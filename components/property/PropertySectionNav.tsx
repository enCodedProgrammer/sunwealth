"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/cn";

type Section = { id: string; label: string };

export function PropertySectionNav({ sections }: { sections: Section[] }) {
  const [active, setActive] = useState(sections[0]?.id ?? "");

  useEffect(() => {
    const els = sections
      .map(({ id }) => document.getElementById(id))
      .filter((el): el is HTMLElement => el !== null);

    const obs = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActive(entry.target.id);
            break;
          }
        }
      },
      { rootMargin: "-15% 0px -70% 0px", threshold: 0 },
    );

    els.forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, [sections]);

  return (
    <nav
      aria-label="Property sections"
      className="sticky top-16 z-10 -mx-4 overflow-x-auto border-b border-sand bg-paper/95 backdrop-blur-sm"
    >
      <ul className="flex min-w-max items-center gap-1 px-4">
        {sections.map((s) => {
          const isActive = s.id === active;
          return (
            <li key={s.id}>
              <a
                href={`#${s.id}`}
                className={cn(
                  "inline-block border-b-2 px-4 py-3.5 text-sm transition-colors duration-150",
                  isActive
                    ? "border-gold font-medium text-ink"
                    : "border-transparent text-ink/50 hover:text-ink",
                )}
              >
                {s.label}
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
