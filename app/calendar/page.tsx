import type { Metadata } from "next";
import { getUpcomingEvents } from "@/lib/calendar";
import CalendarView from "@/components/Calendar/CalendarView";

export const metadata: Metadata = {
  title: "Race Calendar",
  description:
    "Upcoming F1, F2, F3, F4, MotoGP, GT3, GT4, IMSA, and WEC races, linked to tracks in this directory where available.",
};

export default async function CalendarPage() {
  const events = await getUpcomingEvents();

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="mb-1 text-2xl font-bold">Race Calendar</h1>
      <p className="mb-6 text-gray-400">
        Upcoming rounds across F1, F2, F3, F4, MotoGP, GT3, GT4, IMSA, WEC, and WRC.
      </p>

      <CalendarView events={events} />
    </div>
  );
}
