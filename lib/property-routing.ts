import type { ListingType, PropertyCategory } from "./types";

export type PropertyBasePath = "/properties" | "/rentals" | "/land";

export function basePathFor(
  listingType: ListingType,
  category: PropertyCategory,
): PropertyBasePath {
  if (category === "land") return "/land";
  if (listingType === "rent" || listingType === "shortlet") return "/rentals";
  return "/properties";
}

export function canonicalPathFor(
  listingType: ListingType,
  category: PropertyCategory,
  slug: string,
): string {
  return `${basePathFor(listingType, category)}/${slug}`;
}
