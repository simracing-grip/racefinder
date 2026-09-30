import type { Listing, TrackEvent } from "@/lib/types";
import { CATEGORY_LABEL } from "@/lib/categoryMeta";
import { SERIES_LABEL, SERIES_BADGE_CLASS } from "@/lib/seriesMeta";
import { formatAddress, googleMapsUrl } from "@/lib/formatAddress";

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  if (value === undefined || value === null || value === "") return null;
  return (
    <div className="flex justify-between gap-4 border-b border-gray-800 py-1.5 text-sm last:border-0">
      <span className="shrink-0 text-gray-400">{label}</span>
      <span className="text-right font-medium text-gray-100">{value}</span>
    </div>
  );
}

function formatEventDate(event: TrackEvent): string {
  const fmt = (d: Date) => d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
  const start = new Date(event.startDate);
  if (!event.endDate || event.endDate === event.startDate) {
    return `${fmt(start)} ${event.season}`;
  }
  return `${fmt(start)} – ${fmt(new Date(event.endDate))} ${event.season}`;
}

const SOCIAL_LINKS: { key: "instagramUrl" | "facebookUrl" | "tiktokUrl"; label: string; icon: React.ReactNode }[] = [
  {
    key: "instagramUrl",
    label: "Instagram",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4">
        <rect x="3" y="3" width="18" height="18" rx="5" stroke="currentColor" strokeWidth="1.7" />
        <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.7" />
        <circle cx="17.2" cy="6.8" r="1.1" fill="currentColor" />
      </svg>
    ),
  },
  {
    key: "facebookUrl",
    label: "Facebook",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4">
        <path
          d="M14 8.5h2V5.5h-2c-2.2 0-4 1.8-4 4V11H8v3h2v5h3v-5h2.2l.8-3H13V9.5c0-.6.4-1 1-1Z"
          fill="currentColor"
        />
      </svg>
    ),
  },
  {
    key: "tiktokUrl",
    label: "TikTok",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4">
        <path
          d="M16.5 3.5c.4 2.1 1.9 3.6 4 3.9v2.9c-1.5 0-2.9-.5-4-1.3v6.2a5.7 5.7 0 1 1-5.7-5.7c.3 0 .6 0 .9.1V12.7a2.8 2.8 0 1 0 1.9 2.7V3.5h2.9Z"
          fill="currentColor"
        />
      </svg>
    ),
  },
];

function SocialLinks({ listing }: { listing: Listing }) {
  const links = SOCIAL_LINKS.filter((s) => listing[s.key]);
  if (links.length === 0) return null;
  return (
    <div className="mt-3 flex flex-wrap gap-2">
      {links.map((s) => (
        <a
          key={s.key}
          href={listing[s.key]}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 rounded-full border border-gray-700 bg-gray-800 px-2.5 py-1 text-xs font-medium text-gray-200 hover:border-gray-500 hover:text-white"
        >
          {s.icon}
          {s.label}
        </a>
      ))}
    </div>
  );
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
                className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${SERIES_BADGE_CLASS[event.series]}`}
              >
                {SERIES_LABEL[event.series]}
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
      <DetailRow
        label="Address"
        value={
          listing.address && (
            <a
              href={googleMapsUrl(listing)}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 underline"
            >
              {formatAddress(listing)}
            </a>
          )
        }
      />
      <SocialLinks listing={listing} />

      <DetailRow label="Indoor / Outdoor" value={listing.indoorOutdoor} />
      <DetailRow
        label="Track length"
        value={listing.trackLengthM ? `${listing.trackLengthM.toLocaleString()} m` : undefined}
      />
      <DetailRow label="Opening hours" value={listing.openingHours} />

      {listing.description && (
        <p className="mt-3 text-sm leading-relaxed text-gray-300">{listing.description}</p>
      )}

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
