"use client";

import { useRouter } from "next/navigation";
import { slugifyCountry } from "@/lib/countrySlug";
import CountrySelect from "@/components/CountrySelect";

// Entry-point dropdown for the hero: jumps straight to a country's dedicated
// page (/country/[slug]). Distinct from FilterBar's country select further
// down the page, which narrows the in-place world map/list without
// navigating away from it.
export default function CountryPicker({
  countries,
  countryCodes,
}: {
  countries: string[];
  countryCodes: Record<string, string>;
}) {
  const router = useRouter();

  const options = countries.map((c) => ({ value: c, label: c, code: countryCodes[c] }));

  function handleChange(value: string) {
    if (value) {
      router.push(`/country/${slugifyCountry(value)}`);
    }
  }

  return (
    <div className="inline-flex items-center gap-2 border border-white/10 bg-asphalt px-4 py-2 text-sm font-semibold text-gray-200 transition hover:border-white/40">
      <span className="text-gray-400">Jump to a country</span>
      <CountrySelect
        ariaLabel="Choose your country"
        options={options}
        value=""
        onChange={handleChange}
        placeholder="Select…"
        buttonClassName="flex items-center gap-1.5 rounded-md bg-transparent text-gray-100 focus:outline-none"
      />
    </div>
  );
}
