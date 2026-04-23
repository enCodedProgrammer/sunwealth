import "server-only";
import { createAdminClient } from "../db/admin";
import type { DocumentType } from "../types";

// =====================================================================
// Types shared with the concierge loop
// =====================================================================

export type InputGuardrailResult =
  | { allowed: true }
  | {
      allowed: false;
      reason: "injection" | "rate-limit-session" | "rate-limit-ip";
      replacement: string;
      captchaRequired?: boolean;
    };

export type OutputGuardrailResult =
  | { ok: true }
  | {
      ok: false;
      kind: "unverified-price" | "unverified-document" | "negotiation" | "legal-advice";
      replacement?: string;
      forceEscalate?: boolean;
      reason: string;
    };

// Shape of what tool outputs look like to the guardrails. We only care about
// prices and documents — those are the only claims the output guardrail checks.
export type ToolResultSnapshot = {
  prices: number[]; // NGN amounts
  documents: Record<string /* slug */, DocumentType[]>;
  slugs: string[];
};

// =====================================================================
// Input guardrails
// =====================================================================

const INJECTION_PATTERNS: RegExp[] = [
  /ignore (?:all |any |the )?(?:previous|prior|above) (?:instructions|messages|rules|prompts?)/i,
  /disregard (?:the|your) (?:rules|instructions|system prompt)/i,
  /\byou are now\b/i,
  /\bsystem prompt\b/i,
  /\bjailbreak\b/i,
  /\bdev(?:eloper)? mode\b/i,
  /pretend (?:you are|to be) (?:a|an|the)/i,
  /\bDAN\b(?: mode)?/i,
  /reveal (?:your|the) (?:system )?prompt/i,
];

export async function runInputGuardrails(opts: {
  text: string;
  sessionId: string;
  ip: string;
  conversationId?: string;
}): Promise<InputGuardrailResult> {
  const { text, sessionId, ip, conversationId } = opts;

  // 1. Injection filter
  for (const pattern of INJECTION_PATTERNS) {
    if (pattern.test(text)) {
      await logGuardrail({
        kind: "injection",
        conversationId,
        sessionId,
        payload: { pattern: pattern.source, snippet: text.slice(0, 200) },
      });
      return {
        allowed: false,
        reason: "injection",
        replacement:
          "I can only help with property questions — what are you looking for?",
      };
    }
  }

  // 2. Rate limits
  const sessionCount = await bumpRateLimit(`session:${sessionId}`, 3600);
  if (sessionCount > 30) {
    await logGuardrail({
      kind: "rate-limit-session",
      conversationId,
      sessionId,
      payload: { count: sessionCount },
    });
    return {
      allowed: false,
      reason: "rate-limit-session",
      replacement: "Taking a breath — please try again in a few minutes.",
      captchaRequired: true,
    };
  }

  // IP-based new-session rate limit: only counted when a conversation is fresh
  if (!conversationId) {
    const ipCount = await bumpRateLimit(`ip:${ip}:session-create`, 3600);
    if (ipCount > 5) {
      await logGuardrail({
        kind: "rate-limit-ip",
        conversationId,
        sessionId,
        payload: { ip, count: ipCount },
      });
      return {
        allowed: false,
        reason: "rate-limit-ip",
        replacement: "Too many new sessions from this network — try again shortly.",
        captchaRequired: true,
      };
    }
  }

  return { allowed: true };
}

async function bumpRateLimit(key: string, windowSeconds: number): Promise<number> {
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase.rpc("bump_rate_limit", {
      p_key: key,
      p_window_seconds: windowSeconds,
    });
    if (error) {
      console.warn("bump_rate_limit RPC failed:", error.message);
      return 0; // fail-open — don't block users on infra error
    }
    return Number(data) || 0;
  } catch (e) {
    console.warn("bump_rate_limit threw:", e);
    return 0;
  }
}

// =====================================================================
// PII redaction (for logs only — the raw text still goes to the model)
// =====================================================================

// Nigerian BVN/NIN are both 11-digit numeric. We redact any bare 11-digit run,
// and any 13–19 digit run (card-number range) that passes a Luhn check.
const ELEVEN_DIGIT_RE = /\b\d{11}\b/g;
const CARD_CANDIDATE_RE = /\b\d{13,19}\b/g;
const EMAIL_RE = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g;
const NG_PHONE_RE = /\b(?:\+?234|0)[7-9][01]\d{8}\b/g;

function luhn(num: string): boolean {
  let sum = 0;
  let shouldDouble = false;
  for (let i = num.length - 1; i >= 0; i--) {
    let d = num.charCodeAt(i) - 48;
    if (d < 0 || d > 9) return false;
    if (shouldDouble) {
      d *= 2;
      if (d > 9) d -= 9;
    }
    sum += d;
    shouldDouble = !shouldDouble;
  }
  return sum % 10 === 0;
}

export function redactForStorage(text: string): string {
  return text
    .replace(CARD_CANDIDATE_RE, (m) => (luhn(m) ? "[redacted-card]" : m))
    .replace(ELEVEN_DIGIT_RE, "[redacted-id]")
    .replace(EMAIL_RE, "[redacted-email]")
    .replace(NG_PHONE_RE, "[redacted-phone]");
}

// =====================================================================
// Output guardrails
// =====================================================================

const NEGOTIATION_RE =
  /\b(?:discount|lower (?:the )?price|knock (?:it )?off|come down|negotiate|negotiable|best price|final price|reduce(?:d)? (?:by|to)|settle for|drop the price|give it to (?:you|me) for)\b/i;

const LEGAL_ADVICE_RE =
  /\b(?:you should (?:structure|set up|register|incorporate)|tax[- ]wise|legally you (?:can|should|must|may)|inheritance (?:tax|planning)|for tax purposes)\b/i;

// Matches "₦850,000,000", "850m", "850 million", "2.5bn", "N200,000".
const PRICE_RE =
  /(?:₦|\bN(?=\s?\d)|NGN\s*)\s*([\d,]+(?:\.\d+)?)\s*(?:(m|mn|million|bn|billion|k))?|([\d,]+(?:\.\d+)?)\s*(million|billion|m|mn|bn)\b/gi;

const DOC_TYPES: { name: DocumentType; pattern: RegExp }[] = [
  { name: "C of O", pattern: /\b(?:c\s*of\s*o|certificate of occupancy)\b/i },
  { name: "Governor's Consent", pattern: /\bgovernor'?s? consent\b/i },
  { name: "Deed of Assignment", pattern: /\bdeed of assignment\b/i },
  { name: "Registered Survey", pattern: /\bregistered survey\b/i },
  { name: "Building Approval", pattern: /\bbuilding approval\b/i },
  { name: "Excision", pattern: /\bexcision\b/i },
];

function parsePriceToken(
  numStr: string | undefined,
  suffix: string | undefined,
): number | null {
  if (!numStr) return null;
  const base = Number(numStr.replace(/,/g, ""));
  if (!Number.isFinite(base)) return null;
  if (!suffix) return base;
  const s = suffix.toLowerCase();
  if (s === "k") return base * 1_000;
  if (s === "m" || s === "mn" || s === "million") return base * 1_000_000;
  if (s === "bn" || s === "billion") return base * 1_000_000_000;
  return base;
}

function extractPrices(text: string): number[] {
  const hits: number[] = [];
  for (const m of text.matchAll(PRICE_RE)) {
    const price = parsePriceToken(m[1] ?? m[3], m[2] ?? m[4]);
    if (price !== null && price > 0) hits.push(price);
  }
  return hits;
}

function priceMatchesKnown(claimed: number, known: number[]): boolean {
  // Allow 1% tolerance for rounded phrasing ("850 million" vs ₦850,000,000).
  return known.some((k) => Math.abs(k - claimed) / k <= 0.01);
}

export function runOutputGuardrails(
  response: string,
  snapshot: ToolResultSnapshot,
): OutputGuardrailResult {
  // 1. Negotiation — hard escalate.
  if (NEGOTIATION_RE.test(response)) {
    return {
      ok: false,
      kind: "negotiation",
      forceEscalate: true,
      reason: "response contained negotiation language",
      replacement:
        "Price negotiations happen with a senior agent — I'll set that up. One moment.",
    };
  }

  // 2. Legal advice — hard escalate.
  if (LEGAL_ADVICE_RE.test(response)) {
    return {
      ok: false,
      kind: "legal-advice",
      forceEscalate: true,
      reason: "response contained legal/tax advice",
      replacement:
        "This needs a qualified lawyer — I'll connect you with one of our legal partners.",
    };
  }

  // 3. Price assertion — every price mentioned must appear in tool results.
  const claimedPrices = extractPrices(response);
  const unverified = claimedPrices.filter((p) => !priceMatchesKnown(p, snapshot.prices));
  if (unverified.length > 0) {
    return {
      ok: false,
      kind: "unverified-price",
      reason: `unverified price(s): ${unverified.join(", ")}`,
      replacement: "Let me double-check that price for you — one moment.",
    };
  }

  // 4. Document claim — every document type mentioned must be in some tool result.
  const allKnownDocs = new Set<string>();
  for (const docs of Object.values(snapshot.documents)) {
    for (const d of docs) allKnownDocs.add(d);
  }
  for (const doc of DOC_TYPES) {
    if (doc.pattern.test(response) && !allKnownDocs.has(doc.name)) {
      return {
        ok: false,
        kind: "unverified-document",
        reason: `response claims "${doc.name}" but no tool result lists it`,
        replacement:
          "Let me double-check the title documents on that property — one moment.",
      };
    }
  }

  return { ok: true };
}

// =====================================================================
// Observability
// =====================================================================

type GuardrailKind =
  | "injection"
  | "rate-limit-session"
  | "rate-limit-ip"
  | "unverified-price"
  | "unverified-document"
  | "negotiation"
  | "legal-advice";

async function logGuardrail(opts: {
  kind: GuardrailKind;
  conversationId?: string;
  sessionId: string;
  payload: Record<string, unknown>;
}): Promise<void> {
  try {
    const supabase = createAdminClient();
    await supabase.from("ai_events").insert({
      kind: "ai_guardrail_trigger",
      conversation_id: opts.conversationId ?? null,
      session_id: opts.sessionId,
      payload: { guardrail: opts.kind, ...opts.payload },
    });
  } catch (e) {
    console.warn("logGuardrail failed:", e);
  }
}

export async function logOutputGuardrail(opts: {
  kind: GuardrailKind;
  conversationId?: string;
  sessionId: string;
  payload: Record<string, unknown>;
}): Promise<void> {
  return logGuardrail(opts);
}
