import { getListings } from "@/lib/listings";
import { CATEGORIES } from "@/lib/types";
import { CATEGORY_COLOR } from "@/lib/categoryMeta";
import { OG_SIZE, OG_CONTENT_TYPE, renderOgCard } from "@/lib/og";

export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;
export const alt = "RaceFinder discipline preview";
export const revalidate = 3600;

export function generateStaticParams() {
  return CATEGORIES.map((c) => ({ category: c.value }));
}

export default async function Image({ params }: { params: Promise<{ category: string }> }) {
  const { category } = await params;
  const meta = CATEGORIES.find((c) => c.value === category);
  if (!meta) return renderOgCard({ kicker: "RaceFinder", title: "Not found" });

  const count = (await getListings({ category: meta.value })).length;
  return renderOgCard({
    kicker: "Discipline",
    title: meta.plural,
    subtitle: `${count.toLocaleString("en-GB")} venues worldwide — on a map, with upcoming race weekends`,
    accent: CATEGORY_COLOR[meta.value],
  });
}
