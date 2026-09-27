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
