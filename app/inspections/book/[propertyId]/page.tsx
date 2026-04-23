import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Container } from "@/components/ui/Container";
import { CalEmbed } from "./CalEmbed";
import { getPropertyForBooking, getAgentForSubBrand } from "@/lib/db/inspections";
import { buildBookingEmbedUrl } from "@/lib/integrations/cal";
import { formatNaira } from "@/lib/format";

type PageProps = {
  params: Promise<{ propertyId: string }>;
  searchParams: Promise<{ leadId?: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { propertyId } = await params;
  const property = await getPropertyForBooking(propertyId);
  if (!property) return { title: "Book an inspection — Sunwealth" };
  return {
    title: `Book an inspection — ${property.title}`,
    description: `Schedule an in-person or virtual inspection for ${property.title} in ${property.location.area}, Lagos.`,
    robots: { index: false },
  };
}

export default async function BookInspectionPage({ params, searchParams }: PageProps) {
  const { propertyId } = await params;
  const { leadId } = await searchParams;

  const [property, agent] = await Promise.all([
    getPropertyForBooking(propertyId),
    getPropertyForBooking(propertyId).then((p) =>
      p ? getAgentForSubBrand(p.subBrand) : null,
    ),
  ]);

  if (!property) notFound();

  // Fall back to the default booking URL if no agent is found in DB yet.
  const calBaseUrl =
    agent?.calBookingUrl ?? process.env.NEXT_PUBLIC_CAL_DEFAULT_BOOKING_URL;

  if (!calBaseUrl) {
    // Booking is temporarily unavailable — show a contact fallback.
    return (
      <Container className="py-20 text-center">
        <h1 className="font-display text-3xl text-ink">Online booking unavailable</h1>
        <p className="mt-4 text-ink/60">
          Please call us on{" "}
          <a href="tel:+2349038379755" className="text-gold-deep underline">
            +234 903 837 9755
          </a>{" "}
          or send a WhatsApp message to book your inspection.
        </p>
      </Container>
    );
  }

  const embedUrl = buildBookingEmbedUrl(calBaseUrl, {
    propertyId: property.id,
    propertyTitle: property.title,
    leadId,
  });

  const priceLabel = formatNaira(property.price.amount);
  const basisLabel: Record<string, string> = {
    outright: "outright",
    "per-annum": "/ yr",
    "per-night": "/ night",
    "per-plot": "/ plot",
    "per-sqm": "/ sqm",
  };

  return (
    <>
      {/* ── Breadcrumb ──────────────────────────────────────────────── */}
      <div className="border-b border-sand bg-paper py-3">
        <Container>
          <nav aria-label="Breadcrumb">
            <ol className="flex items-center gap-2 text-xs text-ink/45">
              <li>
                <Link href="/properties" className="transition-colors hover:text-ink">
                  Properties
                </Link>
              </li>
              <li aria-hidden="true">/</li>
              <li>
                <Link
                  href={`/properties/${property.slug}`}
                  className="transition-colors hover:text-ink"
                >
                  {property.title}
                </Link>
              </li>
              <li aria-hidden="true">/</li>
              <li className="text-ink/70">Book inspection</li>
            </ol>
          </nav>
        </Container>
      </div>

      <Container className="py-10 lg:py-16">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-[380px_1fr] lg:items-start">
          {/* ── Left: property summary ──────────────────────────────── */}
          <aside>
            <div className="overflow-hidden rounded-sm border border-sand bg-paper">
              {property.primaryImageSrc ? (
                <div className="relative aspect-[4/3] w-full">
                  <Image
                    src={property.primaryImageSrc}
                    alt={property.primaryImageAlt}
                    fill
                    sizes="(max-width: 1024px) 100vw, 380px"
                    className="object-cover"
                    priority
                  />
                </div>
              ) : null}

              <div className="p-5">
                <p className="mb-1 font-mono text-[10px] uppercase tracking-widest text-ink/40">
                  You are booking an inspection for
                </p>
                <h1 className="font-display text-xl leading-snug text-ink">
                  {property.title}
                </h1>
                <p className="mt-1 text-sm text-ink/55">
                  {property.location.area}, {property.location.city}
                </p>

                <div className="mt-4 border-t border-sand pt-4">
                  <p className="font-mono text-[10px] uppercase tracking-widest text-ink/40">
                    Price
                  </p>
                  <p className="mt-1 font-mono text-base font-semibold text-gold-deep">
                    {priceLabel}
                    {basisLabel[property.price.basis] ? (
                      <span className="ml-1 text-xs font-normal text-ink/45">
                        {basisLabel[property.price.basis]}
                      </span>
                    ) : null}
                  </p>
                </div>

                {agent ? (
                  <div className="mt-4 border-t border-sand pt-4">
                    <p className="font-mono text-[10px] uppercase tracking-widest text-ink/40">
                      Your agent
                    </p>
                    <p className="mt-1 text-sm font-medium text-ink">{agent.name}</p>
                    <p className="text-sm text-ink/55">{agent.email}</p>
                  </div>
                ) : null}
              </div>
            </div>

            {/* What to expect */}
            <div className="mt-6 rounded-sm border border-sand bg-paper p-5">
              <h2 className="mb-3 font-mono text-[10px] uppercase tracking-widest text-ink/40">
                What to expect
              </h2>
              <ul className="space-y-2 text-sm text-ink/70">
                <li className="flex gap-2">
                  <span className="mt-0.5 text-gold" aria-hidden="true">—</span>
                  <span>Pick a date and time that suits you — in-person or video call</span>
                </li>
                <li className="flex gap-2">
                  <span className="mt-0.5 text-gold" aria-hidden="true">—</span>
                  <span>Confirmation email with full details sent immediately</span>
                </li>
                <li className="flex gap-2">
                  <span className="mt-0.5 text-gold" aria-hidden="true">—</span>
                  <span>All title documents available for review on the day</span>
                </li>
                <li className="flex gap-2">
                  <span className="mt-0.5 text-gold" aria-hidden="true">—</span>
                  <span>No obligation — questions welcomed at every stage</span>
                </li>
              </ul>
            </div>
          </aside>

          {/* ── Right: Cal.com embed ────────────────────────────────── */}
          <div>
            <h2 className="mb-6 font-display text-2xl text-ink">
              Select a date and time
            </h2>
            <CalEmbed src={embedUrl} />
          </div>
        </div>
      </Container>
    </>
  );
}
