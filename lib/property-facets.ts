import type { DocumentType, ListingType, PropertyCategory } from "./types";

// TODO(Phase 2): replace with a cached facets endpoint that returns distinct
// values from the DB. Hard-coded for now — the seed only exercises three areas.
export const AREA_FACETS = [
  "Banana Island",
  "Ikoyi",
  "Lekki Phase 1",
  "Lekki Phase 2",
  "Victoria Garden City",
  "Osapa London",
  "Pinnock Beach",
  "Oniru",
] as const;

export const CATEGORY_FACETS: { value: PropertyCategory; label: string }[] = [
  { value: "fully-detached-duplex", label: "Fully detached duplex" },
  { value: "semi-detached-duplex", label: "Semi-detached duplex" },
  { value: "terrace-duplex", label: "Terrace duplex" },
  { value: "bungalow", label: "Bungalow" },
  { value: "apartment", label: "Apartment" },
  { value: "penthouse", label: "Penthouse" },
  { value: "maisonette", label: "Maisonette" },
  { value: "land", label: "Land" },
];

export const DOCUMENT_FACETS: DocumentType[] = [
  "C of O",
  "Governor's Consent",
  "Deed of Assignment",
  "Registered Survey",
  "Building Approval",
  "Excision",
];

export const BEDROOM_FACETS: { value: string; label: string }[] = [
  { value: "", label: "Any" },
  { value: "1", label: "1" },
  { value: "2", label: "2" },
  { value: "3", label: "3" },
  { value: "4", label: "4" },
  { value: "5", label: "5+" },
];

export const LISTING_TYPE_FACETS: { value: ListingType; label: string }[] = [
  { value: "sale", label: "Buy" },
  { value: "rent", label: "Rent" },
  { value: "shortlet", label: "Shortlet" },
];

export const SORT_FACETS = [
  { value: "newest", label: "Newest" },
  { value: "price-asc", label: "Price: low to high" },
  { value: "price-desc", label: "Price: high to low" },
] as const;
