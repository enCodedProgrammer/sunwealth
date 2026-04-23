"use client";

import { Button } from "@/components/ui/Button";
import type { Property } from "@/lib/types";

type Props = {
  property: Pick<Property, "id" | "slug" | "title">;
  className?: string;
};

// The concierge widget is wired in a later session. Until then this dispatches
// a window event that the widget will subscribe to.
export function AskConciergeButton({ property, className }: Props) {
  return (
    <Button
      variant="secondary"
      fullWidth
      className={className}
      onClick={() => {
        window.dispatchEvent(
          new CustomEvent("sunwealth:open-concierge", {
            detail: {
              propertyId: property.id,
              slug: property.slug,
              title: property.title,
            },
          }),
        );
      }}
    >
      Ask the concierge about this property
    </Button>
  );
}
