import { cn } from "@/lib/cn";

// Suggested mapping (caller chooses tone — Badge stays domain-agnostic):
//   Available     → "sage"
//   Under Offer   → "gold"
//   Sold          → "ember"
//   Let           → "sage"
//   Document type → "stone" or "sand"

type BadgeTone = "gold" | "sage" | "ember" | "stone" | "sand";
type BadgeSize = "sm" | "md";

type BadgeProps = React.ComponentPropsWithoutRef<"span"> & {
  tone?: BadgeTone;
  size?: BadgeSize;
};

const TONES: Record<BadgeTone, string> = {
  gold: "bg-gold text-ink",
  sage: "bg-sage text-paper",
  ember: "bg-ember text-paper",
  stone: "bg-stone/25 text-ink",
  sand: "bg-sand text-ink border border-stone/40",
};

const SIZES: Record<BadgeSize, string> = {
  sm: "px-2.5 py-0.5 text-xs",
  md: "px-3 py-1 text-sm",
};

export function Badge({
  tone = "stone",
  size = "sm",
  className,
  children,
  ...rest
}: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full font-medium uppercase tracking-wide",
        TONES[tone],
        SIZES[size],
        className,
      )}
      {...rest}
    >
      {children}
    </span>
  );
}
