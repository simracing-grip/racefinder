// Venues that were listed twice and merged into one (see
// data/import/merge-duplicate-venues.ts). [kept slug, removed slug] — the
// removed slug's page permanently redirects to the kept one (next.config.ts),
// so old links and search results still land on the venue.
export const MERGED_VENUES: [keep: string, drop: string][] = [
  ["actua-karting-lyon", "actua-karting-saint-laurent-de-mure"],
  ["bikernieku-kartinga-halle", "bikernieku-karting-hall"],
  ["kartingslv-kartinga-halle", "kartingslv"],
  ["karting-vuiteboeuf-good-kart-indoor-sarl", "karting-de-vuiteboeuf"],
  ["cross-park-empuriabrava", "karting-empuriabrava"],
  ["karting-taranaki", "kartsport-taranaki"],
  ["cockburn-international-kartway-tiger-kart-club", "cockburn-international-kartway"],
  ["ballarat-kart-club-haddon-park-raceway", "haddon-park-raceway"],
  ["ace-motorsport-karting", "ace-motorsport"],
  ["adrenalina-rio-kart-guadalupe", "adrenalina-rio-kart-shopping-jardim-guadalupe"],
  ["adelaide-dirt-kart-club-speedway-city", "speedway-city-complex-dirt-kart-track"],
];
