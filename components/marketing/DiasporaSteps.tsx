import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { AnimateIn } from "@/components/ui/AnimateIn";

const STEPS = [
  {
    title: "Discover properties from anywhere",
    description:
      "Every listing inspected, photographed and priced before it reaches you.",
  },
  {
    title: "Virtual inspection with a senior agent",
    description:
      "Walk through the property on WhatsApp video, ask anything, no pressure.",
  },
  {
    title: "Documents verified before you wire",
    description:
      "We share a title summary your lawyer can cross-check, signed links expire in an hour.",
  },
  {
    title: "Keys handed over, remote or on the ground",
    description:
      "Power of Attorney, escrow, or a nominated representative — whatever suits your setup.",
  },
];

export function DiasporaSteps() {
  return (
    <section className="bg-ink py-20 lg:py-28">
      <Container>
        <AnimateIn className="mb-12 grid grid-cols-1 gap-6 md:grid-cols-[2fr_1fr] md:items-end">
          <div>
            <p className="mb-2 text-xs uppercase tracking-widest text-paper/40">
              For diaspora buyers
            </p>
            <h2 className="font-display text-3xl text-paper md:text-4xl">
              How we work with buyers who can&apos;t fly in next week.
            </h2>
          </div>
          <Link
            href="/diaspora"
            className="justify-self-start text-sm text-paper/60 transition-colors hover:text-gold md:justify-self-end"
          >
            Full diaspora guide →
          </Link>
        </AnimateIn>

        <ol className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((s, i) => (
            <AnimateIn key={s.title} as="li" delay={i * 110}>
              <div className="flex flex-col gap-3 border-t border-paper/15 pt-6">
                <span className="font-mono text-xs text-gold">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <h3 className="font-display text-xl leading-tight text-paper">
                  {s.title}
                </h3>
                <p className="text-sm leading-relaxed text-paper/65">
                  {s.description}
                </p>
              </div>
            </AnimateIn>
          ))}
        </ol>
      </Container>
    </section>
  );
}
