import type { Metadata } from "next";
import { Container } from "@/components/ui/Container";
import { DiasporaHero } from "@/components/marketing/DiasporaHero";
import { DiasporaVerification } from "@/components/marketing/DiasporaVerification";
import { DiasporaRemoteFlow } from "@/components/marketing/DiasporaRemoteFlow";
import { RefundPolicy } from "@/components/marketing/RefundPolicy";
import { CalBookingEmbed } from "@/components/marketing/CalBookingEmbed";

export const metadata: Metadata = {
  title: "Buy property in Lagos from abroad — diaspora buying guide",
  description:
    "Verified Lagos property for Nigerians in the UK, US, Canada, and the UAE. Virtual inspections, document verification, escrow payments — the full process for remote buyers.",
  keywords: [
    "buy property in Lagos from abroad",
    "diaspora real estate Nigeria",
    "verified property Lagos",
    "Lekki property for Nigerians in UK",
    "Ikoyi property diaspora",
    "virtual inspection Lagos",
    "buy land in Lagos from UK",
  ],
  alternates: { canonical: "/diaspora" },
  openGraph: {
    title: "Buy property in Lagos from abroad — Sunwealth Real Estate",
    description:
      "Every property verified. Every document checked. Every step visible. Built for Nigerians buying into Lagos from London, Houston, Toronto, and Dubai.",
    url: "/diaspora",
    siteName: "Sunwealth Real Estate",
    locale: "en_GB",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Buy property in Lagos from abroad — Sunwealth Real Estate",
    description:
      "Every property verified. Every document checked. Every step visible.",
  },
};

const JSON_LD = {
  "@context": "https://schema.org",
  "@type": "RealEstateAgent",
  name: "Sunwealth Real Estate Limited",
  description:
    "Lagos-based luxury real estate firm serving diaspora Nigerians and high-net-worth buyers across Ikoyi, Lekki, VGC, and Banana Island.",
  telephone: "+234 903 837 9755",
  areaServed: [
    { "@type": "City", name: "Lagos" },
    { "@type": "Place", name: "Ikoyi" },
    { "@type": "Place", name: "Banana Island" },
    { "@type": "Place", name: "Lekki Phase 1" },
    { "@type": "Place", name: "Victoria Garden City" },
    { "@type": "Place", name: "Osapa London" },
  ],
  address: {
    "@type": "PostalAddress",
    addressLocality: "Lagos",
    addressCountry: "NG",
  },
  sameAs: [
    "https://www.instagram.com/sunwealthltd",
    "https://www.instagram.com/sunwealth_rent.ng",
    "https://www.instagram.com/sunwealth_landandacres",
  ],
};

// Intentionally empty until real, permissioned testimonials exist.
// The spec says: "If we don't have these yet, omit the section. Never fabricate."
const TESTIMONIALS: { name: string; country: string; quote: string }[] = [];

export default function DiasporaPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(JSON_LD) }}
      />

      <DiasporaHero />
      <DiasporaVerification />
      <VirtualInspectionVideo />
      <DiasporaRemoteFlow />
      <RefundPolicy />

      {TESTIMONIALS.length > 0 ? (
        <Container>
          <section className="py-20 lg:py-28">
            <h2 className="font-display text-3xl text-ink md:text-4xl">
              From diaspora clients.
            </h2>
            {/* Render testimonials here when real, permissioned content lands. */}
          </section>
        </Container>
      ) : null}

      <CalBookingEmbed />
    </>
  );
}

function VirtualInspectionVideo() {
  return (
    <section className="py-20 lg:py-28">
      <Container>
        <div className="mb-10 max-w-2xl">
          <p className="mb-2 text-xs uppercase tracking-widest text-stone">
            Sample walk-through
          </p>
          <h2 className="font-display text-3xl text-ink md:text-4xl">
            What a virtual inspection looks like.
          </h2>
          <p className="mt-4 text-base leading-relaxed text-stone">
            A live video tour with a senior agent — you ask, they walk. Two to
            three minutes is usually enough to know whether to carry on.
          </p>
        </div>

        <div
          className="relative aspect-video w-full overflow-hidden rounded-sm bg-ink"
          data-placeholder="true"
        >
          <iframe
            title="Sample virtual inspection walk-through"
            src="https://www.youtube.com/embed/dQw4w9WgXcQ"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            loading="lazy"
            className="absolute inset-0 h-full w-full"
          />
        </div>
        <p className="mt-3 text-xs italic text-stone">
          {"[PLACEHOLDER video — replace with a real Sunwealth walk-through before launch.]"}
        </p>
      </Container>
    </section>
  );
}
