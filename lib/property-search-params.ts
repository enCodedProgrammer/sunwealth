import type { SearchParams } from "./db/properties";
import type { DocumentType, ListingType, PropertyCategory } from "./types";

const CATEGORIES: PropertyCategory[] = [
  "fully-detached-duplex",
  "semi-detached-duplex",
  "terrace-duplex",
  "bungalow",
  "apartment",
  "penthouse",
  "maisonette",
  "land",
];

const DOCUMENTS: DocumentType[] = [
  "C of O",
  "Governor's Consent",
  "Deed of Assignment",
  "Registered Survey",
  "Building Approval",
  "Excision",
];

const LISTING_TYPES: ListingType[] = ["sale", "rent", "shortlet"];
const SORT_VALUES = ["newest", "price-asc", "price-desc"] as const;

function first(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v;
}

function parseCsv(v: string | undefined): string[] | undefined {
  if (!v) return undefined;
  const parts = v
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  return parts.length ? parts : undefined;
}

function parseNum(v: string | undefined): number | undefined {
  if (!v) return undefined;
  const n = Number(v);
  return Number.isFinite(n) && n >= 0 ? n : undefined;
}

export function parsePropertySearchParams(
  raw: Record<string, string | string[] | undefined>,
): SearchParams {
  const listingType = first(raw.listingType);
  const sortBy = first(raw.sortBy);

  const rawCategory = parseCsv(first(raw.category));
  const category = rawCategory?.filter((c): c is PropertyCategory =>
    CATEGORIES.includes(c as PropertyCategory),
  );

  const rawDocuments = parseCsv(first(raw.documents));
  const documents = rawDocuments?.filter((d): d is DocumentType =>
    DOCUMENTS.includes(d as DocumentType),
  );

  return {
    q: first(raw.q) || undefined,
    listingType: LISTING_TYPES.includes(listingType as ListingType)
      ? (listingType as ListingType)
      : undefined,
    category: category?.length ? category : undefined,
    area: parseCsv(first(raw.area)),
    priceMin: parseNum(first(raw.priceMin)),
    priceMax: parseNum(first(raw.priceMax)),
    bedroomsMin: parseNum(first(raw.bedroomsMin)),
    documents: documents?.length ? documents : undefined,
    sortBy: SORT_VALUES.includes(sortBy as (typeof SORT_VALUES)[number])
      ? (sortBy as SearchParams["sortBy"])
      : undefined,
    offset: parseNum(first(raw.offset)),
  };
}
