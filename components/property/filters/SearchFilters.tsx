"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import {
  AREA_FACETS,
  CATEGORY_FACETS,
  DOCUMENT_FACETS,
  LISTING_TYPE_FACETS,
} from "@/lib/property-facets";
import type { ListingType } from "@/lib/types";
import { BedroomPicker } from "./BedroomPicker";
import { ChipMultiSelect } from "./ChipMultiSelect";
import { PriceRange } from "./PriceRange";
import { SegmentedControl } from "./SegmentedControl";

type SearchFiltersProps = {
  total: number;
  hide?: {
    listingType?: boolean;
    bedrooms?: boolean;
    category?: boolean;
  };
};

export function SearchFilters({ total, hide }: SearchFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();
  const [, startTransition] = useTransition();

  const qParam = sp.get("q") ?? "";
  const [q, setQ] = useState(qParam);
  const lastQParamRef = useRef(qParam);

  if (qParam !== lastQParamRef.current) {
    lastQParamRef.current = qParam;
    setQ(qParam);
  }

  useEffect(() => {
    if (q === qParam) return;
    const handle = setTimeout(() => {
      setParam("q", q || null);
    }, 300);
    return () => clearTimeout(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  function setParam(key: string, value: string | null) {
    const params = new URLSearchParams(sp.toString());
    if (value === null || value === "") params.delete(key);
    else params.set(key, value);
    params.delete("offset");
    startTransition(() => {
      const query = params.toString();
      router.replace(query ? `${pathname}?${query}` : pathname, {
        scroll: false,
      });
    });
  }

  function setList(key: string, values: string[]) {
    setParam(key, values.length ? values.join(",") : null);
  }

  function clearAll() {
    startTransition(() => {
      router.replace(pathname, { scroll: false });
    });
  }

  const listingType = sp.get("listingType") ?? "";
  const area = parseCsv(sp.get("area"));
  const category = parseCsv(sp.get("category"));
  const documents = parseCsv(sp.get("documents"));
  const bedroomsMin = sp.get("bedroomsMin") ?? "";
  const priceMin = sp.get("priceMin") ?? "";
  const priceMax = sp.get("priceMax") ?? "";

  return (
    <div className="flex flex-col gap-6">
      <Input
        label="Search"
        type="search"
        placeholder="Title, description, area…"
        value={q}
        onChange={(e) => setQ(e.target.value)}
      />

      {hide?.listingType ? null : (
        <Section title="Listing type">
          <SegmentedControl<ListingType>
            options={LISTING_TYPE_FACETS}
            value={listingType as ListingType | ""}
            onChange={(v) => setParam("listingType", v || null)}
            allowClear
          />
        </Section>
      )}

      <Section title="Area">
        <ChipMultiSelect
          options={AREA_FACETS.map((v) => ({ value: v, label: v }))}
          selected={area}
          onChange={(v) => setList("area", v)}
          initialVisible={8}
        />
      </Section>

      <Section title="Price range">
        <PriceRange
          min={priceMin}
          max={priceMax}
          onMinChange={(v) => setParam("priceMin", v || null)}
          onMaxChange={(v) => setParam("priceMax", v || null)}
        />
      </Section>

      {hide?.bedrooms ? null : (
        <Section title="Bedrooms">
          <BedroomPicker
            value={bedroomsMin}
            onChange={(v) => setParam("bedroomsMin", v || null)}
          />
        </Section>
      )}

      <Section title="Documents">
        <ChipMultiSelect
          options={DOCUMENT_FACETS.map((v) => ({ value: v, label: v }))}
          selected={documents}
          onChange={(v) => setList("documents", v)}
        />
      </Section>

      {hide?.category ? null : (
        <Section title="Category">
          <ChipMultiSelect
            options={CATEGORY_FACETS.map((o) => ({ value: o.value, label: o.label }))}
            selected={category}
            onChange={(v) => setList("category", v)}
          />
        </Section>
      )}

      <div className="flex flex-col gap-3 border-t border-sand pt-4">
        <p className="text-sm text-ink/60">
          <span className="font-mono font-medium text-ink">{total}</span>{" "}
          {total === 1 ? "property" : "properties"} match
        </p>
        <Button variant="ghost" size="sm" onClick={clearAll}>
          Clear all filters
        </Button>
      </div>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3">
      <h3 className="text-xs font-medium uppercase tracking-wider text-ink/50">
        {title}
      </h3>
      {children}
    </div>
  );
}

function parseCsv(value: string | null): string[] {
  if (!value) return [];
  return value
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}
