import Image from "next/image";
import { Container } from "@/components/ui/Container";
import { OpenConciergeButton } from "./OpenConciergeButton";

export function DiasporaHero() {
  return (
    <section className="relative isolate overflow-hidden bg-ink text-paper">
      <div className="absolute inset-0 -z-10 opacity-40">
        <Image
          src="https://images.unsplash.com/photo-1524168272322-bf73616d9cb5?w=2000&q=80"
          alt="Lagos skyline at dusk seen from across the lagoon, amber lights across the waterline"
          fill
          priority
          sizes="100vw"
          className="object-cover"
          data-placeholder="true"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-ink/50 via-ink/70 to-ink" />
      </div>

      <Container>
        <div className="py-24 md:py-32 lg:py-40">
          <div className="max-w-3xl">
            <p className="mb-4 font-mono text-xs uppercase tracking-widest text-gold">
              For Nigerians abroad
            </p>
            <h1 className="font-display text-4xl leading-[1.1] md:text-5xl lg:text-6xl">
              Buying property in Lagos from London, Houston, or Toronto? We
              built this for you.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-paper/80">
              Every property verified. Every document checked. Every step
              visible.
            </p>
            <div className="mt-10 flex flex-col gap-3 sm:flex-row">
              <a
                href="#book-a-call"
                className="inline-flex h-11 items-center justify-center rounded-sm bg-gold px-6 text-base font-medium text-ink transition-colors hover:bg-gold-deep"
              >
                Book a 30-minute call
              </a>
              <OpenConciergeButton variant="secondary">
                Chat with our concierge
              </OpenConciergeButton>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
