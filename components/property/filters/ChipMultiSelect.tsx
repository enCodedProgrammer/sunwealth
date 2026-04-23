"use client";

import { useState } from "react";
import { cn } from "@/lib/cn";

type Option = { value: string; label: string };

type Props = {
  options: Option[];
  selected: string[];
  onChange: (values: string[]) => void;
  initialVisible?: number;
};

export function ChipMultiSelect({
  options,
  selected,
  onChange,
  initialVisible,
}: Props) {
  const [expanded, setExpanded] = useState(false);
  const canCollapse =
    initialVisible !== undefined && options.length > initialVisible;
  const shown =
    !canCollapse || expanded ? options : options.slice(0, initialVisible);

  function toggle(v: string) {
    if (selected.includes(v)) onChange(selected.filter((x) => x !== v));
    else onChange([...selected, v]);
  }

  return (
    <div className="flex flex-col gap-2">
      <ul className="flex flex-wrap gap-1.5">
        {shown.map((o) => {
          const active = selected.includes(o.value);
          return (
            <li key={o.value}>
              <button
                type="button"
                aria-pressed={active}
                onClick={() => toggle(o.value)}
                className={cn(
                  "rounded-full border px-3 py-1.5 text-xs transition-colors",
                  active
                    ? "border-ink bg-ink text-paper"
                    : "border-stone/40 bg-paper text-ink hover:border-ink",
                )}
              >
                {o.label}
              </button>
            </li>
          );
        })}
      </ul>
      {canCollapse ? (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="self-start text-xs text-gold-deep hover:underline"
        >
          {expanded ? "Show fewer" : `Show all (${options.length})`}
        </button>
      ) : null}
    </div>
  );
}
