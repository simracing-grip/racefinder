// Resized cover photos without an image service: Wikimedia Commons serves
// scaled copies of every upload from its own CDN, e.g.
//   .../commons/b/b3/Name.jpg  ->  .../commons/thumb/b/b3/Name.jpg/960px-Name.jpg
// Originals are often 5-12 MB, which is what the site used to hotlink.
//
// Commons only accepts its standard thumbnail widths (anything else is a
// 400), and it refuses to upscale — a width wider than the original is also
// an error — so callers must fall back to the original URL on failure (see
// VenuePhoto). Photos from other hosts are returned unchanged.
export type CommonsWidth = 120 | 250 | 330 | 500 | 960 | 1280 | 1920;

const COMMONS_ORIGINAL = /^(https:\/\/upload\.wikimedia\.org\/wikipedia\/commons)\/([0-9a-f])\/([0-9a-f]{2})\/([^/]+)$/;
const COMMONS_THUMB = /^(https:\/\/upload\.wikimedia\.org\/wikipedia\/commons)\/thumb\/([0-9a-f])\/([0-9a-f]{2})\/([^/]+)\/[^/]+$/;

export function commonsThumb(url: string, width: CommonsWidth): string | null {
  const m = url.match(COMMONS_ORIGINAL) ?? url.match(COMMONS_THUMB);
  if (!m) return null;
  const [, base, a, ab, file] = m;
  const ext = file.split(".").pop()?.toLowerCase();
  // SVGs are rasterized to PNG; multi-page formats use a different naming
  // scheme we don't need — leave those as originals.
  if (ext === "tif" || ext === "tiff" || ext === "pdf" || ext === "djvu") return null;
  return `${base}/thumb/${a}/${ab}/${file}/${width}px-${file}${ext === "svg" ? ".png" : ""}`;
}

// src + srcSet for an <img>, or just the original when it isn't a Commons photo.
export function responsiveSources(
  url: string,
  widths: readonly CommonsWidth[]
): { src: string; srcSet?: string } {
  const candidates = widths.map((w) => [w, commonsThumb(url, w)] as const);
  if (candidates.some(([, u]) => !u)) return { src: url };
  const fallback = candidates.find(([w]) => w >= 960) ?? candidates[candidates.length - 1];
  return {
    src: fallback[1]!,
    srcSet: candidates.length > 1 ? candidates.map(([w, u]) => `${u} ${w}w`).join(", ") : undefined,
  };
}
