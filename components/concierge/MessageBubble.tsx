"use client";

import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/cn";
import { formatNaira } from "@/lib/format";

export type MiniProperty = {
  slug: string;
  title: string;
  area: string;
  city: string;
  price: { amount: number; currency: string; basis: string };
  primaryImage: string;
};

export type ChatUiMessage =
  | { id: string; role: "user"; content: string }
  | { id: string; role: "assistant"; content: string; streaming?: boolean }
  | { id: string; role: "tool-card"; kind: "property-results"; properties: MiniProperty[] }
  | { id: string; role: "system"; kind: "escalation" | "guardrail"; content: string };

export function MessageBubble({ message }: { message: ChatUiMessage }) {
  if (message.role === "user") {
    return (
      <div className="flex justify-end">
        <div className="max-w-[85%] rounded-sm bg-sage px-3 py-2 text-sm text-paper whitespace-pre-wrap">
          {message.content}
        </div>
      </div>
    );
  }

  if (message.role === "assistant") {
    return (
      <div className="flex justify-start">
        <div
          className={cn(
            "max-w-[90%] rounded-sm bg-sand px-3 py-2 text-sm text-ink whitespace-pre-wrap",
            message.streaming && "opacity-95",
          )}
        >
          {renderAssistantText(message.content)}
          {message.streaming ? (
            <span
              aria-hidden="true"
              className="ml-0.5 inline-block h-3 w-1 animate-pulse bg-ink/60 align-middle"
            />
          ) : null}
        </div>
      </div>
    );
  }

  if (message.role === "tool-card" && message.kind === "property-results") {
    if (message.properties.length === 0) {
      return (
        <p className="text-xs italic text-stone">
          No matches for that search — want to try different criteria?
        </p>
      );
    }
    return (
      <div className="-mx-1 flex gap-2 overflow-x-auto pb-1">
        {message.properties.map((p) => (
          <MiniPropertyCard key={p.slug} p={p} />
        ))}
      </div>
    );
  }

  if (message.role === "system") {
    const tone =
      message.kind === "escalation"
        ? "border-gold bg-gold/10 text-ink"
        : "border-stone/40 bg-paper text-stone";
    return (
      <div
        role="status"
        className={cn(
          "rounded-sm border px-3 py-2 text-xs leading-relaxed",
          tone,
        )}
      >
        {message.content}
      </div>
    );
  }

  return null;
}

function MiniPropertyCard({ p }: { p: MiniProperty }) {
  return (
    <Link
      href={`/properties/${p.slug}`}
      target="_blank"
      rel="noreferrer"
      className="group block w-40 shrink-0 rounded-sm border border-stone/30 bg-paper overflow-hidden"
    >
      <div className="relative aspect-[4/3] bg-sand">
        {p.primaryImage ? (
          <Image
            src={p.primaryImage}
            alt={p.title}
            fill
            sizes="160px"
            className="object-cover"
          />
        ) : null}
      </div>
      <div className="flex flex-col gap-0.5 p-2">
        <p className="line-clamp-2 text-xs font-medium text-ink">{p.title}</p>
        <p className="truncate text-[11px] text-stone">{p.area}</p>
        <p className="font-mono text-xs text-ink tabular-nums">
          {formatNaira(p.price.amount)}
        </p>
      </div>
    </Link>
  );
}

// Very light markdown-ish rendering: bold + inline links. Anything else falls
// back to plain text. Keeps the widget small and injection-safe.
function renderAssistantText(text: string): React.ReactNode {
  const linkRe = /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g;
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let key = 0;

  for (const match of text.matchAll(linkRe)) {
    const start = match.index ?? 0;
    if (start > lastIndex) {
      parts.push(
        <span key={`t-${key++}`}>
          {renderBold(text.slice(lastIndex, start))}
        </span>,
      );
    }
    parts.push(
      <a
        key={`l-${key++}`}
        href={match[2]}
        target="_blank"
        rel="noreferrer"
        className="underline decoration-gold underline-offset-2"
      >
        {match[1]}
      </a>,
    );
    lastIndex = start + match[0].length;
  }
  if (lastIndex < text.length) {
    parts.push(
      <span key={`t-${key++}`}>{renderBold(text.slice(lastIndex))}</span>,
    );
  }

  return parts.length > 0 ? parts : renderBold(text);
}

function renderBold(text: string): React.ReactNode {
  const boldRe = /\*\*([^*]+)\*\*/g;
  const out: React.ReactNode[] = [];
  let lastIndex = 0;
  let key = 0;
  for (const match of text.matchAll(boldRe)) {
    const start = match.index ?? 0;
    if (start > lastIndex) {
      out.push(<span key={`p-${key++}`}>{text.slice(lastIndex, start)}</span>);
    }
    out.push(<strong key={`b-${key++}`}>{match[1]}</strong>);
    lastIndex = start + match[0].length;
  }
  if (lastIndex < text.length) {
    out.push(<span key={`p-${key++}`}>{text.slice(lastIndex)}</span>);
  }
  return out.length > 0 ? out : text;
}
