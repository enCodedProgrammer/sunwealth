# Phase Plan

Referenced by: `CLAUDE.md` section 2.

Three phases. Each one is independently deployable and valuable. Never build Phase 2 work during Phase 1.

---

## Phase 1 — Launch (weeks 1-5)

The goal: a live site with AI concierge, 15-25 real listings, deployed to `sunwealthrealestate.com`.

### Scope

- Brand system (colors, typography, logo components). See `docs/brand.md`.
- All public pages: Home, Properties, Rentals, Land, Property/Rental/Land detail pages, Diaspora, About, Contact, Journal index + detail. See `docs/pages.md`.
- Property search with filters. See `docs/search.md`.
- AI concierge on website (not yet WhatsApp) with all guardrails. See `docs/ai-concierge.md`.
- Supabase schema + admin CRUD for properties. See `docs/data-model.md`.
- Listing ingestion pipeline (Pipeline 1). See `docs/automation.md`.
- Inspection booking via Cal.com (Pipeline 2).
- 15-25 real listings migrated from Instagram.
- 3 Journal posts.
- Deploy to `sunwealthrealestate.com` (Vercel).

### Out of scope (Phase 2)

- WhatsApp integration
- Lead scoring & routing
- Drip sequences
- Full CRM view
- Knowledge base editing UI
- Email newsletter

### Ship criteria

- Lighthouse scores ≥ 95 on accessibility, performance, SEO for Home and Properties pages.
- All concierge red-team tests passing.
- Real client photos for at least 15 listings.
- Diaspora page with at least 3 real testimonials OR section omitted.
- Admin user (Sunwealth owner + 2 staff) can add a property end-to-end without developer help.

---

## Phase 2 — WhatsApp & Automation (weeks 6-10)

The goal: the AI becomes a full sales operating system.

### Scope

- WhatsApp integration (WasenderAPI) for concierge replies and inspection reminders.
- Lead scoring + routing pipeline (Pipeline 3) live.
- Follow-up and re-engagement drip sequences (Pipeline 4) live.
- Full admin CRM with lead pipeline view.
- Knowledge base editing UI at `/admin/knowledge-base`.
- Email newsletter with manual campaigns (saved-search alerts move to Phase 3).

### Ship criteria

- WhatsApp replies in < 5 seconds end-to-end.
- Hot-lead alerts reach senior agent within 60 seconds.
- Drip sequences opt-out working correctly.
- Admin dashboard shows lead pipeline, conversations, and escalations clearly.

---

## Phase 3 — Scale & Polish (post week 10)

Optional, data-driven. Only build what analytics justify.

### Candidate scope

- Official Meta WhatsApp Business API migration (once approved).
- Matterport virtual tours integrated per listing.
- Multi-currency display (NGN/GBP/USD) with live FX rates.
- Payment plan calculator for properties with installment options.
- Saved searches with email alerts.
- Mortgage pre-qualification with a partner bank.
- Mobile app (React Native) — only if engagement metrics justify it.

---

## Between-phase checkpoints

After each phase:
1. Review analytics: inbound leads, concierge conversation count, escalation rate, conversion to inspection, close rate.
2. Review Sunwealth's feedback — what's the team using vs ignoring?
3. Revisit `CLAUDE.md` and `docs/*` — update anything learned during the phase.
4. Decide: double down (Phase N+1), pivot, or pause.

**Never move to the next phase while the current one has open bugs or incomplete features.** Finish before expanding.
