import type { Metadata } from "next";
import { CONTACT_EMAIL } from "@/lib/site";
import PageHeader from "@/components/UI/PageHeader";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Contact",
  description: "Get in touch about a listing correction, a new venue, or anything else.",
  path: "/contact",
});

const reasons = [
  { label: "Report incorrect listing details", hint: "wrong address, hours, contact info, etc." },
  { label: "Suggest a venue that's missing", hint: "include the name, city, and category" },
  { label: "Claim or update your venue's listing", hint: "let us know you're the operator" },
  { label: "Anything else", hint: "feedback, bugs, questions" },
];

export default function ContactPage() {
  return (
    <div>
      <PageHeader
        kicker="Contact"
        title="Talk to the pit wall"
        crumbs={[
          { href: "/", label: "Home" },
          { href: "/contact", label: "Contact" },
        ]}
      >
        RaceFinder doesn&apos;t have a support form yet &mdash; email is the fastest way to reach us.
      </PageHeader>

      <div className="mx-auto max-w-3xl px-4 pt-10">
        <a
          href={`mailto:${CONTACT_EMAIL}`}
          className="btn-skew inline-flex items-center gap-2 bg-signal px-7 py-4 font-display text-2xl font-black italic text-white transition hover:bg-white hover:text-ink"
        >
          {CONTACT_EMAIL} <span aria-hidden>&rarr;</span>
        </a>

        <h2 className="mt-12 mb-4 font-display text-sm font-bold uppercase tracking-[0.25em] text-gray-500">
          What to reach out about
        </h2>
        <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {reasons.map((r, i) => (
            <li key={r.label} className="border border-white/10 bg-asphalt p-4">
              <p className="font-mono text-xs text-signal">{String(i + 1).padStart(2, "0")}</p>
              <p className="mt-1 font-semibold text-white">{r.label}</p>
              <p className="mt-0.5 text-sm text-gray-400">{r.hint}</p>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
