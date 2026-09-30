import Link from "next/link";

export default function NotFound() {
  return (
    <div className="relative isolate overflow-hidden">
      <div className="grid-lines absolute inset-0 -z-10 [mask-image:radial-gradient(ellipse_at_center,black,transparent_70%)]" aria-hidden />
      <div className="mx-auto flex max-w-2xl flex-col items-center px-4 py-24 text-center sm:py-32">
        <p className="font-display text-[7rem] font-black italic leading-none text-signal sm:text-[10rem]">404</p>
        <div className="kerb mt-2 h-2 w-40 -skew-x-12" aria-hidden />
        <h1 className="mt-6 font-display text-4xl font-black uppercase italic text-white sm:text-5xl">Off track</h1>
        <p className="mt-3 max-w-md text-gray-400">
          This page doesn&apos;t exist, or the venue may have been removed from the directory.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link
            href="/"
            className="btn-skew bg-signal px-6 py-3 font-display text-lg font-black uppercase italic text-white transition hover:bg-white hover:text-ink"
          >
            Back to the pits
          </Link>
          <Link
            href="/map"
            className="border border-white/20 px-5 py-3 font-display text-lg font-bold uppercase italic text-white transition hover:border-white"
          >
            Open the map
          </Link>
        </div>
      </div>
    </div>
  );
}
