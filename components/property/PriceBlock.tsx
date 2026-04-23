import { formatNaira } from "@/lib/format";
import { priceBasisLabel } from "@/lib/property-format";
import { cn } from "@/lib/cn";
import type { Property } from "@/lib/types";

type PriceBlockSize = "sm" | "md" | "lg";

type PriceBlockProps = {
  price: Pick<Property["price"], "amount" | "basis">;
  size?: PriceBlockSize;
  className?: string;
};

const SIZES: Record<PriceBlockSize, { amount: string; basis: string }> = {
  sm: { amount: "text-lg", basis: "text-xs" },
  md: { amount: "text-2xl", basis: "text-sm" },
  lg: { amount: "text-4xl", basis: "text-base" },
};

export function PriceBlock({ price, size = "md", className }: PriceBlockProps) {
  const cls = SIZES[size];
  return (
    <div className={cn("flex flex-col gap-1", className)}>
      <p
        className={cn(
          "font-mono font-medium text-ink leading-tight",
          cls.amount,
        )}
      >
        {formatNaira(price.amount)}
      </p>
      <p className={cn("text-ink/50", cls.basis)}>{priceBasisLabel(price.basis)}</p>
    </div>
  );
}
