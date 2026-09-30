import type { Metadata } from "next";
import { SITE_NAME } from "@/lib/site";

// Per-page metadata: <title>, description, canonical URL and the matching
// Open Graph / X card text. Without this every page shared the root
// layout's og:title ("RaceFinder — Sim Racing, …"), so a shared venue link
// never named the venue. `path` is resolved against metadataBase (SITE_URL).
export function pageMetadata({
  title,
  description,
  path,
  image = "/opengraph-image",
}: {
  title: string;
  description: string;
  path: string;
  /** The route's own opengraph-image URL, if it has one; else the site-wide card. */
  image?: string;
}): Metadata {
  const fullTitle = `${title} | ${SITE_NAME}`;
  // Always explicit: once a page sets openGraph, Next no longer picks up
  // opengraph-image files on its own — neither the root one nor the
  // route's (checked in the build output), so previews had no image.
  const images = [{ url: image, width: 1200, height: 630 }];
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: { type: "website", siteName: SITE_NAME, title: fullTitle, description, url: path, images },
    twitter: { card: "summary_large_image", title: fullTitle, description, images },
  };
}
