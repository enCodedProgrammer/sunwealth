"use client";

import { BEDROOM_FACETS } from "@/lib/property-facets";
import { cn } from "@/lib/cn";

type Props = {
  value: string;
  onChange: (v: string) => void;
};

export function BedroomPicker({ value, onChange }: Props) {
  return (
    <div role="group" aria-label="Minimum bedrooms" className="flex flex-wrap gap-1.5">
      {BEDROOM_FACETS.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value || "any"}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(o.value)}
            className={cn(
              "h-9 min-w-9 rounded-sm border px-3 text-sm transition-colors",
              active
                ? "border-ink bg-ink text-paper"
                : "border-stone/40 bg-paper text-ink hover:border-ink",
            )}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
