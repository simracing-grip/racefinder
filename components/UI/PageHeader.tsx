import Link from "next/link";

export interface Crumb {
  href: string;
  label: string;
}

// Standard top-of-page header for inner pages: breadcrumbs, a red kicker,
// the italic display title, an optional intro line, and an optional slot
// on the right (stats, actions). Mirrors the home page's section headings.
export default function PageHeader({
  kicker,
  title,
  crumbs,
  aside,
  accent = "var(--color-signal)",
  children,
}: {
  kicker: string;
  title: React.ReactNode;
  crumbs?: Crumb[];
  aside?: React.ReactNode;
  accent?: string;
  children?: React.ReactNode;
}) {
  return (
    <header className="relative isolate overflow-hidden border-b border-white/5">
      <div className="grid-lines absolute inset-0 -z-10 [mask-image:linear-gradient(to_bottom,black,transparent)]" aria-hidden />
      <div
        className="absolute -right-32 -top-32 -z-10 h-80 w-80 rounded-full opacity-25 blur-3xl"
        style={{ background: accent }}
        aria-hidden
      />
      <div className="mx-auto flex max-w-7xl flex-wrap items-end justify-between gap-6 px-4 pb-8 pt-8 sm:pt-12">
        <div className="min-w-0">
          {crumbs && crumbs.length > 0 && (
            <nav aria-label="Breadcrumb" className="mb-5 flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-wider text-gray-500">
              {crumbs.map((c, i) => (
                <span key={c.href} className="flex items-center gap-2">
                  {i > 0 && <span aria-hidden>/</span>}
                  <Link href={c.href} className="transition hover:text-white">
                    {c.label}
                  </Link>
                </span>
              ))}
            </nav>
          )}
          <p className="flex items-center gap-2 font-display text-sm font-bold uppercase tracking-[0.25em]" style={{ color: accent }}>
            <span className="h-[3px] w-6" style={{ background: accent }} aria-hidden />
            {kicker}
          </p>
          <h1 className="mt-2 font-display text-5xl font-black uppercase italic leading-[0.9] text-white sm:text-6xl">
            {title}
          </h1>
          {children && <div className="mt-4 max-w-2xl text-gray-400">{children}</div>}
        </div>
        {aside && <div className="shrink-0">{aside}</div>}
      </div>
    </header>
  );
}
