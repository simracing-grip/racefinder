"use client";

import { createContext, useContext, useSyncExternalStore } from "react";
import { todayUtc } from "@/lib/today";

// "Today" (see lib/today.ts) for client components
// that hide finished races or count down to the next one.
//
// Pages are cached (ISR) and can be served hours or, if regeneration keeps
// failing, days after they were rendered, so a client component can't just
// call new Date() while rendering: on hydration it would disagree with the
// server HTML (React error #418) whenever the date has moved on. Instead the
// root layout passes the date it rendered with down through this context,
// hydration uses that, and the visitor's real date takes over right after.
const RenderedOnContext = createContext<string | null>(null);

export default function TodayProvider({ renderedOn, children }: { renderedOn: string; children: React.ReactNode }) {
  return <RenderedOnContext.Provider value={renderedOn}>{children}</RenderedOnContext.Provider>;
}

// Re-checks once a minute so an open tab rolls over at midnight UTC.
function subscribe(onChange: () => void) {
  const id = setInterval(onChange, 60_000);
  return () => clearInterval(id);
}

export function useToday(): string {
  const renderedOn = useContext(RenderedOnContext) ?? todayUtc();
  return useSyncExternalStore(subscribe, todayUtc, () => renderedOn);
}
