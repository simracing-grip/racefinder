import type { Metadata } from "next";
import PageHeader from "@/components/UI/PageHeader";
import GarageView from "@/components/Garage/GarageView";
import { pageMetadata } from "@/lib/seo";
import { SITE_URL } from "@/lib/site";

// Personal page (the list lives in the visitor's browser), so keep it out
// of search results.
export const metadata: Metadata = {
  ...pageMetadata({
    title: "My garage",
    description: "Your saved venues and their upcoming race weekends.",
    path: "/garage",
  }),
  robots: { index: false },
};

export default function GaragePage() {
  return (
    <div>
      <PageHeader
        kicker="My garage"
        title="Your saved venues"
        crumbs={[
          { href: "/", label: "Home" },
          { href: "/garage", label: "Garage" },
        ]}
      >
        Tracks you want to drive, races you want to see. Saved in this browser — no account needed.
      </PageHeader>
      <div className="mx-auto max-w-7xl px-4 pt-8">
        <GarageView siteUrl={SITE_URL} />
      </div>
    </div>
  );
}
