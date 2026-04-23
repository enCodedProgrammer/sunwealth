import type { Metadata } from "next";
import { PropertyIndexView } from "@/components/property/PropertyIndexView";
import { searchProperties } from "@/lib/db/properties";
import { parsePropertySearchParams } from "@/lib/property-search-params";

export const metadata: Metadata = {
  title: "Rentals — Sunwealth Rent",
  description:
    "Apartments, duplexes and shortlets for rent across Ikoyi, Lekki Phase 1, VGC and Osapa London. Every listing verified by Sunwealth.",
};

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function RentalsPage({ searchParams }: PageProps) {
  const raw = await searchParams;
  const params = parsePropertySearchParams(raw);
  const data = await searchProperties({
    ...params,
    listingType: undefined,
    listingTypes: ["rent", "shortlet"],
    category: params.category?.filter((c) => c !== "land"),
  });

  return (
    <PropertyIndexView
      eyebrow="Sunwealth Rent"
      title="Homes for rent."
      description="Apartments, duplexes and shortlets across Lagos' best addresses. Every unit inspected and verified before it reaches this page."
      basePath="/rentals"
      rawParams={raw}
      data={data}
      hideFilters={{ listingType: true }}
      heroImage="https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=2400&q=85"
      heroAlt="Contemporary living room with linen sofa, brass floor lamp and coffered ceiling"
    />
  );
}
