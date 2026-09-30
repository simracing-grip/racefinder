import { NextResponse } from "next/server";
import { search } from "@/lib/search";

// GET /api/search?q=monza — top matches for the header palette and the home
// hero search. Answered from the in-memory listings cache; identical queries
// are cached at the CDN for 5 minutes.
export async function GET(request: Request) {
  const q = (new URL(request.url).searchParams.get("q") ?? "").slice(0, 80);
  const results = await search(q);
  return NextResponse.json(
    { results },
    { headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=3600" } }
  );
}
