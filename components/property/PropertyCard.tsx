import Image from "next/image";
import Link from "next/link";
import { formatArea } from "@/lib/format";
import { statusLabel, statusTone } from "@/lib/property-format";
import type { PropertySearchResult } from "@/lib/db/properties";
import { Badge } from "@/components/ui/Badge";
import { PriceBlock } from "./PriceBlock";

type PropertyCardProps = {
  property: PropertySearchResult;
  sizes?: string;
};

export function PropertyCard({
  property: p,
  sizes = "(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw",
}: PropertyCardProps) {
  const showStatusBadge = p.status === "under-offer" || p.status === "let";

  return (
    <Link
      href={`/properties/${p.slug}`}
      className="group block"
      aria-label={`${p.title} — ${p.location.area}`}
    >
      <article className="flex flex-col gap-4">
        <div className="relative aspect-[16/9] overflow-hidden rounded-sm bg-sand">
          {p.primaryImage ? (
            <Image
              src={p.primaryImage}
              alt={p.title}
              fill
              sizes={sizes}
              className="object-cover motion-safe:transition-transform motion-safe:duration-700 motion-safe:group-hover:scale-[1.04]"
            />
          ) : null}
          {/* Hover overlay */}
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-ink/0 motion-safe:transition-colors motion-safe:duration-400 motion-safe:group-hover:bg-ink/18"
          />
          {showStatusBadge ? (
            <div className="absolute left-3 top-3">
              <Badge tone={statusTone(p.status)}>{statusLabel(p.status)}</Badge>
            </div>
          ) : null}
          {/* View affordance on hover */}
          <div
            aria-hidden="true"
            className="absolute bottom-3 right-3 flex h-8 w-8 items-center justify-center rounded-full bg-paper/0 text-paper opacity-0 motion-safe:transition-all motion-safe:duration-300 motion-safe:group-hover:bg-paper/90 motion-safe:group-hover:text-ink motion-safe:group-hover:opacity-100"
          >
            →
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <h3 className="font-display text-xl leading-tight text-ink line-clamp-2">
            {p.title}
          </h3>
          <p className="text-sm text-ink/55">
            {p.location.area}, {p.location.city}
          </p>
          <PriceBlock price={p.price} size="sm" className="mt-1" />

          <ul className="flex flex-wrap items-center gap-x-4 gap-y-1 pt-2 text-sm text-ink/80">
            {p.bedrooms !== undefined ? (
              <li className="inline-flex items-center gap-1.5">
                <BedIcon />
                <span>
                  <span className="font-mono">{p.bedrooms}</span> bed
                </span>
              </li>
            ) : null}
            {p.bathrooms !== undefined ? (
              <li className="inline-flex items-center gap-1.5">
                <BathIcon />
                <span>
                  <span className="font-mono">{p.bathrooms}</span> bath
                </span>
              </li>
            ) : null}
            <li className="inline-flex items-center gap-1.5">
              <SizeIcon />
              <span className="font-mono">
                {formatArea(p.size.value, p.size.unit)}
              </span>
            </li>
          </ul>

          {p.documents.length > 0 ? (
            <ul className="flex flex-wrap gap-1.5 pt-2">
              {p.documents.map((d) => (
                <li key={d}>
                  <Badge tone="gold" size="sm">
                    {d}
                  </Badge>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      </article>
    </Link>
  );
}

function BedIcon() {
  return (
    <Icon path="M3 18v-6a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v6M3 18h18M3 18v2M21 18v2M7 10V7h10v3" />
  );
}

function BathIcon() {
  return (
    <Icon path="M4 10V6.5a2.5 2.5 0 0 1 5 0M3 10h18v3a5 5 0 0 1-5 5H8a5 5 0 0 1-5-5v-3zM7 18v2M17 18v2" />
  );
}

function SizeIcon() {
  return <Icon path="M4 14v6h6M20 10V4h-6M4 20 10 14M20 4 14 10" />;
}

function Icon({ path }: { path: string }) {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={path} />
    </svg>
  );
}
