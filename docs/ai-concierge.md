# AI Concierge — Full Specification

Referenced by: `CLAUDE.md` section 2.

This is the centerpiece of the product. Get it right. Every guardrail here is non-negotiable.

---

## Model choice

- **OpenAI `gpt-4o-mini`** for the concierge conversation. Deliberate vendor choice — we run everything on OpenAI so there is one API contract and one billing relationship.
- **OpenAI `gpt-4o-mini`** for lead scoring, content generation, and background jobs. Same model; cost is low enough to use it for both roles.
- **OpenAI `text-embedding-3-small`** (1536 dim) for knowledge-document embeddings.

Never commit model strings to component files — read from `process.env.OPENAI_CONCIERGE_MODEL`, `process.env.OPENAI_UTILITY_MODEL`, and `process.env.OPENAI_EMBEDDING_MODEL` so we can swap. API key lives in `process.env.OPENAI_API_KEY`.

> **History**: an earlier draft specified Claude Sonnet 4.6 for the concierge. Switched to OpenAI in Session 5 to consolidate vendors.

---

## System prompt (the spine)

Store in `lib/ai/concierge.ts`. This is the master prompt. Do not modify without updating this document in the same PR. The code in `lib/ai/concierge.ts` imports the prompt string directly from this file via a verbatim copy — a unit test will later enforce that they match.

```
You are the AI concierge for Sunwealth Real Estate Limited, a luxury real estate firm in Lagos, Nigeria (RC 1739523). You help visitors find properties, answer questions about Sunwealth's verification process, and book inspections.

# Who you help
Most visitors are either (a) diaspora Nigerians living abroad who want to buy, rent, or invest in Lagos property remotely, or (b) Lagos-based high-net-worth professionals. Default to explaining things clearly for someone who cannot physically visit the office tomorrow.

# How to behave
- Speak like a thoughtful, senior real estate consultant — warm, precise, never pushy.
- British English. Natural, not stiff.
- One question at a time. Do not dump a form on the user.
- Never use more than three sentences per turn unless the user asks for more detail.
- If the user is browsing, offer to match them to properties. If they are anxious about trust, answer their concern before suggesting properties.

# Hard rules — NEVER violate these
1. Never invent facts about a property. Only state things that are present in the `search_properties` tool output. If a user asks about a detail not in the data, say "I'll check with the team" and escalate.
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
If asked "are you a bot?" or "are you human?", answer honestly: "I'm an AI concierge. I can answer most questions, and I'll connect you with a human agent whenever you'd prefer one — just ask."
```

---

## Tools the concierge can call

Each tool is a TypeScript function exposed via the OpenAI function-calling API. Implementations in `lib/ai/tools.ts`.

### `search_properties(filters)`

```ts
{
  listingType?: 'sale' | 'rent' | 'shortlet';
  category?: PropertyCategory | PropertyCategory[];
  area?: string | string[];
  priceMin?: number;
  priceMax?: number;
  bedroomsMin?: number;
  documents?: DocumentType[];
  sortBy?: 'price-asc' | 'price-desc' | 'newest';
  limit?: number; // default 5, max 10
}
// Returns: Property[] with key fields (id, slug, title, price, location, bedrooms, primary image url)
```

Wraps the same endpoint the search UI uses. Never write a separate database query for the AI — one source of truth. See `docs/search.md`.

### `get_property_details(slug)`

Returns the full Property record including description, features, documents, payment plans. Use when the user drills into a specific listing.

### `search_knowledge(query)`

Embedding-based semantic search over the `knowledge_documents` table. Use for questions like "how do you verify title documents" or "what is your refund policy." Returns top 3 matching documents with content.

### `capture_lead(contact_info)`

Persists a Lead record. Tags with `source: 'website'` or `'whatsapp'` depending on channel. Sets `isDiaspora: true` if the user mentioned being abroad. Deduplicates by phone + email.

### `request_inspection(property_slug, proposed_times)`

Creates an `inspection_requests` record, generates a Cal.com booking link scoped to the property's assigned agent, returns the link for the AI to share.

### `escalate_to_human(reason, conversation_summary)`

Sets `concierge_conversations.escalated = true`, sends a WhatsApp + email alert to the on-duty senior agent with the full transcript and the AI's summary of what the user needs. Responds to the user with: "A senior agent will message you on WhatsApp within 15 minutes. Their name is [Name]."

**After escalation, the AI goes quiet.** No more replies in that conversation. Only humans respond.

---

## Guardrails (runtime, not just prompt)

Prompt instructions can be bypassed. Layer hard-coded checks on top. All guardrails live in `lib/ai/guardrails.ts`.

### Input guardrails (run on every user message)

1. **Prompt injection filter** — reject messages containing phrases like "ignore previous instructions", "you are now", "system prompt", "jailbreak". Log and respond with: "I can only help with property questions — what are you looking for?"
2. **PII stripping on logs** — before persisting to `concierge_messages`, redact credit card numbers and Nigerian BVN/NIN patterns (regex).
3. **Rate limit** — max 30 messages per session per hour, max 5 new sessions per IP per hour. Exceeding triggers a CAPTCHA.

### Output guardrails (run on every AI response before it streams to the user)

1. **Price assertion check** — if the response contains a ₦ amount or "million" / "m", verify the number appears verbatim in the most recent `search_properties` or `get_property_details` tool result. If not, replace the response with: "Let me double-check that price for you — one moment." and re-prompt the model with "Only use prices from tool results."
2. **Document claim check** — if the response mentions "C of O" or "Governor's Consent", verify the claim is backed by the property's `documents` array. Same fallback as above.
3. **Negotiation detector** — if the response contains words like "discount", "lower price", "negotiate", "deal", force escalation.
4. **Legal advice detector** — if the response contains "you should structure", "tax-wise", "legally you can", force escalation.

These are not optional. The AI will eventually try to be helpful in the wrong way. The guardrails keep Sunwealth out of court.

---

## Conversation storage

Every conversation persists to `concierge_conversations` and `concierge_messages`. Staff can read them in `/admin/conversations`. No conversation is ever deleted — they're training data and legal evidence.

Transcripts older than 90 days with no lead capture get auto-archived (moved to cold storage, not deleted).

---

## Streaming

The chat uses Server-Sent Events (SSE) from `/api/concierge/stream`. Client maintains a rolling message window.

- First-token latency target: < 800ms.
- The client shows a typing indicator from request-start until first token.
- On tool calls, the client shows "Looking up properties..." / "Checking our records..." / "Booking your inspection..." — natural language, not "tool_use: search_properties".

---

## WhatsApp integration

The same `concierge.ts` module handles WhatsApp. The webhook `/api/concierge/whatsapp` receives inbound messages via WasenderAPI, routes them through the same AI pipeline, and sends responses via the WasenderAPI send endpoint.

- Context is keyed by the user's phone number. Same person on website and WhatsApp gets unified history.
- For v1, WhatsApp is replies-only (no outbound broadcasts beyond inspection reminders).
- Broadcasting listings moves to Phase 2 once official WhatsApp Business API approval comes through.

---

## Testing

Two test suites live under `lib/ai/__tests__/`:

### `pnpm test:ai` — regression suite

30+ scripted conversations that the AI must handle correctly. Covers:
- Simple property searches
- Trust questions ("how do you verify titles?")
- Inspection booking flows
- Escalation triggers (negotiation, legal, distress)
- Contact capture
- Out-of-scope questions

Run on every PR that touches `lib/ai/`.

### `pnpm test:ai:redteam` — adversarial suite

Prompts that try to break guardrails:
- Prompt injection attempts
- Price manipulation ("what if I offered ₦100M for the ₦200M property?")
- Document fabrication ("does this property have C of O?" — when it doesn't)
- Personas designed to extract PII of other clients
- Emotional manipulation to bypass escalation

Must pass 100% before any concierge change merges.

---

## Observability

Log every AI interaction to a structured events table:
- `ai_tool_call` — name, input, output, latency, whether guardrail triggered
- `ai_guardrail_trigger` — which guardrail, why, what was replaced
- `ai_escalation` — reason, conversation ID, time to human response

Surface these in the admin dashboard. If a single guardrail fires > 5% of conversations, something is wrong and needs investigation.
