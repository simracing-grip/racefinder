"use client";

import { useRouter } from "next/navigation";
import { slugifyCountry } from "@/lib/listings";
import { flagEmoji } from "@/components/CountryFlag";

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

  function handleChange(value: string) {
    if (value) {
      router.push(`/country/${slugifyCountry(value)}`);
    }
  }

  return (
    <label className="inline-flex items-center gap-2 rounded-full border border-gray-700 bg-gray-900/80 px-4 py-2 text-sm font-medium text-gray-200">
      <span className="text-gray-400">Choose your country</span>
      <select
        aria-label="Choose your country"
        defaultValue=""
        onChange={(e) => handleChange(e.target.value)}
        className="rounded-md border-none bg-transparent text-gray-100 focus:outline-none"
      >
        <option value="" disabled>
          Select&hellip;
        </option>
        {countries.map((c) => (
          <option key={c} value={c} className="bg-gray-900">
            {countryCodes[c] ? `${flagEmoji(countryCodes[c])} ` : ""}
            {c}
          </option>
        ))}
      </select>
    </label>
  );
}
