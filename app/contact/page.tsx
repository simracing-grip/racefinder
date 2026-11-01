import type { Metadata } from "next";
import { CONTACT_EMAIL } from "@/lib/site";
import PageHeader from "@/components/UI/PageHeader";
import SubmissionForm from "@/components/Contact/SubmissionForm";
import { getListingBySlug } from "@/lib/listings";
import { SUBMISSION_KINDS, type SubmissionKind } from "@/lib/validation/submission";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Contact",
  description: "Add a missing karting track, circuit or sim venue, fix a listing, or update the venue you run.",
  path: "/contact",
});

// /contact?kind=correction&venue=<slug> (from a venue page) pre-fills the form.
export default async function ContactPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const kindParam = typeof sp.kind === "string" ? sp.kind : undefined;
  const kind = SUBMISSION_KINDS.find((k) => k === kindParam) as SubmissionKind | undefined;
  const listing = typeof sp.venue === "string" ? await getListingBySlug(sp.venue) : undefined;
  const venue = listing && { slug: listing.slug, name: listing.name, city: listing.city, country: listing.country };

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
        Add a venue we&apos;re missing, fix a listing, or update the venue you run. Every message is checked by
        hand before anything changes on the site.
      </PageHeader>

      <div className="mx-auto max-w-3xl px-4 pt-10">
        <SubmissionForm initialKind={kind} venue={venue} />

        <p className="mt-6 text-sm text-gray-400">
          Something else &mdash; feedback, a bug, a question? Email{" "}
          <a href={`mailto:${CONTACT_EMAIL}`} className="link-accent">
            {CONTACT_EMAIL}
          </a>
          .
        </p>
      </div>
    </div>
  );
}
