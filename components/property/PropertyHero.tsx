"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/cn";
import type { Property } from "@/lib/types";

type PropertyHeroProps = {
  images: Property["images"];
  title: string;
};

export function PropertyHero({ images, title }: PropertyHeroProps) {
  const [open, setOpen] = useState(false);
  const [index, setIndex] = useState(0);
  const dialogRef = useRef<HTMLDialogElement>(null);

  const showPrev = useCallback(() => {
    setIndex((i) => (i - 1 + images.length) % images.length);
  }, [images.length]);

  const showNext = useCallback(() => {
    setIndex((i) => (i + 1) % images.length);
  }, [images.length]);

  useEffect(() => {
    const d = dialogRef.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") showNext();
      if (e.key === "ArrowLeft") showPrev();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, showNext, showPrev]);

  const openAt = (i: number) => {
    setIndex(i);
    setOpen(true);
  };

  if (images.length === 0) {
    return (
      <div
        className="aspect-[16/9] w-full rounded-sm bg-sand"
        role="img"
        aria-label={`No images available for ${title}`}
      />
    );
  }

  const [primary, ...rest] = images;

  return (
    <div>
      <button
        type="button"
        onClick={() => openAt(0)}
        className="relative block aspect-[16/9] w-full overflow-hidden rounded-sm bg-sand"
        aria-label={`Open gallery starting with: ${primary.alt}`}
      >
        <Image
          src={primary.src}
          alt={primary.alt}
          fill
          priority
          sizes="(min-width: 1024px) 67vw, 100vw"
          className="object-cover motion-safe:transition-transform motion-safe:duration-700 motion-safe:hover:scale-[1.02]"
        />
      </button>

      {rest.length > 0 ? (
        <div className="mt-2 grid grid-cols-4 gap-2">
          {rest.slice(0, 4).map((img, i) => {
            const isOverflow = i === 3 && rest.length > 4;
            return (
              <button
                key={img.src}
                type="button"
                onClick={() => openAt(i + 1)}
                className="relative aspect-[4/3] overflow-hidden rounded-sm bg-sand"
                aria-label={
                  isOverflow
                    ? `View all ${images.length} images`
                    : `Open image: ${img.alt}`
                }
              >
                <Image
                  src={img.src}
                  alt={img.alt}
                  fill
                  sizes="(min-width: 1024px) 17vw, 25vw"
                  className="object-cover"
                />
                {isOverflow ? (
                  <div className="absolute inset-0 flex items-center justify-center bg-ink/60">
                    <span className="font-mono font-medium text-paper">
                      +{rest.length - 4}
                    </span>
                  </div>
                ) : null}
              </button>
            );
          })}
        </div>
      ) : null}

      <dialog
        ref={dialogRef}
        onClose={() => setOpen(false)}
        onClick={(e) => {
          if (e.target === dialogRef.current) setOpen(false);
        }}
        className={cn(
          "m-0 h-dvh w-dvw max-h-none max-w-none bg-ink p-0 text-paper",
          "backdrop:bg-ink/90",
        )}
        aria-label={`${title} — image gallery`}
      >
        {open ? (
          <div className="flex h-full w-full flex-col">
            <div className="flex items-center justify-between p-4">
              <p className="font-mono text-sm text-paper/80">
                {index + 1} / {images.length}
              </p>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close gallery"
                className="p-2 text-paper transition-colors hover:text-gold"
              >
                <CloseIcon />
              </button>
            </div>

            <div className="relative flex-1">
              <Image
                key={images[index].src}
                src={images[index].src}
                alt={images[index].alt}
                fill
                sizes="100vw"
                className="object-contain"
              />
              {images.length > 1 ? (
                <>
                  <GalleryNav side="left" onClick={showPrev} />
                  <GalleryNav side="right" onClick={showNext} />
                </>
              ) : null}
            </div>

            <p className="p-4 text-sm text-paper/70">{images[index].alt}</p>
          </div>
        ) : null}
      </dialog>
    </div>
  );
}

function GalleryNav({
  side,
  onClick,
}: {
  side: "left" | "right";
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={side === "left" ? "Previous image" : "Next image"}
      className={cn(
        "absolute top-1/2 -translate-y-1/2 rounded-full bg-ink/60 p-3 text-paper transition-colors hover:bg-ink/80",
        side === "left" ? "left-4" : "right-4",
      )}
    >
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        {side === "left" ? (
          <polyline points="15 18 9 12 15 6" />
        ) : (
          <polyline points="9 18 15 12 9 6" />
        )}
      </svg>
    </button>
  );
}

function CloseIcon() {
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
      <line x1="6" y1="6" x2="18" y2="18" />
      <line x1="18" y1="6" x2="6" y2="18" />
    </svg>
  );
}
