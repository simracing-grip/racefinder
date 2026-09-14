import type { Category } from "@/lib/types";
import { CATEGORY_LABEL, CATEGORY_BADGE_CLASS } from "@/lib/categoryMeta";

export default function CategoryBadge({ category }: { category: Category }) {
  return (
    <span
      className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${CATEGORY_BADGE_CLASS[category]}`}
    >
      {CATEGORY_LABEL[category]}
    </span>
  );
}
