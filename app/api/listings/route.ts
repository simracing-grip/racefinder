import { NextRequest, NextResponse } from "next/server";
import { getListings } from "@/lib/listings";
import type { Category } from "@/lib/types";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  const listings = await getListings({
    category: (searchParams.get("category") as Category) ?? undefined,
    country: searchParams.get("country") ?? undefined,
    city: searchParams.get("city") ?? undefined,
    indoorOutdoor: searchParams.get("indoorOutdoor") ?? undefined,
  });

  return NextResponse.json({ listings, count: listings.length });
}
