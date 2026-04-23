import Image from "next/image";
import { Container } from "@/components/ui/Container";

const STEPS = [
  {
    title: "Title review",
    description:
      "We request the original C of O, Deed, or Excision from the vendor and photograph every page.",
  },
  {
    title: "Registry cross-check",
    description:
      "We verify the document against Lagos State Land Bureau and the Ministry of Physical Planning.",
  },
  {
    title: "Physical inspection",
    description:
      "A senior agent walks the property with the supplied survey to confirm boundaries and state of repair.",
  },
  {
    title: "Encumbrance search",
    description:
      "We run a formal search to confirm the property isn't under litigation, acquisition, or prior assignment.",
  },
  {
    title: "Photography and measurements",
    description:
      "We capture the listing photos ourselves — no seller-supplied images. Measurements are independently verified.",
  },
  {
    title: "Publishing",
    description:
      "Only once everything above is cleared does the property appear on the site. No shortcuts.",
  },
];

export function DiasporaVerification() {
  return (
    <section className="py-20 lg:py-28">
      <Container>
        <div className="mb-12 grid grid-cols-1 gap-6 lg:grid-cols-[2fr_3fr] lg:items-start">
          <div className="relative aspect-[4/5] overflow-hidden rounded-sm bg-sand lg:sticky lg:top-24">
            <Image
              src="https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=1600&q=80"
              alt="Senior agent reviewing a title document at a desk with a site plan spread out"
              fill
              sizes="(min-width: 1024px) 40vw, 100vw"
              className="object-cover"
              data-placeholder="true"
            />
          </div>

          <div>
            <p className="mb-2 text-xs uppercase tracking-widest text-stone">
              Before you wire a kobo
            </p>
            <h2 className="font-display text-3xl text-ink md:text-4xl">
              How we verify every property.
            </h2>
            <p className="mt-4 max-w-xl text-base leading-relaxed text-stone">
              The same six steps apply to every listing. Missed steps mean the
              property doesn&apos;t get published. That&apos;s why our inventory
              is smaller than a Propertypro page — and why it holds.
            </p>

            <ol className="mt-10 flex flex-col gap-8">
              {STEPS.map((s, i) => (
                <li key={s.title} className="flex gap-6">
                  <span className="shrink-0 font-mono text-xl text-gold-deep tabular-nums">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div>
                    <h3 className="font-display text-xl text-ink">
                      {s.title}
                    </h3>
                    <p className="mt-1 text-sm leading-relaxed text-stone">
                      {s.description}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </Container>
    </section>
  );
}
