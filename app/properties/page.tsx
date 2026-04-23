import type { Metadata } from "next";
import { PropertyIndexView } from "@/components/property/PropertyIndexView";
import { searchProperties } from "@/lib/db/properties";
import { parsePropertySearchParams } from "@/lib/property-search-params";

export const metadata: Metadata = {
  title: "Properties",
  description:
    "Verified luxury homes, rentals and land across Lagos — Ikoyi, VGC, Lekki, Banana Island and beyond.",
};

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function PropertiesPage({ searchParams }: PageProps) {
  const raw = await searchParams;
  const params = parsePropertySearchParams(raw);
  const data = await searchProperties(params);

  return (
    <PropertyIndexView
      title="Properties"
      description="Verified luxury homes across Lagos. Every listing is inspected by our team before it appears here."
      basePath="/properties"
      rawParams={raw}
      data={data}
      heroImage="https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=2400&q=85"
      heroAlt="Contemporary Lagos duplex at dusk with warm interior light through floor-to-ceiling windows"
    />
  );
}
