"use server";

import { createHash } from "node:crypto";
import { headers } from "next/headers";
import { and, count, eq, gte } from "drizzle-orm";
import * as Sentry from "@sentry/nextjs";
import { db } from "@/lib/db/client";
import { submissions } from "@/lib/db/schema";
import { submissionSchema } from "@/lib/validation/submission";
import { CONTACT_EMAIL } from "@/lib/site";

export interface SubmissionState {
  status: "idle" | "ok" | "error";
  message?: string;
  fieldErrors?: Partial<Record<string, string>>;
  // What was typed, echoed back on errors — React resets the form after
  // every submit, and the inputs reset to these as their defaults.
  values?: Partial<Record<string, string | string[]>>;
}

// Bots fill in every field and submit instantly; people don't.
const MIN_FILL_MS = 3_000;
const MAX_PER_HOUR = 5;

// Rotates daily so it can rate-limit without being a lasting identifier.
function hashIp(ip: string): string {
  const day = new Date().toISOString().slice(0, 10);
  return createHash("sha256").update(`racefinder:${day}:${ip}`).digest("hex").slice(0, 32);
}

function echo(formData: FormData): SubmissionState["values"] {
  const text = (k: string) => String(formData.get(k) ?? "").slice(0, 4000);
  return {
    venueName: text("venueName"),
    city: text("city"),
    country: text("country"),
    websiteUrl: text("websiteUrl"),
    message: text("message"),
    contactName: text("contactName"),
    contactEmail: text("contactEmail"),
    categories: formData.getAll("categories").map(String),
  };
}

export async function submitVenueForm(_prev: SubmissionState, formData: FormData): Promise<SubmissionState> {
  // Honeypot: a field hidden from people. Pretend success so bots move on.
  if (formData.get("website_confirm")) return { status: "ok" };
  // Too fast to be typed: could be a bot, or a person with autofill, so ask
  // again rather than silently dropping it.
  const startedAt = Number(formData.get("started_at"));
  if (!startedAt || Date.now() - startedAt < MIN_FILL_MS) {
    return { status: "error", message: "That was quick! Please check your message and press Send again.", values: echo(formData) };
  }

  const parsed = submissionSchema.safeParse({
    kind: formData.get("kind"),
    venueSlug: formData.get("venueSlug"),
    venueName: formData.get("venueName"),
    categories: formData.getAll("categories"),
    city: formData.get("city"),
    country: formData.get("country"),
    websiteUrl: formData.get("websiteUrl"),
    message: formData.get("message"),
    contactName: formData.get("contactName"),
    contactEmail: formData.get("contactEmail"),
  });
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = String(issue.path[0] ?? "form");
      fieldErrors[key] ??= issue.message;
    }
    // Fields the visitor can see get their own message; anything else (a
    // tampered hidden field) is spelled out here so the form never fails
    // without saying why.
    const visible = ["venueName", "websiteUrl", "message", "contactEmail"];
    const hidden = Object.keys(fieldErrors).filter((k) => !visible.includes(k));
    const message = hidden.length
      ? `Something went wrong with the form (${hidden.join(", ")}). Please reload the page and try again.`
      : "Please check the highlighted fields.";
    return { status: "error", message, fieldErrors, values: echo(formData) };
  }

  const unavailable: SubmissionState = {
    status: "error",
    message: `Sorry, the form isn't available right now. Please email ${CONTACT_EMAIL} instead.`,
    values: echo(formData),
  };
  if (!db) return unavailable;

  const forwarded = (await headers()).get("x-forwarded-for") ?? "";
  const ipHash = forwarded ? hashIp(forwarded.split(",")[0].trim()) : null;

  try {
    if (ipHash) {
      const since = new Date(Date.now() - 60 * 60 * 1000);
      const [{ recent }] = await db
        .select({ recent: count() })
        .from(submissions)
        .where(and(eq(submissions.ipHash, ipHash), gte(submissions.createdAt, since)));
      if (recent >= MAX_PER_HOUR) {
        return {
          status: "error",
          message: "You've sent several messages in the last hour — please try again later.",
          values: echo(formData),
        };
      }
    }

    const data = parsed.data;
    await db.insert(submissions).values({
      kind: data.kind,
      venueSlug: data.venueSlug ?? null,
      venueName: data.venueName,
      categories: data.categories.length ? data.categories : null,
      city: data.city ?? null,
      country: data.country ?? null,
      websiteUrl: data.websiteUrl ?? null,
      message: data.message,
      contactName: data.contactName ?? null,
      contactEmail: data.contactEmail,
      ipHash,
    });
  } catch (err) {
    Sentry.captureException(err, { tags: { area: "submission-form" } });
    console.error("Saving a form submission failed.", err);
    return unavailable;
  }

  return { status: "ok" };
}
