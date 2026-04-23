import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { PropertyCard } from "@/components/property/PropertyCard";
import { AnimateIn } from "@/components/ui/AnimateIn";
import type { PropertySearchResult } from "@/lib/db/properties";

type Props = {
  properties: PropertySearchResult[];
};

export function FeaturedStrip({ properties }: Props) {
  if (properties.length === 0) return null;

  return (
    <section className="bg-sand/40 py-20 lg:py-28">
      <Container>
        <AnimateIn className="mb-10 flex items-end justify-between gap-6">
          <div>
            <p className="mb-2 text-xs uppercase tracking-widest text-ink/45">
              Featured this week
            </p>
            <h2 className="font-display text-3xl text-ink md:text-4xl">
              Handpicked by the team.
            </h2>
          </div>
          <Link
            href="/properties"
            className="hidden text-sm text-ink/70 transition-colors hover:text-gold-deep md:inline-block"
          >
            View all properties →
          </Link>
        </AnimateIn>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
          {properties.map((p, i) => (
            <AnimateIn key={p.id} delay={i * 100}>
              <PropertyCard
                property={p}
                sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
              />
            </AnimateIn>
          ))}
        </div>
      </Container>
    </section>
  );
}
