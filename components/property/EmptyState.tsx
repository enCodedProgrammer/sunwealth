"use client";

import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/Button";

export function EmptyState() {
  const sp = useSearchParams();

  function askConcierge() {
    window.dispatchEvent(
      new CustomEvent("sunwealth:open-concierge", {
        detail: { filters: Object.fromEntries(sp.entries()) },
      }),
    );
  }

  return (
    <div className="flex flex-col items-start gap-4 rounded-sm border border-sand bg-sand/40 p-8">
      <h3 className="font-display text-2xl text-ink">
        No properties match those filters.
      </h3>
      <p className="max-w-lg text-ink/70">
        Try widening the price range, or ask our AI concierge to find something
        similar.
      </p>
      <Button variant="secondary" onClick={askConcierge}>
        Ask the concierge →
      </Button>
    </div>
  );
}
