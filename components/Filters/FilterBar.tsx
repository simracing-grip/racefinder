"use client";

import Link from "next/link";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { CATEGORIES } from "@/lib/types";
import type { Category } from "@/lib/types";

// Category is a route param (/category/[category]) rather than a query
// string, so it stays crawlable/linkable; only country is a query param.
// This component infers the active category from the current path so the
// same bar works on both "/" and "/category/[x]".
export default function FilterBar({
  countries,
  activeCategory,
}: {
  countries: string[];
  activeCategory?: Category;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const activeCountry = searchParams.get("country");
  const countryQuery = activeCountry ? `?country=${encodeURIComponent(activeCountry)}` : "";

  function updateCountry(value: string | null) {
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
    <div className="flex flex-wrap items-center gap-3 rounded-xl border border-gray-200 bg-white p-4">
      <div className="flex flex-wrap gap-2">
        <Link
          href={`/${countryQuery}`}
          className={`rounded-full px-3 py-1.5 text-sm font-medium transition ${
            !activeCategory
              ? "bg-gray-900 text-white"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          All
        </Link>
        {CATEGORIES.map((c) => (
          <Link
            key={c.value}
            href={`/category/${c.value}${countryQuery}`}
            className={`rounded-full px-3 py-1.5 text-sm font-medium transition ${
              activeCategory === c.value
                ? "bg-gray-900 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            {c.label}
          </Link>
        ))}
      </div>

      <div className="ml-auto flex items-center gap-2">
        <label htmlFor="country-select" className="text-sm text-gray-500">
          Country
        </label>
        <select
          id="country-select"
          value={activeCountry ?? ""}
          onChange={(e) => updateCountry(e.target.value || null)}
          className="rounded-lg border border-gray-200 px-2 py-1.5 text-sm"
        >
          <option value="">All countries</option>
          {countries.map((country) => (
            <option key={country} value={country}>
              {country}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
