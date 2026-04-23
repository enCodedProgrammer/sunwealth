const METHODS = [
  {
    label: "Visit",
    title: "Our office",
    primary: "[PLACEHOLDER] 1 Sunwealth Close, Ikoyi, Lagos",
    secondary: "Monday–Saturday, 9:00–17:00 WAT",
    href: "https://www.google.com/maps/search/?api=1&q=Sunwealth+Real+Estate+Lagos",
    action: "Open in Google Maps",
  },
  {
    label: "Call",
    title: "Speak to someone",
    primary: "+234 903 837 9755",
    secondary: "Or message on WhatsApp — replies within an hour, 9–21 WAT.",
    href: "tel:+2349038379755",
    action: "Call now",
    secondaryHref: "https://wa.me/2349038379755",
    secondaryAction: "WhatsApp",
  },
  {
    label: "Email",
    title: "Write to us",
    primary: "hello@sunwealthrealestate.com",
    secondary: "Typical reply within 4 working hours.",
    href: "mailto:hello@sunwealthrealestate.com",
    action: "Send an email",
  },
];

export function ContactMethods() {
  return (
    <ul className="grid grid-cols-1 gap-6 md:grid-cols-3">
      {METHODS.map((m) => (
        <li
          key={m.label}
          className="flex flex-col gap-3 rounded-sm border border-stone/30 bg-paper p-6"
        >
          <p className="text-xs uppercase tracking-widest text-gold-deep">
            {m.label}
          </p>
          <h3 className="font-display text-2xl text-ink">{m.title}</h3>
          <p className="text-base leading-relaxed text-ink">{m.primary}</p>
          <p className="text-sm leading-relaxed text-stone">{m.secondary}</p>
          <div className="mt-auto flex flex-wrap gap-4 pt-4">
            <a
              href={m.href}
              target={m.href.startsWith("http") ? "_blank" : undefined}
              rel={m.href.startsWith("http") ? "noopener noreferrer" : undefined}
              className="text-sm text-ink underline decoration-gold underline-offset-4 transition-colors hover:text-gold-deep"
            >
              {m.action}
            </a>
            {m.secondaryHref ? (
              <a
                href={m.secondaryHref}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-stone transition-colors hover:text-gold-deep"
              >
                {m.secondaryAction}
              </a>
            ) : null}
          </div>
        </li>
      ))}
    </ul>
  );
}
