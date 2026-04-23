type Props = {
  query?: string;
  heading?: string;
  address?: string;
};

export function OfficeMap({
  query = "Sunwealth Real Estate Lagos",
  heading = "Find us in Lagos.",
  address = "[PLACEHOLDER] 1 Sunwealth Close, Ikoyi, Lagos",
}: Props) {
  const src = `https://www.google.com/maps?q=${encodeURIComponent(query)}&output=embed`;

  return (
    <section className="mx-auto grid w-full max-w-5xl grid-cols-1 gap-8 lg:grid-cols-[1fr_2fr] lg:items-start">
      <div>
        <h2 className="font-display text-3xl text-ink md:text-4xl">{heading}</h2>
        <p className="mt-4 text-base leading-relaxed text-stone">{address}</p>
        <p className="mt-4 text-sm text-stone">
          Monday–Saturday, 9:00–17:00 WAT. Visits by appointment.
        </p>
        <p className="mt-4 text-xs italic text-stone">
          {"[PLACEHOLDER address — replace with the registered office address before launch.]"}
        </p>
      </div>
      <div className="relative aspect-[4/3] overflow-hidden rounded-sm border border-stone/30">
        <iframe
          title="Sunwealth office location on Google Maps"
          src={src}
          loading="lazy"
          allowFullScreen
          referrerPolicy="no-referrer-when-downgrade"
          className="absolute inset-0 h-full w-full"
          style={{ border: 0 }}
        />
      </div>
    </section>
  );
}
