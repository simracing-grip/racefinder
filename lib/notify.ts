import * as Sentry from "@sentry/nextjs";
import { CONTACT_EMAIL, SITE_NAME, SITE_URL } from "@/lib/site";
import type { SubmissionInput } from "@/lib/validation/submission";

// Emails the site owner when someone sends the contact / add-your-venue form,
// through Resend's HTTP API (no SDK needed). Set in Vercel:
//  - RESEND_API_KEY  (resend.com -> API Keys). Without it this does nothing,
//    and submissions are still saved in the `submissions` table.
//  - NOTIFY_EMAIL    who gets the alerts (default: CONTACT_EMAIL)
//  - NOTIFY_FROM     the sender. Default "onboarding@resend.dev", which Resend
//    only delivers to the address the Resend account was created with. Once
//    the site's domain is verified in Resend, use e.g. "alerts@<domain>".
// A failed email never fails the submission: it is reported to Sentry.

const KIND_LABEL: Record<SubmissionInput["kind"], string> = {
  new_venue: "New venue",
  correction: "Correction",
  owner: "Venue owner",
};

export async function notifySubmission(data: SubmissionInput): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return;

  const lines = [
    `Type: ${KIND_LABEL[data.kind]}`,
    `Venue: ${data.venueName}${data.venueSlug ? ` (${SITE_URL}/listings/${data.venueSlug})` : ""}`,
    data.categories.length ? `Categories: ${data.categories.join(", ")}` : "",
    data.city || data.country ? `Place: ${[data.city, data.country].filter(Boolean).join(", ")}` : "",
    data.websiteUrl ? `Website: ${data.websiteUrl}` : "",
    `From: ${data.contactName ? `${data.contactName} <${data.contactEmail}>` : data.contactEmail}`,
    "",
    data.message,
    "",
    "Reply to this email to answer them. All submissions are in the `submissions` table in Supabase.",
  ].filter((l, i, all) => l !== "" || all[i - 1] !== "");

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: process.env.NOTIFY_FROM || `${SITE_NAME} <onboarding@resend.dev>`,
        to: [process.env.NOTIFY_EMAIL || CONTACT_EMAIL],
        reply_to: data.contactEmail,
        subject: `[${SITE_NAME}] ${KIND_LABEL[data.kind]}: ${data.venueName}`.slice(0, 200),
        text: lines.join("\n"),
      }),
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) throw new Error(`Resend answered ${res.status}: ${(await res.text()).slice(0, 300)}`);
  } catch (err) {
    Sentry.captureException(err, { tags: { area: "submission-email" } });
    console.error("Sending the submission alert failed.", err);
  }
}
