// Unicode regional-indicator flag, e.g. "FR" -> "🇫🇷". Used inside <option>
// elements, where the flag-icons CSS sprite below can't render (browsers
// don't apply background-image to <option>) — emoji are plain text, so they
// work in native <select> dropdowns.
export function flagEmoji(countryCode: string): string {
  return countryCode
    .toUpperCase()
    .replace(/./g, (char) => String.fromCodePoint(127397 + char.charCodeAt(0)));
}

// Renders a small flag square from the "flag-icons" package (imported in
// app/globals.css). Country codes are ISO 3166-1 alpha-2, same as
// Listing.countryCode / lib/countryNames.ts.
export default function CountryFlag({
  countryCode,
  className = "",
}: {
  countryCode: string;
  className?: string;
}) {
  return (
    <span
      className={`fi fi-${countryCode.toLowerCase()} inline-block rounded-[2px] align-[-1px] ${className}`}
      role="img"
      aria-label={`${countryCode.toUpperCase()} flag`}
    />
  );
}
