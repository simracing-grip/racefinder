// Split out from lib/listings.ts so client components (e.g. CountryPicker)
// can use it without pulling the Postgres driver into the browser bundle.
export function slugifyCountry(country: string): string {
  return country.toLowerCase().replace(/\s+/g, "-");
}
