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

// Local-language country names seen on venues whose geocode came back
// without a country code (stored with code "XX"), mapped to the English
// name and ISO code the rest of the directory uses. Without this they get
// no flag and their own duplicate /country page (e.g. "日本" beside "Japan").
const COUNTRY_ALIASES: Record<string, { name: string; code: string }> = {
  "Κύπρος - Kıbrıs": { name: "Cyprus", code: "CY" },
  "تونس": { name: "Tunisia", code: "TN" },
  Italia: { name: "Italy", code: "IT" },
  "Magyarország": { name: "Hungary", code: "HU" },
  "ประเทศไทย": { name: "Thailand", code: "TH" },
  "日本": { name: "Japan", code: "JP" },
  Norge: { name: "Norway", code: "NO" },
  "România": { name: "Romania", code: "RO" },
  "Panamá": { name: "Panama", code: "PA" },
  "臺灣": { name: "Taiwan", code: "TW" },
  Deutschland: { name: "Germany", code: "DE" },
};

// Country name + code as the site should show them: known local-language
// names are translated (and get their real code if it was missing), then
// the code-based English name applies as before.
export function normalizeCountry(country: string, countryCode: string): { country: string; countryCode: string } {
  const alias = COUNTRY_ALIASES[country.trim()];
  const code = !countryCode || countryCode === "XX" ? alias?.code ?? "XX" : countryCode;
  return { country: alias?.name ?? countryNameEn(code, country), countryCode: code };
}
