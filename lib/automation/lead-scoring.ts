import "server-only";
import OpenAI from "openai";
import { createAdminClient } from "../db/admin";

const MODEL = process.env.OPENAI_UTILITY_MODEL ?? "gpt-4o-mini";

let _openai: OpenAI | null = null;
function openai(): OpenAI {
  if (!_openai) {
    _openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return _openai;
}

// Bias-safe rubric. Verbatim rationale lives in docs/automation.md.
const SYSTEM = `You score real estate leads for Sunwealth Real Estate Limited, a Lagos firm.

Return a single integer from 0 to 100 reflecting how qualified the lead is, based ONLY on:
- Budget stated (+20)
- Specific area mentioned (+15)
- Timeline given (+15)
- Abroad — self-described only, not inferred from name or phone prefix (+20)
- Contact info provided: email or phone (+15)
- Specific property of interest mentioned (+15)

Never infer wealth, ethnicity, or seriousness from names, phone prefixes, or email domains. If the lead provides no signal, return 0. If a signal is ambiguous, do not award it.

Output JSON only, in this exact shape:
{"score": <integer 0..100>, "reasons": ["..."]}

Do not add any text outside the JSON.`;

type Lead = {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  country: string | null;
  is_diaspora: boolean;
  notes: string;
  interested_areas: string[] | null;
  interested_categories: string[] | null;
  budget: unknown;
};

type ScoreResult = {
  score: number;
  reasons: string[];
};

export async function scoreLead(leadId: string): Promise<number> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("leads")
    .select(
      "id, name, email, phone, country, is_diaspora, notes, interested_areas, interested_categories, budget",
    )
    .eq("id", leadId)
    .maybeSingle();

  if (error) throw new Error(`scoreLead lookup failed: ${error.message}`);
  if (!data) throw new Error(`scoreLead: lead ${leadId} not found`);

  const lead = data as unknown as Lead;
  const summary = summariseLeadForScoring(lead);

  const start = Date.now();
  let result: ScoreResult;
  try {
    result = await callModel(summary);
  } catch (err) {
    await logEvent("ai_error", leadId, {
      stage: "lead-scoring",
      error: err instanceof Error ? err.message : String(err),
      latency_ms: Date.now() - start,
    });
    // Fail-safe: default to 0 so we never falsely promote a lead.
    return writeScore(leadId, 0, ["scoring failed — defaulted to 0"]);
  }

  const safeScore = Math.max(0, Math.min(100, Math.round(result.score || 0)));

  await logEvent("ai_tool_call", leadId, {
    tool: "scoreLead",
    input: summary,
    output: result,
    latency_ms: Date.now() - start,
  });

  return writeScore(leadId, safeScore, result.reasons);
}

function summariseLeadForScoring(lead: Lead): string {
  // Feed only statement-of-fact fields — never the raw name in a way that
  // invites inference. The scorer sees structured features, not raw identity.
  const hasEmail = Boolean(lead.email);
  const hasPhone = Boolean(lead.phone);
  const lines = [
    `Has email: ${hasEmail ? "yes" : "no"}`,
    `Has phone: ${hasPhone ? "yes" : "no"}`,
    `Self-described as abroad: ${lead.is_diaspora ? "yes" : "no"}`,
    `Country (if provided): ${lead.country ?? "not provided"}`,
    `Interested areas: ${(lead.interested_areas ?? []).join(", ") || "none"}`,
    `Interested categories: ${(lead.interested_categories ?? []).join(", ") || "none"}`,
    `Budget provided: ${lead.budget ? JSON.stringify(lead.budget) : "no"}`,
    `Notes from lead:`,
    lead.notes?.slice(0, 1500) ?? "",
  ];
  return lines.join("\n");
}

async function callModel(summary: string): Promise<ScoreResult> {
  const response = await openai().chat.completions.create({
    model: MODEL,
    temperature: 0,
    max_tokens: 200,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: SYSTEM },
      { role: "user", content: summary },
    ],
  });

  const text = response.choices[0]?.message?.content ?? "";
  const parsed = JSON.parse(text) as Partial<ScoreResult>;
  return {
    score: typeof parsed.score === "number" ? parsed.score : 0,
    reasons: Array.isArray(parsed.reasons) ? parsed.reasons : [],
  };
}

async function writeScore(
  leadId: string,
  score: number,
  reasons: string[],
): Promise<number> {
  const supabase = createAdminClient();
  const { error } = await supabase
    .from("leads")
    .update({ score, last_contact_at: new Date().toISOString() })
    .eq("id", leadId);
  if (error) {
    console.warn("scoreLead writeScore failed:", error.message);
  }
  await logEvent("ai_tool_call", leadId, {
    tool: "writeScore",
    score,
    reasons,
  });
  return score;
}

async function logEvent(
  kind: "ai_tool_call" | "ai_error",
  leadId: string,
  payload: Record<string, unknown>,
): Promise<void> {
  try {
    const supabase = createAdminClient();
    await supabase.from("ai_events").insert({
      kind,
      conversation_id: null,
      session_id: `lead:${leadId}`,
      payload,
    });
  } catch (e) {
    console.warn("scoreLead logEvent failed:", e);
  }
}
