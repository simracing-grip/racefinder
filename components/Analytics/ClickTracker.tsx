"use client";

import { useEffect } from "react";
import { track } from "@vercel/analytics";

// One delegated listener for the site's launch events, so server components
// can mark a link or button for tracking without becoming client components:
//
//   <a data-track="Visit website" data-track-venue={slug} ...>
//
// sends the custom event "Visit website" with { venue: slug }. Every
// data-track-* attribute becomes a property (Vercel Web Analytics custom
// events; property values must be strings, numbers or booleans).
export default function ClickTracker() {
  useEffect(() => {
    function onClick(e: MouseEvent) {
      const el = (e.target as Element | null)?.closest?.<HTMLElement>("[data-track]");
      if (!el) return;
      const props: Record<string, string> = {};
      for (const [key, value] of Object.entries(el.dataset)) {
        // dataset turns data-track-venue into trackVenue
        if (key.startsWith("track") && key !== "track" && value) {
          props[key.charAt(5).toLowerCase() + key.slice(6)] = value;
        }
      }
      track(el.dataset.track!, props);
    }
    // Capture phase, so it still fires when a handler stops propagation or
    // the click navigates away.
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, []);

  return null;
}
