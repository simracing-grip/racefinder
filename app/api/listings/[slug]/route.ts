import { NextResponse } from "next/server";
import { getListingBySlug } from "@/lib/listings";

// Full details for one venue — what a list row loads when it's expanded,
// since lists/maps only ship ListingSummary. Served from the shared listings
// cache and cached at the CDN for 5 minutes (same freshness as the pages).
export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const listing = await getListingBySlug(slug);
  if (!listing) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(listing, {
    headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=86400" },
  });
}
