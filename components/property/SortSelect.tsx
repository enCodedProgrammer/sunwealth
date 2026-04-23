"use client";

import { useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { SORT_FACETS } from "@/lib/property-facets";

export function SortSelect() {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();
  const [, startTransition] = useTransition();

  const value = sp.get("sortBy") ?? "newest";

  function onChange(v: string) {
    const params = new URLSearchParams(sp.toString());
    if (v === "newest") params.delete("sortBy");
    else params.set("sortBy", v);
    params.delete("offset");
    startTransition(() => {
      const query = params.toString();
      router.replace(query ? `${pathname}?${query}` : pathname, {
        scroll: false,
      });
    });
  }

  return (
    <div className="flex items-center gap-2">
      <label htmlFor="sort-select" className="text-sm text-ink/55">
        Sort
      </label>
      <select
        id="sort-select"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-9 rounded-sm border border-sand bg-paper px-3 text-sm text-ink transition-colors hover:border-stone/60"
      >
        {SORT_FACETS.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}
