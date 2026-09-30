import Link from "next/link";

// Wordmark: a slanted "apex" chevron + italic condensed name. Kept as markup
// (not an image) so it stays crisp and themable everywhere it's used.
export default function Logo({ className = "" }: { className?: string }) {
  return (
    <Link href="/" aria-label="RaceFinder home" className={`group inline-flex items-center gap-2 ${className}`}>
      <svg viewBox="0 0 32 24" className="h-6 w-8" aria-hidden>
        <path d="M2 22 L12 2 H20 L10 22 Z" className="fill-signal transition group-hover:fill-white" />
        <path d="M14 22 L24 2 H30 L20 22 Z" className="fill-white/90" />
      </svg>
      <span className="font-display text-2xl font-extrabold italic uppercase leading-none tracking-tight text-white">
        Race<span className="text-signal">Finder</span>
      </span>
    </Link>
  );
}
