"use client";

const RADIUS_OPTIONS = [25, 50, 100, 250, 500];

export type GeoStatus = "idle" | "loading" | "granted" | "denied" | "error";

// Small, self-contained control for the homepage explorer — deliberately not
// folded into FilterBar, which is also reused (in uncontrolled/Link mode) by
// the server-rendered /category and /country pages where "near me" has no
// server-side equivalent to link to.
export default function NearMeControl({
  active,
  status,
  radiusKm,
  onToggle,
  onRadiusChange,
}: {
  active: boolean;
  status: GeoStatus;
  radiusKm: number;
  onToggle: () => void;
  onRadiusChange: (km: number) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2 border border-white/10 bg-asphalt p-1.5">
      <button
        type="button"
        onClick={onToggle}
        aria-pressed={active}
        className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-semibold transition ${
          active ? "bg-signal text-white" : "bg-white/5 text-gray-300 hover:bg-white/10"
        }`}
      >
        <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4">
          <path
            d="M10 2a6 6 0 0 0-6 6c0 4.5 6 10 6 10s6-5.5 6-10a6 6 0 0 0-6-6Z"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinejoin="round"
          />
          <circle cx="10" cy="8" r="2" fill="currentColor" />
        </svg>
        Near me
      </button>

      {active && (
        <>
          <label htmlFor="near-me-radius" className="text-sm text-gray-400">
            within
          </label>
          <select
            id="near-me-radius"
            value={radiusKm}
            onChange={(e) => onRadiusChange(Number(e.target.value))}
            className="border border-white/10 bg-panel px-2 py-1.5 text-sm text-gray-100"
          >
            {RADIUS_OPTIONS.map((km) => (
              <option key={km} value={km}>
                {km} km
              </option>
            ))}
          </select>

          {status === "loading" && (
            <span className="text-sm text-gray-400">Finding your location&hellip;</span>
          )}
          {status === "denied" && (
            <span className="text-sm text-amber-400">
              Location access denied &mdash; allow it in your browser to use this filter.
            </span>
          )}
          {status === "error" && (
            <span className="text-sm text-amber-400">Couldn&rsquo;t get your location. Try again.</span>
          )}
        </>
      )}
    </div>
  );
}
