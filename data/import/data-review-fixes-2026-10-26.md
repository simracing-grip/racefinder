# Data review fixes — 2026-10-26

Fixes for the problems found in the 2026-10-20 visitor/data review. All changes are in `data/generated-listings.json`. **Postgres is not synced yet:** the Supabase project is still unreachable (`tenant/user postgres.aqjltrsawiphkiixwjzt not found` from the pooler on 2026-10-26). See [Database sync](#database-sync).

Accuracy rule: a venue whose position couldn't be confirmed from an independent source (OSM venue feature, Wikipedia coordinates, the venue's or a tourism board's own map) was dropped, not guessed.

| | Before (master) | After |
|---|---|---|
| Published venues | 3,456 | 3,194 |
| F1 venues | 21 | 24 |
| F1 venues without a website | 21 | 1 (Shanghai, see below) |
| Venues sharing a pin with another | 414 on 167 points | 22 on 11 points, all real same-site pairs |
| Empty city | 86 | 0 |
| City in local script | 14 | 0 |
| Categories (karting / track_day / sim_racing / f1 / club_only) | 2,526 / 463 / 454 / 21 / 25 | 2,302 / 455 / 420 / 24 / 20 |

## F1

- **Red Bull Ring** and **Hungaroring**: `track_day` → `f1` + `track_day`. `f1` is listed first because the site uses the first category as the venue's main one (pin, card label, page copy), like the other F1 venues.
- **Madring** (Madrid) added as `f1`: it opened in August 2026 and hosted the 2026 Spanish Grand Prix in September (en.wikipedia "Madring"; madring.com). Coordinates 40.465278, -3.615278 (Wikipedia). City Madrid, address IFEMA, Av. del Partenón 5, 28042 Madrid. Only `f1`, because the circuit is used for F1 only.
- **Official websites** added for 22 F1 venues. Each one was fetched on 2026-10-26 and its page title checked. Two domains that look official were rejected: `jeddahcorniche.com` is for sale, and `gpbrazil.com` is an unrelated French site. For street and promoter-run venues, the site used is the Grand Prix's own site.

| Venue | websiteUrl |
|---|---|
| Jeddah Corniche Circuit | https://saudiarabiangp.com/en |
| Miami International Autodrome | https://f1miamigp.com/ |
| Circuit de Monaco | https://acm.mc/en/ (Automobile Club de Monaco) |
| Circuit de Barcelona-Catalunya | https://www.circuitcat.com/en/ |
| Circuit Gilles Villeneuve | https://gpcanada.ca/ |
| Silverstone Circuit | https://www.silverstone.co.uk/ |
| Circuit de Spa-Francorchamps | https://www.spa-francorchamps.be/en |
| Circuit Zandvoort | https://www.circuitzandvoort.nl/ |
| Autodromo Nazionale Monza | https://www.monzanet.it/ |
| Baku City Circuit | https://www.bakucitycircuit.com/ |
| Marina Bay Street Circuit | https://singaporegp.sg/en/ |
| Circuit of the Americas | https://circuitoftheamericas.com/ |
| Autódromo Hermanos Rodríguez | https://www.mexicogp.mx/ (CIE, the race promoter; `autodromohermanosrodriguez.com.mx` is an unofficial Blogger blog) |
| Autódromo José Carlos Pace | https://f1saopaulo.com.br/ |
| Las Vegas Strip Circuit | https://www.f1lasvegasgp.com/ |
| Yas Marina Circuit | https://www.yasmarinacircuit.com/en/ |
| Bahrain International Circuit | https://www.bahraingp.com/ |
| Albert Park Circuit | https://www.grandprix.com.au/ |
| Suzuka International Racing Course | https://www.suzukacircuit.jp/en/ |
| Losail International Circuit | https://www.lcsc.qa/ |
| Red Bull Ring | https://www.redbullring.com/en/ |
| Hungaroring | https://hungaroring.hu/ |

- **Shanghai International Circuit** still has no website. Wikipedia lists `shang-sai.com`, which now serves a spam streaming site. The older `icsh.sh.cn` returns 403, and `shcsport.com` doesn't resolve. The circuit's official channel is WeChat.

## New circuit

- **Circuito de Jerez – Ángel Nieto** added as `track_day`. City Jerez de la Frontera, address Carretera de Arcos km 10, 11406. Coordinates 36.708333, -6.034167 come from en.wikipedia. Website https://circuitodejerez.com/. No existing listing is within 3 km.

## Mis-categorised sim venues

`sim_racing` + `track_day` → `sim_racing` for:
- Nürburgring eSports Sim Racing Lounge Köln (`nurburgring-esports-sim-racing-lounge-koln`)
- Nürburgring eSports SimRacing Bar & Lounge (`nurburgring-esports-simracing-bar-and-lounge`)

## Coordinates

This builds on the earlier re-geocode session (`claude/hungry-lovelace-437337`, report in `location-report-2026-10-01.md`). That session's work was never committed or applied to the JSON on master. Its decisions in `data/import/location-fixes.csv` covered exactly the 414 shared-pin venues: 137 moved, 7 kept, 270 dropped. This branch commits its scripts (`find-approximate-locations.ts`, `relocate-approximate-venues.ts`, `sync-location-fixes.ts`, and the `import-to-db.ts` hook) and applies its decisions, with the amendments below.

### Rescued from the earlier drop list (13)

The earlier session queried OSM with English names only. Several of its drops were also real same-site pairs that it had flagged as "unrelated venues on one spot".

| Venue | Was | Now | Evidence |
|---|---|---|---|
| Biwako Sports Land | Kiryu centroid | Otsu, Shiga (35.151942, 135.889132) | OSM raceway "琵琶湖スポーツランド", single match |
| New Kyowa Kart Land | Kiryu centroid | Daisen, Akita (39.640115, 140.419290) | OSM raceway "新協和カートランド", single match |
| Igashira Motor Park | Kiryu centroid | Moka, Tochigi (36.503841, 139.985426) | OSM raceway "井頭モーターパーク(レーシングコース)" |
| Nakayama Circuit Kart Course | Kiryu centroid | Wake, Okayama (34.783750, 134.177694) | OSM raceway "中山サーキット カートコース". The earlier English query had matched a horse racecourse |
| Sports Land Tamada | Kiryu centroid | Hiroshima (34.561850, 132.559281) | ja.wikipedia coordinates |
| Suzuka Twin Circuit | Suzuka city hall | Suzuka (34.805403, 136.496028) | ja.wikipedia coordinates |
| Mallala Motorsport Park | Mallala township centre | Mallala (-34.415, 138.504722) | en.wikipedia coordinates, 2.3 km from the old pin |
| Almería Circuit | motorway pin outside Almería | Tabernas (37.0899, -2.2719) | es.wikipedia coordinates, and OSM "Circuito Costa de Almería" is 0.13 km away |
| Chengdu Tianfu International Circuit | central Chengdu | Jianyang (30.493744, 104.434147) | en.wikipedia coordinates, 40 km from the old pin |
| The Bend Motorsport Park / The Bend Kartdrome | dropped | kept in place | Pin is 0.7 km from Wikipedia's, inside the complex. The two are a same-site pair |
| Taupo Motorsport Park / Taupo Go Karts | dropped | kept in place | Pin is 0.5 km from Wikipedia's. The go-karts are a taupomp.co.nz subpage, so the two are a same-site pair |

### Brief-named groups

- **Russia centroid (64.6863, 97.7453), 6 venues.** 100% Karting, Dixxodrom, Karting Center, Karting Serebryaby Dozhd, Lider Kart Circuit and Pilot are all **dropped**. They have no city, no website and no phone, and the names are generic or ambiguous in OSM, so nothing ties them to a place.
- **Kiryu pin (36.5748, 139.2394), 15 Japanese tracks.** Seven are now located:
  - Fuji Speedway Kart Circuit and Ishino Circuit were moved by the earlier session.
  - Biwako, New Kyowa, Igashira, Nakayama and Tamada were rescued above.
  - Eight are **dropped** because no source gives their location: Capital Sports Land, Haruna Motor Sports Land, Kart Land Hiro Paradise, Kart Land ORC, Kota Circuit YRP Kiriyama, MSL Hobby, Natura Circuit and Seto Inland Sea Circuit.

### Further bad pins found while filling cities (10)

These pins weren't shared with another venue, so the shared-pin check missed them. They surfaced because their reverse-geocoded address had no town.

| Venue | Action | Reason |
|---|---|---|
| Nonstop Karting | moved to Waterford (52.250930, -7.166360), website + phone added | Discover Ireland listing for Non-Stop Karting, Old Kilmeaden Rd, Waterford City. The old pin was a café in Lismore, 55 km away |
| Red Go Kart | moved 4 km (41.012183, 28.814959), Istanbul | OSM raceway "Red Go Kart", single match |
| Speed Zone at Riverland Dubai | moved 10 km (24.918411, 55.008224), Dubai | Dubai Parks & Resorts lists Speed Zone karting inside Riverland. The old pin was a pharmacy in Jebel Ali |
| SB Raceway | dropped | Pin is exactly the San Bernardino County centroid |
| Obye Karting | dropped | Pin is exactly Cambodia's country centroid |
| Buttonwillow Kart Track | dropped | Pin is the Buttonwillow census-area centroid |
| Kinsmen Kart Club | dropped | Pin is in the Sequoia backcountry. The only OSM match is 300 km away |
| Splash n Putt | dropped | Pin is a Newfoundland-island centroid, and karting at the OSM water park isn't confirmed |
| Kartódromo Francisco de Aguirre | dropped | Local press puts it in Santiago del Estero city, but the pin is in Termas de Río Hondo, 70 km away |
| TopTime Racing Simulator | dropped | The address (Nangang, Taipei) and the pin (Xizhi, New Taipei) are about 8 km apart |

**Totals now in `location-fixes.csv`:** 149 moved, 11 kept, 264 dropped. The other dropped venues and their reasons are as listed in `location-report-2026-10-01.md`, minus the 13 rescues above.

## Cities

- **Empty city (86):**
  - 20 of these venues were dropped as unlocatable (above or in the earlier session).
  - 59 were filled by hand from the venue's address. Where the address only gave a rural locality, the nearest town the venue is known by was used: Knockhill → Dunfermline, Mondello Park → Naas, Hume Raceway → Seymour.
  - 7 got a city when they were relocated.
- **Local script (14), romanised:**
  - Japan: 小山町 → Oyama (Fuji Speedway), 茂木町 → Motegi, 村田町 → Murata (SUGO), 多可町 → Taka (Central Circuit), 更別村 → Sarabetsu (Tokachi), 大津町 → Ozu (HSR Kyushu), 美浜町 → Mihama.
  - Elsewhere: ตำบลบ้านบัว → Buriram (Chang), เขาไม้แก้ว → Pattaya (Bira), 東港鎮 → Donggang (PenBay), Δασάκι Άχνας → Achna, دهستان سخت سر → Ramsar, تونس → Tunis.
  - 新北市 (TopTime) was dropped instead, see above.

Every city change by slug:

```
silverstone-circuit Silverstone · circuit-of-the-americas Austin · anglesey-circuit Aberffraw · knockhill-racing-circuit Dunfermline
mondello-park Naas · dubai-kartdrome / rush-racing-esports / immersive-esports / dubai-autodrome / jebel-ali-kart-track Dubai
sonoma-raceway Sonoma · carolina-motorsports-park Kershaw · chuckwalla-valley-raceway Desert Center · speedsportz-racing-park New Caney
game-over-gold-coast Helensvale · powerplay-bibra-lake Bibra Lake · mega-fast-karts-wanneroo / wanneroo-international-raceway / motormall-wanneroo-raceway Wanneroo
winton-motor-raceway Winton · symmons-plains-raceway Symmons Plains · game-over-queenstown Queenstown · raceline-karting-off-road-nz Rotorua
levels-raceway Timaru · rochester-kart-club Rochester · norwell-motorplex Norwell · collie-motorplex Collie
cockburn-international-kartway(-tiger-kart-club) Henderson · alice-springs-kart-club-arunga-park Alice Springs · go-karts-go-nelson-bay Bobs Farm
c1-speed-indoor-karting-and-laser-tag Albion Park Rail · perth-motorplex Kwinana · griffith-kart-club-circuit Griffith · lithgow-city-raceway Lithgow
lismore-kart-club-circuit Lismore · pacific-parkway-international Port Macquarie · sapphire-coast-kart-circuit Bega · charters-towers-kart-circuit Charters Towers
maryborough-speedway-karting Maryborough · mount-isa-kart-circuit Mount Isa · rockhampton-kart-club-circuit Bajool · sandy-creek-raceway Warwick
whitsunday-raceway Proserpine · geelong-motor-sports-complex-dirt-kart-track Avalon · buckley-park-raceway Hamilton · hume-international-raceway Seymour
goomalling-dirt-kart-club-track Goomalling · dowerin-dirt-kart-club-track Dowerin · esperance-kart-klub-circuit Esperance · hedland-kart-club-circuit South Hedland
jennacubbine-dirt-kart-club-track Jennacubbine · dirt-trackers-kart-club-track-oldbury Oldbury · glenburnie-kartway Mount Gambier · monarto-karting-complex Monarto
mt-young-raceway Whyalla · katherine-speedway-dirt-karts Katherine · kartsport-dunedin Dunedin · teamsport-go-karting-warrington Warrington
```

## Database sync

The JSON is the source of truth for this change. Once the Supabase project is back (restored or re-created with the same schema):

1. Check how many published rows the DB has. If it was restored from a backup older than 2026-10-01, it may not have master's latest additions either.
2. Run `npx tsx data/import/sync-to-supabase.ts` from a checkout with `.env`. It upserts every listing in the JSON by slug and archives (doesn't delete) published rows that are no longer in it. That covers all of the above: categories, websites, cities, moved pins, the 2 new circuits and the 264 drops.
   - `sync-location-fixes.ts` is not needed on top of it. It touches only lat/lng/address/city/status and is a no-op against this JSON. The dry run reports 3,194 → 3,194.
   - The earlier session's report says it "applied" its fixes. Nothing reached the JSON, though, and the DB was already unreachable when it was checked on 2026-10-16. Assume the DB has none of it.
3. Expect 3,194 published rows afterwards.

**Re-import caveat (pre-existing):** `npm run import:load` regenerates the JSON from `data/import/review.csv`. It would undo the category, website and city edits here and drop Madring, Jerez and the Balkan venues added on 2026-10-01, because `review.csv` hasn't been the source of truth for a while. Location decisions do survive a re-import, since `import-to-db.ts` now reads `location-fixes.csv`. That CSV is git-ignored (`/data/import/*.csv`), so its updated copy was placed in the main checkout's `data/import/` and the previous one was kept as `location-fixes.2026-10-01.csv`.
