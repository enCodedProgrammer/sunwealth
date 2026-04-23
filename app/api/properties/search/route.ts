import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { searchProperties } from "@/lib/db/properties";

const CATEGORIES = [
  "fully-detached-duplex",
  "semi-detached-duplex",
  "terrace-duplex",
  "bungalow",
  "apartment",
  "penthouse",
  "maisonette",
  "land",
] as const;

const DOCUMENTS = [
  "C of O",
  "Governor's Consent",
  "Deed of Assignment",
  "Registered Survey",
  "Building Approval",
  "Excision",
] as const;

const searchSchema = z
  .object({
    q: z.string().trim().min(1).max(200).optional(),
    listingType: z.enum(["sale", "rent", "shortlet"]).optional(),
    category: z.array(z.enum(CATEGORIES)).optional(),
    area: z.array(z.string().min(1)).optional(),
    priceMin: z.coerce.number().int().nonnegative().optional(),
    priceMax: z.coerce.number().int().nonnegative().optional(),
    bedroomsMin: z.coerce.number().int().min(0).max(20).optional(),
    documents: z.array(z.enum(DOCUMENTS)).optional(),
    sortBy: z.enum(["price-asc", "price-desc", "newest"]).optional(),
    limit: z.coerce.number().int().min(1).max(50).optional(),
    offset: z.coerce.number().int().nonnegative().optional(),
    status: z.enum(["available", "under-offer", "sold", "let"]).optional(),
  })
  .refine(
    (d) =>
      d.priceMin === undefined ||
      d.priceMax === undefined ||
      d.priceMin <= d.priceMax,
    {
      message: "priceMin must be less than or equal to priceMax",
      path: ["priceMin"],
    },
  );

function splitCsv(value: string | null): string[] | undefined {
  if (!value) return undefined;
  const parts = value
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  return parts.length > 0 ? parts : undefined;
}

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const preprocessed = {
    q: params.get("q") ?? undefined,
    listingType: params.get("listingType") ?? undefined,
    category: splitCsv(params.get("category")),
    area: splitCsv(params.get("area")),
    priceMin: params.get("priceMin") ?? undefined,
    priceMax: params.get("priceMax") ?? undefined,
    bedroomsMin: params.get("bedroomsMin") ?? undefined,
    documents: splitCsv(params.get("documents")),
    sortBy: params.get("sortBy") ?? undefined,
    limit: params.get("limit") ?? undefined,
    offset: params.get("offset") ?? undefined,
    status: params.get("status") ?? undefined,
  };

  const parsed = searchSchema.safeParse(preprocessed);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid query parameters", issues: parsed.error.issues },
      { status: 400 },
    );
  }

  const data = await searchProperties(parsed.data);

  return NextResponse.json(data, {
    headers: {
      "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
    },
  });
}
