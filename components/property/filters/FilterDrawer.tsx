"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";

type Props = {
  children: React.ReactNode;
  triggerLabel?: string;
};

export function FilterDrawer({ children, triggerLabel = "Filters" }: Props) {
  const [open, setOpen] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const d = dialogRef.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);

  return (
    <>
      <Button variant="secondary" onClick={() => setOpen(true)}>
        {triggerLabel}
      </Button>
      <dialog
        ref={dialogRef}
        onClose={() => setOpen(false)}
        onClick={(e) => {
          if (e.target === dialogRef.current) setOpen(false);
        }}
        className={cn(
          "m-0 ml-auto h-dvh max-h-none w-full max-w-full bg-paper p-0",
          "sm:w-[420px]",
          "backdrop:bg-ink/50",
        )}
        aria-label="Filters"
      >
        {open ? (
          <div className="flex h-full flex-col">
            <div className="flex items-center justify-between border-b border-stone/30 p-4">
              <h2 className="font-display text-xl text-ink">Filters</h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close filters"
                className="p-2 text-ink transition-colors hover:text-gold-deep"
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  aria-hidden="true"
                >
                  <line x1="6" y1="6" x2="18" y2="18" />
                  <line x1="18" y1="6" x2="6" y2="18" />
                </svg>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">{children}</div>
            <div className="border-t border-stone/30 p-4">
              <Button fullWidth onClick={() => setOpen(false)}>
                View results
              </Button>
            </div>
          </div>
        ) : null}
      </dialog>
    </>
  );
}
