import Image from "next/image";
import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { AnimateIn } from "@/components/ui/AnimateIn";
import { AccordionFilters } from "@/components/property/AccordionFilters";
import { EmptyState } from "@/components/property/EmptyState";
import { ResultsGrid } from "@/components/property/ResultsGrid";
import { SortSelect } from "@/components/property/SortSelect";
import type { PropertyBasePath } from "@/lib/property-routing";
import type { SearchResponse } from "@/lib/db/properties";

type HideFilters = {
  listingType?: boolean;
  bedrooms?: boolean;
  category?: boolean;
};

type PropertyIndexViewProps = {
  title: string;
  description: string;
  eyebrow?: string;
  basePath: PropertyBasePath;
  rawParams: Record<string, string | string[] | undefined>;
  data: SearchResponse;
  hideFilters?: HideFilters;
  heroImage: string;
  heroAlt: string;
};

export function PropertyIndexView({
  title,
  description,
  eyebrow,
  basePath,
  rawParams,
  data,
  hideFilters,
  heroImage,
  heroAlt,
}: PropertyIndexViewProps) {
  const urlParams = toUrlSearchParams(rawParams);

  return (
    <>
      {/* ── Full-bleed hero ─────────────────────────────────────────── */}
      <section
        className="relative flex min-h-[62vh] items-end"
        aria-label={`${title} hero`}
      >
        <Image
          src={heroImage}
          alt={heroAlt}
          fill
          priority
          sizes="100vw"
          className="object-cover"
          data-placeholder="true"
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-t from-ink/85 via-ink/35 to-ink/5"
        />
        <div className="relative z-10 w-full pb-24 pt-32">
          <Container>
            {eyebrow ? (
              <p
                className="animate-fade-up mb-3 font-mono text-xs uppercase tracking-widest text-gold"
                style={{ animationDelay: "80ms" }}
              >
                {eyebrow}
              </p>
            ) : null}
            <h1
              className="animate-fade-up font-display text-4xl text-paper md:text-5xl lg:text-[3.25rem]"
              style={{ animationDelay: "160ms" }}
            >
              {title}
            </h1>
            <p
              className="animate-fade-up mt-3 max-w-xl text-base leading-relaxed text-paper/70"
              style={{ animationDelay: "280ms" }}
            >
              {description}
            </p>
          </Container>
        </div>
      </section>

      {/* ── Accordion filter bar (floats up over the hero boundary) ─── */}
      <div className="relative z-20 -mt-9">
        <Container>
          <div className="rounded-sm border border-sand bg-paper px-6 py-5 shadow-[0_8px_40px_rgba(11,14,19,0.14)]">
            <AccordionFilters total={data.total} hide={hideFilters} />
          </div>
        </Container>
      </div>

      {/* ── Results grid (full-width, no sidebar) ───────────────────── */}
      <Container className="py-10 lg:py-16">
        <div className="mb-6 flex items-center justify-between gap-4">
          <p className="text-sm text-ink/55">
            <span className="font-mono font-medium text-ink">{data.total}</span>{" "}
            {data.total === 1 ? "property" : "properties"}
          </p>
          <SortSelect />
        </div>

        {data.results.length > 0 ? (
          <>
            <AnimateIn>
              <ResultsGrid results={data.results} />
            </AnimateIn>
            <Pagination
              total={data.total}
              offset={data.offset}
              limit={data.limit}
              basePath={basePath}
              searchParams={urlParams}
            />
          </>
        ) : (
          <EmptyState />
        )}
      </Container>
    </>
  );
}

function toUrlSearchParams(
  raw: Record<string, string | string[] | undefined>,
): URLSearchParams {
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(raw)) {
    if (Array.isArray(v)) {
      for (const x of v) params.append(k, x);
    } else if (v !== undefined) {
      params.set(k, v);
    }
  }
  return params;
}

type PaginationProps = {
  total: number;
  offset: number;
  limit: number;
  basePath: PropertyBasePath;
  searchParams: URLSearchParams;
};

function Pagination({
  total,
  offset,
  limit,
  basePath,
  searchParams,
}: PaginationProps) {
  if (total <= limit) return null;

  const page = Math.floor(offset / limit) + 1;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const hasPrev = offset > 0;
  const hasNext = offset + limit < total;

  const prevParams = new URLSearchParams(searchParams);
  const prevOffset = Math.max(0, offset - limit);
  if (prevOffset === 0) prevParams.delete("offset");
  else prevParams.set("offset", String(prevOffset));

  const nextParams = new URLSearchParams(searchParams);
  nextParams.set("offset", String(offset + limit));

  const prevHref = `${basePath}${
    prevParams.toString() ? `?${prevParams.toString()}` : ""
  }`;
  const nextHref = `${basePath}?${nextParams.toString()}`;

  return (
    <nav
      aria-label="Pagination"
      className="mt-12 flex items-center justify-between gap-4 border-t border-sand pt-8"
    >
      {hasPrev ? (
        <Link
          href={prevHref}
          className="text-sm text-ink/70 transition-colors hover:text-gold-deep"
        >
          ← Previous
        </Link>
      ) : (
        <span />
      )}
      <p className="font-mono text-sm text-ink/50">
        Page {page} of {totalPages}
      </p>
      {hasNext ? (
        <Link
          href={nextHref}
          className="text-sm text-ink/70 transition-colors hover:text-gold-deep"
        >
          Next →
        </Link>
      ) : (
        <span />
      )}
    </nav>
  );
}
