"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { cn } from "@/lib/cn";
import type { JournalCategory } from "@/lib/journal";

type Props = {
  categories: JournalCategory[];
};

export function CategoryFilter({ categories }: Props) {
  const searchParams = useSearchParams();
  const current = searchParams.get("category");

  function hrefFor(category: string | null): string {
    if (!category) return "/journal";
    const params = new URLSearchParams();
    params.set("category", category);
    return `/journal?${params.toString()}`;
  }

  return (
    <nav
      aria-label="Filter articles by category"
      className="flex flex-wrap gap-2"
    >
      <FilterLink
        label="All"
        href={hrefFor(null)}
        active={current === null}
      />
      {categories.map((c) => (
        <FilterLink
          key={c}
          label={c}
          href={hrefFor(c)}
          active={current === c}
        />
      ))}
    </nav>
  );
}

function FilterLink({
  label,
  href,
  active,
}: {
  label: string;
  href: string;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "rounded-sm border px-3 py-1.5 text-xs uppercase tracking-widest transition-colors",
        active
          ? "border-gold bg-gold text-ink"
          : "border-stone/40 text-ink hover:border-gold",
      )}
    >
      {label}
    </Link>
  );
}
