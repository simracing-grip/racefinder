import Link from "next/link";

export default function SiteHeader() {
  return (
    <header className="border-b border-gray-800 bg-gray-900">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-y-2 px-4 py-4">
        <Link href="/" className="text-lg font-bold text-gray-100">
          RaceFinder<span className="text-red-500">.</span>
        </Link>
        <nav className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm font-medium text-gray-400">
          <Link
            href="/map"
            className="rounded-full bg-red-600 px-3.5 py-1.5 text-white hover:bg-red-500"
          >
            Map
          </Link>
          <Link href="/calendar" className="hover:text-gray-100">
            Calendar
          </Link>
          <span className="hidden h-4 w-px bg-gray-700 sm:block" aria-hidden />
          <Link href="/category/sim_racing" className="hover:text-gray-100">
            Sim Racing
          </Link>
          <Link href="/category/track_day" className="hover:text-gray-100">
            Track Days
          </Link>
          <Link href="/category/karting" className="hover:text-gray-100">
            Karting
          </Link>
          <Link href="/category/f1" className="hover:text-gray-100">
            F1
          </Link>
          <Link href="/faq" className="hover:text-gray-100">
            FAQ
          </Link>
        </nav>
      </div>
    </header>
  );
}
