import { Container } from "@/components/ui/Container";

const STEPS = [
  {
    title: "Discovery",
    description:
      "Browse the site, or message the concierge with your brief. We shortlist three to five properties that fit.",
  },
  {
    title: "Virtual inspection",
    description:
      "A senior agent walks the property on WhatsApp video. You ask whatever you want. Typically 20 to 40 minutes.",
  },
  {
    title: "Document verification",
    description:
      "We share a plain-English summary of the title and a secure link to the originals. Your lawyer can verify independently.",
  },
  {
    title: "Escrow",
    description:
      "Funds flow through a verified escrow agent — never directly to the seller, never through chat, never via payment links.",
  },
  {
    title: "Power of Attorney",
    description:
      "Optional. Signed and notarised at a Nigerian embassy in your country so a nominated representative can sign on your behalf.",
  },
  {
    title: "Handover",
    description:
      "Keys handed over in person by our team, or via your POA. We send a walk-through video either way.",
  },
];

export function DiasporaRemoteFlow() {
  return (
    <section className="bg-sand/50 py-20 lg:py-28">
      <Container>
        <div className="mb-12 max-w-2xl">
          <p className="mb-2 text-xs uppercase tracking-widest text-stone">
            Remote purchase
          </p>
          <h2 className="font-display text-3xl text-ink md:text-4xl">
            Six steps, no surprises.
          </h2>
          <p className="mt-4 text-base leading-relaxed text-stone">
            You&apos;ll see each of these before the next one begins. If
            something feels off at any stage, we stop.
          </p>
        </div>

        <ol className="grid grid-cols-1 gap-x-10 gap-y-8 md:grid-cols-2 lg:grid-cols-3">
          {STEPS.map((s, i) => (
            <li
              key={s.title}
              className="flex flex-col gap-3 border-t border-stone/50 pt-5"
            >
              <span className="font-mono text-xs text-gold-deep">
                Step {String(i + 1).padStart(2, "0")}
              </span>
              <h3 className="font-display text-xl text-ink leading-tight">
                {s.title}
              </h3>
              <p className="text-sm leading-relaxed text-stone">
                {s.description}
              </p>
            </li>
          ))}
        </ol>
      </Container>
    </section>
  );
}
