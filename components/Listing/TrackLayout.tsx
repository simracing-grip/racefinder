import type { TrackOutline } from "@/data/track-outlines";

// The venue's track drawn from OpenStreetMap, in the same signal red as the
// track outlines on the map. Pure SVG, rendered on the server.
export default function TrackLayout({ outline, name }: { outline: TrackOutline; name: string }) {
  // Padding scales with the drawing so the glow isn't clipped at the edges.
  const pad = 60;
  const viewBox = `${-pad} ${-pad} ${outline.w + 2 * pad} ${outline.h + 2 * pad}`;
  return (
    <section className="border border-white/10 bg-asphalt p-5 sm:p-6">
      <h2 className="font-display text-2xl font-black uppercase italic text-white">Track layout</h2>
      <div className="mt-4 flex justify-center bg-ink/60 px-4 py-6 sm:py-8">
        <svg
          viewBox={viewBox}
          role="img"
          aria-label={`Track layout of ${name}`}
          className="h-auto max-h-80 w-full max-w-lg"
          preserveAspectRatio="xMidYMid meet"
        >
          <path
            d={outline.d}
            fill="none"
            stroke="#ff2a2a"
            strokeOpacity={0.18}
            strokeWidth={28}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d={outline.d}
            fill="none"
            stroke="#ff2a2a"
            strokeWidth={8}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
      <p className="mt-3 text-xs text-gray-500">
        Drawn from{" "}
        <a href="https://www.openstreetmap.org/copyright" className="underline hover:text-gray-300" rel="noopener">
          OpenStreetMap
        </a>{" "}
        data, so it may include pit lanes and side loops. © OpenStreetMap contributors.
      </p>
    </section>
  );
}
