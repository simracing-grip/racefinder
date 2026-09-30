import { ImageResponse } from "next/og";
import sharp from "sharp";
import { commonsThumb } from "@/lib/imageSizes";

// Shared renderer for link-preview (Open Graph) images: the pit-wall look
// from the site — asphalt, a category-colour glow or the venue's photo, the
// italic condensed display face and the kerb stripe — at 1200x630.

export const OG_SIZE = { width: 1200, height: 630 };
// JPEG, not Satori's PNG: a photo card is ~1.9 MB as PNG, well over what
// WhatsApp and others will show as a preview; as JPEG it's ~150 KB.
export const OG_CONTENT_TYPE = "image/jpeg";

const INK = "#07080b";
const SIGNAL = "#ff2a2a";
const TIMING = "#ffd400";

// Satori ignores 8-digit hex (#rrggbbaa) inside gradients, so alpha colours
// are passed as rgba().
function rgba(hex: string, alpha: number): string {
  const n = parseInt(hex.replace("#", ""), 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`;
}

// Barlow Condensed (the site's display face) as TTF — Satori can't read the
// WOFF2 next/font serves. Google's CSS API returns TTF URLs for plain
// requests. Fetched once per server instance; if it fails the card still
// renders in the bundled default font.
let displayFonts: Promise<{ name: string; data: ArrayBuffer; weight: 700 | 900; style: "italic" }[]> | null = null;
function loadDisplayFonts() {
  displayFonts ??= (async () => {
    const css = await fetch(
      "https://fonts.googleapis.com/css2?family=Barlow+Condensed:ital,wght@1,700;1,900",
      { cache: "force-cache" }
    ).then((r) => r.text());
    const faces = [...css.matchAll(/font-weight: (\d+);[\s\S]*?src: url\((.+?\.ttf)\)/g)];
    return Promise.all(
      faces.map(async ([, weight, url]) => ({
        name: "Barlow Condensed",
        data: await fetch(url, { cache: "force-cache" }).then((r) => r.arrayBuffer()),
        weight: Number(weight) as 700 | 900,
        style: "italic" as const,
      }))
    );
  })().catch((err) => {
    console.error("OG fonts failed to load; using the default font.", err);
    displayFonts = null; // retry next time
    return [];
  });
  return displayFonts;
}

// A cover photo inlined as a data URL, so a slow or broken image host can't
// fail the whole card. Wikimedia photos use a resized copy; anything that
// isn't a reasonably small JPEG/PNG is skipped.
export async function loadPhoto(url: string | undefined): Promise<string | null> {
  if (!url) return null;
  try {
    const res = await fetch(commonsThumb(url, 1280) ?? url, {
      headers: { "User-Agent": "RaceFinder link previews (https://motorsport-directory.vercel.app)" },
      signal: AbortSignal.timeout(5000),
    });
    const type = res.headers.get("content-type") ?? "";
    if (!res.ok || !/image\/(jpeg|png)/.test(type)) return null;
    const buf = await res.arrayBuffer();
    if (buf.byteLength > 4_000_000) return null;
    return `data:${type.split(";")[0]};base64,${Buffer.from(buf).toString("base64")}`;
  } catch {
    return null;
  }
}

// "JP" -> 🇯🇵 (rendered as a Twemoji flag by ImageResponse).
export function flagEmoji(countryCode: string | undefined): string {
  if (!countryCode || !/^[A-Za-z]{2}$/.test(countryCode) || countryCode.toUpperCase() === "XX") return "";
  return String.fromCodePoint(...[...countryCode.toUpperCase()].map((c) => 0x1f1a5 + c.charCodeAt(0)));
}

function titleSize(title: string): number {
  if (title.length <= 14) return 132;
  if (title.length <= 24) return 108;
  if (title.length <= 36) return 88;
  return 70;
}

export async function renderOgCard({
  kicker,
  title,
  subtitle,
  accent = SIGNAL,
  photo,
  badge,
}: {
  kicker: string;
  title: string;
  subtitle?: string;
  accent?: string;
  /** data URL from loadPhoto */
  photo?: string | null;
  /** timing-yellow strip, e.g. the next race */
  badge?: string;
}) {
  const fonts = await loadDisplayFonts();
  const display = fonts.length > 0 ? "Barlow Condensed" : undefined;

  const png = new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", position: "relative", background: INK, color: "white" }}>
        {photo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={photo} alt="" width={1200} height={630} style={{ position: "absolute", top: 0, left: 0, width: 1200, height: 630, objectFit: "cover" }} />
        ) : (
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: 1200,
              height: 630,
              display: "flex",
              backgroundImage: `radial-gradient(circle at 85% 15%, ${rgba(accent, 0.35)}, transparent 55%)`,
            }}
          />
        )}
        {/* legibility wash over the photo / glow */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: 1200,
            height: 630,
            display: "flex",
            backgroundImage: photo
              ? `linear-gradient(90deg, ${rgba(INK, 0.97)} 0%, ${rgba(INK, 0.88)} 42%, ${rgba(INK, 0.45)} 75%, ${rgba(INK, 0.15)} 100%)`
              : `linear-gradient(180deg, ${rgba(INK, 0)} 0%, ${INK} 100%)`,
          }}
        />

        <div style={{ position: "relative", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: "56px 64px 72px", width: "100%" }}>
          {/* wordmark */}
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ display: "flex", gap: 6 }}>
              <div style={{ width: 16, height: 34, background: SIGNAL, transform: "skewX(-24deg)" }} />
              <div style={{ width: 16, height: 34, background: "white", transform: "skewX(-24deg)" }} />
            </div>
            <div style={{ display: "flex", fontFamily: display, fontWeight: 900, fontStyle: "italic", fontSize: 40, letterSpacing: -1 }}>
              RACE<span style={{ color: SIGNAL }}>FINDER</span>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", maxWidth: 900 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14, fontFamily: display, fontWeight: 700, fontStyle: "italic", fontSize: 30, letterSpacing: 4, color: accent, textTransform: "uppercase" }}>
              <div style={{ width: 40, height: 5, background: accent }} />
              {kicker}
            </div>
            <div
              style={{
                display: "flex",
                marginTop: 10,
                fontFamily: display,
                fontWeight: 900,
                fontStyle: "italic",
                fontSize: titleSize(title),
                lineHeight: 0.92,
                textTransform: "uppercase",
              }}
            >
              {title}
            </div>
            {subtitle && <div style={{ display: "flex", marginTop: 18, fontSize: 32, color: "#d1d5db" }}>{subtitle}</div>}
            {badge && (
              <div
                style={{
                  display: "flex",
                  alignSelf: "flex-start",
                  marginTop: 22,
                  padding: "8px 16px",
                  background: TIMING,
                  color: INK,
                  fontFamily: display,
                  fontWeight: 900,
                  fontStyle: "italic",
                  fontSize: 30,
                  textTransform: "uppercase",
                }}
              >
                {badge}
              </div>
            )}
          </div>
        </div>

        {/* kerb stripe */}
        <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 16, display: "flex" }}>
          {Array.from({ length: 28 }, (_, i) => (
            <div key={i} style={{ width: 44, height: 16, background: i % 2 ? "#f4f4f5" : SIGNAL }} />
          ))}
        </div>
      </div>
    ),
    { ...OG_SIZE, fonts, emoji: "twemoji" }
  );
  const jpeg = await sharp(Buffer.from(await png.arrayBuffer())).jpeg({ quality: 82, mozjpeg: true }).toBuffer();
  return new Response(new Uint8Array(jpeg), { headers: { "Content-Type": OG_CONTENT_TYPE } });
}
