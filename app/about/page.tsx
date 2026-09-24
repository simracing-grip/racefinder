import type { Metadata } from "next";
import Link from "next/link";
import { CONTACT_EMAIL } from "@/lib/site";

export const metadata: Metadata = {
  title: "About",
  description: "Why RaceFinder exists and how the directory is put together.",
};

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold">About RaceFinder</h1>

      <div className="space-y-4 text-sm leading-relaxed text-gray-300">
        <p>
          RaceFinder is a free, independent directory of sim racing centers, track day circuits,
          and karting tracks across Europe (plus every current Formula 1 circuit worldwide). It
          started as a way to answer a simple question &mdash; &ldquo;where can I actually go
          racing near me?&rdquo; &mdash; that scattered search results never answered well.
        </p>
        <p>
          It&apos;s built and maintained by one person, not a company. Listings are compiled from
          public sources (official venue sites, maps, and public records), reviewed for accuracy
          before publishing, and kept up to date as venues change. Details like pricing, hours,
          and availability can still change faster than the directory does &mdash; always confirm
          directly with a venue before visiting.
        </p>
        <p>
          RaceFinder doesn&apos;t sell anything, doesn&apos;t require an account, and doesn&apos;t
          take bookings. It&apos;s just a map and a list, kept as useful and accurate as possible.
        </p>
        <p>
          Spotted something wrong, or know a venue that&apos;s missing?{" "}
          <Link href="/contact" className="text-blue-400 hover:underline">
            Get in touch
          </Link>{" "}
          &mdash; or reach out directly at{" "}
          <a href={`mailto:${CONTACT_EMAIL}`} className="text-blue-400 hover:underline">
            {CONTACT_EMAIL}
          </a>
          .
        </p>
      </div>
    </div>
  );
}
