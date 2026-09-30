import Link from "next/link";

export default function SectionHeading({
  kicker,
  title,
  href,
  hrefLabel,
}: {
  kicker: string;
  title: string;
  href?: string;
  hrefLabel?: string;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <p className="flex items-center gap-2 font-display text-sm font-bold uppercase tracking-[0.25em] text-signal">
          <span className="h-[3px] w-6 bg-signal" aria-hidden />
          {kicker}
        </p>
        <h2 className="mt-1 font-display text-4xl font-black uppercase italic leading-none text-white sm:text-5xl">
          {title}
        </h2>
      </div>
      {href && (
        <Link
          href={href}
          className="font-display text-base font-bold uppercase italic tracking-wide text-gray-400 transition hover:text-white"
        >
          {hrefLabel} <span aria-hidden>&rarr;</span>
        </Link>
      )}
    </div>
  );
}
