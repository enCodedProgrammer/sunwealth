import Image from "next/image";
import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { AnimateIn } from "@/components/ui/AnimateIn";

const BLOCKS = [
  {
    href: "/properties",
    title: "Sales",
    description:
      "Verified homes across Ikoyi, Banana Island, VGC, Lekki Phase 1 and Pinnock Beach.",
    image:
      "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1600&q=80",
    alt: "Modern Lagos duplex at dusk with warm interior light through floor-to-ceiling windows",
  },
  {
    href: "/rentals",
    title: "Rentals",
    description:
      "Long-lets and shortlets with transparent pricing and vetted landlords.",
    image:
      "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1600&q=80",
    alt: "Contemporary living room with linen sofa, brass floor lamp and coffered ceiling",
  },
  {
    href: "/land",
    title: "Land & Acres",
    description:
      "Plots with clear title across Lagos's growth corridors — excisions, C of O, Governor's Consent.",
    image:
      "https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=1600&q=80",
    alt: "Aerial view of cleared land plots at sunset with palm trees along the boundary",
  },
];

export function SubBrandBlocks() {
  return (
    <section className="py-20 lg:py-28">
      <Container>
        <AnimateIn className="mb-10 flex items-end justify-between gap-6">
          <h2 className="font-display text-3xl text-ink md:text-4xl">
            Three ways to build in Lagos.
          </h2>
        </AnimateIn>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {BLOCKS.map((b, i) => (
            <AnimateIn key={b.href} delay={i * 120}>
              <Link
                href={b.href}
                className="group block overflow-hidden rounded-sm border border-sand bg-paper transition-colors duration-300 hover:border-gold hover:shadow-[0_4px_24px_rgba(201,162,84,0.10)]"
              >
                <div className="relative aspect-[4/3] overflow-hidden bg-sand">
                  <Image
                    src={b.image}
                    alt={b.alt}
                    fill
                    sizes="(min-width: 768px) 33vw, 100vw"
                    className="object-cover motion-safe:transition-transform motion-safe:duration-700 motion-safe:group-hover:scale-[1.04]"
                    data-placeholder="true"
                  />
                  {/* Subtle overlay on hover */}
                  <div
                    aria-hidden="true"
                    className="absolute inset-0 bg-ink/0 motion-safe:transition-colors motion-safe:duration-500 motion-safe:group-hover:bg-ink/10"
                  />
                </div>
                <div className="flex flex-col gap-2 p-6">
                  <h3 className="font-display text-2xl text-ink">{b.title}</h3>
                  <p className="text-sm leading-relaxed text-ink/65">
                    {b.description}
                  </p>
                  <span className="mt-3 inline-flex items-center gap-1.5 text-sm text-ink/50 transition-colors duration-200 group-hover:text-gold-deep">
                    Explore {b.title.toLowerCase()}
                    <span
                      aria-hidden="true"
                      className="motion-safe:translate-x-0 motion-safe:transition-transform motion-safe:duration-200 motion-safe:group-hover:translate-x-1"
                    >
                      →
                    </span>
                  </span>
                </div>
              </Link>
            </AnimateIn>
          ))}
        </div>
      </Container>
    </section>
  );
}
