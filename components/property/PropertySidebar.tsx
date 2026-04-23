import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { PriceBlock } from "./PriceBlock";
import { AskConciergeButton } from "./AskConciergeButton";
import { statusLabel, statusTone } from "@/lib/property-format";
import type { Agent, Property } from "@/lib/types";

type PropertySidebarProps = {
  property: Property;
  agent?: Agent | null;
  canonicalPath: string;
};

const SUNWEALTH_PHONE = "+2349038379755";
const SUNWEALTH_WA = "2349038379755";
const CANONICAL_HOST = "https://sunwealthrealestate.com";

export function PropertySidebar({
  property,
  agent,
  canonicalPath,
}: PropertySidebarProps) {
  const url = `${CANONICAL_HOST}${canonicalPath}`;
  const waMessage = `Hi, I'm interested in ${property.title} — ${url}`;
  const whatsappHref = `https://wa.me/${SUNWEALTH_WA}?text=${encodeURIComponent(waMessage)}`;

  return (
    <aside className="relative sticky top-24 flex flex-col gap-6 overflow-hidden rounded-sm border border-sand bg-sand/25 p-6">
      {/* Gold hairline accent at top */}
      <div aria-hidden="true" className="absolute inset-x-0 top-0 h-[2px] bg-gold" />

      <div className="flex items-start justify-between gap-3 pt-1">
        <PriceBlock price={property.price} size="lg" />
        <Badge tone={statusTone(property.status)}>
          {statusLabel(property.status)}
        </Badge>
      </div>

      <div className="flex flex-col gap-3">
        <Link
          href={`/inspections/book/${property.id}`}
          className="inline-flex h-12 items-center justify-center rounded-sm bg-gold px-6 font-medium text-ink transition-colors hover:bg-gold-deep"
        >
          Book inspection
        </Link>
        <AskConciergeButton
          property={{ id: property.id, slug: property.slug, title: property.title }}
        />
      </div>

      <div className="flex flex-col gap-3 border-t border-sand pt-5 text-sm">
        <a
          href={whatsappHref}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-3 text-ink/80 transition-colors hover:text-gold-deep"
        >
          <WhatsappIcon />
          <span>
            WhatsApp{" "}
            <span className="font-mono">{SUNWEALTH_PHONE}</span>
          </span>
        </a>
        <a
          href={`tel:${SUNWEALTH_PHONE}`}
          className="inline-flex items-center gap-3 text-ink/80 transition-colors hover:text-gold-deep"
        >
          <PhoneIcon />
          <span className="font-mono">{SUNWEALTH_PHONE}</span>
        </a>
      </div>

      {agent ? (
        <div className="flex items-start gap-3 border-t border-sand pt-5">
          <div
            aria-hidden="true"
            className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full bg-gold/20 font-medium text-ink"
          >
            {agent.name
              .split(/\s+/)
              .slice(0, 2)
              .map((w) => w[0])
              .join("")}
          </div>
          <div className="flex flex-col gap-0.5">
            <p className="text-sm font-medium text-ink">{agent.name}</p>
            <p className="text-xs uppercase tracking-wide text-ink/45">
              {agent.role === "admin" ? "Admin" : `${agent.role} consultant`}
            </p>
          </div>
        </div>
      ) : (
        <p className="border-t border-sand pt-5 text-sm text-ink/60">
          A senior consultant from the Sunwealth team will be assigned when you
          book.
        </p>
      )}
    </aside>
  );
}

function WhatsappIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      className="flex-shrink-0"
    >
      <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 2.1.65 4.06 1.75 5.68L2 22l4.6-1.2a9.87 9.87 0 0 0 5.44 1.62h.01c5.46 0 9.91-4.45 9.91-9.91S17.5 2 12.04 2zm0 18.1a8.2 8.2 0 0 1-4.18-1.14l-.3-.18-3.05.8.82-2.97-.2-.31a8.2 8.2 0 1 1 15.11-4.39 8.2 8.2 0 0 1-8.2 8.19zm4.72-6.14c-.26-.13-1.53-.76-1.76-.84-.24-.09-.4-.13-.58.13-.17.26-.67.84-.82 1.02-.15.17-.3.2-.56.07-.26-.13-1.1-.4-2.08-1.29-.77-.68-1.29-1.52-1.44-1.78-.15-.26-.02-.4.12-.53.12-.12.26-.3.39-.46.13-.17.17-.3.26-.5.09-.2.04-.38-.02-.52-.06-.13-.58-1.41-.8-1.93-.2-.5-.41-.43-.58-.44l-.5-.01a.96.96 0 0 0-.7.32c-.24.26-.92.9-.92 2.2s.94 2.56 1.07 2.74c.13.17 1.85 2.83 4.48 3.97.63.27 1.12.43 1.5.55.63.2 1.2.17 1.66.1.5-.07 1.53-.62 1.75-1.23.22-.6.22-1.13.15-1.23-.06-.1-.23-.17-.5-.3z" />
    </svg>
  );
}

function PhoneIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className="flex-shrink-0"
    >
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.8 19.8 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.8 19.8 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.37 1.9.72 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.9.35 1.85.59 2.81.72A2 2 0 0 1 22 16.92z" />
    </svg>
  );
}
