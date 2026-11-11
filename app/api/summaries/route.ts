import { NextResponse } from "next/server";
import { getListings } from "@/lib/listings";
import { toSummaries } from "@/lib/listingSummary";

// GET /api/summaries — the slim venue list behind the home page map and
// list. Fetched by the browser when that section scrolls near, instead of
// being embedded in the home page HTML (it was ~800 KB of a 920 KB page).
// Cached like a page: built once, rebuilt at most every 5 minutes.
export const dynamic = "force-static";
export const revalidate = 300;

export async function GET() {
  return NextResponse.json(toSummaries(await getListings()));
}
