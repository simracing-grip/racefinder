import Link from "next/link";
import Logo from "@/components/Brand/Logo";
import SearchPalette from "@/components/Search/SearchPalette";
import GarageLink from "@/components/Garage/GarageLink";

const NAV = [
  { href: "/category/sim_racing", label: "Sim Racing" },
  { href: "/category/track_day", label: "Track Days" },
  { href: "/category/karting", label: "Karting" },
  { href: "/category/f1", label: "F1" },
  { href: "/calendar", label: "Calendar" },
];

export default function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-white/5 bg-ink/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3">
        <Logo />
        <div className="flex items-center gap-1 sm:gap-2">
          <nav className="hidden items-center gap-1 text-sm font-semibold text-gray-400 md:flex">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-md px-3 py-2 uppercase tracking-wide transition hover:bg-white/5 hover:text-white"
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <SearchPalette />
          <GarageLink />
          <Link
            href="/map"
            className="inline-flex items-center gap-1.5 bg-signal px-3.5 py-2 font-display sm:gap-2 sm:px-4 text-base font-bold italic uppercase tracking-wide text-white transition [clip-path:polygon(8px_0,100%_0,calc(100%-8px)_100%,0_100%)] hover:bg-white hover:text-ink"
          >
            {/* "Map" alone on phones, where search + garage share the row */}
            <span className="hidden sm:inline">Open</span> map
            <span aria-hidden>&rarr;</span>
          </Link>
        </div>
      </div>
      {/* Mobile: scrolls sideways instead of wrapping into a tall header. */}
      <nav className="flex gap-1 overflow-x-auto border-t border-white/5 px-2 py-1.5 text-xs font-semibold uppercase tracking-wide text-gray-400 md:hidden">
        {NAV.map((item) => (
          <Link key={item.href} href={item.href} className="shrink-0 rounded-md px-3 py-1.5 hover:bg-white/5 hover:text-white">
            {item.label}
          </Link>
        ))}
        <Link href="/faq" className="shrink-0 rounded-md px-3 py-1.5 hover:bg-white/5 hover:text-white">
          FAQ
        </Link>
      </nav>
      <div className="kerb h-[3px] opacity-80" aria-hidden />
    </header>
  );
}
