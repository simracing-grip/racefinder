"use client";

import { useState } from "react";
import Link from "next/link";
import type { Listing } from "@/lib/types";
import { CATEGORY_COLOR } from "@/lib/categoryMeta";
import CategoryIcon from "@/components/Home/CategoryIcon";
import PhotoCredit from "./PhotoCredit";

type Variant = "thumb" | "cover" | "fill";

function CameraOffIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <path d="M4 8.5A1.5 1.5 0 0 1 5.5 7h2l1.5-2h6l1.5 2h2A1.5 1.5 0 0 1 20 8.5v9a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 17.5z" />
      <circle cx="12" cy="13" r="3.2" />
      <path d="M3 3l18 18" />
    </svg>
  );
}

// Stand-in for venues without a photo, in the site's pit-wall style: asphalt,
// speed streaks, the category's color and icon, and an honest "not
// available" label. `cta` adds a nudge for venue owners to send one in
// (only where it can't end up nested inside another link).
function Placeholder({ listing, variant, cta }: { listing: Listing; variant: Variant; cta: boolean }) {
  const category = listing.categories[0];
  const color = CATEGORY_COLOR[category] ?? "#ff2a2a";

  if (variant === "thumb") {
    return (
      <div
        className="relative flex h-full w-full flex-col items-center justify-center gap-0.5 overflow-hidden bg-asphalt"
        role="img"
        aria-label={`No photo available for ${listing.name}`}
      >
        <span className="absolute inset-x-0 top-0 h-[3px]" style={{ background: color }} aria-hidden />
        <span className="speed-lines absolute inset-0" aria-hidden />
        <span className="relative" style={{ color }}>
          <CategoryIcon category={category} className="h-6 w-6" />
        </span>
        <span className="relative font-display text-[9px] font-bold uppercase italic leading-none tracking-wide text-gray-500">
          No photo
        </span>
      </div>
    );
  }

  return (
    <div className="relative h-full w-full overflow-hidden bg-asphalt" role="img" aria-label={`No photo available for ${listing.name}`}>
      <div className="grid-lines absolute inset-0" aria-hidden />
      <div className="speed-lines absolute inset-0" aria-hidden />
      <div
        className="absolute inset-0"
        style={{ background: `radial-gradient(90% 90% at 100% 0%, ${color}2e, transparent 60%)` }}
        aria-hidden
      />
      <span className="absolute -right-6 -top-4 opacity-[0.07]" style={{ color }} aria-hidden>
        <CategoryIcon category={category} className="h-56 w-56" />
      </span>

      <div className="relative flex h-full flex-col items-center justify-center gap-2 p-6 text-center">
        <span className="flex h-12 w-12 items-center justify-center border border-white/10 bg-ink/60 text-gray-400">
          <CameraOffIcon className="h-6 w-6" />
        </span>
        <p className="font-display text-2xl font-black uppercase italic leading-none text-gray-300">
          Photo not available yet
        </p>
        {cta && (
          <Link href="/contact" className="text-sm text-gray-500 underline decoration-signal decoration-2 underline-offset-4 hover:text-white">
            Run this venue? Send us a photo
          </Link>
        )}
      </div>
      <span className="kerb absolute inset-x-0 bottom-0 h-1 opacity-70" aria-hidden />
    </div>
  );
}

// A venue's cover photo with its credit, or the placeholder above when there
// is none — or when the (hotlinked) image fails to load.
//  - thumb: small square for list rows; credit shown elsewhere (row details)
//  - cover: detail-page banner; credit overlaid bottom-right
//  - fill:  absolutely fills a positioned parent (photo cards); caller places the credit
export default function VenuePhoto({
  listing,
  variant,
  className = "",
  imgClassName = "",
  cta = false,
  showCredit = variant === "cover",
}: {
  listing: Listing;
  variant: Variant;
  className?: string;
  imgClassName?: string;
  cta?: boolean;
  showCredit?: boolean;
}) {
  const [failed, setFailed] = useState(false);
  const src = failed ? undefined : listing.coverImageUrl;
  const credit = listing.coverImageCredit;

  return (
    <div className={`relative overflow-hidden ${variant === "fill" ? "absolute inset-0" : ""} ${className}`}>
      {src ? (
        <>
          {/* Remote images from many hosts — plain <img>, like the rest of the site. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={src}
            alt={listing.name}
            loading="lazy"
            onError={() => setFailed(true)}
            className={`h-full w-full object-cover ${imgClassName}`}
          />
          {showCredit && credit && (
            <div className="absolute bottom-0 right-0 max-w-[85%] bg-ink/75 px-2 py-1 backdrop-blur-sm">
              <PhotoCredit credit={credit} />
            </div>
          )}
        </>
      ) : (
        <Placeholder listing={listing} variant={variant} cta={cta} />
      )}
    </div>
  );
}
