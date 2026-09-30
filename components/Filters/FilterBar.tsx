"use client";

import Link from "next/link";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { CATEGORIES } from "@/lib/types";
import type { Category } from "@/lib/types";
import CountrySelect from "@/components/CountrySelect";
import CategoryIcon from "@/components/Home/CategoryIcon";
import { CATEGORY_COLOR } from "@/lib/categoryMeta";

type CategoryFilter = Category | "all";

function pillClass(active: boolean): string {
  return `inline-flex items-center gap-2 border px-3 py-2 text-sm font-semibold transition ${
    active ? "border-white bg-white text-ink" : "border-white/10 bg-panel text-gray-300 hover:border-white/30"
  }`;
}

// Category/country pages (/category/[x], /country/[x]) drive this bar from
// the URL so filters stay crawlable and linkable. The homepage instead
// filters a map + list in place without navigating, so it passes
// onCategoryChange to switch the bar into controlled mode — one filter UI
// shared by both instead of two near-identical copies. The homepage doesn't
// pass onCountryChange (country there is a separate entry point — see
// CountryPicker), which hides the country select in controlled mode.
export default function FilterBar({
  countries,
  countryCodes,
  activeCategory,
  counts,
  allCount,
  country,
  onCategoryChange,
  onCountryChange,
}: {
  countries?: string[];
  countryCodes?: Record<string, string>;
  activeCategory?: CategoryFilter;
  counts?: Record<Category, number>;
  allCount?: number;
  country?: string;
  onCategoryChange?: (category: CategoryFilter) => void;
  onCountryChange?: (country: string) => void;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const controlled = !!onCategoryChange;

  const activeCountry = controlled ? country ?? "" : searchParams.get("country") ?? "";
  const countryQuery = !controlled && activeCountry ? `?country=${encodeURIComponent(activeCountry)}` : "";

  function updateCountry(value: string) {
    if (controlled) {
      onCountryChange?.(value);
      return;
    }
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set("country", value);
    } else {
      params.delete("country");
    }
    const query = params.toString();
    router.push(query ? `${pathname}?${query}` : pathname);
  }

  return (
    <div className="flex flex-wrap items-center gap-3 border border-white/10 bg-asphalt p-3">
      <div className="flex flex-wrap gap-2">
        {controlled ? (
          <button onClick={() => onCategoryChange?.("all")} className={pillClass(!activeCategory || activeCategory === "all")}>
            All {allCount != null && (!activeCategory || activeCategory === "all") && (
              <span className="opacity-70">{allCount}</span>
            )}
          </button>
        ) : (
          <Link href={`/${countryQuery}`} className={pillClass(!activeCategory)}>
            All
          </Link>
        )}
        {CATEGORIES.map((c) =>
          controlled ? (
            <button key={c.value} onClick={() => onCategoryChange?.(c.value)} className={pillClass(activeCategory === c.value)}>
              {c.label} {counts && activeCategory === c.value && <span className="opacity-70">{counts[c.value]}</span>}
            </button>
          ) : (
            <Link key={c.value} href={`/category/${c.value}${countryQuery}`} className={pillClass(activeCategory === c.value)}>
              <span style={{ color: activeCategory === c.value ? undefined : CATEGORY_COLOR[c.value] }}>
                <CategoryIcon category={c.value} className="h-4 w-4" />
              </span>
              {c.label}
            </Link>
          )
        )}
      </div>

      {(!controlled || onCountryChange) && (
        <div className="ml-auto flex items-center gap-2">
          <label htmlFor="country-select" className="text-xs font-semibold uppercase tracking-wider text-gray-500">
            Country
          </label>
          <CountrySelect
            id="country-select"
            ariaLabel="Country"
            value={activeCountry}
            onChange={updateCountry}
            options={[
              { value: "", label: "All countries" },
              ...(countries ?? []).map((c) => ({ value: c, label: c, code: countryCodes?.[c] })),
            ]}
            buttonClassName="flex min-w-[11rem] items-center justify-between gap-2 border border-white/10 bg-panel px-3 py-2 text-sm font-semibold text-gray-100 transition hover:border-white/30"
          />
        </div>
      )}
    </div>
  );
}
