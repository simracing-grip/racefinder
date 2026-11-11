// Unit tests for small pure helpers. Run: npm test
import { test } from "node:test";
import assert from "node:assert/strict";
import { formatAddress, googleMapsUrl } from "../lib/formatAddress";
import { distanceKm } from "../lib/geo";
import { slugifyCountry } from "../lib/countrySlug";
import { commonsThumb } from "../lib/imageSizes";
import { addressFromReverse } from "../data/import/nominatim-address";
import { fixedAddress } from "../data/import/sync-address-fixes";
import { fixedWebsite } from "../data/import/sync-website-fixes";

test("formatAddress drops a leaked POI name and admin layers", () => {
  assert.equal(
    formatAddress({
      name: "Some Karting",
      address: "Norfos vaistinė, 1B, Parodų g., Miškiniai, Lazdynai eldership, Vilnius, Vilnius County, 04133, Lithuania",
      city: "Vilnius",
      country: "Lithuania",
    }),
    "1B, Parodų g., Miškiniai, Vilnius, Lithuania",
  );
});

test("formatAddress drops the venue's own name and never repeats the city", () => {
  assert.equal(
    formatAddress({ name: "Oulton Park", address: "Oulton Park, Park Road, Tarporley, Cheshire, CW6 9BW, United Kingdom", city: "Tarporley", country: "United Kingdom" }),
    "Park Road, Tarporley, United Kingdom",
  );
  assert.equal(formatAddress({ name: "X", address: "Monza, Lombardy, Italy", city: "Monza", country: "Italy" }), "Monza, Italy");
});

test("googleMapsUrl opens directions to the exact pin", () => {
  const url = googleMapsUrl({ lat: 50.4372, lng: 5.9714 });
  assert.match(url, /^https:\/\/www\.google\.com\/maps\/dir\//);
  assert.match(url, /50\.4372/);
});

test("distanceKm is symmetric and roughly right", () => {
  const spa = { lat: 50.4372, lng: 5.9714 };
  const nurburgring = { lat: 50.3356, lng: 6.9475 };
  const d = distanceKm(spa, nurburgring);
  assert.ok(d > 65 && d < 75, `got ${d}`);
  assert.equal(d, distanceKm(nurburgring, spa));
  assert.equal(distanceKm(spa, spa), 0);
});

test("slugifyCountry", () => {
  assert.equal(slugifyCountry("United Kingdom"), "united-kingdom");
  assert.equal(slugifyCountry("Czechia"), "czechia");
});

test("commonsThumb builds a standard-size thumbnail URL", () => {
  const original = "https://upload.wikimedia.org/wikipedia/commons/6/67/Salzburgring_2014-09-17-8120.jpg";
  assert.equal(
    commonsThumb(original, 500),
    "https://upload.wikimedia.org/wikipedia/commons/thumb/6/67/Salzburgring_2014-09-17-8120.jpg/500px-Salzburgring_2014-09-17-8120.jpg",
  );
  assert.equal(commonsThumb("https://example.com/photo.jpg", 500), null);
  assert.equal(commonsThumb("https://upload.wikimedia.org/wikipedia/commons/a/ab/Map.tif", 500), null);
});

test("addressFromReverse strips an unrelated nearby place name", () => {
  assert.equal(
    addressFromReverse({
      display_name: "Hotel Motodrom, Motodrom, Hockenheim, Baden-Württemberg, 68766, Germany",
      name: "Hotel Motodrom",
      category: "tourism",
      address: { road: "Motodrom", town: "Hockenheim" },
    }),
    "Motodrom, Hockenheim, Baden-Württemberg, 68766, Germany",
  );
  // A road or a town is part of the address: keep it.
  const road = { display_name: "Motodrom, Hockenheim, Germany", name: "Motodrom", category: "highway", address: {} };
  assert.equal(addressFromReverse(road), road.display_name);
  // A name with commas spans several parts.
  assert.equal(
    addressFromReverse({ display_name: "Bar, Grill & Co, 5, Main Street, Town, Country", name: "Bar, Grill & Co", category: "amenity", address: {} }),
    "5, Main Street, Town, Country",
  );
});

test("fixedAddress applies only while the pin and old address are unchanged", () => {
  const fix = { slug: "x", lat: "1.000000", lng: "2.000000", oldAddress: "Old", address: "New", removed: "", osmCategory: "", osmType: "" };
  assert.equal(fixedAddress(fix, { lat: 1, lng: 2, address: "Old" }), "New");
  assert.equal(fixedAddress(fix, { lat: 1.01, lng: 2, address: "Old" }), undefined, "pin moved since");
  assert.equal(fixedAddress(fix, { lat: 1, lng: 2, address: "Edited" }), undefined, "address edited since");
  assert.equal(fixedAddress(undefined, { lat: 1, lng: 2, address: "Old" }), undefined);
});

test("fixedWebsite applies only while the old website is still there", () => {
  const fix = { slug: "x", oldWebsiteUrl: "http://old.example", websiteUrl: "https://new.example", source: "" };
  assert.equal(fixedWebsite(fix, "http://old.example"), "https://new.example");
  assert.equal(fixedWebsite(fix, "https://someone-else.example"), undefined);
  assert.equal(fixedWebsite({ ...fix, oldWebsiteUrl: "", websiteUrl: "https://found.example" }, undefined), "https://found.example");
});
