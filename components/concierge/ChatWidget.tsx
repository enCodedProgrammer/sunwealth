"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/cn";
import { MessageBubble, type ChatUiMessage, type MiniProperty } from "./MessageBubble";

const SESSION_KEY = "sunwealth:concierge:sessionId";
const TRANSCRIPT_KEY = "sunwealth:concierge:transcript";
const ESCALATED_KEY = "sunwealth:concierge:escalated";

type OpenConciergeDetail = {
  slug?: string;
  title?: string;
  propertyId?: string;
};

export function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatUiMessage[]>(() =>
    readInitialMessages(),
  );
  const [draft, setDraft] = useState("");
  const [pending, setPending] = useState(false);
  const [toolPhase, setToolPhase] = useState<string | null>(null);
  const [escalated, setEscalated] = useState<boolean>(() =>
    readInitialEscalated(),
  );
  const [clientContext, setClientContext] = useState<
    { propertySlug?: string; propertyTitle?: string } | undefined
  >();

  const inputRef = useRef<HTMLTextAreaElement | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const sessionId = useMemo(() => resolveSessionId(), []);

  // Persist transcript.
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      sessionStorage.setItem(TRANSCRIPT_KEY, JSON.stringify(messages));
    } catch {
      // storage full — fail quietly
    }
  }, [messages]);

  // Listen for the "open concierge" window event from product cards etc.
  useEffect(() => {
    function onOpen(e: Event) {
      const detail = (e as CustomEvent<OpenConciergeDetail>).detail;
      setIsOpen(true);
      if (detail?.slug) {
        setClientContext({ propertySlug: detail.slug, propertyTitle: detail.title });
        // Pre-fill but do NOT auto-send — user must press enter.
        setDraft(
          detail.title
            ? `I'm interested in ${detail.title} — can you tell me more?`
            : "I'm interested in this property — can you tell me more?",
        );
        // Focus after mount paints.
        setTimeout(() => inputRef.current?.focus(), 60);
      }
    }
    window.addEventListener("sunwealth:open-concierge", onOpen as EventListener);
    return () => {
      window.removeEventListener(
        "sunwealth:open-concierge",
        onOpen as EventListener,
      );
    };
  }, []);

  // Autoscroll on new content.
  useEffect(() => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, toolPhase, pending]);

  // Escape closes.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setIsOpen(false);
    }
    if (isOpen) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen]);

  const handleEvent = useCallback(
    (
      ev: {
        type?: string;
        text?: string;
        toolName?: string;
        friendly?: string;
        output?: unknown;
        agentName?: string;
        message?: string;
      },
      assistantId: string,
    ) => {
      switch (ev.type) {
        case "token": {
          if (!ev.text) return;
          setToolPhase(null);
          setMessages((prev) =>
            upsertAssistant(prev, assistantId, (m) => ({
              ...m,
              content: m.content + ev.text,
              streaming: true,
            })),
          );
          return;
        }
        case "tool_start": {
          setToolPhase(ev.friendly ?? "Working on that…");
          return;
        }
        case "tool_end": {
          if (ev.toolName === "search_properties") {
            const out = ev.output as { results?: unknown[] } | null | undefined;
            const rawResults = Array.isArray(out?.results) ? out!.results : [];
            const miniProps: MiniProperty[] = rawResults
              .map((r) => toMiniProperty(r))
              .filter((r): r is MiniProperty => r !== null);
            if (miniProps.length > 0) {
              setMessages((prev) => [
                ...prev,
                {
                  id: crypto.randomUUID(),
                  role: "tool-card",
                  kind: "property-results",
                  properties: miniProps,
                },
              ]);
            }
          }
          setToolPhase(null);
          return;
        }
        case "guardrail": {
          if (ev.message) {
            setMessages((prev) =>
              upsertAssistant(prev, assistantId, (m) => ({
                ...m,
                content: ev.message ?? m.content,
                streaming: false,
              })),
            );
          }
          return;
        }
        case "escalated": {
          setEscalated(true);
          try {
            sessionStorage.setItem(ESCALATED_KEY, "1");
          } catch {
            // ignore
          }
          setMessages((prev) => [
            ...upsertAssistant(prev, assistantId, (m) => ({
              ...m,
              streaming: false,
            })),
            {
              id: crypto.randomUUID(),
              role: "system",
              kind: "escalation",
              content: `You're being handed over to ${ev.agentName ?? "a senior agent"}. They'll message you on WhatsApp within 15 minutes.`,
            },
          ]);
          return;
        }
        case "done": {
          setMessages((prev) =>
            upsertAssistant(prev, assistantId, (m) => ({
              ...m,
              streaming: false,
            })),
          );
          return;
        }
        case "error": {
          setMessages((prev) =>
            upsertAssistant(prev, assistantId, (m) => ({
              ...m,
              content: ev.message ?? "Something went wrong. Please try again.",
              streaming: false,
            })),
          );
          return;
        }
      }
    },
    [],
  );

  const send = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || pending || escalated) return;

      const userMsg: ChatUiMessage = {
        id: crypto.randomUUID(),
        role: "user",
        content: trimmed,
      };
      const assistantId = crypto.randomUUID();
      const assistantMsg: ChatUiMessage = {
        id: assistantId,
        role: "assistant",
        content: "",
        streaming: true,
      };

      setMessages((prev) => [...prev, userMsg, assistantMsg]);
      setDraft("");
      setPending(true);
      setToolPhase(null);

      const ctrl = new AbortController();
      abortRef.current = ctrl;

      try {
        const res = await fetch("/api/concierge/stream", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            sessionId,
            message: trimmed,
            clientContext,
          }),
          signal: ctrl.signal,
        });

        if (!res.ok || !res.body) {
          throw new Error(`request failed (${res.status})`);
        }

        const reader = res.body
          .pipeThrough(new TextDecoderStream())
          .getReader();

        let buffer = "";
        let lastEventName = "";

        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          buffer += value;

          let idx: number;
          while ((idx = buffer.indexOf("\n\n")) !== -1) {
            const frame = buffer.slice(0, idx);
            buffer = buffer.slice(idx + 2);

            let eventName = "";
            let dataLine = "";
            for (const line of frame.split("\n")) {
              if (line.startsWith("event: ")) eventName = line.slice(7).trim();
              else if (line.startsWith("data: ")) dataLine += line.slice(6);
            }
            if (!dataLine) continue;
            lastEventName = eventName;

            let parsed: {
              type?: string;
              text?: string;
              toolName?: string;
              friendly?: string;
              output?: unknown;
              agentName?: string;
              message?: string;
            };
            try {
              parsed = JSON.parse(dataLine);
            } catch {
              continue;
            }

            handleEvent(parsed, assistantId);
          }
        }
        void lastEventName;
      } catch (err) {
        if ((err as { name?: string }).name === "AbortError") return;
        console.error("concierge stream error", err);
        setMessages((prev) =>
          upsertAssistant(prev, assistantId, (m) => ({
            ...m,
            content:
              m.content ||
              "Something went wrong on our side — please try again in a moment.",
            streaming: false,
          })),
        );
      } finally {
        setPending(false);
        setToolPhase(null);
        abortRef.current = null;
      }
    },
    [clientContext, escalated, handleEvent, pending, sessionId],
  );

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    void send(draft);
  }

  return (
    <>
      {/* Launcher */}
      {!isOpen ? (
        <button
          type="button"
          aria-label="Open the Sunwealth concierge"
          onClick={() => setIsOpen(true)}
          className={cn(
            "fixed bottom-5 right-5 z-40 h-14 w-14 rounded-full bg-ink text-paper shadow-lg",
            "flex items-center justify-center transition-transform hover:scale-105",
            "focus-visible:outline focus-visible:outline-2 focus-visible:outline-gold",
          )}
        >
          <ConciergeIcon />
        </button>
      ) : null}

      {/* Panel */}
      {isOpen ? (
        <div
          role="dialog"
          aria-label="Sunwealth concierge"
          className={cn(
            "fixed z-50 bg-paper border border-stone/40 shadow-xl flex flex-col",
            // Desktop
            "sm:bottom-5 sm:right-5 sm:h-[580px] sm:w-[380px] sm:rounded-sm",
            // Mobile full-screen
            "inset-0 sm:inset-auto",
          )}
        >
          <header className="flex items-center justify-between border-b border-stone/30 px-4 py-3">
            <div className="flex flex-col">
              <p className="font-display text-base text-ink">Sunwealth Concierge</p>
              <p className="text-[11px] text-stone">
                {escalated
                  ? "Handed over to a senior agent"
                  : "AI assistant — connects you to our team when needed"}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              aria-label="Close concierge"
              className="rounded-sm p-1 text-stone hover:text-ink"
            >
              <CloseIcon />
            </button>
          </header>

          <div
            ref={scrollRef}
            className="flex-1 overflow-y-auto px-3 py-3 flex flex-col gap-2"
          >
            {messages.length === 0 ? (
              <Greeting />
            ) : (
              messages.map((m) => <MessageBubble key={m.id} message={m} />)
            )}
            {pending && toolPhase ? (
              <p className="text-xs italic text-stone">{toolPhase}</p>
            ) : pending && !hasStreamingAssistant(messages) ? (
              <TypingDots />
            ) : null}
          </div>

          <form
            onSubmit={onSubmit}
            className="border-t border-stone/30 p-2"
          >
            <div className="flex items-end gap-2">
              <textarea
                ref={inputRef}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    void send(draft);
                  }
                }}
                disabled={escalated || pending}
                rows={1}
                placeholder={
                  escalated
                    ? "A senior agent will message you on WhatsApp"
                    : "Ask about a property, area, or the buying process…"
                }
                className={cn(
                  "flex-1 resize-none rounded-sm border border-stone/40 bg-paper px-3 py-2 text-sm",
                  "focus:border-gold focus:outline-none",
                  "disabled:bg-sand/60 disabled:cursor-not-allowed",
                )}
              />
              <button
                type="submit"
                disabled={escalated || pending || !draft.trim()}
                className={cn(
                  "h-9 shrink-0 rounded-sm bg-ink px-3 text-xs font-medium text-paper",
                  "disabled:opacity-50 disabled:cursor-not-allowed",
                )}
              >
                Send
              </button>
            </div>
            <p className="mt-1 text-[10px] text-stone">
              {"British English · won't discuss payment or negotiate · links to human agents"}
            </p>
          </form>
        </div>
      ) : null}
    </>
  );
}

function Greeting() {
  return (
    <div className="rounded-sm bg-sand px-3 py-3 text-sm text-ink">
      <p className="font-medium">Welcome to Sunwealth.</p>
      <p className="mt-1 text-stone">
        {"I can match you to verified homes, rentals and land in Lagos, and walk you through our buying process — especially if you're abroad. What are you looking for?"}
      </p>
    </div>
  );
}

function TypingDots() {
  return (
    <div className="flex items-center gap-1 px-2" aria-label="Concierge is typing">
      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-stone" />
      <span
        className="h-1.5 w-1.5 animate-pulse rounded-full bg-stone"
        style={{ animationDelay: "120ms" }}
      />
      <span
        className="h-1.5 w-1.5 animate-pulse rounded-full bg-stone"
        style={{ animationDelay: "240ms" }}
      />
    </div>
  );
}

function ConciergeIcon() {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M4 19a4 4 0 0 1 4-4h8a4 4 0 0 1 4 4v1H4v-1z" />
      <circle cx="12" cy="8" r="3.5" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  );
}

// =====================================================================
// Helpers
// =====================================================================

function readInitialMessages(): ChatUiMessage[] {
  if (typeof window === "undefined") return [];
  try {
    const saved = sessionStorage.getItem(TRANSCRIPT_KEY);
    if (!saved) return [];
    const parsed = JSON.parse(saved) as ChatUiMessage[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function readInitialEscalated(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return sessionStorage.getItem(ESCALATED_KEY) === "1";
  } catch {
    return false;
  }
}

function resolveSessionId(): string {
  if (typeof window === "undefined") return "";
  try {
    const existing = sessionStorage.getItem(SESSION_KEY);
    if (existing) return existing;
    const id = crypto.randomUUID();
    sessionStorage.setItem(SESSION_KEY, id);
    return id;
  } catch {
    return crypto.randomUUID();
  }
}

function upsertAssistant(
  prev: ChatUiMessage[],
  id: string,
  patch: (m: Extract<ChatUiMessage, { role: "assistant" }>) => Extract<
    ChatUiMessage,
    { role: "assistant" }
  >,
): ChatUiMessage[] {
  return prev.map((m) => {
    if (m.role === "assistant" && m.id === id) return patch(m);
    return m;
  });
}

function hasStreamingAssistant(messages: ChatUiMessage[]): boolean {
  const last = messages[messages.length - 1];
  return !!last && last.role === "assistant" && !!last.content;
}

function toMiniProperty(raw: unknown): MiniProperty | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as {
    slug?: string;
    title?: string;
    area?: string;
    city?: string;
    price?: { amount?: number; currency?: string; basis?: string };
    primaryImage?: string;
  };
  if (!r.slug || !r.title || !r.price?.amount) return null;
  return {
    slug: r.slug,
    title: r.title,
    area: r.area ?? "",
    city: r.city ?? "Lagos",
    price: {
      amount: r.price.amount,
      currency: r.price.currency ?? "NGN",
      basis: r.price.basis ?? "outright",
    },
    primaryImage: r.primaryImage ?? "",
  };
}
