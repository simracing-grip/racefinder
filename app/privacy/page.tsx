import type { Metadata } from "next";
import { CONTACT_EMAIL, SITE_NAME } from "@/lib/site";
import PageHeader from "@/components/UI/PageHeader";
import { ProseColumn, ProseSection } from "@/components/UI/Prose";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Privacy Policy",
  description: `How ${SITE_NAME} handles data.`,
  path: "/privacy",
});

export default function PrivacyPage() {
  return (
    <div>
      <PageHeader
        kicker="Legal"
        title="Privacy Policy"
        crumbs={[
          { href: "/", label: "Home" },
          { href: "/privacy", label: "Privacy Policy" },
        ]}
      >
        <span className="font-mono text-sm">Last updated 22 September 2026</span>
      </PageHeader>
      <ProseColumn>
        <ProseSection title="The short version">
          <p>
            {SITE_NAME} doesn&apos;t have user accounts, doesn&apos;t sell data, and doesn&apos;t
            run advertising trackers. The only data collected is anonymous, aggregate visit
            analytics used to understand which pages are useful.
          </p>
        </ProseSection>

        <ProseSection title="What we collect">
          <p>
            We use{" "}
            <a
              href="https://vercel.com/docs/analytics"
              target="_blank"
              rel="noopener noreferrer"
              className="link-accent"
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
        </ProseSection>

        <ProseSection title="Map tiles and third-party embeds">
          <p>
            The map is rendered with{" "}
            <a
              href="https://openfreemap.org"
              target="_blank"
              rel="noopener noreferrer"
              className="link-accent"
            >
              OpenFreeMap
            </a>{" "}
            / OpenStreetMap tiles, loaded directly from their servers when you view a map. Their own
            privacy practices apply to that connection.
          </p>
        </ProseSection>

        <ProseSection title="Listing data">
          <p>
            Venue information (name, address, contact details, photos) is compiled from public
            sources &mdash; official websites, public listings, and maps &mdash; not collected from
            site visitors. If you run a venue and want details corrected or removed, contact us and
            we&apos;ll handle it promptly.
          </p>
        </ProseSection>

        <ProseSection title="Changes to this policy">
          <p>
            If this policy changes materially, we&apos;ll update the date above. Continued use of the
            site after a change means you accept the update.
          </p>
        </ProseSection>

        <ProseSection title="Contact">
          <p>
            Questions about privacy: email{" "}
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
