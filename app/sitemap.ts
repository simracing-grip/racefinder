import type { MetadataRoute } from "next";
import { getListings, getCountries } from "@/lib/listings";
import { CATEGORIES } from "@/lib/types";
import { SITE_URL } from "@/lib/site";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [listings, countries] = await Promise.all([getListings(), getCountries()]);

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`, changeFrequency: "daily", priority: 1 },
    { url: `${SITE_URL}/map`, changeFrequency: "daily", priority: 0.8 },
    { url: `${SITE_URL}/calendar`, changeFrequency: "daily", priority: 0.8 },
    { url: `${SITE_URL}/faq`, changeFrequency: "monthly", priority: 0.3 },
    { url: `${SITE_URL}/about`, changeFrequency: "monthly", priority: 0.3 },
    { url: `${SITE_URL}/contact`, changeFrequency: "monthly", priority: 0.3 },
  ];

  const categoryRoutes: MetadataRoute.Sitemap = CATEGORIES.map((c) => ({
    url: `${SITE_URL}/category/${c.value}`,
    changeFrequency: "daily",
    priority: 0.7,
  }));

  const countryRoutes: MetadataRoute.Sitemap = countries.map((country) => ({
    url: `${SITE_URL}/country/${country.toLowerCase().replace(/\s+/g, "-")}`,
    changeFrequency: "weekly",
    priority: 0.5,
  }));

  const listingRoutes: MetadataRoute.Sitemap = listings.map((listing) => ({
    url: `${SITE_URL}/listings/${listing.slug}`,
    changeFrequency: "weekly",
    priority: 0.6,
  }));

  return [...staticRoutes, ...categoryRoutes, ...countryRoutes, ...listingRoutes];
}
