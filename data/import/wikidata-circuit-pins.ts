// Second opinion on suspect circuit pins, without Nominatim.
//
// relocate-approximate-venues.ts needs Nominatim, which rate-limits bulk use.
// Circuits are well covered elsewhere: Wikidata has coordinates (CC0) for most
// of them, and Photon (komoot's OSM search, a separate service) can find the
// mapped track itself. A pin is moved only when
//   A) Wikidata and an OSM track/raceway found by Photon agree within 3 km
//      (the pin goes on the OSM track), or
//   B) Wikidata's official website matches ours (the pin goes to Wikidata's
//      point), and an OSM track or raceway is near that point.
// Everything else is "keep" (pin already within 1 km of both) or "review".
//
// Output is in location-fixes.csv format; apply it with
//   sync-location-fixes.ts --file <out>
//
// Usage: tsx data/import/wikidata-circuit-pins.ts --suspects <csv> --out <csv>
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { parse } from "csv-parse/sync";
import { stringify } from "csv-stringify/sync";

type Suspect = {
  slug: string;
  name: string;
  city: string;
  country: string;
  lat: string;
  lng: string;
  address: string;
  websiteUrl: string;
};
type Point = { lat: number; lng: number };
type PhotonFeature = {
  geometry: { coordinates: [number, number] };
  properties: Record<string, string | undefined>;
};

function argValue(flag: string): string | undefined {
  const i = process.argv.indexOf(flag);
  return i >= 0 ? process.argv[i + 1] : undefined;
}
const SUSPECTS_FILE = argValue("--suspects") ?? "data/import/pin-suspects-circuits.csv";
const OUT_FILE = argValue("--out") ?? "data/import/pin-fixes-wikidata.csv";
const CACHE_FILE = "data/import/.wikidata-pin-cache.json";
const UA = "venue-data-check/1.0 (one-off, low volume)";
const CITY_RADIUS_KM = 15;
// --osm-only: for karting and sim venues, which rarely have Wikidata items.
// One source, so a stricter rule: every distinctive word of the venue name
// is in the OSM name, the OSM object is a sports/track feature within 30 km,
// and all such matches sit within 0.5 km of each other (one place).
const OSM_ONLY = process.argv.includes("--osm-only");

const cache: Record<string, unknown> = existsSync(CACHE_FILE) ? JSON.parse(readFileSync(CACHE_FILE, "utf-8")) : {};
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function getJson(url: string, pauseMs: number): Promise<unknown> {
  if (url in cache) return cache[url];
  for (let attempt = 0; attempt < 3; attempt++) {
    await sleep(pauseMs);
    const res = await fetch(url, { headers: { "User-Agent": UA, Accept: "application/json" } });
    if (res.status === 429 || res.status >= 500) {
      // Back off and stop hammering; the caller treats null as "no answer".
      await sleep(30_000 * (attempt + 1));
      continue;
    }
    if (!res.ok) return null;
    const data = await res.json();
    cache[url] = data;
    writeFileSync(CACHE_FILE, JSON.stringify(cache));
    return data;
  }
  throw new Error(`gave up after repeated 429/5xx: ${url}`);
}

function km(a: Point, b: Point): number {
  const r = (d: number) => (d * Math.PI) / 180;
  const dLat = r(b.lat - a.lat);
  const dLng = r(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(r(a.lat)) * Math.cos(r(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 6371 * 2 * Math.asin(Math.sqrt(h));
}

const host = (u: string | undefined) => {
  try {
    return u ? new URL(u).hostname.replace(/^www\./, "").toLowerCase() : "";
  } catch {
    return "";
  }
};

const GENERIC = new Set([
  "circuit", "circuito", "circuit", "raceway", "speedway", "motorsport", "motorsports", "park", "international",
  "track", "racing", "race", "autodromo", "autódromo", "autodrome", "motor", "kart", "karting", "the", "de", "di",
  "del", "la", "le", "of", "and", "center", "centre", "ring", "sports", "sport", "club", "pista",
]);
const words = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .split(/[^a-z0-9]+/)
    .filter((w) => w.length > 2);
const distinctive = (s: string) => words(s).filter((w) => !GENERIC.has(w));
function allDistinctiveIn(venue: string, osm: string): boolean {
  const d = distinctive(venue);
  const w = new Set(words(osm));
  return d.length > 0 && d.every((x) => w.has(x));
}
function sharesName(a: string, b: string): boolean {
  const da = distinctive(a);
  const wb = new Set(words(b));
  return da.length > 0 && da.some((w) => wb.has(w));
}

type WikidataHit = { id: string; label: string; point: Point; website: string };

async function wikidata(s: Suspect, pin: Point): Promise<WikidataHit[]> {
  const search = (await getJson(
    `https://www.wikidata.org/w/api.php?action=wbsearchentities&format=json&language=en&uselang=en&type=item&limit=7&search=${encodeURIComponent(s.name)}`,
    300,
  )) as { search?: { id: string; label?: string }[] } | null;
  const ids = (search?.search ?? []).map((x) => x.id);
  if (!ids.length) return [];
  const ents = (await getJson(
    `https://www.wikidata.org/w/api.php?action=wbgetentities&format=json&props=claims|labels&languages=en&ids=${ids.join("|")}`,
    300,
  )) as { entities?: Record<string, { labels?: { en?: { value: string } }; claims?: Record<string, { mainsnak?: { datavalue?: { value?: unknown } } }[]> }> } | null;
  const hits: WikidataHit[] = [];
  for (const id of ids) {
    const e = ents?.entities?.[id];
    const coord = e?.claims?.P625?.[0]?.mainsnak?.datavalue?.value as { latitude: number; longitude: number } | undefined;
    if (!coord) continue;
    const point = { lat: coord.latitude, lng: coord.longitude };
    if (km(point, pin) > 60) continue;
    hits.push({
      id,
      label: e?.labels?.en?.value ?? id,
      point,
      website: String(e?.claims?.P856?.[0]?.mainsnak?.datavalue?.value ?? ""),
    });
  }
  return hits;
}

const isTrack = (f: PhotonFeature) =>
  (f.properties.osm_key === "highway" && f.properties.osm_value === "raceway") ||
  (f.properties.osm_key === "leisure" && ["track", "sports_centre", "stadium", "amusement_arcade"].includes(f.properties.osm_value ?? "")) ||
  (f.properties.osm_key === "landuse" && f.properties.osm_value === "raceway");

async function photonTracks(s: Suspect, near: Point, altName?: string): Promise<PhotonFeature[]> {
  // The venue name first, then Wikidata's label ("Cadwell Park" finds what
  // "Cadwell Park Circuit" does not).
  for (const q of [s.name, altName].filter((x, i, a): x is string => !!x && a.indexOf(x) === i)) {
    const data = (await getJson(
      `https://photon.komoot.io/api/?limit=10&lang=en&lat=${near.lat}&lon=${near.lng}&q=${encodeURIComponent(q)}`,
      1100,
    )) as { features?: PhotonFeature[] } | null;
    const found = (data?.features ?? []).filter((f) => isTrack(f) && sharesName(s.name, f.properties.name ?? ""));
    if (found.length) return found;
  }
  return [];
}

// The nearest mapped track feature within 1.5 km of a point, whatever its name.
// A sports centre outline is preferred over a raceway segment (it covers the
// whole venue); a raceway is the fallback.
async function photonTrackNear(p: Point): Promise<PhotonFeature | null> {
  for (const tag of ["leisure:sports_centre", "highway:raceway", "leisure:track", "landuse:raceway"]) {
    const data = (await getJson(
      `https://photon.komoot.io/reverse?lang=en&radius=1.5&limit=1&lat=${p.lat}&lon=${p.lng}&osm_tag=${tag}`,
      1100,
    )) as { features?: PhotonFeature[] } | null;
    const f = data?.features?.[0];
    if (f && km(pointOf(f), p) <= 1.5) return f;
  }
  return null;
}

async function photonReverse(p: Point): Promise<Record<string, string | undefined>> {
  const data = (await getJson(`https://photon.komoot.io/reverse?lang=en&lat=${p.lat}&lon=${p.lng}`, 1100)) as {
    features?: PhotonFeature[];
  } | null;
  return data?.features?.[0]?.properties ?? {};
}

function addressFrom(p: Record<string, string | undefined>): string {
  const street = [p.housenumber, p.street].filter(Boolean).join(", ");
  const parts = [street, p.locality, p.district, p.city, p.county, p.state, p.postcode, p.country];
  return parts.filter((x, i) => x && parts.indexOf(x) === i).join(", ");
}

const pointOf = (f: PhotonFeature): Point => ({ lat: f.geometry.coordinates[1], lng: f.geometry.coordinates[0] });

async function main() {
  const suspects = parse(readFileSync(SUSPECTS_FILE, "utf-8"), { columns: true, skip_empty_lines: true }) as Suspect[];
  const rows: Record<string, string | number>[] = [];
  let n = 0;
  for (const s of suspects) {
    n++;
    const pin = { lat: Number(s.lat), lng: Number(s.lng) };
    let action = "review";
    let target: Point | null = null;
    let source = "";
    let evidence = "";

    if (OSM_ONLY) {
      const found = (await photonTracks(s, pin))
        .filter((f) => allDistinctiveIn(s.name, f.properties.name ?? "") && km(pointOf(f), pin) <= 30);
      const one = found.length > 0 && found.every((f) => km(pointOf(f), pointOf(found[0])) <= 0.5);
      if (one) {
        target = pointOf(found[0]);
        source = "osm";
        evidence = `OSM ${found[0].properties.osm_value} "${found[0].properties.name}" (${found.length} match${found.length > 1 ? "es" : ""}, one place)`;
      } else {
        evidence = found.length ? `${found.length} OSM matches in different places` : "no OSM feature with the full name";
      }
    }
    const wd = OSM_ONLY ? [] : await wikidata(s, pin);
    const wdSite = wd.find((h) => h.website && host(h.website) === host(s.websiteUrl));
    const wdName = wd.find((h) => sharesName(s.name, h.label));
    const best = wdSite ?? wdName;
    const tracks = OSM_ONLY ? [] : await photonTracks(s, best?.point ?? pin, best?.label);

    if (OSM_ONLY) {
      // decided above
    } else if (best) {
      const agreeing = tracks
        .map((f) => ({ f, d: km(pointOf(f), best.point) }))
        .filter((x) => x.d <= 3)
        .sort((a, b) => a.d - b.d)[0];
      if (agreeing) {
        target = pointOf(agreeing.f);
        source = "wikidata+osm";
        evidence = `Wikidata ${best.id} "${best.label}" and OSM ${agreeing.f.properties.osm_value} "${agreeing.f.properties.name}" agree within ${agreeing.d.toFixed(1)} km`;
      } else if (wdSite && tracks.some((f) => km(pointOf(f), wdSite.point) <= 5)) {
        target = wdSite.point;
        source = "wikidata";
        evidence = `Wikidata ${wdSite.id} "${wdSite.label}" (official website matches), OSM track within 5 km`;
      } else {
        // Many tracks are mapped under a local-script name ("筑波サーキット"),
        // so the name search misses them. Second source instead: a mapped
        // raceway/track/sports centre within 1.5 km of Wikidata's point.
        const near = await photonTrackNear(best.point);
        if (near) {
          target = pointOf(near);
          source = "wikidata+osm";
          evidence = `Wikidata ${best.id} "${best.label}"; OSM ${near.properties.osm_value} "${near.properties.name ?? "unnamed"}" ${km(pointOf(near), best.point).toFixed(1)} km from it`;
        } else {
          evidence = `Wikidata ${best.id} "${best.label}" ${km(best.point, pin).toFixed(1)} km away; no OSM track agrees`;
        }
      }
    } else {
      evidence = tracks.length
        ? `no Wikidata item; OSM "${tracks[0].properties.name}" ${km(pointOf(tracks[0]), pin).toFixed(1)} km away`
        : "no Wikidata item or OSM track found";
    }

    let address = "";
    let city = "";
    if (target) {
      const moved = km(target, pin);
      if (moved < 1) {
        action = "keep";
        evidence += `; pin already within ${moved.toFixed(2)} km`;
      } else {
        const rev = await photonReverse(target);
        if (rev.country && rev.country !== s.country && rev.countrycode?.length) {
          // Country names differ between sources (e.g. "Czechia"); only flag clear mismatches.
          evidence += `; reverse geocode says ${rev.country}`;
        }
        action = "fix";
        address = addressFrom(rev);
        city =
          moved <= CITY_RADIUS_KM || !(rev.city ?? rev.locality ?? rev.county)
            ? s.city
            : (rev.city ?? rev.locality ?? rev.county)!;
        evidence += `; moved ${moved.toFixed(1)} km`;
      }
    }

    rows.push({
      slug: s.slug,
      action,
      lat: target && action === "fix" ? target.lat.toFixed(6) : "",
      lng: target && action === "fix" ? target.lng.toFixed(6) : "",
      address,
      city,
      source,
      evidence,
      name: s.name,
      country: s.country,
      oldLat: s.lat,
      oldLng: s.lng,
      oldCity: s.city,
    });
    console.log(`${n}/${suspects.length} ${action.padEnd(6)} ${s.slug} — ${evidence}`);
  }
  writeFileSync(OUT_FILE, stringify(rows, { header: true }));
  const count = (a: string) => rows.filter((r) => r.action === a).length;
  console.log(`\nfix ${count("fix")}, keep ${count("keep")}, review ${count("review")} → ${OUT_FILE}`);
}

main().then(() => process.exit(0));
