import type { Category } from "@/lib/types";
import { CATEGORIES } from "@/lib/types";
import { CATEGORY_COLOR } from "@/lib/categoryMeta";
import CategoryIcon from "./CategoryIcon";

type CategoryFilter = Category | "all";

// The primary way to narrow the map/list by discipline — deliberately placed
// after the map rather than as a filter bar above it, so picking a category
// is a choice people make once they're already engaged, not a gate they hit
// before seeing anything.
export default function CategoryCards({
  counts,
  allCount,
  activeCategory,
  onSelect,
}: {
  counts: Record<Category, number>;
  allCount: number;
  activeCategory: CategoryFilter;
  onSelect: (category: CategoryFilter) => void;
}) {
  const cards: { value: CategoryFilter; label: string; count: number; color: string }[] = [
    { value: "all", label: "All venues", count: allCount, color: "#e5e7eb" },
    ...CATEGORIES.filter((c) => counts[c.value] > 0).map((c) => ({
      value: c.value,
      label: c.plural,
      count: counts[c.value],
      color: CATEGORY_COLOR[c.value],
    })),
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
      {cards.map((card) => {
        const active = activeCategory === card.value || (activeCategory === "all" && card.value === "all");
        return (
          <button
            key={card.value}
            onClick={() => onSelect(card.value)}
            aria-pressed={active}
            className={`group relative overflow-hidden rounded-xl border bg-gray-900 p-4 text-left transition hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/20 ${
              active ? "border-red-500/70 ring-1 ring-red-500/40" : "border-gray-800 hover:border-gray-600"
            }`}
          >
            <span className="absolute inset-x-0 top-0 h-1" style={{ background: card.color }} aria-hidden />
            <span
              className="flex h-10 w-10 items-center justify-center rounded-lg"
              style={{ background: `${card.color}22`, color: card.color }}
            >
              <CategoryIcon category={card.value} />
            </span>
            <p className="mt-3 truncate font-semibold text-gray-100">{card.label}</p>
            <p className="text-xs text-gray-400">
              {card.count} location{card.count === 1 ? "" : "s"}
            </p>
          </button>
        );
      })}
    </div>
  );
}
