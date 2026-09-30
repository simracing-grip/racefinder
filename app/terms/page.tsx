import type { Metadata } from "next";
import { CONTACT_EMAIL, SITE_NAME } from "@/lib/site";
import PageHeader from "@/components/UI/PageHeader";
import { ProseColumn, ProseSection } from "@/components/UI/Prose";

export const metadata: Metadata = {
  title: "Terms of Use",
  description: `The terms for using ${SITE_NAME}.`,
};

export default function TermsPage() {
  return (
    <div>
      <PageHeader
        kicker="Legal"
        title="Terms of Use"
        crumbs={[
          { href: "/", label: "Home" },
          { href: "/terms", label: "Terms of Use" },
        ]}
      >
        <span className="font-mono text-sm">Last updated 22 September 2026</span>
      </PageHeader>
      <ProseColumn>
        <ProseSection title="Using the site">
          <p>
            {SITE_NAME} is a free directory, provided as-is, for personal, non-commercial use. By
            using the site you agree not to scrape, republish, or bulk-download the listing data
            without permission, and not to use the site in a way that disrupts it for other
            visitors.
          </p>
        </ProseSection>

        <ProseSection title="Accuracy of listings">
          <p>
            Listing details &mdash; addresses, contact information, pricing, hours, and
            availability &mdash; are compiled from public sources and reviewed before publishing,
            but venues change these things without notice. We make no guarantee that any listing is
            complete, current, or error-free. Always confirm directly with a venue before visiting,
            booking, or relying on any detail shown here.
          </p>
        </ProseSection>

        <ProseSection title="Third-party links and content">
          <p>
            The site links to venue websites and other external resources we don&apos;t control or
            endorse. We&apos;re not responsible for the content, availability, or practices of those
            sites.
          </p>
        </ProseSection>

        <ProseSection title="No liability">
          <p>
            {SITE_NAME} is provided without warranties of any kind. To the extent permitted by law,
            we&apos;re not liable for any loss or damage arising from your use of the site or
            reliance on information it contains.
          </p>
        </ProseSection>

        <ProseSection title="Changes">
          <p>
            These terms may be updated from time to time; the date above reflects the latest
            revision. Continued use of the site after a change means you accept the update.
          </p>
        </ProseSection>

        <ProseSection title="Contact">
          <p>
            Questions about these terms: email{" "}
            <a href={`mailto:${CONTACT_EMAIL}`} className="link-accent">
              {CONTACT_EMAIL}
            </a>
            .
          </p>
        </ProseSection>
      </ProseColumn>
    </div>
  );
}
