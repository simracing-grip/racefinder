// Shared layout pieces for the text pages (About, Privacy, Terms): a readable
// column and numbered sections with the display-font heading style.
export function ProseColumn({ children }: { children: React.ReactNode }) {
  return <div className="mx-auto max-w-3xl px-4 pt-10">{children}</div>;
}

export function ProseSection({
  title,
  number,
  children,
}: {
  title: string;
  number?: number;
  children: React.ReactNode;
}) {
  return (
    <section className="mb-10">
      <h2 className="mb-3 flex items-baseline gap-3 font-display text-2xl font-black uppercase italic text-white">
        {number != null && <span className="font-mono text-sm not-italic text-signal">{String(number).padStart(2, "0")}</span>}
        {title}
      </h2>
      <div className="space-y-3 leading-relaxed text-gray-400">{children}</div>
    </section>
  );
}
