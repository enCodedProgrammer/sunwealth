"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { cn } from "@/lib/cn";

type Props = {
  children: ReactNode;
  className?: string;
  /** Delay in ms before the reveal animation starts after intersection */
  delay?: number;
  as?: "div" | "li" | "section" | "article";
};

export function AnimateIn({
  children,
  className,
  delay = 0,
  as: Tag = "div",
}: Props) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      el.classList.add("animate-visible");
      return;
    }

    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          const id = delay
            ? window.setTimeout(() => el.classList.add("animate-visible"), delay)
            : (el.classList.add("animate-visible"), undefined);
          obs.disconnect();
          return () => {
            if (id !== undefined) window.clearTimeout(id);
          };
        }
      },
      { threshold: 0.08, rootMargin: "0px 0px -40px 0px" },
    );

    obs.observe(el);
    return () => obs.disconnect();
  }, [delay]);

  return (
    // @ts-expect-error — ref assignment is safe for all supported tag values
    <Tag ref={ref} className={cn("animate-reveal", className)}>
      {children}
    </Tag>
  );
}
