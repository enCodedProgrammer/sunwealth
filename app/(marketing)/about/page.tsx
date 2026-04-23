import type { Metadata } from "next";
import { Container } from "@/components/ui/Container";
import { FounderStory } from "@/components/marketing/FounderStory";
import { TeamGrid } from "@/components/marketing/TeamGrid";
import { OfficeMap } from "@/components/marketing/OfficeMap";

export const metadata: Metadata = {
  title: "About Sunwealth Real Estate",
  description:
    "Sunwealth Real Estate Limited — a Lagos luxury real estate firm (RC 1739523) operating across sales, rentals, and land. Meet the team and find our office.",
};

export default function AboutPage() {
  return (
    <div className="flex flex-col gap-20 py-20 lg:gap-28 lg:py-28">
      <Container>
        <FounderStory />
      </Container>

      <Container>
        <TeamGrid />
      </Container>

      <Container>
        <section className="mx-auto flex max-w-3xl flex-col gap-6 border-y border-stone/30 py-10">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <Fact label="RC number" value="1739523" mono />
            <Fact label="Founded" value="[PLACEHOLDER]" />
            <Fact label="Listings inspected in person" value="100%" />
          </div>
          <p className="text-xs italic text-stone">
            {"[PLACEHOLDER facts — replace with verified figures before launch.]"}
          </p>
        </section>
      </Container>

      <Container>
        <OfficeMap />
      </Container>
    </div>
  );
}

function Fact({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1">
      <p className="text-xs uppercase tracking-widest text-stone">{label}</p>
      <p
        className={`text-2xl text-ink ${mono ? "font-mono tabular-nums" : "font-display"}`}
      >
        {value}
      </p>
    </div>
  );
}
