import type { Metadata } from "next";
import { Container } from "@/components/ui/Container";
import { ContactMethods } from "@/components/marketing/ContactMethods";
import { ContactForm } from "@/components/marketing/ContactForm";

export const metadata: Metadata = {
  title: "Contact Sunwealth",
  description:
    "Three ways to reach the Sunwealth team — visit the office, call or WhatsApp +234 903 837 9755, or send an email. Replies within four working hours.",
};

export default function ContactPage() {
  return (
    <Container>
      <div className="py-20 lg:py-28">
        <div className="mb-12 max-w-2xl">
          <p className="mb-2 text-xs uppercase tracking-widest text-stone">
            Get in touch
          </p>
          <h1 className="font-display text-4xl text-ink md:text-5xl">
            Three easy ways to reach us.
          </h1>
          <p className="mt-4 text-base leading-relaxed text-stone">
            Visit the office, call us, or drop us a line. However you prefer —
            we&apos;ll be back in touch within four working hours.
          </p>
        </div>

        <ContactMethods />

        <div className="mt-20 grid grid-cols-1 gap-10 lg:grid-cols-[1fr_1.3fr] lg:items-start">
          <div className="lg:sticky lg:top-24">
            <h2 className="font-display text-2xl text-ink md:text-3xl">
              Or send an enquiry.
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-stone">
              Tell us the outline — area, budget, timeline — and we&apos;ll line
              up matches before our first reply. No auto-responders.
            </p>
          </div>
          <ContactForm />
        </div>
      </div>
    </Container>
  );
}
