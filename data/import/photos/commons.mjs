// Helper for the RaceFinder photo run. Node 18+.
// Usage:
//   node commons.mjs search "<query>" [limit=15]      search Commons files (namespace 6)
//   node commons.mjs cat "Category:Name" [limit=40]   files in a Commons category (+ lists subcategories)
//   node commons.mjs catsearch "<query>"              find Commons categories matching a query
//   node commons.mjs wp <lang> "<Article title>"      images used in a Wikipedia article that exist on Commons
//   node commons.mjs thumb "<File:Name.jpg>" <outDir> download the standard 330px thumbnail, print local path
// Output is one JSON object per line (search/cat/wp) with licence pre-filtered.
// All network calls are paced through a cross-process lock so parallel agents share one rate budget.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';

const UA = 'RaceFinderPhotoBot/1.0 (https://github.com/simracing-grip/racefinder; blazevic35@gmail.com) node';
const API = 'https://commons.wikimedia.org/w/api.php';
const LOCKDIR = path.join(os.tmpdir(), 'racefinder-commons-lock');
const STAMP = path.join(os.tmpdir(), 'racefinder-commons-stamp');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function pace(minGapMs) {
  // cross-process mutex (mkdir is atomic) + shared "last request" timestamp
  for (let i = 0; i < 600; i++) {
    try {
      fs.mkdirSync(LOCKDIR);
      break;
    } catch {
      try {
        if (Date.now() - fs.statSync(LOCKDIR).mtimeMs > 20000) fs.rmdirSync(LOCKDIR);
      } catch {}
      await sleep(100 + Math.random() * 100);
    }
  }
  try {
    let last = 0;
    try { last = Number(fs.readFileSync(STAMP, 'utf8')) || 0; } catch {}
    const wait = last + minGapMs - Date.now();
    if (wait > 0) await sleep(wait);
    fs.writeFileSync(STAMP, String(Date.now()));
  } finally {
    try { fs.rmdirSync(LOCKDIR); } catch {}
  }
}

async function get(url, { gap = 300, binary = false } = {}) {
  for (let attempt = 0; attempt < 6; attempt++) {
    await pace(gap);
    const res = await fetch(url, { headers: { 'User-Agent': UA, 'Api-User-Agent': UA } });
    if (res.status === 429 || res.status >= 500) {
      const ra = Number(res.headers.get('retry-after')) || 10 * (attempt + 1);
      console.error(`HTTP ${res.status}, backing off ${ra}s`);
      await sleep(ra * 1000);
      continue;
    }
    if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
    return binary ? Buffer.from(await res.arrayBuffer()) : res.json();
  }
  throw new Error(`gave up (rate limited) for ${url}`);
}

const ACCEPT = /^(cc0|public domain|pd\b|cc[- ]by(-sa)?\b|cc[- ]by(-sa)?[- ]\d|attribution|no restrictions)/i;
const REJECT = /(\bnc\b|-nc|\bnd\b|-nd|non-?commercial|no derivatives)/i;
const strip = (s) => (s || '').replace(/<[^>]*>/g, '').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#0?39;/g, "'").replace(/\s+/g, ' ').trim();

function shape(page) {
  const ii = page.imageinfo && page.imageinfo[0];
  if (!ii) return null;
  const m = ii.extmetadata || {};
  const license = strip(m.LicenseShortName && m.LicenseShortName.value);
  const ok = ACCEPT.test(license) && !REJECT.test(license);
  return {
    title: page.title,
    ok,
    license,
    licenseUrl: strip(m.LicenseUrl && m.LicenseUrl.value),
    author: strip(m.Artist && m.Artist.value).slice(0, 120),
    width: ii.width,
    height: ii.height,
    mime: ii.mime,
    imageUrl: ii.url.split('?')[0],
    sourcePageUrl: ii.descriptionurl,
    desc: strip(m.ImageDescription && m.ImageDescription.value).slice(0, 140),
  };
}

const PROPS = 'prop=imageinfo&iiprop=url|size|mime|extmetadata&iiextmetadatafilter=Artist|LicenseShortName|LicenseUrl|ImageDescription';

function emit(pages, limitIdx) {
  const arr = Object.values(pages || {}).sort((a, b) => (a.index || 0) - (b.index || 0));
  let hidden = 0;
  for (const p of arr) {
    const s = shape(p);
    if (!s) continue;
    if (!/^image\/(jpeg|png|webp)$/.test(s.mime)) { hidden++; continue; }
    if (!s.ok) { hidden++; continue; }
    console.log(JSON.stringify(s));
  }
  console.log(`# ${arr.length} results, ${hidden} hidden (unacceptable licence or non-photo mime)`);
}

async function chunkedInfo(titles) {
  const out = {};
  for (let i = 0; i < titles.length; i += 40) {
    const t = titles.slice(i, i + 40).map(encodeURIComponent).join('|');
    const j = await get(`${API}?action=query&format=json&titles=${t}&${PROPS}`);
    Object.assign(out, j.query?.pages || {});
  }
  return out;
}

const [cmd, a1, a2, a3] = process.argv.slice(2);
if (cmd === 'search') {
  const j = await get(`${API}?action=query&format=json&generator=search&gsrnamespace=6&gsrlimit=${a2 || 15}&gsrsearch=${encodeURIComponent(a1)}&${PROPS}`);
  emit(j.query?.pages);
} else if (cmd === 'cat') {
  const lim = a2 || 40;
  const j = await get(`${API}?action=query&format=json&generator=categorymembers&gcmtitle=${encodeURIComponent(a1)}&gcmtype=file&gcmlimit=${lim}&${PROPS}`);
  if (j.query) {
    // categorymembers has no relevance index; keep order by title
    const pages = Object.values(j.query.pages).sort((x, y) => x.title.localeCompare(y.title));
    pages.forEach((p, i) => (p.index = i));
    emit(Object.fromEntries(pages.map((p) => [p.pageid, p])));
  } else console.log('# category empty or missing');
  const sc = await get(`${API}?action=query&format=json&list=categorymembers&cmtitle=${encodeURIComponent(a1)}&cmtype=subcat&cmlimit=30`);
  const subs = (sc.query?.categorymembers || []).map((c) => c.title);
  if (subs.length) console.log('# subcategories: ' + subs.join(' ; '));
} else if (cmd === 'catsearch') {
  const j = await get(`${API}?action=query&format=json&list=search&srnamespace=14&srlimit=10&srsearch=${encodeURIComponent(a1)}`);
  for (const r of j.query?.search || []) console.log(r.title);
} else if (cmd === 'wp') {
  const lang = a1;
  const j = await get(`https://${lang}.wikipedia.org/w/api.php?action=query&format=json&prop=images&imlimit=100&redirects=1&titles=${encodeURIComponent(a2)}`);
  const pages = Object.values(j.query?.pages || {});
  const titles = pages.flatMap((p) => (p.images || []).map((i) => i.title)).filter((t) => /\.(jpe?g|png|webp)$/i.test(t));
  if (!titles.length) { console.log('# no images (or article missing)'); }
  else emit(await chunkedInfo(titles));
} else if (cmd === 'thumb') {
  const title = a1.startsWith('File:') ? a1 : 'File:' + a1;
  const info = await chunkedInfo([title]);
  const s = shape(Object.values(info)[0] || {});
  if (!s) { console.log('ERR no imageinfo'); process.exit(1); }
  const outDir = a2 || os.tmpdir();
  fs.mkdirSync(outDir, { recursive: true });
  let url = s.imageUrl;
  if (s.width > 330) {
    // standard thumbnail: .../commons/<a>/<ab>/<File> -> .../commons/thumb/<a>/<ab>/<File>/330px-<File>
    const m = url.match(/^(https:\/\/upload\.wikimedia\.org\/wikipedia\/commons)\/(.\/..)\/(.+)$/);
    url = `${m[1]}/thumb/${m[2]}/${m[3]}/330px-${m[3]}`;
  }
  const buf = await get(url, { gap: 1100, binary: true });
  const ext = s.mime === 'image/png' ? 'png' : s.mime === 'image/webp' ? 'webp' : 'jpg';
  // Truncated names can collide (e.g. long geograph titles that differ only at
  // the end), so a short hash of the full title keeps every thumbnail distinct.
  const hash = crypto.createHash('sha1').update(title).digest('hex').slice(0, 8);
  const base = title.replace(/^File:/, '').replace(/[^A-Za-z0-9]+/g, '_').slice(0, 60) + '_' + hash;
  const file = path.join(outDir, `${base}.${ext}`);
  fs.writeFileSync(file, buf);
  console.log(file);
} else {
  console.error('unknown command');
  process.exit(2);
}
