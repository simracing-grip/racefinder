import type { Metadata } from "next";
import { getUpcomingEvents } from "@/lib/calendar";
import CalendarView from "@/components/Calendar/CalendarView";
import PageHeader from "@/components/UI/PageHeader";
import { SERIES_LABEL } from "@/lib/seriesMeta";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Race Calendar",
  description: "Upcoming F1, MotoGP, WEC, IMSA, GT, touring car and karting rounds, linked to the circuits in RaceFinder.",
  path: "/calendar",
  image: "/calendar/opengraph-image",
});

// "Upcoming" is computed from today's date at render time, so rebuild the
// page hourly — otherwise finished rounds linger until the next deploy.
export const revalidate = 3600;

export default async function CalendarPage() {
  const events = await getUpcomingEvents();
  const seriesCount = new Set(events.map((e) => e.series)).size;
  const next = events[0];

  return (
    <div>
      <PageHeader
        kicker="Race calendar"
        title="Every race ahead"
        crumbs={[
          { href: "/", label: "Home" },
          { href: "/calendar", label: "Calendar" },
        ]}
        aside={
          <dl className="grid grid-cols-2 border border-white/10 bg-ink/70 font-mono text-sm">
            <div className="flex flex-col-reverse border-r border-white/10 px-4 py-3">
              <dt className="text-[10px] uppercase tracking-widest text-gray-500">Rounds</dt>
              <dd className="text-2xl font-semibold text-timing">{events.length}</dd>
            </div>
            <div className="flex flex-col-reverse px-4 py-3">
              <dt className="text-[10px] uppercase tracking-widest text-gray-500">Series</dt>
              <dd className="text-2xl font-semibold text-timing">{seriesCount}</dd>
            </div>
          </dl>
        }
      >
        {next ? (
          <>
            F1, MotoGP, WEC, IMSA, GT and more. Up next:{" "}
            <span className="text-white">
              {SERIES_LABEL[next.series]} · {next.name}
            </span>
            . Rounds at circuits we list link straight to the venue.
          </>
        ) : (
          "F1, MotoGP, WEC, IMSA, GT and more."
        )}
      </PageHeader>

      <div className="mx-auto max-w-5xl px-4 pt-8">
        <CalendarView events={events} />
      </div>
    </div>
  );
}
