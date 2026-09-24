import type { Metadata } from "next";
import { CONTACT_EMAIL } from "@/lib/site";

export const metadata: Metadata = {
  title: "Contact",
  description: "Get in touch about a listing correction, a new venue, or anything else.",
};

const reasons = [
  { label: "Report incorrect listing details", hint: "wrong address, hours, contact info, etc." },
  { label: "Suggest a venue that's missing", hint: "include the name, city, and category" },
  { label: "Claim or update your venue's listing", hint: "let us know you're the operator" },
  { label: "Anything else", hint: "feedback, bugs, questions" },
];

export default function ContactPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="mb-2 text-2xl font-bold">Contact</h1>
      <p className="mb-6 text-sm text-gray-400">
        RaceFinder doesn&apos;t have a support form yet &mdash; email is the fastest way to reach
        us.
      </p>

      <a
        href={`mailto:${CONTACT_EMAIL}`}
        className="mb-8 inline-flex items-center gap-1.5 rounded-full bg-red-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-red-500"
      >
        {CONTACT_EMAIL}
      </a>

      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-400">
        What to reach out about
      </h2>
      <ul className="divide-y divide-gray-800 rounded-xl border border-gray-800">
        {reasons.map((r) => (
          <li key={r.label} className="p-3.5">
            <p className="font-medium text-gray-100">{r.label}</p>
            <p className="text-sm text-gray-400">{r.hint}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
