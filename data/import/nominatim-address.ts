// Turns a Nominatim reverse-geocoding answer into a venue address.
//
// display_name starts with the name of whatever OSM object is nearest the
// pin. For a road or a town that is part of the address, but for a shop,
// pub or school next door it is someone else's name (the Hockenheimring
// was once listed at "Hotel Motodrom, …"). Drop it in that case.
// find-poi-addresses.ts did the same cleanup for venues imported before this.
export function addressFromReverse(data: {
  display_name?: string;
  name?: string;
  category?: string;
  address?: Record<string, string>;
}): string {
  const display = data.display_name ?? "";
  const name = data.name?.trim();
  if (!name || ["highway", "place", "boundary", "railway"].includes(data.category ?? "")) return display;
  const parts = display.split(",").map((s) => s.trim());
  const addr = data.address ?? {};
  // A name with commas in it spans several parts.
  const nameParts = name.split(",").length;
  if (parts.slice(0, nameParts).join(", ") !== name || [addr.road, addr.city, addr.town, addr.village].includes(name)) {
    return display;
  }
  return parts.length > nameParts + 1 ? parts.slice(nameParts).join(", ") : display;
}
