import Link from "next/link";
import Logo from "@/components/Brand/Logo";
import { CONTACT_EMAIL } from "@/lib/site";

const COLUMNS = [
  {
    title: "Explore",
    links: [
      { href: "/map", label: "World map" },
      { href: "/calendar", label: "Race calendar" },
      { href: "/category/sim_racing", label: "Sim racing centers" },
      { href: "/category/track_day", label: "Track day circuits" },
      { href: "/category/karting", label: "Karting tracks" },
      { href: "/category/f1", label: "F1 circuits" },
    ],
  },
  {
    title: "RaceFinder",
    links: [
      { href: "/about", label: "About" },
      { href: "/faq", label: "FAQ" },
      { href: "/contact", label: "Contact" },
      { href: "/privacy", label: "Privacy" },
      { href: "/terms", label: "Terms" },
    ],
  },
];

export default function SiteFooter() {
  return (
    <footer className="mt-24 bg-asphalt">
      <div className="kerb h-1" aria-hidden />
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 md:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <Logo />
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-gray-400">
            The free directory of sim racing centers, track day circuits, karting tracks and every F1
            circuit on the calendar. Built by racing fans, for racing fans.
          </p>
          <a
            href={`mailto:${CONTACT_EMAIL}`}
            className="mt-4 inline-block text-sm font-semibold text-gray-300 underline decoration-signal decoration-2 underline-offset-4 hover:text-white"
          >
            {CONTACT_EMAIL}
          </a>
        </div>
        {COLUMNS.map((col) => (
          <div key={col.title}>
            <p className="font-display text-sm font-bold uppercase tracking-[0.2em] text-gray-500">{col.title}</p>
            <ul className="mt-4 space-y-2.5">
              {col.links.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-sm text-gray-300 transition hover:text-signal">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-white/5">
        <p className="mx-auto max-w-7xl px-4 py-5 font-mono text-xs text-gray-600">
          &copy; {new Date().getFullYear()} RaceFinder &middot; Venue info changes &mdash; always confirm with the
          venue before you travel.
        </p>
      </div>
    </footer>
  );
}
