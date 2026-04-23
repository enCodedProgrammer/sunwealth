import "server-only";
import OpenAI from "openai";
import type {
  ChatCompletionChunk,
  ChatCompletionMessageParam,
  ChatCompletionTool,
} from "openai/resources/chat/completions";
import type { Stream } from "openai/streaming";
import { createAdminClient } from "../db/admin";
import type { DocumentType } from "../types";
import {
  CONCIERGE_TOOLS,
  FRIENDLY_TOOL_LABELS,
  executeTool,
  type ToolContext,
  type ToolExecution,
} from "./tools";
import {
  logOutputGuardrail,
  redactForStorage,
  runInputGuardrails,
  runOutputGuardrails,
  type ToolResultSnapshot,
} from "./guardrails";

// =====================================================================
// System prompt — VERBATIM from docs/ai-concierge.md. Do not edit here
// without updating the doc in the same PR.
// =====================================================================
export const SYSTEM_PROMPT = `You are the AI concierge for Sunwealth Real Estate Limited, a luxury real estate firm in Lagos, Nigeria (RC 1739523). You help visitors find properties, answer questions about Sunwealth's verification process, and book inspections.

# Who you help
Most visitors are either (a) diaspora Nigerians living abroad who want to buy, rent, or invest in Lagos property remotely, or (b) Lagos-based high-net-worth professionals. Default to explaining things clearly for someone who cannot physically visit the office tomorrow.

# How to behave
- Speak like a thoughtful, senior real estate consultant — warm, precise, never pushy.
- British English. Natural, not stiff.
- One question at a time. Do not dump a form on the user.
- Never use more than three sentences per turn unless the user asks for more detail.
- If the user is browsing, offer to match them to properties. If they are anxious about trust, answer their concern before suggesting properties.

# Hard rules — NEVER violate these
1. Never invent facts about a property. Only state things that are present in the \`search_properties\` tool output. If a user asks about a detail not in the data, say "I'll check with the team" and escalate.
2. Never claim a document type (C of O, Governor's Consent, etc.) for a property unless it is explicitly listed in that property's documents array.
3. Never negotiate price, discount, or offer any figure other than the listed price. If the user tries to negotiate, say "price negotiations happen with a senior agent — I'll set that up" and escalate.
4. Never give legal or tax advice. If the user asks about tax, inheritance, or legal structures, say "this needs a qualified lawyer — I can connect you with one of our legal partners."
5. Never promise a timeline for documentation, construction, or handover that isn't stated in the property record.
6. Never share another client's information, deal terms, or personal details. If a user asks "who else has bought here", answer generically about the estate's occupancy, not specific buyers.
7. Never accept or process payment. Direct payment questions to a human agent. Sunwealth only accepts payment via verified bank transfer or escrow, never via the chat.
8. If the user seems distressed, confused, or says "I was scammed", escalate to a human immediately without further qualification questions.

# Tools you can call
- search_properties(filters) — returns matching properties from the database
- get_property_details(slug) — returns full details for a specific property
- search_knowledge(query) — returns Sunwealth facts (verification process, refund policy, etc.)
- capture_lead(contact_info) — saves the user's contact details to the CRM
- request_inspection(property_slug, proposed_times) — starts a booking flow
- escalate_to_human(reason, conversation_summary) — hands over to a senior agent

# When to escalate
Escalate whenever: (1) the user asks something outside your knowledge tools, (2) the user expresses distress or anger, (3) the user wants to negotiate, (4) the user wants to discuss payment specifics, (5) the user explicitly asks for a human, (6) you've tried twice to answer and the user is still unsatisfied.

Escalation is not failure. A handed-over lead that closes is better than an AI conversation that kills a deal.

# Capturing contact info
Do not demand contact info upfront. Offer help first, earn trust, then ask: "would you like me to share these properties with you over WhatsApp or email?" If they say yes, ask for their name and preferred channel. Only ask for nationality/country if they volunteer that they're abroad — this helps us tailor the process.

# Honesty about being an AI
If asked "are you a bot?" or "are you human?", answer honestly: "I'm an AI concierge. I can answer most questions, and I'll connect you with a human agent whenever you'd prefer one — just ask."`;

const MODEL = process.env.OPENAI_CONCIERGE_MODEL ?? "gpt-4o-mini";
const MAX_TOOL_ROUNDS = 4;
const MAX_OUTPUT_TOKENS = 600;

let _openai: OpenAI | null = null;
function openai(): OpenAI {
  if (!_openai) {
    _openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return _openai;
}

// =====================================================================
// Event types — the concierge loop emits these via push(). The transport
// layer (SSE, WhatsApp) translates them into whatever format it needs.
// =====================================================================
export type ConciergeEvent =
  | { type: "token"; text: string }
  | { type: "tool_start"; toolName: string; friendly: string }
  | { type: "tool_end"; toolName: string; output: unknown }
  | { type: "guardrail"; kind: string; userVisible: boolean; message?: string }
  | { type: "escalated"; agentName: string }
  | { type: "done" }
  | { type: "error"; message: string };

export type RunTurnOptions = {
  conversationId: string;
  sessionId: string;
  channel: "website" | "whatsapp";
  ip: string;
  userText: string;
  push: (event: ConciergeEvent) => void;
};

// =====================================================================
// Public entry: run one turn
// =====================================================================
export async function runConciergeTurn(opts: RunTurnOptions): Promise<void> {
  const { conversationId, sessionId, channel, ip, userText, push } = opts;
  const supabase = createAdminClient();

  // Refuse if the conversation is already escalated — the hard mute.
  const { data: convRow } = await supabase
    .from("concierge_conversations")
    .select("escalated")
    .eq("id", conversationId)
    .maybeSingle();
  if ((convRow as { escalated?: boolean } | null)?.escalated) {
    push({ type: "escalated", agentName: "a senior agent" });
    push({ type: "done" });
    return;
  }

  // Input guardrails.
  const gate = await runInputGuardrails({
    text: userText,
    sessionId,
    ip,
    conversationId,
  });
  if (!gate.allowed) {
    push({
      type: "guardrail",
      kind: gate.reason,
      userVisible: true,
      message: gate.replacement,
    });
    // Still record the (redacted) user turn so the admin sees the attempt.
    await persistMessage({
      conversationId,
      role: "user",
      content: redactForStorage(userText),
    });
    await persistMessage({
      conversationId,
      role: "assistant",
      content: gate.replacement,
    });
    push({ type: "done" });
    return;
  }

  // Persist the user message (redacted for storage).
  await persistMessage({
    conversationId,
    role: "user",
    content: redactForStorage(userText),
  });

  // Load prior messages (full history; 90-day retention handled elsewhere).
  const history = await loadHistory(conversationId);

  // Assemble OpenAI messages.
  const messages: ChatCompletionMessageParam[] = [
    { role: "system", content: SYSTEM_PROMPT },
    ...history,
    { role: "user", content: userText },
  ];

  const ctx: ToolContext = { conversationId, sessionId, channel, ip };
  const snapshot: ToolResultSnapshot = {
    prices: [],
    documents: {},
    slugs: [],
  };

  const assistantText = await runToolLoop({
    messages,
    ctx,
    push,
    snapshot,
  });

  // Output guardrails on the final assistant text.
  let finalText = assistantText;
  const gr = runOutputGuardrails(assistantText, snapshot);

  if (!gr.ok) {
    await logOutputGuardrail({
      kind: gr.kind,
      conversationId,
      sessionId,
      payload: { reason: gr.reason, draft: assistantText.slice(0, 500) },
    });

    if (gr.forceEscalate) {
      // Force an escalation via the tool, then mute.
      push({ type: "guardrail", kind: gr.kind, userVisible: false });
      const escalation = await executeTool(
        "escalate_to_human",
        {
          reason: gr.kind,
          conversationSummary:
            "Automatic escalation: output guardrail blocked the assistant's previous reply.",
        },
        ctx,
      );
      const escOut = escalation.output as { agentName?: string; userMessage?: string };
      finalText =
        escOut.userMessage ??
        gr.replacement ??
        "A senior agent will reach out to you shortly.";
      push({ type: "escalated", agentName: escOut.agentName ?? "a senior agent" });
    } else {
      // One retry with a correction nudge.
      messages.push({ role: "assistant", content: assistantText });
      messages.push({
        role: "system",
        content: `Your previous reply was blocked by an output guardrail (${gr.kind}: ${gr.reason}). Only use prices and document types that appear in tool results. Retry the reply — keep it short.`,
      });
      const retry = await runToolLoop({ messages, ctx, push, snapshot });
      const retryCheck = runOutputGuardrails(retry, snapshot);
      if (retryCheck.ok) {
        // Rewind the first emitted text — we already streamed it, so the transport
        // is responsible for visually replacing; here we just record the new one.
        finalText = retry;
      } else {
        finalText = gr.replacement ?? "Let me double-check that for you — one moment.";
      }
    }
  }

  // Persist the assistant message.
  await persistMessage({
    conversationId,
    role: "assistant",
    content: finalText,
  });

  // Touch last_message_at.
  await supabase
    .from("concierge_conversations")
    .update({ last_message_at: new Date().toISOString() })
    .eq("id", conversationId);

  push({ type: "done" });
}

// =====================================================================
// The tool-use loop
// =====================================================================

type PartialToolCall = {
  id: string;
  name: string;
  argsBuffer: string;
};

async function runToolLoop(opts: {
  messages: ChatCompletionMessageParam[];
  ctx: ToolContext;
  push: (e: ConciergeEvent) => void;
  snapshot: ToolResultSnapshot;
}): Promise<string> {
  const { messages, ctx, push, snapshot } = opts;
  let round = 0;
  let finalText = "";

  while (round < MAX_TOOL_ROUNDS) {
    round += 1;
    const stream = await openai().chat.completions.create({
      model: MODEL,
      messages,
      tools: CONCIERGE_TOOLS as unknown as ChatCompletionTool[],
      tool_choice: "auto",
      stream: true,
      max_tokens: MAX_OUTPUT_TOKENS,
      temperature: 0.4,
    });

    const { text, toolCalls, finishReason } = await consumeStream(stream, push);
    finalText = text;

    if (finishReason !== "tool_calls" || toolCalls.length === 0) {
      // Plain text response. We're done.
      return finalText;
    }

    // Record the assistant's tool-call turn in the running message list.
    messages.push({
      role: "assistant",
      content: text || null,
      tool_calls: toolCalls.map((tc) => ({
        id: tc.id,
        type: "function" as const,
        function: { name: tc.name, arguments: tc.argsBuffer || "{}" },
      })),
    });

    // Execute each tool call sequentially.
    let mutedAfterThisRound = false;
    for (const tc of toolCalls) {
      const friendly = FRIENDLY_TOOL_LABELS[tc.name] ?? "Working on that…";
      push({ type: "tool_start", toolName: tc.name, friendly });

      let parsedInput: unknown = {};
      try {
        parsedInput = tc.argsBuffer ? JSON.parse(tc.argsBuffer) : {};
      } catch {
        parsedInput = { _parseError: tc.argsBuffer };
      }

      const exec = await executeTool(tc.name, parsedInput, ctx);
      updateSnapshot(snapshot, exec);

      push({ type: "tool_end", toolName: tc.name, output: exec.output });

      messages.push({
        role: "tool",
        tool_call_id: tc.id,
        content: JSON.stringify(exec.output),
      });

      if (exec.meta?.muteConversation) {
        mutedAfterThisRound = true;
        const out = exec.output as { agentName?: string; userMessage?: string };
        push({ type: "escalated", agentName: out.agentName ?? "a senior agent" });
        return out.userMessage ?? "A senior agent will reach out to you shortly.";
      }
    }

    if (mutedAfterThisRound) break;
  }

  // If we ran out of rounds without a final text, fall back gracefully.
  return (
    finalText ||
    "Let me get back to you on that — I'll have a senior agent reach out."
  );
}

async function consumeStream(
  stream: Stream<ChatCompletionChunk>,
  push: (e: ConciergeEvent) => void,
): Promise<{
  text: string;
  toolCalls: PartialToolCall[];
  finishReason: string | null;
}> {
  let text = "";
  const toolCalls: PartialToolCall[] = [];
  let finishReason: string | null = null;

  for await (const chunk of stream) {
    const choice = chunk.choices[0];
    if (!choice) continue;
    const delta = choice.delta;

    if (delta?.content) {
      text += delta.content;
      push({ type: "token", text: delta.content });
    }

    if (delta?.tool_calls) {
      for (const toolDelta of delta.tool_calls) {
        const idx = toolDelta.index;
        if (!toolCalls[idx]) {
          toolCalls[idx] = {
            id: toolDelta.id ?? `call_${idx}`,
            name: toolDelta.function?.name ?? "",
            argsBuffer: "",
          };
        }
        if (toolDelta.id) toolCalls[idx].id = toolDelta.id;
        if (toolDelta.function?.name) toolCalls[idx].name = toolDelta.function.name;
        if (toolDelta.function?.arguments) {
          toolCalls[idx].argsBuffer += toolDelta.function.arguments;
        }
      }
    }

    if (choice.finish_reason) {
      finishReason = choice.finish_reason;
    }
  }

  return { text, toolCalls: toolCalls.filter(Boolean), finishReason };
}

function updateSnapshot(snapshot: ToolResultSnapshot, exec: ToolExecution): void {
  if (exec.name === "search_properties" && exec.meta?.searchResults) {
    for (const r of exec.meta.searchResults) {
      snapshot.prices.push(r.price.amount);
      snapshot.slugs.push(r.slug);
      snapshot.documents[r.slug] = r.documents;
    }
  }
  if (exec.name === "get_property_details" && exec.meta?.propertySlug) {
    const docs = (exec.meta.propertyDocuments ?? []) as DocumentType[];
    snapshot.documents[exec.meta.propertySlug] = docs;
    snapshot.slugs.push(exec.meta.propertySlug);
    const out = exec.output as { price?: { amount?: number } };
    if (out.price?.amount) snapshot.prices.push(out.price.amount);
  }
}

// =====================================================================
// Persistence
// =====================================================================

async function persistMessage(opts: {
  conversationId: string;
  role: "user" | "assistant" | "system" | "tool";
  content: string;
  toolCalls?: unknown;
}): Promise<void> {
  const supabase = createAdminClient();
  const { error } = await supabase.from("concierge_messages").insert({
    conversation_id: opts.conversationId,
    role: opts.role,
    content: opts.content,
    tool_calls: opts.toolCalls ?? null,
  });
  if (error) {
    console.warn("persistMessage failed:", error.message);
  }
}

async function loadHistory(
  conversationId: string,
): Promise<ChatCompletionMessageParam[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("concierge_messages")
    .select("role, content")
    .eq("conversation_id", conversationId)
    .order("timestamp", { ascending: true })
    .limit(40); // keep prompt bounded

  if (error || !data) return [];

  const rows = data as unknown as { role: string; content: string }[];
  return rows
    .filter((r) => r.role === "user" || r.role === "assistant")
    .map((r) => {
      if (r.role === "user") return { role: "user" as const, content: r.content };
      return { role: "assistant" as const, content: r.content };
    });
}

// =====================================================================
// Conversation bootstrapping (used by the route)
// =====================================================================

export async function getOrCreateConversation(opts: {
  sessionId: string;
  channel: "website" | "whatsapp";
}): Promise<{ id: string; escalated: boolean }> {
  const supabase = createAdminClient();

  const { data: existing } = await supabase
    .from("concierge_conversations")
    .select("id, escalated")
    .eq("session_id", opts.sessionId)
    .eq("channel", opts.channel)
    .maybeSingle();

  if (existing) {
    return existing as { id: string; escalated: boolean };
  }

  const { data: created, error } = await supabase
    .from("concierge_conversations")
    .insert({
      session_id: opts.sessionId,
      channel: opts.channel,
    })
    .select("id, escalated")
    .single();

  if (error || !created) {
    throw new Error(`conversation create failed: ${error?.message ?? "unknown"}`);
  }
  return created as { id: string; escalated: boolean };
}
