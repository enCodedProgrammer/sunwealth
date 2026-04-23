import { cn } from "@/lib/cn";

type ContainerElement =
  | "div"
  | "section"
  | "main"
  | "article"
  | "header"
  | "footer";

type ContainerProps = React.ComponentPropsWithoutRef<"div"> & {
  as?: ContainerElement;
};

export function Container({
  as: Tag = "div",
  className,
  children,
  ...rest
}: ContainerProps) {
  return (
    <Tag
      className={cn(
        "mx-auto w-full max-w-[1280px] px-6 md:px-12 lg:px-20",
        className,
      )}
      {...rest}
    >
      {children}
    </Tag>
  );
}
