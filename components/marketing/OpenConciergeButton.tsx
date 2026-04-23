"use client";

import { cn } from "@/lib/cn";

type Props = {
  children: React.ReactNode;
  className?: string;
  variant?: "primary" | "secondary" | "ghost";
  fullWidth?: boolean;
};

export function OpenConciergeButton({
  children,
  className,
  variant = "secondary",
  fullWidth = false,
}: Props) {
  const base =
    "inline-flex h-11 items-center justify-center gap-2 rounded-sm px-6 text-base font-medium transition-colors";
  const variants: Record<NonNullable<Props["variant"]>, string> = {
    primary: "bg-gold text-ink hover:bg-gold-deep",
    secondary: "bg-sage text-paper hover:opacity-90",
    ghost:
      "bg-transparent text-ink hover:text-gold-deep underline decoration-gold underline-offset-4",
  };

  return (
    <button
      type="button"
      onClick={() => {
        window.dispatchEvent(new CustomEvent("sunwealth:open-concierge"));
      }}
      className={cn(base, variants[variant], fullWidth && "w-full", className)}
    >
      {children}
    </button>
  );
}
