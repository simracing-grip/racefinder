# Dropped-venue rescues — 2026-11-02

Follow-up to `data-review-fixes-2026-10-26.md`. Commit 6654e3b dropped 264 venues whose pins were geocoding centroids. Many were dropped only because an English-name OSM search found nothing. This pass looked for an exact, confirmed location for the best-known of them.

Accuracy rule (unchanged): a venue was rescued only if (a) its position comes from Wikipedia coordinates, an OSM venue/address feature, or a single map pin on the venue's own or a tourism/federation site, **and** (b) there is current evidence it is operating (2025/2026 events, live booking with hours, or a dated 2025/2026 source). Anything less stayed dropped.

| | Before | After |
|---|---|---|
| Published venues in `generated-listings.json` | 3,194 | 3,228 |
| `location-fixes.csv` (fix / keep / drop) | 149 / 11 / 264 | 183 / 11 / 230 |

Every restored listing is master's version of the record, with new `lat`, `lng`, `city` (romanised, non-empty) and `address`. Each one's row in `location-fixes.csv` is now `action=fix`, `source=manual`, with the evidence below. `lib/validation/listing.ts` passes for all 3,228 listings: 0 invalid, no duplicate slugs, no empty or local-script cities.

## Rescued (34)

| Venue (slug) | Categories | City | Lat, lng | Evidence |
|---|---|---|---|---|
| Autodromo Internacional de Maputo (`autodromo-internacional-de-maputo`) | track_day, club_only | Maputo, Mozambique | -25.940547, 32.620239 | OSM highway=raceway "Autódromo de Maputo" (way/202755515), operator ATCM; hosted SA Formula Vee round 4 on 25 July 2026 (formulavee.co.za) |
| Circuito Mike G Guadix (`circuito-mike-g-guadix`) | track_day | Guadix, Spain | 37.401000, -3.073776 | es.wikipedia "Circuito Guadix" 37.4017,-3.0747 and OSM sports_centre "Circuito de Guadix" (way/170352775) agree; racingcircuits.info lists it Active (2026), officially renamed Circuito Mike G Guadix |
| Sevilla Circuit (`sevilla-circuit`) | track_day | Carmona, Spain | 37.460305, -5.720840 | OSM leisure/sports_centre "Circuito de Sevilla" (way/1432235440) on the SE-3201, matching the official site's address (sevillacircuit.com: Ctra SE-3201 km 9, Viso del Alcor/Carmona); site live 2026 |
| Canberra Kart Racing Club (Circuit Mark Webber) (`canberra-kart-racing-club-circuit-mark-webber`) | karting, club_only | Canberra, Australia | -35.327553, 149.232603 | club website canberrakarts.com.au links its own Google Maps pin (-35.3275527,149.2326033), inside OSM Fairbairn Park Motorsport Complex; 2026 club calendar and standings on site |
| Brasília Kart (`brasilia-kart`) | karting | Brasília, Brazil | -15.751030, -47.713876 | official brasiliakart.com.br (Kartódromo Internacional de Brasília / Brasília Kart, DF-250 km 8) links its own Google Maps place at -15.7510303,-47.7138755; site © 2026 and 2025 championship; Aug 2025 press on kart races at Paranoá; OSM leisure/pitch "Kartódromo Internacional de Brasília" (way/1174847456) 0.2 km away |
| Carrera Kart Parque da Cidade (`carrera-kart-parque-da-cidade`) | karting | Brasília, Brazil | -15.795780, -47.900163 | OSM highway=raceway "Carrera Kart" (way/262405157) in Parque da Cidade; Correio Braziliense, Oct 2025, describes the venue's current kart tracks |
| K1 Speed Mississauga (`k1-speed-mississauga`) | karting | Mississauga, Canada | 43.635236, -79.621061 | official k1speed.ca/mississauga-location.html address 1330 Eglinton Ave. East; OSM address point (node/4033403780) at that number; listed as open on k1speed.com/locations |
| SPEEDERS Calgary Chinook (`speeders-calgary-chinook`) | karting | Calgary, Canada | 51.002694, -114.058371 | official speeders.ca/chinook/about address 324 58 Ave SE #4000 with current hours; OSM building (way/1457198468) at 324 58 Avenue SE |
| SPEEDERS Edmonton (`speeders-edmonton`) | karting | Edmonton, Canada | 53.585349, -113.616165 | official speeders.ca/edmonton address 12808 170 St NW Unit 16 with current hours and booking; OSM POI "Speeders" (node/10119954394) at that address |
| BattleKart Paris Ouest Dreux (`battlekart-paris-ouest-dreux`) | karting | Dreux, France | 48.746807, 1.361160 | official battlekart.com/fr/paris-ouest-dreux page map pin 48.746807,1.36116 with current hours; OSM sports_centre "BattleKart" (way/1540863442) 0.1 km away |
| BattleKart Rennes (`battlekart-rennes`) | karting | La Mézière, France | 48.191696, -1.727305 | official battlekart.com/fr/rennes page map pin 48.191696,-1.727305 and address, with current opening hours |
| BattleKart Saint-Étienne (`battlekart-saint-etienne`) | karting | Andrézieux-Bouthéon, France | 45.523769, 4.291520 | official battlekart.com/fr/saint-etienne page map pin 45.523769,4.29152 and address, with current opening hours |
| Circuit International Anthoine Hubert (`circuit-international-anthoine-hubert`) | karting | Angerville, France | 48.290125, 2.006158 | FFSA Karting event dossier GPS 48°17'24.45"N 2°00'22.17"E (Angerville, Essonne); club site askangerville.fr has 2026 track-opening calendar and 2026 interclub entries. Old pin was Angerville in Calvados |
| K1 Speed - Karting Indoor Électrique Le Mans (`k1-speed-karting-indoor-electrique-le-mans`) | karting | Le Mans, France | 47.962904, 0.218584 | official k1speed.com/fr/le-mans.html links its Google Maps place (47.962904,0.2185836) and address; listed on k1speed.com/locations |
| BattleKart Dankern (`battlekart-dankern`) | karting | Haren (Ems), Germany | 52.803493, 7.163298 | official battlekart.com/en/dankern page map pin 52.803493,7.163298 and address, with current opening hours |
| Kart-Club Kerpen (`kart-club-kerpen`) | karting | Kerpen, Germany | 50.888610, 6.613800 | de.wikipedia "Erftlandring" coordinates 50.88861,6.6138 (Kart-Club Kerpen's track); hosted DKM round 4, 14-16 Aug 2026 (adac-motorsport.de). Old city 'Kerpen (Eifel)' was the wrong town |
| G1 Gokart - World Mall (`g1-gokart-world-mall`) | karting | Budapest, Hungary | 47.549331, 19.147534 | OSM leisure/pitch "G1 Gokart Center" (node/6917918673) at World Mall, Szentmihályi út 167-169, matching programturizmus.hu listing; programturizmus.hu listing (valid to 2026-12-31) gives current hours, Asia Center/World Mall garage level -2 |
| Kartodromo ATCM Maputo (`kartodromo-atcm-maputo`) | karting, club_only | Maputo, Mozambique | -25.943092, 32.620322 | official site karting.atcm.org.mz embeds map pin -25.9430915,32.6203218 (Av. da Marginal, Entrada 2), 0.3 km from the Autódromo de Maputo; site has 2025/2026 content. Same-site pair with the autodromo |
| Daytona Raceway Palmerston North (`daytona-raceway-palmerston-north`) | karting | Palmerston North, New Zealand | -40.342582, 175.595966 | official daytona.co.nz lists 23D Bennett Street (site © 2026, live booking); OSM address point 23D Bennett Street (node/5643411627) |
| BattleKart Dubai (`battlekart-dubai`) | karting | Dubai, United Arab Emirates | 24.980837, 55.190311 | official battlekart.com/en/dubai page gives GPS 24.980837,55.190311 and the DIP 2 address, with current opening hours and booking |
| BattleKart Sheffield (`battlekart-sheffield`) | karting | Sheffield, United Kingdom | 53.405136, -1.432469 | official battlekart.com/en/sheffield page map pin 53.405136,-1.432469 and address, with current opening hours |
| Capital Karts (`capital-karts`) | karting | Birmingham, United Kingdom | 52.505436, -1.855627 | official capitalkarts.com/star-city gives Unit 12 Star City B7 5SA with online booking; pin is the OSM Star City leisure complex (way/23483259) |
| Drive Lounge Westfield London (`drive-lounge-westfield-london`) | sim_racing | London, United Kingdom | 51.507848, -0.221808 | official drivelounge.co.uk/locations/london lists one London venue, at Westfield London (Ariel Way W12 7SL), with current hours; pin is the OSM Westfield mall (relation/12609168) |
| Full Send Racing Lounge (`full-send-racing-lounge`) | sim_racing | Portsmouth, United Kingdom | 50.795462, -1.106200 | official fullsendracinglounge.co.uk gives Gunwharf Quays, Portsmouth PO1 3FA with current hours and booking; pin is the OSM Gunwharf Quays retail complex (relation/4104928). Old city Winchester was wrong |
| Teamworks Birmingham City (`teamworks-birmingham-city`) | karting | Birmingham, United Kingdom | 52.478064, -1.880959 | OSM building "Teamwork Karting" (way/73990190) at 202 Fazeley Street, the address on teamworkskarting.com/locations/birmingham-city (live Book Now, flagship venue) and at Companies House; bookable on Expedia |
| The Race Centre Chandlers Ford (`the-race-centre-chandlers-ford`) | sim_racing | Chandlers Ford, United Kingdom | 50.982322, -1.382072 | official theracecentre.co.uk/contact gives Unit 17 The Central Precinct, Winchester Road SO53 2GB; OSM building "Central Precinct" (way/78861488); October half-term 2026 offer on the site |
| The Race Lounge Star City Birmingham (`the-race-lounge-star-city-birmingham`) | sim_racing | Birmingham, United Kingdom | 52.505436, -1.855627 | official capitalkarts.com/star-city/the-race-lounge (2026) places the sim lounge inside Capital Karts Star City B7 5SA; pin is the OSM Star City leisure complex (way/23483259). Same-site pair with Capital Karts |
| Andretti Indoor Karting & Games Katy (`andretti-indoor-karting-and-games-katy`) | karting | Katy, United States | 29.787513, -95.772246 | official andrettikarting.com/katy/directions embeds a Google map at 29.787513,-95.772246 for 1230 Grand West Blvd, Katy TX 77449 (same address in TDLR record) |
| Crazy Pinz – Surfside Speedway (`crazy-pinz-surfside-speedway`) | karting | Fort Wayne, United States | 41.156432, -85.162045 | official crazypinz.com structured data lat/lng 41.1564322,-85.162045 and go-karts listed among current attractions; OSM building "Crazy Pinz Entertainment Center" (way/265490008) 0.01 km away |
| Flightdeck1 Rogue Racing (`flightdeck1-rogue-racing`) | sim_racing | Anaheim, United States | 33.805048, -117.911393 | official flightdeck1.com gives 400 W Disney Way Ste 196 (Anaheim GardenWalk) with 8 racing sims, current hours and booking (© 2026); pin is the OSM Anaheim GardenWalk mall (way/286358490) |
| K1 Speed Jacksonville (`k1-speed-jacksonville`) | karting | Jacksonville, United States | 30.255128, -81.602337 | official k1speed.com/jacksonville-location.html structured data lat/lng 30.2551278,-81.6023373 and address; listed as open on k1speed.com/locations |
| K1 Speed Karting Arlington (`k1-speed-karting-arlington`) | karting | Arlington, United States | 32.763587, -97.080585 | official k1speed.com/arlington-location.html structured data lat/lng 32.7635874,-97.0805845 and address; listed as open on k1speed.com/locations |
| K1 Speed Karting Tampa Bay (`k1-speed-karting-tampa-bay`) | karting | Tampa, United States | 27.976186, -82.341328 | official k1speed.com/tampa-bay-location.html structured data lat/lng 27.976186,-82.3413277 and address; listed as open on k1speed.com/locations |
| K1 Speed Las Vegas (`k1-speed-las-vegas`) | karting | Las Vegas, United States | 36.114248, -115.202386 | official k1speed.com/las-vegas-location.html structured data lat/lng 36.114248,-115.2023859 and address; listed as open on k1speed.com/locations |

Same-site pairs this creates (intended, like the existing 11): Capital Karts + The Race Lounge (Star City, Birmingham, same pin); Teamworks Birmingham City shares its building pin with the existing `racing-simulation-birmingham` (a sim activity sold at the same venue); Autódromo de Maputo + its kartódromo (0.3 km apart); BattleKart Dankern is 0.1 km from the existing Emslandring Dankern kart track.

## Left dropped as duplicates (9)

Their CSV rows stay `drop`, with a note added to `evidence`:

- `kartbahn-kappelen-ag` → already published as `kartbahn-kappelen`.
- `indoor-racing-aadorf` → already published as `ap-cafe-indoor-racing` (same address).
- `meta-kart-barra`, `meta-kart-campo-grande` → already published as `meta-kart-indoor-barra` and `meta-kart-indoor-campo-grande`.
- `sepang-international-kart-circuit` → already published as `sepang-international-karting-circuit`. **That listing's pin (2.800862, 101.709401, Salak Tinggi) looks about 4.5 km off.** OSM puts the track, run as RUD Karting Sepang, at 2.763316, 101.728153, beside Sepang International Circuit. Worth fixing separately.
- `circuit-mark-webber` → same track as the rescued `canberra-kart-racing-club-circuit-mark-webber`.
- `drive-lounge-london` → drivelounge.co.uk lists only one London venue, the rescued `drive-lounge-westfield-london`.
- `brasilia-kart-kartodromo-internacional-de-brasilia` → same venue as the rescued `brasilia-kart`.
- `daytona-indoor-raceway` → daytona.co.nz lists one venue, the rescued `daytona-raceway-palmerston-north`.

## Checked and left dropped

- **Andalucía Circuit** (Tabernas): real, but no 2026 activity found (site footer © 2024). The only OSM feature is a pit building ("Box Andalucia").
- **Xiamen International Circuit**: its site has 2025/26 content, but no source gives an exact location.
- **eKart Zabeel** (Dubai Mall Zabeel rooftop): the official site's TLS certificate is broken and sources disagree on the floor/location. No pin.
- **Chaos Karts Dubai**: address only (6A St, Al Quoz). No pin.
- **Emirates Karting Centre Jebel Ali**: no source. Probably the Jebel Ali Kart Track, which is already listed.
- **VOLTA Racing** (Dubai): a pop-up at Ripe Market Academy Park. Its ticket listing has ended.
- **Al Ain Raceway / Al Ain Sportplex**: real and on Visit Abu Dhabi, but no pin anywhere. The two listings are one venue.
- **Karting Town / Sharjah Kart Track**: OSM has "Karting Town" near Sharjah airport, but it's unclear whether the two names are the same track, and Karting Town has no 2026 evidence.
- **Kartódromo Benny Giannetti (ECPA, Piracicaba)**: no source after ~2010. A city-council document says the circuit is closed for works.
- **KartIndoor Pro** (5 São Paulo units): no evidence this business exists.
- **KIP / KartXperience Palmela**: no 2025/26 evidence.
- **Le Mans Karting International / Karting des 24 Heures du Mans**: operating (ACO site © 2026; Route du Chemin aux Boeufs), and probably one venue. No pin could be confirmed before the geocoders started rate-limiting. A good candidate for the next pass.
- **Raceworld Kerpen**: listed at Steinheide 1, next to the Erftlandring. It's unclear whether it is a separate venue.
- **G1 Gokart Budaring**: Budaring is a different operator from G1. The listing mixes the two.
- **Meta Kart NorteShopping**: confirmed (Dec 2025), but OSM has only the office tower and plaza, not the mall itself.
- **Address confirmed, not geocoded** (Nominatim and Photon both returned 429 near the end): SIMTrack (Helios 47, Garforth LS25 2DY), RPM Rush (7545 Presidential Ln, Manassas), Academy Sim Racing (1421 Massaro Blvd, Tampa), Fast Lane Karting (151 King St, Fenton ST4 3ER), GT Karting Leeds (Hudson Rd LS9 7DX). These are the easiest next rescues.
- **Mallala Kartdrome**: operating (2026 hours), but it has no pin separate from Mallala Motorsport Park.
- The 8 Kiryu-pin Japanese tracks and the 6 Russia-centroid venues were not re-checked. The 2026-10-26 review already covered them.

Roughly 190 drops weren't individually researched: smaller karting clubs, Chinese/Indian/Turkish venues and most sim centres. An OSM name sweep (Nominatim, all 264, original and stripped names, same country) found new exact matches for only a handful of them, the ones used above.

## Files

- `data/generated-listings.json`: 34 listings restored. Each is inserted after its master neighbour, so master's order is kept.
- `data/import/location-fixes.csv`: git-ignored. 34 rows flipped to `fix` and 9 duplicate notes added. The updated copy is in this worktree only. A copy was also left in the session notes folder. **The main checkout's `data/import/location-fixes.csv` still has the 2026-10-26 version.** Copy this one over when the branch is merged, so `npm run import:load` keeps the rescues.

## Database sync

The DB is still unreachable, so nothing has been synced. Once it's back, `npx tsx data/import/sync-to-supabase.ts` (see the 2026-10-26 report) upserts these 34 by slug. Expect **3,228** published rows if this branch is merged on top of 6654e3b.
