import Link from "next/link";

// Closing banner for venue owners — the supply side of the directory.
export default function ListVenueCta() {
  return (
    <section className="mx-auto max-w-7xl px-4">
      <div className="relative overflow-hidden border border-white/10 bg-signal-deep">
        <div className="speed-lines absolute inset-0 opacity-60" aria-hidden />
        <div className="checker absolute inset-y-0 right-0 w-24 opacity-20 [mask-image:linear-gradient(90deg,transparent,black)] sm:w-48" aria-hidden />
        <div className="relative flex flex-col items-start gap-6 p-8 sm:p-12 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="font-display text-sm font-bold uppercase tracking-[0.25em] text-white/70">For tracks, kart centers &amp; sim venues</p>
            <h2 className="mt-2 max-w-2xl font-display text-4xl font-black uppercase italic leading-[0.95] text-white sm:text-5xl">
              Run a venue? Get on the grid.
            </h2>
            <p className="mt-3 max-w-xl text-white/80">
              Listing is free. Send us your details, photos and upcoming events and we&rsquo;ll put you in front
              of drivers looking for their next session.
            </p>
          </div>
          <Link
            href="/contact"
            className="shrink-0 bg-white px-7 py-3.5 font-display text-xl font-black uppercase italic text-ink transition [clip-path:polygon(10px_0,100%_0,calc(100%-10px)_100%,0_100%)] hover:bg-ink hover:text-white"
          >
            Add your venue &rarr;
          </Link>
        </div>
      </div>
    </section>
  );
}
