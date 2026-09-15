// ISO 3166-1 alpha-2 -> English name, for the countries this directory
// currently covers. Nominatim returns country names in the local language,
// which isn't usable directly on an English-language site — the countryCode
// it also returns is language-independent, so that's the source of truth.
export const COUNTRY_NAME_EN: Record<string, string> = {
  AT: "Austria",
  BA: "Bosnia and Herzegovina",
  BE: "Belgium",
  CH: "Switzerland",
  CZ: "Czechia",
  DE: "Germany",
  ES: "Spain",
  FR: "France",
  HR: "Croatia",
  HU: "Hungary",
  IT: "Italy",
  NL: "Netherlands",
  PL: "Poland",
  PT: "Portugal",
  SI: "Slovenia",
  SK: "Slovakia",
  GB: "United Kingdom",
};

export function countryNameEn(countryCode: string, fallback: string): string {
  return COUNTRY_NAME_EN[countryCode.toUpperCase()] ?? fallback;
}
