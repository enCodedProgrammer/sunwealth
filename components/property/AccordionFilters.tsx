"use client";

import { useRef, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/cn";
import {
  AREA_FACETS,
  BEDROOM_FACETS,
  CATEGORY_FACETS,
  DOCUMENT_FACETS,
  LISTING_TYPE_FACETS,
} from "@/lib/property-facets";
import { ChipMultiSelect } from "@/components/property/filters/ChipMultiSelect";
import { SegmentedControl } from "@/components/property/filters/SegmentedControl";
import type { ListingType } from "@/lib/types";

type HideFilters = {
  listingType?: boolean;
  bedrooms?: boolean;
  category?: boolean;
};

type Props = {
  total: number;
  hide?: HideFilters;
};

const FIELD =
  "h-11 w-full rounded-sm border border-sand bg-paper px-3 text-sm text-ink placeholder:text-ink/35 transition-colors focus:border-gold focus:outline-none";

export function AccordionFilters({ total, hide }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();
  const [, startTransition] = useTransition();
  const [expanded, setExpanded] = useState(false);

  // ── Instant-update helpers ────────────────────────────────────────
  function setParam(key: string, value: string | null) {
    const params = new URLSearchParams(sp.toString());
    if (!value) params.delete(key);
    else params.set(key, value);
    params.delete("offset");
    startTransition(() => {
      const q = params.toString();
      router.replace(q ? `${pathname}?${q}` : pathname, { scroll: false });
    });
  }

  function setList(key: string, values: string[]) {
    setParam(key, values.length ? values.join(",") : null);
  }

  function clearAll() {
    startTransition(() => router.replace(pathname, { scroll: false }));
  }

  // ── Debounced price + keyword — uncontrolled inputs with timer refs ─
  // Using key={urlValue} on each input so React remounts (resets) them
  // when the URL param changes externally (e.g. "Clear all").
  // Timer refs are only touched in event handlers — never during render.
  const priceMinParam = sp.get("priceMin") ?? "";
  const priceMaxParam = sp.get("priceMax") ?? "";
  const qParam = sp.get("q") ?? "";
  const priceMinTimer = useRef<number | undefined>(undefined);
  const priceMaxTimer = useRef<number | undefined>(undefined);
  const qTimer = useRef<number | undefined>(undefined);

  function onPriceMinChange(e: React.ChangeEvent<HTMLInputElement>) {
    clearTimeout(priceMinTimer.current);
    const v = e.target.value;
    priceMinTimer.current = window.setTimeout(() => setParam("priceMin", v || null), 500);
  }
  function onPriceMaxChange(e: React.ChangeEvent<HTMLInputElement>) {
    clearTimeout(priceMaxTimer.current);
    const v = e.target.value;
    priceMaxTimer.current = window.setTimeout(() => setParam("priceMax", v || null), 500);
  }
  function onQChange(e: React.ChangeEvent<HTMLInputElement>) {
    clearTimeout(qTimer.current);
    const v = e.target.value;
    qTimer.current = window.setTimeout(() => setParam("q", v || null), 300);
  }

  // ── Instant-update field values from URL ──────────────────────────
  const area = sp.get("area") ?? "";
  const bedroomsMin = sp.get("bedroomsMin") ?? "";
  const listingType = sp.get("listingType") ?? "";
  const documents = parseCsv(sp.get("documents"));
  const category = parseCsv(sp.get("category"));

  // Count active extra filters (for the badge on the toggle button)
  const extraCount = [
    !hide?.listingType && !!listingType,
    !!qParam,
    documents.length > 0,
    !hide?.category && category.length > 0,
  ].filter(Boolean).length;

  return (
    <div>
      {/* ── Base row: 4 always-visible filters + toggle ─────────── */}
      <div
        className={cn(
          "grid grid-cols-1 gap-3 sm:grid-cols-2",
          !hide?.bedrooms
            ? "lg:grid-cols-[1fr_1fr_1fr_1fr_auto]"
            : "lg:grid-cols-[1fr_1fr_1fr_auto]",
        )}
      >
        {/* Area */}
        <Field label="Area">
          <select
            value={area}
            onChange={(e) => setParam("area", e.target.value || null)}
            className={FIELD}
          >
            <option value="">All areas</option>
            {AREA_FACETS.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
        </Field>

        {/* Bedrooms (hidden for land) */}
        {!hide?.bedrooms ? (
          <Field label="Bedrooms">
            <select
              value={bedroomsMin}
              onChange={(e) =>
                setParam("bedroomsMin", e.target.value || null)
              }
              className={FIELD}
            >
              <option value="">Any</option>
              {BEDROOM_FACETS.filter((b) => b.value !== "").map((b) => (
                <option key={b.value} value={b.value}>
                  {b.label}+
                </option>
              ))}
            </select>
          </Field>
        ) : null}

        {/* Min price */}
        <Field label="Min price (₦)">
          <input
            key={priceMinParam}
            type="number"
            inputMode="numeric"
            min="0"
            defaultValue={priceMinParam}
            onChange={onPriceMinChange}
            placeholder="Any"
            className={FIELD}
          />
        </Field>

        {/* Max price */}
        <Field label="Max price (₦)">
          <input
            key={priceMaxParam}
            type="number"
            inputMode="numeric"
            min="0"
            defaultValue={priceMaxParam}
            onChange={onPriceMaxChange}
            placeholder="Any"
            className={FIELD}
          />
        </Field>

        {/* More / fewer filters toggle */}
        <div className="flex flex-col justify-end sm:col-span-2 lg:col-span-1">
          <button
            type="button"
            aria-expanded={expanded}
            onClick={() => setExpanded((v) => !v)}
            className={cn(
              "inline-flex h-11 w-full items-center justify-center gap-2 rounded-sm border px-4 text-sm font-medium transition-colors lg:w-auto lg:whitespace-nowrap",
              expanded
                ? "border-ink bg-ink text-paper"
                : "border-sand bg-paper text-ink hover:border-gold hover:text-gold-deep",
            )}
          >
            <span>{expanded ? "Fewer filters" : "More filters"}</span>
            {!expanded && extraCount > 0 ? (
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-gold px-1 font-mono text-xs text-ink">
                {extraCount}
              </span>
            ) : null}
            <ChevronIcon expanded={expanded} />
          </button>
        </div>
      </div>

      {/* ── Expandable section (smooth grid-row animation) ───────── */}
      <div
        className={cn(
          "grid motion-safe:transition-[grid-template-rows] motion-safe:duration-300 motion-safe:ease-out",
          expanded ? "[grid-template-rows:1fr]" : "[grid-template-rows:0fr]",
        )}
      >
        <div
          className="min-h-0 overflow-hidden"
          aria-hidden={!expanded}
          inert={expanded ? undefined : true}
        >
          <div className="grid grid-cols-1 gap-5 border-t border-sand pt-5 mt-5 sm:grid-cols-2 lg:grid-cols-4">
            {/* Keyword search */}
            <div className="flex flex-col gap-2">
              <SectionLabel>Keyword</SectionLabel>
              <input
                key={qParam}
                type="search"
                defaultValue={qParam}
                onChange={onQChange}
                placeholder="Title, description, area…"
                className={FIELD}
              />
            </div>

            {/* Listing type (hidden for rentals / land) */}
            {!hide?.listingType ? (
              <div className="flex flex-col gap-2">
                <SectionLabel>Listing type</SectionLabel>
                <SegmentedControl<ListingType>
                  options={LISTING_TYPE_FACETS}
                  value={listingType as ListingType | ""}
                  onChange={(v) => setParam("listingType", v || null)}
                  allowClear
                />
              </div>
            ) : null}

            {/* Documents */}
            <div className="flex flex-col gap-2">
              <SectionLabel>Documents</SectionLabel>
              <ChipMultiSelect
                options={DOCUMENT_FACETS.map((v) => ({ value: v, label: v }))}
                selected={documents}
                onChange={(v) => setList("documents", v)}
              />
            </div>

            {/* Category (hidden for land) */}
            {!hide?.category ? (
              <div className="flex flex-col gap-2">
                <SectionLabel>Category</SectionLabel>
                <ChipMultiSelect
                  options={CATEGORY_FACETS.map((o) => ({
                    value: o.value,
                    label: o.label,
                  }))}
                  selected={category}
                  onChange={(v) => setList("category", v)}
                />
              </div>
            ) : null}
          </div>
        </div>
      </div>

      {/* ── Footer: results count + clear ───────────────────────── */}
      <div className="mt-4 flex items-center justify-between gap-4 border-t border-sand pt-3">
        <p className="text-sm text-ink/60">
          <span className="font-mono font-medium text-ink">{total}</span>{" "}
          {total === 1 ? "property" : "properties"}
        </p>
        <button
          type="button"
          onClick={clearAll}
          className="text-sm text-ink/40 transition-colors hover:text-ink"
        >
          Clear all
        </button>
      </div>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-[11px] font-medium uppercase tracking-wider text-ink/45">
        {label}
      </span>
      {children}
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-[11px] font-medium uppercase tracking-wider text-ink/45">
      {children}
    </h3>
  );
}

function ChevronIcon({ expanded }: { expanded: boolean }) {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={cn(
        "flex-shrink-0 motion-safe:transition-transform motion-safe:duration-200",
        expanded && "rotate-180",
      )}
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

function parseCsv(value: string | null): string[] {
  if (!value) return [];
  return value
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}
