import { cn } from "@/lib/cn";

type CardElement = "article" | "div" | "section";

type CardProps = React.ComponentPropsWithoutRef<"article"> & {
  as?: CardElement;
};

export function Card({
  as: Tag = "article",
  className,
  children,
  ...rest
}: CardProps) {
  return (
    <Tag
      className={cn(
        "bg-sand border border-stone/40 rounded-sm overflow-hidden",
        "transition-transform duration-200 motion-safe:hover:-translate-y-0.5",
        className,
      )}
      {...rest}
    >
      {children}
    </Tag>
  );
}
