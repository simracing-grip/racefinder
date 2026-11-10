"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { track } from "@vercel/analytics";
import { submitVenueForm, type SubmissionState } from "@/app/contact/actions";
import { CATEGORIES } from "@/lib/types";
import type { SubmissionKind } from "@/lib/validation/submission";

const KINDS: { value: SubmissionKind; label: string; hint: string }[] = [
  { value: "new_venue", label: "Add a missing venue", hint: "A track, kart center or sim venue we don't list" },
  { value: "correction", label: "Fix a listing", hint: "Closed, moved, wrong details or map pin" },
  { value: "owner", label: "I run this venue", hint: "Update your listing, photos or events" },
];

const INITIAL: SubmissionState = { status: "idle" };

const field =
  "w-full border border-white/15 bg-ink px-3 py-2.5 text-white placeholder:text-gray-500 focus:border-signal focus:outline-none";
const labelCls = "mb-1 block text-sm font-semibold text-gray-200";

export default function SubmissionForm({
  initialKind = "new_venue",
  venue,
}: {
  initialKind?: SubmissionKind;
  venue?: { slug: string; name: string; city: string; country: string };
}) {
  const [state, formAction, pending] = useActionState(submitVenueForm, INITIAL);
  const [kind, setKind] = useState<SubmissionKind>(venue && initialKind === "new_venue" ? "correction" : initialKind);
  const startedAt = useRef<HTMLInputElement>(null);
  const openedAt = useRef(0);

  // Client-only, so server and client HTML match. Written into the hidden
  // field on every submit, because React resets the form after each one.
  useEffect(() => {
    openedAt.current = Date.now();
  }, []);

  useEffect(() => {
    if (state.status === "ok") track("Form submitted", { kind });
  }, [state, kind]);

  if (state.status === "ok") {
    return (
      <div role="status" className="border border-white/10 bg-panel p-6">
        <p className="font-display text-2xl font-black uppercase italic text-white">Thanks &mdash; got it.</p>
        <p className="mt-2 text-gray-300">
          We check every message by hand and usually reply within a few days. Nothing goes live until it&rsquo;s been
          verified.
        </p>
      </div>
    );
  }

  const err = (name: string) => state.fieldErrors?.[name];
  const val = (name: string) => {
    const v = state.values?.[name];
    return typeof v === "string" ? v : undefined;
  };
  const errText = (name: string) =>
    err(name) ? (
      <p id={`${name}-error`} className="mt-1 text-sm text-red-400">
        {err(name)}
      </p>
    ) : null;
  const aria = (name: string) =>
    err(name) ? { "aria-invalid": true, "aria-describedby": `${name}-error` } : {};

  return (
    <form
      action={formAction}
      onSubmit={() => {
        if (startedAt.current) startedAt.current.value = String(openedAt.current);
      }}
      className="space-y-5 border border-white/10 bg-panel p-5 sm:p-6"
      noValidate
    >
      <fieldset>
        <legend className={labelCls}>What&rsquo;s this about?</legend>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          {KINDS.map((k) => (
            <label
              key={k.value}
              className={`cursor-pointer border p-3 transition has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-signal ${
                kind === k.value ? "border-signal bg-signal/10" : "border-white/15 hover:border-white/30"
              }`}
            >
              <input
                type="radio"
                name="kind"
                value={k.value}
                checked={kind === k.value}
                onChange={() => setKind(k.value)}
                className="sr-only"
              />
              <span className="block font-semibold text-white">{k.label}</span>
              <span className="mt-0.5 block text-xs text-gray-400">{k.hint}</span>
            </label>
          ))}
        </div>
      </fieldset>

      {venue && <input type="hidden" name="venueSlug" value={venue.slug} />}

      <div>
        <label htmlFor="venueName" className={labelCls}>
          Venue name
        </label>
        <input
          id="venueName"
          name="venueName"
          required
          defaultValue={val("venueName") ?? venue?.name}
          readOnly={!!venue && kind !== "new_venue"}
          className={field}
          {...aria("venueName")}
        />
        {errText("venueName")}
      </div>

      {kind === "new_venue" && (
        <>
          <fieldset>
            <legend className={labelCls}>Type</legend>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.filter((c) => c.value !== "f1" && c.value !== "club_only").map((c) => (
                <label key={c.value} className="flex items-center gap-2 border border-white/15 px-3 py-2 text-sm text-gray-200">
                  <input
                    type="checkbox"
                    name="categories"
                    value={c.value}
                    defaultChecked={state.values?.categories?.includes(c.value)}
                    className="accent-[#ff2a2a]"
                  />
                  {c.label}
                </label>
              ))}
            </div>
          </fieldset>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="city" className={labelCls}>
                City
              </label>
              <input id="city" name="city" defaultValue={val("city")} className={field} {...aria("city")} />
            </div>
            <div>
              <label htmlFor="country" className={labelCls}>
                Country
              </label>
              <input id="country" name="country" defaultValue={val("country")} className={field} {...aria("country")} />
            </div>
          </div>
          <div>
            <label htmlFor="websiteUrl" className={labelCls}>
              Website <span className="font-normal text-gray-500">(optional)</span>
            </label>
            <input
              id="websiteUrl"
              name="websiteUrl"
              type="url"
              inputMode="url"
              placeholder="https://"
              defaultValue={val("websiteUrl")}
              className={field}
              {...aria("websiteUrl")}
            />
            {errText("websiteUrl")}
          </div>
        </>
      )}

      <div>
        <label htmlFor="message" className={labelCls}>
          {kind === "new_venue" ? "Anything else we should know?" : "What should change?"}
        </label>
        <textarea
          id="message"
          name="message"
          required
          rows={5}
          defaultValue={val("message")}
          placeholder={
            kind === "correction"
              ? "e.g. It closed in 2025 / the pin is on the wrong side of town / new phone number…"
              : kind === "owner"
                ? "What you'd like updated — and links to photos you're happy for us to use."
                : "Address, what's on offer (arrive-and-drive, leagues, kids' karts…), opening hours…"
          }
          className={field}
          {...aria("message")}
        />
        {errText("message")}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="contactName" className={labelCls}>
            Your name <span className="font-normal text-gray-500">(optional)</span>
          </label>
          <input id="contactName" name="contactName" autoComplete="name" defaultValue={val("contactName")} className={field} />
        </div>
        <div>
          <label htmlFor="contactEmail" className={labelCls}>
            Your email
          </label>
          <input
            id="contactEmail"
            name="contactEmail"
            type="email"
            required
            autoComplete="email"
            defaultValue={val("contactEmail")}
            className={field}
            {...aria("contactEmail")}
          />
          {errText("contactEmail")}
        </div>
      </div>

      {/* Spam traps: a field people never see, and the time the form was opened. */}
      <div aria-hidden className="absolute left-[-9999px] h-0 w-0 overflow-hidden">
        <label htmlFor="website_confirm">Leave this empty</label>
        <input id="website_confirm" name="website_confirm" tabIndex={-1} autoComplete="off" />
      </div>
      <input ref={startedAt} type="hidden" name="started_at" defaultValue="" />

      <div className="flex flex-wrap items-center gap-4">
        <button
          type="submit"
          disabled={pending}
          className="btn-skew inline-flex items-center gap-2 bg-signal px-7 py-3 font-display text-xl font-black uppercase italic text-white transition hover:bg-white hover:text-ink disabled:opacity-60"
        >
          {pending ? "Sending…" : "Send"} <span aria-hidden>&rarr;</span>
        </button>
        <p className="text-xs text-gray-400">
          We only use your email to reply about this. See the{" "}
          <a href="/privacy" className="link-accent">
            privacy policy
          </a>
          .
        </p>
      </div>
      {state.status === "error" && state.message && (
        <p role="alert" className="text-sm text-red-400">
          {state.message}
        </p>
      )}
    </form>
  );
}
