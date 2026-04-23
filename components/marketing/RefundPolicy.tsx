import { Container } from "@/components/ui/Container";

export function RefundPolicy() {
  return (
    <section className="py-20 lg:py-28">
      <Container>
        <div className="mx-auto max-w-3xl">
          <p className="mb-2 text-xs uppercase tracking-widest text-stone">
            Refund policy
          </p>
          <h2 className="font-display text-3xl text-ink md:text-4xl">
            Change your mind? You get your money back.
          </h2>
          <p className="mt-6 text-lg leading-relaxed text-ink">
            Reservation fees are fully refundable within fourteen days of
            payment, provided the property has not yet been formally allocated.
            After allocation, a 10% administrative deduction applies. Refunds
            land back in the account they came from, typically within seven
            working days. We accept payment only by verified bank transfer or
            licensed escrow — never through chat, never through payment links,
            never in cash.
          </p>
          <p className="mt-6 text-sm italic text-stone">
            {
              "[PLACEHOLDER — confirm exact refund window and percentages with operations before launch.]"
            }
          </p>
        </div>
      </Container>
    </section>
  );
}
