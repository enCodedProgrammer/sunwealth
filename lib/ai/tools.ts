import "server-only";
import { Resend } from "resend";
import { z } from "zod";
import { createAdminClient } from "../db/admin";
import {
  getPropertyBySlug,
  searchProperties,
  type PropertySearchResult,
  type SearchParams,
} from "../db/properties";
import type { DocumentType, ListingType, PropertyCategory } from "../types";
import { semanticSearch } from "./embeddings";

// =====================================================================
// Tool schema — OpenAI function-calling format
// =====================================================================

export type ToolDef = {
  type: "function";
  function: {
    name: string;
    description: string;
    parameters: Record<string, unknown>;
    strict?: boolean;
  };
};

const CATEGORY_ENUM: PropertyCategory[] = [
  "fully-detached-duplex",
  "semi-detached-duplex",
  "terrace-duplex",
  "bungalow",
  "apartment",
  "penthouse",
  "maisonette",
  "land",
];

const DOCUMENT_ENUM: DocumentType[] = [
  "C of O",
  "Governor's Consent",
  "Deed of Assignment",
  "Registered Survey",
  "Building Approval",
  "Excision",
];

const LISTING_TYPE_ENUM: ListingType[] = ["sale", "rent", "shortlet"];

export const CONCIERGE_TOOLS: ToolDef[] = [
  {
    type: "function",
    function: {
      name: "search_properties",
      description:
        "Search Sunwealth's verified property listings. Use this whenever the user describes what they are looking for. Returns a short list of matches with key fields (price, area, bedrooms, documents, primary image). Do not state any fact about a property that is not present in the result.",
      parameters: {
        type: "object",
        additionalProperties: false,
        properties: {
          listingType: { type: "string", enum: LISTING_TYPE_ENUM },
          category: {
            type: "array",
            items: { type: "string", enum: CATEGORY_ENUM },
          },
          area: {
            type: "array",
            items: { type: "string" },
            description: "Lagos neighbourhoods, e.g. ['Ikoyi', 'Lekki Phase 1']",
          },
          priceMin: { type: "number", description: "NGN, inclusive" },
          priceMax: { type: "number", description: "NGN, inclusive" },
          bedroomsMin: { type: "integer", minimum: 0, maximum: 20 },
          documents: {
            type: "array",
            items: { type: "string", enum: DOCUMENT_ENUM },
          },
          sortBy: { type: "string", enum: ["price-asc", "price-desc", "newest"] },
          limit: { type: "integer", minimum: 1, maximum: 10, default: 5 },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_property_details",
      description:
        "Fetch full details for a single property by its slug. Use after search_properties when the user wants to know more about a specific listing.",
      parameters: {
        type: "object",
        additionalProperties: false,
        required: ["slug"],
        properties: {
          slug: { type: "string", description: "The property slug, e.g. 'placeholder-ikoyi-duplex'" },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "search_knowledge",
      description:
        "Semantic search over Sunwealth's knowledge base — verification process, refund policy, diaspora buying, payment methods, inspection SOP. Use for any trust/process question.",
      parameters: {
        type: "object",
        additionalProperties: false,
        required: ["query"],
        properties: {
          query: { type: "string" },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "capture_lead",
      description:
        "Save the user's contact details to the CRM. Only call after the user has agreed to share their details — do not demand upfront. Deduplicates by phone/email.",
      parameters: {
        type: "object",
        additionalProperties: false,
        properties: {
          name: { type: "string" },
          email: { type: "string" },
          phone: { type: "string" },
          whatsapp: { type: "string" },
          country: { type: "string", description: "ISO 3166-1 alpha-2 country code, e.g. 'GB'" },
          isDiaspora: { type: "boolean" },
          preferredChannel: { type: "string", enum: ["whatsapp", "email", "phone"] },
          notes: { type: "string", description: "What the user is looking for, in one sentence." },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "request_inspection",
      description:
        "Create an inspection request for a specific property. Returns a Cal.com booking link the user can follow. Use when the user has expressed interest in a specific listing and wants to view it.",
      parameters: {
        type: "object",
        additionalProperties: false,
        required: ["propertySlug"],
        properties: {
          propertySlug: { type: "string" },
          isVirtual: { type: "boolean", description: "true = WhatsApp video walkthrough; false = on-site" },
          preferredAt: { type: "string", description: "ISO 8601 datetime if the user gave a specific time" },
          contactName: { type: "string" },
          contactEmail: { type: "string" },
          contactPhone: { type: "string" },
          notes: { type: "string" },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "escalate_to_human",
      description:
        "Hand the conversation over to a senior agent. Call whenever: user is distressed, wants to negotiate, asks about payment specifics, explicitly asks for a human, or the question is outside your tools. After calling this, stop replying — only humans respond.",
      parameters: {
        type: "object",
        additionalProperties: false,
        required: ["reason", "conversationSummary"],
        properties: {
          reason: { type: "string", description: "Short label, e.g. 'negotiation', 'distress', 'outside-scope'" },
          conversationSummary: {
            type: "string",
            description: "2-3 sentence summary of what the user is asking for, written for the incoming agent.",
          },
        },
      },
    },
  },
];

// =====================================================================
// Executor
// =====================================================================

export type ToolContext = {
  conversationId: string;
  sessionId: string;
  channel: "website" | "whatsapp";
  ip: string;
};

export type ToolExecution = {
  name: string;
  input: unknown;
  output: unknown;
  friendly: string; // shown to the user while the tool runs
  // If this tool mutates conversation state (e.g. escalation), flag it here.
  meta?: {
    muteConversation?: boolean;
    escalated?: boolean;
    leadId?: string;
    agentName?: string;
    // For output guardrail snapshot building:
    searchResults?: PropertySearchResult[];
    propertySlug?: string;
    propertyDocuments?: DocumentType[];
  };
};

export const FRIENDLY_TOOL_LABELS: Record<string, string> = {
  search_properties: "Looking up properties…",
  get_property_details: "Pulling up the details…",
  search_knowledge: "Checking our records…",
  capture_lead: "Saving your details…",
  request_inspection: "Booking your inspection…",
  escalate_to_human: "Connecting you to a senior agent…",
};

export async function executeTool(
  name: string,
  rawInput: unknown,
  ctx: ToolContext,
): Promise<ToolExecution> {
  const friendly = FRIENDLY_TOOL_LABELS[name] ?? "Working on that…";
  const start = Date.now();
  try {
    let output: unknown;
    let meta: ToolExecution["meta"] = {};
    switch (name) {
      case "search_properties": {
        const parsed = SearchPropertiesInput.parse(rawInput);
        const params: SearchParams = {
          listingType: parsed.listingType,
          category: parsed.category,
          area: parsed.area,
          priceMin: parsed.priceMin,
          priceMax: parsed.priceMax,
          bedroomsMin: parsed.bedroomsMin,
          documents: parsed.documents,
          sortBy: parsed.sortBy,
          limit: Math.min(parsed.limit ?? 5, 10),
        };
        const res = await searchProperties(params);
        const compact = res.results.map((r) => ({
          slug: r.slug,
          title: r.title,
          category: r.category,
          listingType: r.listingType,
          area: r.location.area,
          city: r.location.city,
          price: r.price,
          bedrooms: r.bedrooms,
          bathrooms: r.bathrooms,
          size: r.size,
          documents: r.documents,
          primaryImage: r.primaryImage,
        }));
        output = { results: compact, total: res.total };
        meta = { searchResults: res.results };
        break;
      }

      case "get_property_details": {
        const { slug } = GetPropertyDetailsInput.parse(rawInput);
        const prop = await getPropertyBySlug(slug);
        if (!prop) {
          output = { error: "not-found", slug };
        } else {
          output = {
            slug: prop.slug,
            title: prop.title,
            category: prop.category,
            listingType: prop.listingType,
            status: prop.status,
            location: prop.location,
            price: prop.price,
            size: prop.size,
            bedrooms: prop.bedrooms,
            bathrooms: prop.bathrooms,
            features: prop.features,
            documents: prop.documents,
            description: prop.description,
            nearbyLandmarks: prop.nearbyLandmarks,
            paymentPlans: prop.paymentPlans,
            virtualTourUrl: prop.virtualTourUrl,
          };
          meta = {
            propertySlug: prop.slug,
            propertyDocuments: prop.documents,
          };
        }
        break;
      }

      case "search_knowledge": {
        const { query } = SearchKnowledgeInput.parse(rawInput);
        const hits = await semanticSearch(query, 3);
        output = {
          results: hits.map((h) => ({
            title: h.title,
            category: h.category,
            content: h.content,
            similarity: Number(h.similarity.toFixed(3)),
          })),
        };
        break;
      }

      case "capture_lead": {
        const parsed = CaptureLeadInput.parse(rawInput);
        const result = await captureLead(parsed, ctx);
        output = result;
        meta = { leadId: result.leadId };
        break;
      }

      case "request_inspection": {
        const parsed = RequestInspectionInput.parse(rawInput);
        output = await requestInspection(parsed);
        break;
      }

      case "escalate_to_human": {
        const parsed = EscalateInput.parse(rawInput);
        const result = await escalateToHuman(parsed, ctx);
        output = result;
        meta = {
          muteConversation: true,
          escalated: true,
          agentName: result.agentName,
        };
        break;
      }

      default:
        output = { error: "unknown-tool", name };
    }

    await logToolCall({
      ctx,
      name,
      input: rawInput,
      output,
      latencyMs: Date.now() - start,
    });

    return { name, input: rawInput, output, friendly, meta };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await logToolCall({
      ctx,
      name,
      input: rawInput,
      output: { error: message },
      latencyMs: Date.now() - start,
      errored: true,
    });
    return {
      name,
      input: rawInput,
      output: { error: message },
      friendly,
    };
  }
}

// =====================================================================
// Input schemas (Zod — runtime-validated at the boundary)
// =====================================================================

const SearchPropertiesInput = z.object({
  listingType: z.enum(LISTING_TYPE_ENUM).optional(),
  category: z.array(z.enum(CATEGORY_ENUM)).optional(),
  area: z.array(z.string()).optional(),
  priceMin: z.number().nonnegative().optional(),
  priceMax: z.number().nonnegative().optional(),
  bedroomsMin: z.number().int().nonnegative().max(20).optional(),
  documents: z.array(z.enum(DOCUMENT_ENUM)).optional(),
  sortBy: z.enum(["price-asc", "price-desc", "newest"]).optional(),
  limit: z.number().int().min(1).max(10).optional(),
});

const GetPropertyDetailsInput = z.object({
  slug: z.string().min(1),
});

const SearchKnowledgeInput = z.object({
  query: z.string().min(1),
});

const CaptureLeadInput = z.object({
  name: z.string().optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  whatsapp: z.string().optional(),
  country: z.string().length(2).optional(),
  isDiaspora: z.boolean().optional(),
  preferredChannel: z.enum(["whatsapp", "email", "phone"]).optional(),
  notes: z.string().optional(),
});

const RequestInspectionInput = z.object({
  propertySlug: z.string().min(1),
  isVirtual: z.boolean().optional(),
  preferredAt: z.string().optional(),
  contactName: z.string().optional(),
  contactEmail: z.string().email().optional(),
  contactPhone: z.string().optional(),
  notes: z.string().optional(),
});

const EscalateInput = z.object({
  reason: z.string().min(1),
  conversationSummary: z.string().min(1),
});

// =====================================================================
// Tool implementations
// =====================================================================

async function captureLead(
  input: z.infer<typeof CaptureLeadInput>,
  ctx: ToolContext,
): Promise<{ leadId: string; created: boolean }> {
  const supabase = createAdminClient();

  // Dedupe by phone OR email if either was provided.
  let existingId: string | null = null;
  if (input.phone || input.email) {
    const filters: string[] = [];
    if (input.phone) filters.push(`phone.eq.${input.phone}`);
    if (input.email) filters.push(`email.eq.${input.email}`);
    const { data } = await supabase
      .from("leads")
      .select("id")
      .or(filters.join(","))
      .limit(1)
      .maybeSingle();
    if (data) existingId = (data as { id: string }).id;
  }

  const row = {
    name: input.name ?? null,
    email: input.email ?? null,
    phone: input.phone ?? null,
    whatsapp: input.whatsapp ?? input.phone ?? null,
    country: input.country ?? null,
    is_diaspora: input.isDiaspora ?? false,
    source: ctx.channel === "whatsapp" ? "whatsapp" : "website",
    last_contact_at: new Date().toISOString(),
    notes: input.notes ?? "",
  };

  let leadId: string;
  let created = false;
  if (existingId) {
    const { error } = await supabase.from("leads").update(row).eq("id", existingId);
    if (error) throw new Error(`capture_lead update failed: ${error.message}`);
    leadId = existingId;
  } else {
    const { data, error } = await supabase
      .from("leads")
      .insert(row)
      .select("id")
      .single();
    if (error) throw new Error(`capture_lead insert failed: ${error.message}`);
    leadId = (data as { id: string }).id;
    created = true;
  }

  // Link conversation -> lead.
  await supabase
    .from("concierge_conversations")
    .update({ lead_id: leadId })
    .eq("id", ctx.conversationId);

  return { leadId, created };
}

async function requestInspection(
  input: z.infer<typeof RequestInspectionInput>,
): Promise<{ inspectionId: string; bookingUrl: string | null; agentName: string | null }> {
  const supabase = createAdminClient();

  const { data: propRow, error: propErr } = await supabase
    .from("properties")
    .select("id, sub_brand, title, slug")
    .eq("slug", input.propertySlug)
    .maybeSingle();
  if (propErr) throw new Error(`request_inspection: property lookup failed: ${propErr.message}`);
  if (!propRow) throw new Error(`request_inspection: property not found: ${input.propertySlug}`);
  const property = propRow as { id: string; sub_brand: string; title: string; slug: string };

  const agent = await findAgentForSubBrand(property.sub_brand);

  const { data: inspRow, error: inspErr } = await supabase
    .from("inspection_requests")
    .insert({
      property_id: property.id,
      contact_name: input.contactName ?? null,
      contact_email: input.contactEmail ?? null,
      contact_phone: input.contactPhone ?? null,
      preferred_at: input.preferredAt ?? null,
      is_virtual: input.isVirtual ?? false,
      status: "pending",
      notes: input.notes ?? null,
    })
    .select("id")
    .single();
  if (inspErr) throw new Error(`request_inspection insert failed: ${inspErr.message}`);

  return {
    inspectionId: (inspRow as { id: string }).id,
    bookingUrl: agent?.cal_booking_url ?? null,
    agentName: agent?.name ?? null,
  };
}

async function escalateToHuman(
  input: z.infer<typeof EscalateInput>,
  ctx: ToolContext,
): Promise<{ agentName: string; userMessage: string }> {
  const supabase = createAdminClient();

  // Pick an agent. Default to any active senior; sub_brand match not required
  // until the conversation has a dominant sub_brand.
  const agent =
    (await findAgentForSubBrand("all")) ??
    (await findAgentForSubBrand("sales")) ??
    (await findFallbackAgent());

  const agentName = agent?.name ?? "a senior agent";

  // Mark the conversation as escalated.
  const { error: updateErr } = await supabase
    .from("concierge_conversations")
    .update({
      escalated: true,
      escalation_reason: input.reason,
    })
    .eq("id", ctx.conversationId);
  if (updateErr) {
    console.warn("escalate: failed to mark conversation:", updateErr.message);
  }

  // Log escalation.
  await supabase.from("ai_events").insert({
    kind: "ai_escalation",
    conversation_id: ctx.conversationId,
    session_id: ctx.sessionId,
    payload: {
      reason: input.reason,
      summary: input.conversationSummary,
      agent_id: agent?.id ?? null,
    },
  });

  // Notify the agent by email via Resend. WhatsApp outbound is not wired in v1.
  await sendEscalationEmail({
    agentEmail: agent?.email ?? null,
    agentName,
    reason: input.reason,
    summary: input.conversationSummary,
    conversationId: ctx.conversationId,
  });

  return {
    agentName,
    userMessage: `A senior agent will message you on WhatsApp within 15 minutes. Their name is ${agentName}.`,
  };
}

// =====================================================================
// Helpers
// =====================================================================

type AgentRow = {
  id: string;
  name: string;
  email: string;
  whatsapp: string;
  cal_booking_url: string;
  sub_brand: string;
  role: string;
};

async function findAgentForSubBrand(subBrand: string): Promise<AgentRow | null> {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("agents")
    .select("id, name, email, whatsapp, cal_booking_url, sub_brand, role")
    .eq("is_active", true)
    .eq("sub_brand", subBrand)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  return (data as AgentRow | null) ?? null;
}

async function findFallbackAgent(): Promise<AgentRow | null> {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("agents")
    .select("id, name, email, whatsapp, cal_booking_url, sub_brand, role")
    .eq("is_active", true)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  return (data as AgentRow | null) ?? null;
}

let _resend: Resend | null = null;
function resendClient(): Resend | null {
  const key = process.env.RESEND_API_KEY;
  if (!key || key === "placeholder") return null;
  if (!_resend) _resend = new Resend(key);
  return _resend;
}

async function sendEscalationEmail(opts: {
  agentEmail: string | null;
  agentName: string;
  reason: string;
  summary: string;
  conversationId: string;
}): Promise<void> {
  const client = resendClient();
  if (!client) {
    console.warn("Resend not configured — skipping escalation email");
    return;
  }
  if (!opts.agentEmail) {
    console.warn("Escalation has no agent email — skipping send");
    return;
  }

  const from = process.env.RESEND_FROM_EMAIL ?? "concierge@sunwealthrealestate.com";
  try {
    await client.emails.send({
      from,
      to: opts.agentEmail,
      subject: `Concierge escalation: ${opts.reason}`,
      text: [
        `Hi ${opts.agentName},`,
        "",
        `The AI concierge has handed over a conversation. Reason: ${opts.reason}.`,
        "",
        "Summary:",
        opts.summary,
        "",
        `Conversation ID: ${opts.conversationId}`,
        "",
        "Please follow up on WhatsApp within 15 minutes.",
      ].join("\n"),
    });
  } catch (e) {
    console.warn("Resend send failed:", e);
  }
}

async function logToolCall(opts: {
  ctx: ToolContext;
  name: string;
  input: unknown;
  output: unknown;
  latencyMs: number;
  errored?: boolean;
}): Promise<void> {
  try {
    const supabase = createAdminClient();
    await supabase.from("ai_events").insert({
      kind: "ai_tool_call",
      conversation_id: opts.ctx.conversationId,
      session_id: opts.ctx.sessionId,
      payload: {
        tool: opts.name,
        input: opts.input,
        output_summary: summariseOutput(opts.output),
        latency_ms: opts.latencyMs,
        errored: Boolean(opts.errored),
      },
    });
  } catch (e) {
    console.warn("logToolCall failed:", e);
  }
}

function summariseOutput(output: unknown): unknown {
  if (output && typeof output === "object" && "results" in output) {
    const o = output as { results: unknown[] };
    return { resultCount: Array.isArray(o.results) ? o.results.length : 0 };
  }
  return output;
}
