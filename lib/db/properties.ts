import type {
  DocumentType,
  ListingType,
  Property,
  PropertyCategory,
  PropertyStatus,
} from "../types";
import { createServerClient } from "./schema";

export type SearchSortBy = "price-asc" | "price-desc" | "newest";
export type SearchStatus = PropertyStatus | "all";

export type SearchParams = {
  q?: string;
  listingType?: ListingType;
  listingTypes?: ListingType[];
  category?: PropertyCategory[];
  area?: string[];
  priceMin?: number;
  priceMax?: number;
  bedroomsMin?: number;
  documents?: DocumentType[];
  sortBy?: SearchSortBy;
  limit?: number;
  offset?: number;
  status?: SearchStatus;
};

export type PropertySearchResult = {
  id: string;
  slug: string;
  title: string;
  category: PropertyCategory;
  listingType: ListingType;
  status: PropertyStatus;
  location: { area: string; city: string };
  price: { amount: number; currency: string; basis: Property["price"]["basis"] };
  bedrooms?: number;
  bathrooms?: number;
  size: { value: number; unit: Property["size"]["unit"] };
  documents: DocumentType[];
  primaryImage: string;
  publishedAt: string;
};

export type SearchResponse = {
  results: PropertySearchResult[];
  total: number;
  offset: number;
  limit: number;
};

const DEFAULT_LIMIT = 12;
const MAX_LIMIT = 50;

const SELECT_COLUMNS =
  "id, slug, title, category, listing_type, status, location, price, bedrooms, bathrooms, size, documents, images, published_at";

const FULL_COLUMNS =
  "id, slug, title, category, listing_type, status, sub_brand, location, price, size, bedrooms, bathrooms, features, documents, images, description, nearby_landmarks, payment_plans, virtual_tour_url, published_at, updated_at";

export async function searchProperties(
  params: SearchParams,
  { asStaff = false }: { asStaff?: boolean } = {},
): Promise<SearchResponse> {
  const supabase = await createServerClient();

  const limit = Math.min(params.limit ?? DEFAULT_LIMIT, MAX_LIMIT);
  const offset = Math.max(params.offset ?? 0, 0);

  let query = supabase
    .from("properties")
    .select(SELECT_COLUMNS, { count: "exact" });

  const status = params.status ?? "available";
  if (asStaff && status === "all") {
    // no status filter — staff can see everything
  } else {
    const effective = status === "all" ? "available" : status;
    query = query.eq("status", effective);
  }

  if (params.listingType) {
    query = query.eq("listing_type", params.listingType);
  } else if (params.listingTypes?.length) {
    query = query.in("listing_type", params.listingTypes);
  }

  if (params.category?.length) {
    query = query.in("category", params.category);
  }

  if (params.area?.length) {
    query = query.in("location->>area", params.area);
  }

  if (params.priceMin !== undefined) {
    query = query.gte("price_amount", params.priceMin);
  }

  if (params.priceMax !== undefined) {
    query = query.lte("price_amount", params.priceMax);
  }

  if (params.bedroomsMin !== undefined) {
    query = query.gte("bedrooms", params.bedroomsMin);
  }

  if (params.documents?.length) {
    query = query.contains("documents", params.documents);
  }

  if (params.q && params.q.trim().length > 0) {
    query = query.textSearch("search_text", params.q.trim(), {
      type: "websearch",
      config: "english",
    });
  }

  const sortBy = params.sortBy ?? "newest";
  switch (sortBy) {
    case "newest":
      query = query.order("published_at", { ascending: false });
      break;
    case "price-asc":
      query = query.order("price_amount", { ascending: true });
      break;
    case "price-desc":
      query = query.order("price_amount", { ascending: false });
      break;
  }

  query = query.range(offset, offset + limit - 1);

  const { data, error, count } = await query;

  if (error) {
    throw new Error(`Property search failed: ${error.message}`);
  }

  const rows = (data ?? []) as unknown as PropertyRow[];

  return {
    results: rows.map(toResult),
    total: count ?? 0,
    offset,
    limit,
  };
}

export async function getPropertyBySlug(
  slug: string,
  { asStaff = false }: { asStaff?: boolean } = {},
): Promise<Property | null> {
  const supabase = await createServerClient();

  let query = supabase
    .from("properties")
    .select(FULL_COLUMNS)
    .eq("slug", slug);

  if (!asStaff) {
    query = query.neq("status", "sold");
  }

  const { data, error } = await query.maybeSingle();

  if (error) {
    throw new Error(`Property lookup failed: ${error.message}`);
  }
  if (!data) return null;

  return toProperty(data as unknown as PropertyFullRow);
}

export async function getRelatedProperties(
  current: Pick<Property, "id" | "location" | "category">,
  limit = 3,
): Promise<PropertySearchResult[]> {
  const supabase = await createServerClient();

  const { data: sameArea, error: areaError } = await supabase
    .from("properties")
    .select(SELECT_COLUMNS)
    .eq("status", "available")
    .eq("location->>area", current.location.area)
    .neq("id", current.id)
    .order("published_at", { ascending: false })
    .limit(limit);

  if (areaError) {
    throw new Error(`Related lookup failed: ${areaError.message}`);
  }

  const areaRows = (sameArea ?? []) as unknown as PropertyRow[];
  if (areaRows.length >= limit) {
    return areaRows.slice(0, limit).map(toResult);
  }

  const excludeIds = [current.id, ...areaRows.map((r) => r.id)];
  const { data: sameCategory, error: catError } = await supabase
    .from("properties")
    .select(SELECT_COLUMNS)
    .eq("status", "available")
    .eq("category", current.category)
    .not("id", "in", `(${excludeIds.join(",")})`)
    .order("published_at", { ascending: false })
    .limit(limit - areaRows.length);

  if (catError) {
    throw new Error(`Related lookup failed: ${catError.message}`);
  }

  const categoryRows = (sameCategory ?? []) as unknown as PropertyRow[];
  return [...areaRows, ...categoryRows].slice(0, limit).map(toResult);
}

type PropertyImage = NonNullable<Property["images"]>[number];

type PropertyRow = {
  id: string;
  slug: string;
  title: string;
  category: PropertyCategory;
  listing_type: ListingType;
  status: PropertyStatus;
  location: { area: string; city: string; state: string };
  price: { amount: number; currency: string; basis: Property["price"]["basis"] };
  bedrooms: number | null;
  bathrooms: number | null;
  size: { value: number; unit: Property["size"]["unit"] };
  documents: DocumentType[];
  images: PropertyImage[];
  published_at: string;
};

type PropertyFullRow = PropertyRow & {
  sub_brand: Property["subBrand"];
  features: string[];
  description: string;
  nearby_landmarks: string[];
  payment_plans: NonNullable<Property["paymentPlans"]>;
  virtual_tour_url: string | null;
  updated_at: string;
  location: {
    area: string;
    city: Property["location"]["city"];
    state: string;
    coordinates?: { lat: number; lng: number };
  };
};

function pickPrimary(images: PropertyImage[]): PropertyImage | undefined {
  return (
    images.find((img) => img.isPrimary) ??
    [...images].sort((a, b) => a.order - b.order)[0]
  );
}

function toResult(row: PropertyRow): PropertySearchResult {
  const primary = pickPrimary(row.images);

  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    category: row.category,
    listingType: row.listing_type,
    status: row.status,
    location: { area: row.location.area, city: row.location.city },
    price: {
      amount: row.price.amount,
      currency: row.price.currency,
      basis: row.price.basis,
    },
    bedrooms: row.bedrooms ?? undefined,
    bathrooms: row.bathrooms ?? undefined,
    size: { value: row.size.value, unit: row.size.unit },
    documents: row.documents,
    primaryImage: primary?.src ?? "",
    publishedAt: row.published_at,
  };
}

function toProperty(row: PropertyFullRow): Property {
  const sortedImages = [...row.images].sort((a, b) => a.order - b.order);

  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    category: row.category,
    listingType: row.listing_type,
    status: row.status,
    subBrand: row.sub_brand,
    location: {
      area: row.location.area,
      city: row.location.city,
      state: row.location.state,
      coordinates: row.location.coordinates,
    },
    price: {
      amount: row.price.amount,
      currency: "NGN",
      basis: row.price.basis,
    },
    size: row.size,
    bedrooms: row.bedrooms ?? undefined,
    bathrooms: row.bathrooms ?? undefined,
    features: row.features,
    documents: row.documents,
    images: sortedImages,
    description: row.description,
    nearbyLandmarks: row.nearby_landmarks.length
      ? row.nearby_landmarks
      : undefined,
    paymentPlans: row.payment_plans.length ? row.payment_plans : undefined,
    virtualTourUrl: row.virtual_tour_url ?? undefined,
    publishedAt: row.published_at,
    updatedAt: row.updated_at,
  };
}
