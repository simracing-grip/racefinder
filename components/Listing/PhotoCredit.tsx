import type { PhotoCredit as PhotoCreditData } from "@/lib/types";

function hostname(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

// "Photo: Author · CC BY-SA 4.0" — Creative Commons licenses require naming
// the author and license, linked back to the source where possible. Photos
// without a license (venue/tourism sites) credit the site they came from.
export default function PhotoCredit({
  credit,
  className = "",
}: {
  credit: PhotoCreditData;
  className?: string;
}) {
  const who = credit.author ?? (credit.sourceUrl ? hostname(credit.sourceUrl) : undefined);
  if (!who) return null;

  const link = "underline decoration-white/30 underline-offset-2 hover:text-white hover:decoration-white";

  return (
    <p className={`truncate text-[11px] leading-tight text-gray-400 ${className}`}>
      Photo:{" "}
      {credit.sourceUrl ? (
        <a href={credit.sourceUrl} target="_blank" rel="noopener noreferrer" className={link} title={who}>
          {who}
        </a>
      ) : (
        who
      )}
      {credit.license && (
        <>
          {" · "}
          {credit.licenseUrl ? (
            <a href={credit.licenseUrl} target="_blank" rel="noopener noreferrer license" className={link}>
              {credit.license}
            </a>
          ) : (
            credit.license
          )}
        </>
      )}
    </p>
  );
}
