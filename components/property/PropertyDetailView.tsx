import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { Container } from "@/components/ui/Container";
import { AnimateIn } from "@/components/ui/AnimateIn";
import { PropertyCard } from "@/components/property/PropertyCard";
import { PropertyHero } from "@/components/property/PropertyHero";
import { PropertyMap } from "@/components/property/PropertyMap";
import { PropertySidebar } from "@/components/property/PropertySidebar";
import { PropertySectionNav } from "@/components/property/PropertySectionNav";
import { formatArea, formatDate } from "@/lib/format";
import { categoryLabel, listingTypeLabel } from "@/lib/property-format";
import type { PropertyBasePath } from "@/lib/property-routing";
import type { PropertySearchResult } from "@/lib/db/properties";
import type { Property } from "@/lib/types";

const CANONICAL_HOST = "https://sunwealthrealestate.com";

type PropertyDetailViewProps = {
  property: Property;
  related: PropertySearchResult[];
  basePath: PropertyBasePath;
  breadcrumbLabel: string;
};

export function PropertyDetailView({
  property,
  related,
  basePath,
  breadcrumbLabel,
}: PropertyDetailViewProps) {
  const canonicalPath = `${basePath}/${property.slug}`;
  const jsonLd = buildJsonLd(property, canonicalPath);

  const hasFeatures = property.features.length > 0;
  const hasDocuments = property.documents.length > 0;
  const hasPaymentPlans =
    property.paymentPlans !== undefined && property.paymentPlans.length > 0;
  const hasLandmarks =
    property.nearbyLandmarks !== undefined &&
    property.nearbyLandmarks.length > 0;

  const sections: { id: string; label: string }[] = [
    { id: "overview", label: "Overview" },
    ...(hasFeatures ? [{ id: "features", label: "Features" }] : []),
    { id: "location", label: "Location" },
    ...(hasDocuments ? [{ id: "documents", label: "Documents" }] : []),
    ...(hasPaymentPlans
      ? [{ id: "payment-plans", label: "Payment plans" }]
      : []),
  ];

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <Container className="py-8 lg:py-12">
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="mb-6 text-sm text-ink/50">
          <Link href="/" className="transition-colors hover:text-ink">
            Home
          </Link>
          <span aria-hidden="true" className="mx-2">
            /
          </span>
          <Link href={basePath} className="transition-colors hover:text-ink">
            {breadcrumbLabel}
          </Link>
          <span aria-hidden="true" className="mx-2">
            /
          </span>
          <span className="text-ink">{property.location.area}</span>
        </nav>

        {/* Page header */}
        <header className="mb-6 flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone="gold" size="sm">
              {listingTypeLabel(property.listingType)}
            </Badge>
            <Badge tone="stone" size="sm">
              {categoryLabel(property.category)}
            </Badge>
          </div>
          <h1 className="font-display text-3xl leading-tight text-ink md:text-5xl">
            {property.title}
          </h1>
          <p className="text-ink/60">
            {property.location.area}, {property.location.city} —{" "}
            {property.location.state}
          </p>
        </header>

        <PropertyHero images={property.images} title={property.title} />

        <div className="mt-10 grid grid-cols-1 gap-10 lg:grid-cols-12">
          {/* Main content */}
          <div className="min-w-0 lg:col-span-8">
            <PropertySectionNav sections={sections} />

            <section id="overview" className="scroll-mt-32 pt-10 first:pt-0">
              <h2 className="mb-4 font-display text-2xl text-ink">Overview</h2>
              <div className="whitespace-pre-line leading-relaxed text-ink/85">
                {property.description}
              </div>
              {/* Stat cards */}
              <dl className="mt-8 grid grid-cols-2 gap-3 border-t border-sand pt-8 md:grid-cols-4">
                <Meta
                  label="Size"
                  value={formatArea(property.size.value, property.size.unit)}
                />
                {property.bedrooms !== undefined ? (
                  <Meta label="Bedrooms" value={String(property.bedrooms)} />
                ) : null}
                {property.bathrooms !== undefined ? (
                  <Meta label="Bathrooms" value={String(property.bathrooms)} />
                ) : null}
                <Meta label="Listed" value={formatDate(property.publishedAt)} />
              </dl>
            </section>

            {hasFeatures ? (
              <AnimateIn>
                <section id="features" className="scroll-mt-32 pt-12">
                  <h2 className="mb-5 font-display text-2xl text-ink">
                    Features
                  </h2>
                  <ul className="grid grid-cols-1 gap-x-6 gap-y-3 md:grid-cols-2">
                    {property.features.map((f) => (
                      <li
                        key={f}
                        className="flex items-center gap-3 text-ink/85"
                      >
                        <span
                          aria-hidden="true"
                          className="h-1.5 w-1.5 flex-shrink-0 rounded-full bg-gold"
                        />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                </section>
              </AnimateIn>
            ) : null}

            <AnimateIn>
              <section id="location" className="scroll-mt-32 pt-12">
                <h2 className="mb-4 font-display text-2xl text-ink">
                  Location
                </h2>
                <p className="mb-4 text-ink/75">
                  {property.location.area}, {property.location.city},{" "}
                  {property.location.state}
                </p>
                {property.location.coordinates ? (
                  <PropertyMap
                    center={{
                      lng: property.location.coordinates.lng,
                      lat: property.location.coordinates.lat,
                    }}
                    label={property.location.area}
                  />
                ) : (
                  <div className="rounded-sm border border-sand bg-sand/40 p-6 text-sm text-ink/60">
                    Map coordinates have not yet been published for this
                    listing.
                  </div>
                )}
                {hasLandmarks ? (
                  <div className="mt-6">
                    <h3 className="mb-3 text-xs font-medium uppercase tracking-wider text-ink/45">
                      Nearby
                    </h3>
                    <ul className="flex flex-wrap gap-1.5">
                      {property.nearbyLandmarks!.map((l) => (
                        <li key={l}>
                          <Badge tone="sand">{l}</Badge>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </section>
            </AnimateIn>

            {hasDocuments ? (
              <AnimateIn>
                <section id="documents" className="scroll-mt-32 pt-12">
                  <h2 className="mb-4 font-display text-2xl text-ink">
                    Documents
                  </h2>
                  <ul className="flex flex-wrap gap-2">
                    {property.documents.map((d) => (
                      <li key={d}>
                        <Badge tone="gold" size="md">
                          {d}
                        </Badge>
                      </li>
                    ))}
                  </ul>
                  <p className="mt-4 max-w-lg text-sm text-ink/60">
                    Every document is verified by our team before this listing
                    is published. Your lawyer can request the full file through
                    our concierge.
                  </p>
                </section>
              </AnimateIn>
            ) : null}

            {hasPaymentPlans ? (
              <AnimateIn>
                <section id="payment-plans" className="scroll-mt-32 pt-12">
                  <h2 className="mb-4 font-display text-2xl text-ink">
                    Payment plans
                  </h2>
                  <ul className="flex flex-col gap-3">
                    {property.paymentPlans!.map((plan) => (
                      <li
                        key={plan.label}
                        className="rounded-sm border border-sand bg-sand/30 p-4"
                      >
                        <p className="font-medium text-ink">{plan.label}</p>
                        <p className="font-mono text-sm text-ink/50">
                          {plan.duration}
                        </p>
                        {plan.note ? (
                          <p className="mt-2 text-sm text-ink/75">
                            {plan.note}
                          </p>
                        ) : null}
                      </li>
                    ))}
                  </ul>
                </section>
              </AnimateIn>
            ) : null}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-4">
            <PropertySidebar
              property={property}
              canonicalPath={canonicalPath}
            />
          </div>
        </div>

        {/* Related properties */}
        {related.length > 0 ? (
          <section className="mt-20 border-t border-sand pt-16">
            <AnimateIn className="mb-8">
              <h2 className="font-display text-2xl text-ink md:text-3xl">
                Related properties
              </h2>
            </AnimateIn>
            <ul className="grid grid-cols-1 gap-x-6 gap-y-10 md:grid-cols-2 lg:grid-cols-3">
              {related.map((r, i) => (
                <AnimateIn key={r.id} as="li" delay={i * 100}>
                  <PropertyCard property={r} />
                </AnimateIn>
              ))}
            </ul>
          </section>
        ) : null}
      </Container>
    </>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1.5 rounded-sm bg-sand/60 p-4">
      <dt className="text-[11px] font-medium uppercase tracking-wider text-ink/45">
        {label}
      </dt>
      <dd className="font-mono font-medium text-ink">{value}</dd>
    </div>
  );
}

function availability(status: Property["status"]): string {
  switch (status) {
    case "available":
      return "https://schema.org/InStock";
    case "under-offer":
      return "https://schema.org/LimitedAvailability";
    case "sold":
    case "let":
      return "https://schema.org/OutOfStock";
  }
}

function buildJsonLd(p: Property, canonicalPath: string) {
  const url = `${CANONICAL_HOST}${canonicalPath}`;
  return {
    "@context": "https://schema.org",
    "@type": "RealEstateListing",
    name: p.title,
    description: p.description,
    url,
    datePosted: p.publishedAt,
    image: p.images.map((img) => img.src),
    address: {
      "@type": "PostalAddress",
      streetAddress: p.location.area,
      addressLocality: p.location.city,
      addressRegion: p.location.state,
      addressCountry: "NG",
    },
    ...(p.location.coordinates
      ? {
          geo: {
            "@type": "GeoCoordinates",
            latitude: p.location.coordinates.lat,
            longitude: p.location.coordinates.lng,
          },
        }
      : {}),
    offers: {
      "@type": "Offer",
      price: p.price.amount,
      priceCurrency: p.price.currency,
      availability: availability(p.status),
    },
    ...(p.bedrooms !== undefined ? { numberOfRooms: p.bedrooms } : {}),
    floorSize: {
      "@type": "QuantitativeValue",
      value: p.size.value,
      unitText: p.size.unit,
    },
  };
}
