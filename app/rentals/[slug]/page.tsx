import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { PropertyDetailView } from "@/components/property/PropertyDetailView";
import { getPropertyBySlug, getRelatedProperties } from "@/lib/db/properties";
import { canonicalPathFor } from "@/lib/property-routing";

type PageProps = {
  params: Promise<{ slug: string }>;
};

const CANONICAL_HOST = "https://sunwealthrealestate.com";

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const property = await getPropertyBySlug(slug);
  if (!property) return { title: "Rental not found" };

  const description = property.description.slice(0, 160);
  const primary = property.images[0];
  const canonical = canonicalPathFor(
    property.listingType,
    property.category,
    property.slug,
  );

  return {
    title: property.title,
    description,
    alternates: { canonical: `${CANONICAL_HOST}${canonical}` },
    openGraph: {
      title: property.title,
      description,
      images: primary ? [{ url: primary.src, alt: primary.alt }] : undefined,
      type: "website",
      locale: "en_GB",
    },
  };
}

export default async function RentalDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const property = await getPropertyBySlug(slug);

  if (!property) notFound();

  const canonical = canonicalPathFor(
    property.listingType,
    property.category,
    property.slug,
  );
  if (canonical !== `/rentals/${property.slug}`) {
    redirect(canonical);
  }

  const related = await getRelatedProperties(property, 3);

  return (
    <PropertyDetailView
      property={property}
      related={related}
      basePath="/rentals"
      breadcrumbLabel="Rentals"
    />
  );
}
