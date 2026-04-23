import type {
  ListingType,
  Property,
  PropertyCategory,
  PropertyStatus,
} from "./types";

type BadgeTone = "gold" | "sage" | "ember" | "stone" | "sand";

const CATEGORY_LABELS: Record<PropertyCategory, string> = {
  "fully-detached-duplex": "Fully detached duplex",
  "semi-detached-duplex": "Semi-detached duplex",
  "terrace-duplex": "Terrace duplex",
  bungalow: "Bungalow",
  apartment: "Apartment",
  penthouse: "Penthouse",
  maisonette: "Maisonette",
  land: "Land",
};

const STATUS_LABELS: Record<PropertyStatus, string> = {
  available: "Available",
  "under-offer": "Under offer",
  sold: "Sold",
  let: "Let",
};

const STATUS_TONES: Record<PropertyStatus, BadgeTone> = {
  available: "sage",
  "under-offer": "gold",
  sold: "ember",
  let: "stone",
};

const BASIS_LABELS: Record<Property["price"]["basis"], string> = {
  outright: "outright",
  "per-annum": "per annum",
  "per-night": "per night",
  "per-plot": "per plot",
  "per-sqm": "per sqm",
};

const LISTING_TYPE_LABELS: Record<ListingType, string> = {
  sale: "For sale",
  rent: "For rent",
  shortlet: "Shortlet",
};

export function categoryLabel(c: PropertyCategory): string {
  return CATEGORY_LABELS[c];
}

export function statusLabel(s: PropertyStatus): string {
  return STATUS_LABELS[s];
}

export function statusTone(s: PropertyStatus): BadgeTone {
  return STATUS_TONES[s];
}

export function priceBasisLabel(b: Property["price"]["basis"]): string {
  return BASIS_LABELS[b];
}

export function listingTypeLabel(t: ListingType): string {
  return LISTING_TYPE_LABELS[t];
}
