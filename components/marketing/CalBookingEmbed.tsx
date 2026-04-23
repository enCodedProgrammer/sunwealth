import { Container } from "@/components/ui/Container";

type Props = {
  calUrl?: string;
  heading?: string;
  subheading?: string;
};

export function CalBookingEmbed({
  calUrl = "https://cal.com/sunwealth/placeholder",
  heading = "Book a 30-minute call with a senior consultant.",
  subheading = "We walk through what you're looking for, what we have, and whether there's a fit. No obligation.",
}: Props) {
  // The placeholder Cal.com URL from the seeded agent. Real agent Cal URLs are
  // stored in the `agents` table and surfaced on specific property routes;
  // this diaspora landing uses a single team URL intentionally.
  const isPlaceholder = calUrl.includes("/placeholder");

  return (
    <section id="book-a-call" className="bg-ink py-20 text-paper lg:py-28">
      <Container>
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-[2fr_3fr]">
          <div>
            <p className="mb-2 text-xs uppercase tracking-widest text-gold">
              Talk to us
            </p>
            <h2 className="font-display text-3xl leading-tight md:text-4xl">
              {heading}
            </h2>
            <p className="mt-6 max-w-md text-base leading-relaxed text-paper/80">
              {subheading}
            </p>
            <p className="mt-6 text-sm text-paper/60">
              Prefer WhatsApp?{" "}
              <a
                className="underline decoration-gold underline-offset-4 hover:text-gold"
                href="https://wa.me/2349038379755"
                target="_blank"
                rel="noopener noreferrer"
              >
                +234 903 837 9755
              </a>
            </p>
          </div>

          <div className="relative overflow-hidden rounded-sm border border-paper/10 bg-paper">
            <iframe
              title="Book a 30-minute call with Sunwealth"
              src={calUrl}
              loading="lazy"
              className="h-[620px] w-full"
              style={{ border: 0 }}
            />
            {isPlaceholder ? (
              <p className="absolute bottom-2 left-2 right-2 rounded-sm bg-ember/90 px-2 py-1 text-center text-[11px] text-paper">
                {
                  "[PLACEHOLDER Cal.com URL — update the agent's cal_booking_url in the agents table.]"
                }
              </p>
            ) : null}
          </div>
        </div>
      </Container>
    </section>
  );
}
