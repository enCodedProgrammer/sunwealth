"use client";

import { cn } from "@/lib/cn";

type Option<V extends string> = { value: V; label: string };

type Props<V extends string> = {
  options: Option<V>[];
  value: V | "";
  onChange: (v: V | "") => void;
  allowClear?: boolean;
};

export function SegmentedControl<V extends string>({
  options,
  value,
  onChange,
  allowClear = false,
}: Props<V>) {
  return (
    <div
      role="group"
      className="inline-flex w-full overflow-hidden rounded-sm border border-stone/40"
    >
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(allowClear && active ? "" : o.value)}
            className={cn(
              "flex-1 px-3 py-2 text-sm transition-colors",
              active ? "bg-ink text-paper" : "bg-paper text-ink hover:bg-sand",
            )}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
