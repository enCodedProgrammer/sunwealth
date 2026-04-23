import type { Metadata } from "next";
import { PropertyIndexView } from "@/components/property/PropertyIndexView";
import { searchProperties } from "@/lib/db/properties";
import { parsePropertySearchParams } from "@/lib/property-search-params";

export const metadata: Metadata = {
  title: "Land & Acres — Sunwealth Land & Acres",
  description:
    "Plots and acreage across Lagos' emerging corridors — C of O, Governor's Consent, and Excised title, all verified by Sunwealth.",
};

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function LandPage({ searchParams }: PageProps) {
  const raw = await searchParams;
  const params = parsePropertySearchParams(raw);
  const data = await searchProperties({
    ...params,
    listingType: undefined,
    listingTypes: undefined,
    category: ["land"],
    bedroomsMin: undefined,
  });

  return (
    <PropertyIndexView
      eyebrow="Sunwealth Land & Acres"
      title="Land & acres."
      description="Verified plots and acreage across Lagos' growth corridors. Title status, size, and nearest landmarks shown up front — no guesswork."
      basePath="/land"
      rawParams={raw}
      data={data}
      hideFilters={{ listingType: true, bedrooms: true, category: true }}
      heroImage="https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=2400&q=85"
      heroAlt="Aerial view of cleared land plots at sunset with palm trees along the boundary"
    />
  );
}
