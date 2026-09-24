import type { Metadata } from "next";
import { CONTACT_EMAIL, SITE_NAME } from "@/lib/site";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: `How ${SITE_NAME} handles data.`,
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-6">
      <h2 className="mb-2 text-lg font-semibold text-gray-100">{title}</h2>
      <div className="space-y-3 text-sm leading-relaxed text-gray-400">{children}</div>
    </section>
  );
}

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="mb-1 text-2xl font-bold">Privacy Policy</h1>
      <p className="mb-8 text-sm text-gray-500">Last updated 22 September 2026</p>

      <Section title="The short version">
        <p>
          {SITE_NAME} doesn&apos;t have user accounts, doesn&apos;t sell data, and doesn&apos;t
          run advertising trackers. The only data collected is anonymous, aggregate visit
          analytics used to understand which pages are useful.
        </p>
      </Section>

      <Section title="What we collect">
        <p>
          We use{" "}
          <a
            href="https://vercel.com/docs/analytics"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-400 hover:underline"
          >
            Vercel Analytics
          </a>{" "}
          to see aggregate traffic (pages visited, approximate location, device type). It doesn&apos;t
          use cookies and doesn&apos;t track you individually across sites.
        </p>
        <p>
          If you email us directly, we keep that email thread to respond to you and don&apos;t use
          it for anything else.
        </p>
        <p>
          We don&apos;t use marketing or advertising cookies, and we don&apos;t require sign-up to
          browse the directory.
        </p>
      </Section>

      <Section title="Map tiles and third-party embeds">
        <p>
          The map is rendered with{" "}
          <a
            href="https://openfreemap.org"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-400 hover:underline"
          >
            OpenFreeMap
          </a>{" "}
          / OpenStreetMap tiles, loaded directly from their servers when you view a map. Their own
          privacy practices apply to that connection.
        </p>
      </Section>

      <Section title="Listing data">
        <p>
          Venue information (name, address, contact details, photos) is compiled from public
          sources &mdash; official websites, public listings, and maps &mdash; not collected from
          site visitors. If you run a venue and want details corrected or removed, contact us and
          we&apos;ll handle it promptly.
        </p>
      </Section>

      <Section title="Changes to this policy">
        <p>
          If this policy changes materially, we&apos;ll update the date above. Continued use of the
          site after a change means you accept the update.
        </p>
      </Section>

      <Section title="Contact">
        <p>
          Questions about privacy: email{" "}
          <a href={`mailto:${CONTACT_EMAIL}`} className="text-blue-400 hover:underline">
            {CONTACT_EMAIL}
          </a>
          .
        </p>
      </Section>
    </div>
  );
}
