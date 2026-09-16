import type { Listing, TrackEvent } from "@/lib/types";
import { CATEGORY_LABEL } from "@/lib/categoryMeta";

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  if (value === undefined || value === null || value === "") return null;
  return (
    <div className="flex justify-between gap-4 border-b border-gray-800 py-1.5 text-sm last:border-0">
      <span className="shrink-0 text-gray-400">{label}</span>
      <span className="text-right font-medium text-gray-100">{value}</span>
    </div>
  );
}

const EVENT_SERIES_LABEL: Record<TrackEvent["series"], string> = {
  f1: "F1",
  gt3: "GT3",
};

const EVENT_SERIES_BADGE_CLASS: Record<TrackEvent["series"], string> = {
  f1: "bg-amber-500/15 text-amber-300",
  gt3: "bg-red-500/15 text-red-300",
};

function formatEventDate(event: TrackEvent): string {
  const fmt = (d: Date) => d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
  const start = new Date(event.startDate);
  if (!event.endDate || event.endDate === event.startDate) {
    return `${fmt(start)} ${event.season}`;
  }
  return `${fmt(start)} – ${fmt(new Date(event.endDate))} ${event.season}`;
}

function UpcomingEvents({ events }: { events: TrackEvent[] }) {
  const sorted = [...events].sort((a, b) => a.startDate.localeCompare(b.startDate));
  return (
    <>
      <h3 className="mt-3 mb-1 text-xs font-semibold uppercase tracking-wide text-gray-400">
        Upcoming Events
      </h3>
      <ul className="space-y-1.5">
        {sorted.map((event, i) => (
          <li key={i} className="flex items-center justify-between gap-3 text-sm">
            <span className="flex min-w-0 items-center gap-2">
              <span
                className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${EVENT_SERIES_BADGE_CLASS[event.series]}`}
              >
                {EVENT_SERIES_LABEL[event.series]}
              </span>
              <span className="truncate text-gray-100">
                {event.sourceUrl ? (
                  <a
                    href={event.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:underline"
                  >
                    {event.name}
                  </a>
                ) : (
                  event.name
                )}
              </span>
            </span>
            <span className="shrink-0 text-gray-400">{formatEventDate(event)}</span>
          </li>
        ))}
      </ul>
    </>
  );
}

// Shared between the expandable list row and the full listing page, so the
// two never drift out of sync with each other.
export default function ListingDetails({ listing }: { listing: Listing }) {
  return (
    <div>
      <DetailRow
        label="Website"
        value={
          listing.websiteUrl && (
            <a
              href={listing.websiteUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 underline"
            >
              Visit site
            </a>
          )
        }
      />
      <DetailRow label="Phone" value={listing.phone} />
      <DetailRow label="Address" value={listing.address || undefined} />
      <DetailRow label="Indoor / Outdoor" value={listing.indoorOutdoor} />
      <DetailRow
        label="Track length"
        value={listing.trackLengthM ? `${listing.trackLengthM.toLocaleString()} m` : undefined}
      />

      {listing.events && listing.events.length > 0 && (
        <UpcomingEvents events={listing.events} />
      )}

      {listing.details?.sim_racing && (
        <>
          <h3 className="mt-3 mb-1 text-xs font-semibold uppercase tracking-wide text-gray-400">
            {CATEGORY_LABEL.sim_racing}
          </h3>
          <DetailRow label="Simulators" value={listing.details.sim_racing.simulator_count} />
          <DetailRow
            label="Platforms"
            value={listing.details.sim_racing.simulator_platforms?.join(", ")}
          />
          <DetailRow label="Motion rig" value={listing.details.sim_racing.motion_rig ? "Yes" : undefined} />
          <DetailRow label="VR available" value={listing.details.sim_racing.vr_available ? "Yes" : undefined} />
        </>
      )}

      {listing.details?.track_day && (
        <>
          <h3 className="mt-3 mb-1 text-xs font-semibold uppercase tracking-wide text-gray-400">
            {CATEGORY_LABEL.track_day}
          </h3>
          <DetailRow
            label="Layouts"
            value={listing.details.track_day.track_config_variants?.join(", ")}
          />
          <DetailRow
            label="Car hire"
            value={listing.details.track_day.car_hire_available ? "Available" : undefined}
          />
          <DetailRow
            label="Passenger laps"
            value={listing.details.track_day.passenger_laps_available ? "Available" : undefined}
          />
          <DetailRow label="Operators" value={listing.details.track_day.operators?.join(", ")} />
        </>
      )}

      {listing.details?.karting && (
        <>
          <h3 className="mt-3 mb-1 text-xs font-semibold uppercase tracking-wide text-gray-400">
            {CATEGORY_LABEL.karting}
          </h3>
          <DetailRow label="Kart type" value={listing.details.karting.kart_type} />
          <DetailRow
            label="Top speed"
            value={
              listing.details.karting.max_kart_speed_kmh
                ? `${listing.details.karting.max_kart_speed_kmh} km/h`
                : undefined
            }
          />
          <DetailRow label="Minimum age/height" value={listing.details.karting.min_age_or_height} />
          <DetailRow
            label="League"
            value={listing.details.karting.league_available ? "Available" : undefined}
          />
        </>
      )}
    </div>
  );
}
