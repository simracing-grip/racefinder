import type { Metadata } from "next";
import { CONTACT_EMAIL, OPERATOR, SITE_NAME } from "@/lib/site";
import PageHeader from "@/components/UI/PageHeader";
import { ProseColumn, ProseSection } from "@/components/UI/Prose";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Privacy Policy",
  description: `How ${SITE_NAME} handles data: what is collected, why, who processes it and your rights.`,
  path: "/privacy",
});

function Ext({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className="link-accent">
      {children}
    </a>
  );
}

const mail = (
  <a href={`mailto:${CONTACT_EMAIL}`} className="link-accent">
    {CONTACT_EMAIL}
  </a>
);

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
        <span className="font-mono text-sm">Last updated 11 November 2026</span>
      </PageHeader>
      <ProseColumn>
        <ProseSection title="The short version">
          <p>
            {SITE_NAME} has no user accounts, no advertising and no tracking cookies, and doesn&apos;t
            sell data. To browse the directory you don&apos;t give us anything. We only store personal
            data you choose to send us through the contact form or by email, plus the minimum technical
            data needed to run, protect and improve the site.
          </p>
        </ProseSection>

        <ProseSection title="Who is responsible">
          <p>
            The controller for personal data on this site is{" "}
            {OPERATOR.name ? <>{OPERATOR.name}</> : <>the operator of {SITE_NAME}</>}
            {OPERATOR.address ? <>, {OPERATOR.address}</> : null}. For anything about privacy, email{" "}
            {mail}.
          </p>
        </ProseSection>

        <ProseSection title="What we collect and why">
          <p>
            <strong className="text-gray-200">Visits.</strong> Like every website, our hosting provider
            receives your IP address and browser details with each request, and keeps short-lived
            server logs to deliver the site and keep it secure. We use{" "}
            <Ext href="https://vercel.com/docs/analytics/privacy-policy">Vercel Web Analytics</Ext> to
            count visits in aggregate (pages viewed, referring site, country, device and browser type).
            It uses no cookies and doesn&apos;t identify you or follow you across sites. Legal basis:
            our legitimate interest in running and improving the site (GDPR Art. 6(1)(f)).
          </p>
          <p>
            <strong className="text-gray-200">Error reports.</strong> When something breaks, an error
            report is sent to <Ext href="https://sentry.io/privacy/">Sentry</Ext> (stored in the EU,
            Germany). It contains technical details such as the page, browser and the error itself, and
            Sentry receives your IP address when the report is sent. Reports are kept for up to 90
            days. Legal basis: legitimate interest in finding and fixing faults (Art. 6(1)(f)).
          </p>
          <p>
            <strong className="text-gray-200">The contact form.</strong> If you send the form (to add a
            venue, report a problem or as a venue owner), we store what you write, including your
            email address and, if you give it, your name. We use it only to review your message and
            reply, and delete it once it&apos;s dealt with, at the latest after 12 months. To limit
            spam we also keep a one-way hash of your IP address that changes every day; the IP address
            itself isn&apos;t stored. Submissions are stored with{" "}
            <Ext href="https://supabase.com/privacy">Supabase</Ext> (database in the EU, Ireland), and
            we get an email copy so we notice new messages. Legal basis: taking steps you asked for
            and our legitimate interest in keeping the directory accurate (Art. 6(1)(b) and (f)).
          </p>
          <p>
            <strong className="text-gray-200">Email.</strong> If you email us directly, we keep the
            thread to answer you and don&apos;t use it for anything else.
          </p>
          <p>
            <strong className="text-gray-200">Your Garage.</strong> Venues you save with the star
            button are stored only in your own browser (local storage). They never reach us; clearing
            your browser data removes them.
          </p>
          <p>
            <strong className="text-gray-200">Near me.</strong> If you use &ldquo;Near me&rdquo;, your
            browser asks for permission and gives your location to the page, which sorts venues by
            distance in your browser. Your location isn&apos;t sent to us or stored.
          </p>
        </ProseSection>

        <ProseSection title="Content loaded from other services">
          <p>
            Some parts of a page load straight from another service, which then receives your IP
            address and browser details, and its own privacy policy applies:
          </p>
          <ul className="list-disc space-y-1 pl-5">
            <li>
              Map tiles from <Ext href="https://openfreemap.org">OpenFreeMap</Ext> (OpenStreetMap
              data), when you view a map.
            </li>
            <li>
              Venue photos, loaded from where they are published: mostly{" "}
              <Ext href="https://foundation.wikimedia.org/wiki/Policy:Privacy_policy">
                Wikimedia Commons
              </Ext>
              , and for some venues the venue&apos;s own website.
            </li>
          </ul>
          <p>Fonts are served from our own site, not from Google.</p>
        </ProseSection>

        <ProseSection title="Who processes data for us">
          <p>
            We share personal data only with the services that run the site for us, under their data
            processing terms: Vercel (hosting and analytics), Supabase (database), Sentry (error
            reports) and Resend (form email alerts). Vercel and Resend are based in the United States,
            so data can be transferred there; those transfers are covered by the EU–US Data Privacy
            Framework or the European Commission&apos;s standard contractual clauses. We don&apos;t
            sell or rent data to anyone.
          </p>
        </ProseSection>

        <ProseSection title="Your rights">
          <p>
            Under the GDPR you can ask us for a copy of the personal data we hold about you, and to
            correct it, delete it, restrict how we use it or send it to you in a portable format. You
            can also object to processing based on our legitimate interests. Email {mail} and
            we&apos;ll answer within one month.
          </p>
          <p>
            You also have the right to complain to a data protection authority, in particular the one
            where you live or work.
          </p>
        </ProseSection>

        <ProseSection title="Venue information">
          <p>
            Venue details (name, address, contact details, photos) are compiled from public sources:
            official websites, public listings and maps. They aren&apos;t collected from visitors. If
            you run a venue and want its details corrected or removed, use the form on the contact
            page or email {mail}, and we&apos;ll handle it promptly.
          </p>
        </ProseSection>

        <ProseSection title="Changes to this policy">
          <p>
            If this policy changes, we&apos;ll update it here and change the date at the top.
          </p>
        </ProseSection>
      </ProseColumn>
    </div>
  );
}
