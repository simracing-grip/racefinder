/**
 * Builds data/track-outlines.json: a drawn layout of each venue's track, as
 * an SVG path, for the "Track layout" card on venue pages.
 *
 * Source: the same OpenFreeMap vector tiles the site's map uses (OpenMapTiles
 * schema, OpenStreetMap data). OSM highway=raceway lines are in the
 * "transportation" layer as class "raceway", at full detail at zoom 14.
 *
 * For each venue:
 *  1. fetch the zoom-14 tiles around the pin, keep the raceway lines
 *  2. join lines that touch into clusters (one cluster ≈ one track; a big
 *     circuit's pit lane and side loops join its main loop)
 *  3. pick the venue's track: for circuits (f1/track_day) the longest cluster
 *     within MAX_DIST_M of the pin, for others the nearest one
 *  4. if that cluster runs off the edge of the fetched tiles, fetch the
 *     neighbouring tiles and repeat (long circuits like the Nordschleife)
 *  5. project, simplify and scale it into a 1000-unit SVG box
 *
 * Venues with no raceway near the pin are skipped (most indoor kart tracks
 * and sim centres aren't mapped as raceways).
 *
 * Tiles are cached in data/import/.tile-cache/ (git-ignored) and fetched a few
 * at a time; OpenFreeMap has no rate limit, but a run is thousands of tiles.
 *
 * Run: npx tsx data/import/build-track-outlines.ts [--categories f1,track_day] [--slugs a,b] [--limit N]
 * The output is merged into the existing file, so runs can be split.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { VectorTile } from "@mapbox/vector-tile";
import { PbfReader } from "pbf";
import type { Listing } from "../../lib/types";

const Z = 14;
const MAX_DIST_M = 1500; // pin to track
const JOIN_M = 10; // lines whose vertices come this close are one track (connected ways share points; tile clipping keeps them)
const MIN_LENGTH_M = 250; // ignore stubs
const MAX_TILES = 120; // per venue (~15 km square at mid latitudes)
const CACHE_DIR = path.join(process.cwd(), "data", "import", ".tile-cache");
const OUT_FILE = path.join(process.cwd(), "data", "track-outlines.json");
const LISTINGS_FILE = path.join(process.cwd(), "data", "generated-listings.json");
const USER_AGENT = "venue-data-check/1.0";

// Checked by eye on 2026-11-12 and left out: the drawing would be wrong or a
// fragment. Street circuits are public roads, not mapped as raceway, so only
// odd pieces come through.
const EXCLUDE: Record<string, string> = {
  "baku-city-circuit": "street circuit, only a fragment is mapped as raceway",
  "circuit-de-monaco": "street circuit, only a fragment",
  "marina-bay-street-circuit": "street circuit, only a fragment",
  "las-vegas-strip-circuit": "street circuit, only a fragment",
  "madring": "semi-street circuit, only a fragment",
  "east-london-grand-prix-circuit": "street circuit, only a fragment",
  "schleizer-dreieck": "public-road circuit, only a fragment",
  "circuit-bugatti-le-mans": "drew part of the 24 Hours road course, not the Bugatti circuit",
  "aldo-scribante-race-circuit": "only one curve of the circuit is mapped",
  "atlantic-motorsport-park": "picked a 0.5 km loop, not the road course",
  "perth-motorplex": "only the drag strip is mapped",
  "tor-kielce": "small loop with a long road attached",
  "transilvania-motor-ring": "only part of the circuit is mapped",
};

function argValue(name: string): string | undefined {
  const i = process.argv.indexOf(name);
  return i > -1 ? process.argv[i + 1] : undefined;
}

type LngLat = [number, number];
type Line = LngLat[];

export interface TrackOutline {
  /** SVG path data in a viewBox of 0 0 w h (the longer side is 1000). */
  d: string;
  w: number;
  h: number;
  /** Total length of the drawn lines, metres (includes pit lanes). */
  lengthM: number;
}

// ---------- tiles ----------

let tileUrlTemplate: string | null = null;
async function tileUrl(x: number, y: number): Promise<string> {
  if (!tileUrlTemplate) {
    const res = await fetch("https://tiles.openfreemap.org/planet", { headers: { "User-Agent": USER_AGENT } });
    tileUrlTemplate = ((await res.json()) as { tiles: string[] }).tiles[0];
  }
  return tileUrlTemplate.replace("{z}", String(Z)).replace("{x}", String(x)).replace("{y}", String(y));
}

async function getTile(x: number, y: number): Promise<Buffer | null> {
  const file = path.join(CACHE_DIR, `${Z}-${x}-${y}.pbf`);
  if (existsSync(file)) return readFileSync(file);
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const res = await fetch(await tileUrl(x, y), { headers: { "User-Agent": USER_AGENT } });
      if (res.status === 204 || res.status === 404) {
        writeFileSync(file, Buffer.alloc(0));
        return Buffer.alloc(0);
      }
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const buf = Buffer.from(await res.arrayBuffer());
      writeFileSync(file, buf);
      return buf;
    } catch {
      await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)));
    }
  }
  return null;
}

function raceways(buf: Buffer, x: number, y: number): Line[] {
  if (buf.length === 0) return [];
  const layer = new VectorTile(new PbfReader(buf)).layers.transportation;
  if (!layer) return [];
  const n = 2 ** Z;
  const lines: Line[] = [];
  for (let i = 0; i < layer.length; i++) {
    const f = layer.feature(i);
    if (f.properties.class !== "raceway") continue;
    for (const ring of f.loadGeometry()) {
      lines.push(
        ring.map((p) => {
          const lng = ((x + p.x / layer.extent) / n) * 360 - 180;
          const my = Math.PI * (1 - (2 * (y + p.y / layer.extent)) / n);
          return [lng, (180 / Math.PI) * Math.atan(Math.sinh(my))] as LngLat;
        })
      );
    }
  }
  return lines;
}

function tileOf([lng, lat]: LngLat): [number, number] {
  const n = 2 ** Z;
  const x = Math.floor(((lng + 180) / 360) * n);
  const r = (lat * Math.PI) / 180;
  const y = Math.floor(((1 - Math.log(Math.tan(r) + 1 / Math.cos(r)) / Math.PI) / 2) * n);
  return [x, y];
}

// ---------- geometry ----------

function metres(a: LngLat, b: LngLat): number {
  const r = (d: number) => (d * Math.PI) / 180;
  const h = Math.sin(r(b[1] - a[1]) / 2) ** 2 + Math.cos(r(a[1])) * Math.cos(r(b[1])) * Math.sin(r(b[0] - a[0]) / 2) ** 2;
  return 6371000 * 2 * Math.asin(Math.sqrt(h));
}

function lineLength(l: Line): number {
  let s = 0;
  for (let i = 1; i < l.length; i++) s += metres(l[i - 1], l[i]);
  return s;
}

/** The line with extra points so no two are more than ~5 m apart. */
function densify(l: Line): Line {
  const out: Line = [];
  for (let i = 0; i < l.length; i++) {
    if (i > 0) {
      const steps = Math.floor(metres(l[i - 1], l[i]) / 5);
      for (let k = 1; k < steps; k++) {
        const t = k / steps;
        out.push([l[i - 1][0] + (l[i][0] - l[i - 1][0]) * t, l[i - 1][1] + (l[i][1] - l[i - 1][1]) * t]);
      }
    }
    out.push(l[i]);
  }
  return out;
}

/** Union lines that come within JOIN_M of each other, via a point grid. */
function cluster(lines: Line[]): Line[][] {
  const parent = lines.map((_, i) => i);
  const find = (i: number): number => (parent[i] === i ? i : (parent[i] = find(parent[i])));
  const cell = JOIN_M / 111000; // degrees, roughly; the latitude stretch only makes cells generous
  const grid = new Map<string, number[]>();
  // Points every few metres along each line, not just its vertices: where a
  // line is cut at a tile edge, the two pieces overlap along a segment but
  // may have no vertices near each other (long straights).
  const dense = lines.map(densify);
  dense.forEach((line, i) => {
    for (const [lng, lat] of line) {
      const key = `${Math.floor(lng / cell)},${Math.floor(lat / cell)}`;
      const list = grid.get(key);
      if (list) list.push(i);
      else grid.set(key, [i]);
    }
  });
  dense.forEach((line, i) => {
    for (const [lng, lat] of line) {
      const cx = Math.floor(lng / cell);
      const cy = Math.floor(lat / cell);
      for (let dx = -1; dx <= 1; dx++)
        for (let dy = -1; dy <= 1; dy++)
          for (const j of grid.get(`${cx + dx},${cy + dy}`) ?? []) {
            if (j !== i) parent[find(i)] = find(j);
          }
    }
  });
  const groups = new Map<number, Line[]>();
  lines.forEach((line, i) => {
    const root = find(i);
    const g = groups.get(root);
    if (g) g.push(line);
    else groups.set(root, [line]);
  });
  return [...groups.values()];
}

function distanceToCluster(p: LngLat, c: Line[]): number {
  let best = Infinity;
  for (const l of c) for (const v of l) best = Math.min(best, metres(p, v));
  return best;
}

/** Douglas–Peucker on planar points. */
function simplify(points: [number, number][], tol: number): [number, number][] {
  if (points.length <= 2) return points;
  const [a, b] = [points[0], points[points.length - 1]];
  // A closed loop (most circuits are one way that starts and ends at the
  // same point) has no baseline: split it at the point farthest from the
  // start and simplify the two halves, or it collapses to a single dot.
  if (Math.hypot(b[0] - a[0], b[1] - a[1]) < 1e-9) {
    let far = 1;
    for (let i = 1; i < points.length - 1; i++)
      if (Math.hypot(points[i][0] - a[0], points[i][1] - a[1]) > Math.hypot(points[far][0] - a[0], points[far][1] - a[1])) far = i;
    if (far === 0 || far === points.length - 1) return points;
    return [...simplify(points.slice(0, far + 1), tol).slice(0, -1), ...simplify(points.slice(far), tol)];
  }
  let maxD = -1;
  let idx = 0;
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const len2 = dx * dx + dy * dy;
  for (let i = 1; i < points.length - 1; i++) {
    // Distance to the segment a–b, not the infinite line through it: a line
    // that runs out along a straight and comes back (a hairpin at the end)
    // has its far end on that line, and would lose the whole straight.
    const t = Math.max(0, Math.min(1, ((points[i][0] - a[0]) * dx + (points[i][1] - a[1]) * dy) / len2));
    const d = Math.hypot(points[i][0] - (a[0] + t * dx), points[i][1] - (a[1] + t * dy));
    if (d > maxD) {
      maxD = d;
      idx = i;
    }
  }
  if (maxD <= tol) return [a, b];
  return [...simplify(points.slice(0, idx + 1), tol).slice(0, -1), ...simplify(points.slice(idx), tol)];
}

function toOutline(c: Line[]): TrackOutline {
  // Local equirectangular projection in metres around the track's centre.
  const all = c.flat();
  const lat0 = all.reduce((s, p) => s + p[1], 0) / all.length;
  const kx = 111320 * Math.cos((lat0 * Math.PI) / 180);
  const ky = 110540;
  const proj = c.map((l) => l.map(([lng, lat]) => [lng * kx, -lat * ky] as [number, number]));
  const xs = proj.flat().map((p) => p[0]);
  const ys = proj.flat().map((p) => p[1]);
  const [minX, maxX, minY, maxY] = [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)];
  const span = Math.max(maxX - minX, maxY - minY) || 1;
  const scale = 1000 / span;
  const w = Math.max(1, Math.round((maxX - minX) * scale));
  const h = Math.max(1, Math.round((maxY - minY) * scale));
  const d = proj
    .map((l) => simplify(l, span / 1500))
    .map((l) => l.map(([x, y]) => [Math.round((x - minX) * scale), Math.round((y - minY) * scale)]))
    .filter((l) => l.length >= 2)
    .map((l) => "M" + l.map(([x, y]) => `${x} ${y}`).join("L"))
    .join("");
  return { d, w, h, lengthM: Math.round(c.reduce((s, l) => s + lineLength(l), 0)) };
}

// ---------- per venue ----------

async function outlineFor(v: Listing): Promise<{ outline: TrackOutline; tiles: number; distM: number } | null> {
  const pin: LngLat = [v.lng, v.lat];
  const [cx, cy] = tileOf(pin);
  const fetched = new Map<string, Line[]>();
  const want = new Set<string>();
  for (let dx = -1; dx <= 1; dx++) for (let dy = -1; dy <= 1; dy++) want.add(`${cx + dx},${cy + dy}`);
  const circuit = v.categories.includes("f1") || v.categories.includes("track_day");

  for (let round = 0; round < 12; round++) {
    const todo = [...want].filter((k) => !fetched.has(k));
    for (let i = 0; i < todo.length; i += 4) {
      await Promise.all(
        todo.slice(i, i + 4).map(async (k) => {
          const [x, y] = k.split(",").map(Number);
          const buf = await getTile(x, y);
          fetched.set(k, buf ? raceways(buf, x, y) : []);
        })
      );
    }
    const clusters = cluster([...fetched.values()].flat())
      .map((c) => ({ c, len: c.reduce((s, l) => s + lineLength(l), 0), dist: distanceToCluster(pin, c) }))
      .filter((x) => x.len >= MIN_LENGTH_M && x.dist <= MAX_DIST_M);
    if (clusters.length === 0) return null;
    const best = circuit
      ? clusters.sort((a, b) => b.len - a.len)[0]
      : clusters.sort((a, b) => a.dist - b.dist)[0];

    // Does the chosen track reach a tile we haven't fetched the far side of?
    const edge = new Set<string>();
    for (const l of best.c)
      for (const p of l) {
        const [tx, ty] = tileOf(p);
        for (let dx = -1; dx <= 1; dx++)
          for (let dy = -1; dy <= 1; dy++) {
            const k = `${tx + dx},${ty + dy}`;
            if (!fetched.has(k)) edge.add(k);
          }
      }
    if (edge.size === 0 || fetched.size + edge.size > MAX_TILES) {
      return { outline: toOutline(best.c), tiles: fetched.size, distM: Math.round(best.dist) };
    }
    for (const k of edge) want.add(k);
  }
  return null;
}

async function main() {
  mkdirSync(CACHE_DIR, { recursive: true });
  const listings = JSON.parse(readFileSync(LISTINGS_FILE, "utf-8")) as Listing[];
  const slugs = argValue("--slugs")?.split(",");
  const categories = (argValue("--categories") ?? "f1,track_day").split(",");
  const limit = Number(argValue("--limit") ?? Infinity);
  const targets = listings
    .filter((l) => (slugs ? slugs.includes(l.slug) : l.categories.some((c) => categories.includes(c))))
    .filter((l) => !EXCLUDE[l.slug])
    .slice(0, limit);

  const out: Record<string, TrackOutline> = existsSync(OUT_FILE) ? JSON.parse(readFileSync(OUT_FILE, "utf-8")) : {};
  for (const slug of Object.keys(EXCLUDE)) delete out[slug];
  let found = 0;
  for (const [i, v] of targets.entries()) {
    const r = await outlineFor(v);
    if (r) {
      out[v.slug] = r.outline;
      found++;
    } else delete out[v.slug];
    console.log(
      `[${i + 1}/${targets.length}] ${v.slug}: ${r ? `${(r.outline.lengthM / 1000).toFixed(1)} km of lines, ${r.distM} m from pin, ${r.tiles} tiles, ${r.outline.d.length} chars` : "no raceway near the pin"}`
    );
  }
  const sorted = Object.fromEntries(Object.entries(out).sort(([a], [b]) => a.localeCompare(b)));
  writeFileSync(OUT_FILE, JSON.stringify(sorted) + "\n");
  console.log(`${found} of ${targets.length} outlined; ${Object.keys(sorted).length} in ${path.relative(process.cwd(), OUT_FILE)}.`);
}

main();
