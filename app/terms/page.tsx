import type { Metadata } from "next";
import { CONTACT_EMAIL, SITE_NAME } from "@/lib/site";

export const metadata: Metadata = {
  title: "Terms of Use",
  description: `The terms for using ${SITE_NAME}.`,
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-6">
      <h2 className="mb-2 text-lg font-semibold text-gray-100">{title}</h2>
      <div className="space-y-3 text-sm leading-relaxed text-gray-400">{children}</div>
    </section>
  );
}

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="mb-1 text-2xl font-bold">Terms of Use</h1>
      <p className="mb-8 text-sm text-gray-500">Last updated 22 September 2026</p>

      <Section title="Using the site">
        <p>
          {SITE_NAME} is a free directory, provided as-is, for personal, non-commercial use. By
          using the site you agree not to scrape, republish, or bulk-download the listing data
          without permission, and not to use the site in a way that disrupts it for other
          visitors.
        </p>
      </Section>

      <Section title="Accuracy of listings">
        <p>
          Listing details &mdash; addresses, contact information, pricing, hours, and
          availability &mdash; are compiled from public sources and reviewed before publishing,
          but venues change these things without notice. We make no guarantee that any listing is
          complete, current, or error-free. Always confirm directly with a venue before visiting,
          booking, or relying on any detail shown here.
        </p>
      </Section>

      <Section title="Third-party links and content">
        <p>
          The site links to venue websites and other external resources we don&apos;t control or
          endorse. We&apos;re not responsible for the content, availability, or practices of those
          sites.
        </p>
      </Section>

      <Section title="No liability">
        <p>
          {SITE_NAME} is provided without warranties of any kind. To the extent permitted by law,
          we&apos;re not liable for any loss or damage arising from your use of the site or
          reliance on information it contains.
        </p>
      </Section>

      <Section title="Changes">
        <p>
          These terms may be updated from time to time; the date above reflects the latest
          revision. Continued use of the site after a change means you accept the update.
        </p>
      </Section>

      <Section title="Contact">
        <p>
          Questions about these terms: email{" "}
          <a href={`mailto:${CONTACT_EMAIL}`} className="text-blue-400 hover:underline">
            {CONTACT_EMAIL}
          </a>
          .
        </p>
      </Section>
    </div>
  );
}
