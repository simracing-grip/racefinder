import Link from "next/link";
import type { Listing } from "@/lib/types";
import { getNextEvent, formatEventDate } from "@/lib/listingSort";
import CountryFlag from "@/components/CountryFlag";
import VenuePhoto from "@/components/Listing/VenuePhoto";
import PhotoCredit from "@/components/Listing/PhotoCredit";
import SectionHeading from "./SectionHeading";

// Photo-led cards for the famous stuff — circuits with a cover photo, those
// racing soonest first. First card spans two columns as the "hero" circuit.
export default function IconicCircuits({ listings }: { listings: Listing[] }) {
  const withPhotos = listings.filter((l) => l.coverImageUrl && (l.categories.includes("f1") || l.events?.length));
  const picks = withPhotos
    .map((l) => ({ l, next: getNextEvent(l) }))
    .sort((a, b) => {
      if (a.next && b.next) return a.next.startDate.localeCompare(b.next.startDate);
      return a.next ? -1 : b.next ? 1 : 0;
    })
    .slice(0, 5);

  if (picks.length < 3) return null;

  return (
    <section className="mx-auto max-w-7xl px-4">
      <SectionHeading kicker="Hallowed tarmac" title="Iconic circuits" href="/category/f1" hrefLabel="All F1 circuits" />
      <div className="grid auto-rows-[260px] gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {picks.map(({ l, next }, i) => (
          // Link overlays the card rather than wrapping it, so the photo
          // credit's own links aren't nested inside another <a>.
          <div
            key={l.id}
            className={`group relative overflow-hidden border border-white/10 bg-panel ${
              i === 0 ? "sm:col-span-2 sm:row-span-2" : ""
            }`}
          >
            <VenuePhoto
              listing={l}
              variant="fill"
              // Grid: 4 cols on lg (first card spans 2), 2 cols from sm.
              sizes={
                i === 0
                  ? "(min-width: 1280px) 620px, (min-width: 640px) 50vw, 100vw"
                  : "(min-width: 1280px) 310px, (min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
              }
              imgClassName="opacity-70 grayscale-[35%] transition duration-700 group-hover:scale-105 group-hover:opacity-90 group-hover:grayscale-0"
            />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink via-ink/40 to-transparent" aria-hidden />
            <Link href={`/listings/${l.slug}`} className="absolute inset-0 flex flex-col justify-end p-5">
              {next && (
                <p className="mb-2 self-start bg-timing px-2 py-0.5 font-display text-xs font-extrabold uppercase italic tracking-wide text-ink">
                  Next: {next.name} &middot; {formatEventDate(next.startDate)}
                </p>
              )}
              <h3
                className={`font-display font-black uppercase italic leading-[0.95] text-white ${
                  i === 0 ? "text-4xl sm:text-5xl" : "text-2xl"
                }`}
              >
                {l.name}
              </h3>
              <p className="mt-1.5 flex items-center gap-1.5 text-sm text-gray-300">
                <CountryFlag countryCode={l.countryCode} />
                {l.city ? `${l.city}, ` : ""}
                {l.country}
              </p>
            </Link>
            {l.coverImageCredit && (
              <div className="absolute right-0 top-0 max-w-[80%] bg-ink/70 px-2 py-1 opacity-70 backdrop-blur-sm transition group-hover:opacity-100">
                <PhotoCredit credit={l.coverImageCredit} />
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
