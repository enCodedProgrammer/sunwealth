import Image from "next/image";
import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { OpenConciergeButton } from "./OpenConciergeButton";

type HeroProps = {
  imageSrc: string;
  imageAlt: string;
};

export function Hero({ imageSrc, imageAlt }: HeroProps) {
  return (
    <section
      className="relative flex min-h-[78vh] items-end"
      aria-label="Sunwealth Real Estate"
    >
      {/* Background image */}
      {imageSrc ? (
        <Image
          src={imageSrc}
          alt={imageAlt}
          fill
          priority
          sizes="100vw"
          className="object-cover"
          data-placeholder="true"
        />
      ) : (
        <div className="absolute inset-0 bg-ink" />
      )}

      {/* Gradient overlay — barely visible at top, strong at bottom */}
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-gradient-to-t from-ink/92 via-ink/45 to-ink/8"
      />

      {/* Content */}
      <div className="relative z-10 w-full py-16 md:py-20 lg:py-24">
        <Container>
          {/* Gold hairline draws in on load */}
          <div
            aria-hidden="true"
            className="animate-draw-line mb-8 h-px w-16 bg-gold"
            style={{ animationDelay: "80ms" }}
          />

          <h1
            className="animate-fade-up font-display text-4xl leading-[1.06] text-paper md:text-5xl lg:text-[3.5rem]"
            style={{ animationDelay: "160ms" }}
          >
            Lagos luxury property, verified for the way you live now.
          </h1>

          <p
            className="animate-fade-up mt-6 max-w-lg text-lg leading-relaxed text-paper/70"
            style={{ animationDelay: "310ms" }}
          >
            Sales, rentals, and land across Ikoyi, Lekki, and VGC — with a
            team that answers at 2 AM London time.
          </p>

          <div
            className="animate-fade-up mt-8 flex flex-col gap-3 sm:flex-row"
            style={{ animationDelay: "450ms" }}
          >
            <Link
              href="/properties"
              className="inline-flex h-11 items-center justify-center rounded-sm bg-gold px-6 text-base font-medium text-ink transition-colors hover:bg-gold-deep"
            >
              Browse properties
            </Link>
            <OpenConciergeButton variant="secondary">
              Chat with our concierge
            </OpenConciergeButton>
          </div>
        </Container>
      </div>
    </section>
  );
}
