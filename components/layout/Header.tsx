"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogoDark } from "@/components/brand/Logo";
import { Container } from "@/components/ui/Container";
import { cn } from "@/lib/cn";

const NAV = [
  { href: "/properties", label: "Properties" },
  { href: "/rentals", label: "Rentals" },
  { href: "/land", label: "Land" },
  { href: "/diaspora", label: "Diaspora" },
  { href: "/journal", label: "Journal" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

function isActive(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function Header() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <header className="sticky top-0 z-40 bg-paper/90 backdrop-blur border-b border-stone/30">
      <Container>
        <div className="flex h-16 items-center justify-between">
          <Link href="/" aria-label="Sunwealth Real Estate — home" className="-my-2">
            <LogoDark width={140} />
          </Link>

          <nav aria-label="Primary" className="hidden md:flex items-center gap-8">
            {NAV.map((item) => {
              const active = isActive(pathname, item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "text-sm text-ink hover:text-gold-deep transition-colors",
                    active && "border-b border-gold pb-1",
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <button
            type="button"
            className="md:hidden -mr-2 p-2 text-ink"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            aria-controls="mobile-nav"
            onClick={() => setOpen((v) => !v)}
          >
            <HamburgerIcon open={open} />
          </button>
        </div>
      </Container>

      <div
        id="mobile-nav"
        inert={open ? undefined : true}
        aria-hidden={!open}
        className={cn(
          "md:hidden border-t border-stone/30 bg-paper overflow-hidden",
          "motion-safe:transition-[max-height,opacity] motion-safe:duration-300",
          open ? "max-h-[80vh] opacity-100" : "max-h-0 opacity-0",
        )}
      >
        <Container>
          <nav aria-label="Mobile" className="flex flex-col py-4">
            {NAV.map((item) => {
              const active = isActive(pathname, item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  onClick={() => setOpen(false)}
                  className={cn(
                    "py-3 text-lg text-ink transition-colors",
                    active ? "text-gold-deep" : "hover:text-gold-deep",
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </Container>
      </div>
    </header>
  );
}

function HamburgerIcon({ open }: { open: boolean }) {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      aria-hidden="true"
    >
      {open ? (
        <>
          <line x1="6" y1="6" x2="18" y2="18" />
          <line x1="18" y1="6" x2="6" y2="18" />
        </>
      ) : (
        <>
          <line x1="4" y1="8" x2="20" y2="8" />
          <line x1="4" y1="16" x2="20" y2="16" />
        </>
      )}
    </svg>
  );
}
