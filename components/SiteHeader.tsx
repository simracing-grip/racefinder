import Link from "next/link";

export default function SiteHeader() {
  return (
    <header className="border-b border-gray-200 bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
        <Link href="/" className="text-lg font-bold text-gray-900">
          RaceFinder<span className="text-red-600">.</span>
        </Link>
        <nav className="flex items-center gap-5 text-sm font-medium text-gray-600">
          <Link href="/category/sim_racing" className="hover:text-gray-900">
            Sim Racing
          </Link>
          <Link href="/category/track_day" className="hover:text-gray-900">
            Track Days
          </Link>
          <Link href="/category/karting" className="hover:text-gray-900">
            Karting
          </Link>
          <Link href="/category/f1" className="hover:text-gray-900">
            F1
          </Link>
          <Link href="/faq" className="hover:text-gray-900">
            FAQ
          </Link>
          <Link
            href="/map"
            className="rounded-full bg-gray-900 px-3.5 py-1.5 text-white hover:bg-gray-700"
          >
            Map
          </Link>
        </nav>
      </div>
    </header>
  );
}
