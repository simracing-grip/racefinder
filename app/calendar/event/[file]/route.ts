import { CALENDAR_EVENTS } from "@/data/calendar-events";
import { buildIcs, eventId } from "@/lib/ics";
import { SITE_URL } from "@/lib/site";

// One race weekend as a downloadable .ics (/calendar/event/<id>.ics), for
// "Add to calendar" in Apple Calendar, Outlook and anything else that opens
// .ics files. Google users get a direct link instead (see lib/ics.ts).
export const revalidate = 3600;

export function generateStaticParams() {
  return CALENDAR_EVENTS.map((e) => ({ file: `${eventId(e)}.ics` }));
}

export async function GET(_request: Request, { params }: { params: Promise<{ file: string }> }) {
  const { file } = await params;
  const id = file.replace(/\.ics$/, "");
  const event = CALENDAR_EVENTS.find((e) => eventId(e) === id);
  if (!event) return new Response("Not found", { status: 404 });

  return new Response(buildIcs({ events: [event], siteUrl: SITE_URL }), {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="${file}"`,
    },
  });
}
