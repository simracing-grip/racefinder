import type { Category } from "@/lib/types";
import { CATEGORY_LABEL, CATEGORY_BADGE_CLASS } from "@/lib/categoryMeta";

export default function CategoryBadge({ category }: { category: Category }) {
  return (
    <span
      className={`inline-block px-2 py-0.5 font-display text-xs font-bold uppercase italic tracking-wide ${CATEGORY_BADGE_CLASS[category]}`}
    >
      {CATEGORY_LABEL[category]}
    </span>
  );
}
