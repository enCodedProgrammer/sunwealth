"use client";

type Props = { src: string };

export function CalEmbed({ src }: Props) {
  return (
    <iframe
      src={src}
      title="Book an inspection"
      className="w-full rounded-sm border-0"
      style={{ minHeight: "700px" }}
      allow="payment"
      loading="lazy"
    />
  );
}
