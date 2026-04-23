# CLAUDE.md — Sunwealth Real Estate Platform

This is the map. Read it at the start of every session. When you need detail on a specific area, read the linked doc in `docs/`. Don't guess if you can read.

---

## 1. Project Context

### About the client

Sunwealth Real Estate Limited is one of Lagos's highest-engagement real estate operations. They have **97,000 Instagram followers** and over **8,000 posts** on [@sunwealthltd](https://www.instagram.com/sunwealthltd/). RC 1739523. Primary phone: **+234 903 837 9755**.

They operate three connected sub-brands, each currently running as a separate Instagram account:

- **@sunwealthltd** — property sales (Ikoyi, VGC, Lekki Phase 1, Pinnock Beach, Osapa London)
- **@sunwealth_rent.ng** — rentals
- **@sunwealth_landandacres** — land sales

Current "website" is a rented profile page on `sunwealth-realtor.realtornigeria.com`. No real architecture, no search, no AI, no unified brand.


### The real problem

1. **They can't scale past their team's DM capacity.** 97K followers, massive inbound volume, every DM is a human response. Most leads die in the inbox.
2. **Diaspora buyers can't trust Instagram.** A London buyer with ₦500M to spend does not wire money based on a Reel.
3. **Their three sub-brands don't talk to each other.** Cross-brand data is lost across three Instagram inboxes.

### What we are building

A unified property platform with an AI sales concierge at its core:

- Qualifies every visitor, matches them to properties, answers trust questions, books inspections, escalates to humans cleanly.
- Works on the website AND on WhatsApp — one brain, multiple channels.
- Sits on top of an automation layer that handles listing publishing, inspection bookings, lead scoring, and follow-up.

### Who buys from Sunwealth (priority order)

1. **Diaspora Nigerians** (UK, US, Canada, UAE) buying remotely — need trust signals and zero-friction remote buying. Priority #1 for every design decision.
2. **High-net-worth Lagos professionals** upgrading into Ikoyi/Lekki luxury.
3. **Landlords and investors** looking for rental yield.
4. **Land bankers** buying in emerging corridors.

### What success looks like

- A diaspora buyer lands at 2 AM London time, chats with the AI, gets matched to 3 properties, books a virtual inspection — all while the team sleeps.
- Inbound volume moves from Instagram DMs (untracked) to the CRM (measured).
- Inbound lead volume from the site matches or exceeds Instagram DM volume within 90 days.

---

## 2. Document Map

Read these on demand. Never work on a section without reading its doc first.

| If you're working on... | Read |
|---|---|
| Colors, typography, logo, voice, layout | [`docs/brand.md`](docs/brand.md) |
| Stack choice, folder structure, performance, accessibility | [`docs/architecture.md`](docs/architecture.md) |
| TypeScript types, Supabase schema, RLS | [`docs/data-model.md`](docs/data-model.md) |
| The AI concierge, system prompt, tools, guardrails | [`docs/ai-concierge.md`](docs/ai-concierge.md) |
| Property search endpoint, filter UI, search UX | [`docs/search.md`](docs/search.md) |
| Page-by-page specs (home, properties, diaspora, admin, etc.) | [`docs/pages.md`](docs/pages.md) |
| Listing ingestion, inspection booking, lead scoring, follow-up | [`docs/automation.md`](docs/automation.md) |
| Phase plan and what ships when | [`docs/phases.md`](docs/phases.md) |

---

## 3. Non-Negotiable Rules

These apply to every change in every session.

### Do

- Show price transparently. Always. "Price on request" destroys diaspora trust.
- Show document type (C of O, Governor's Consent, etc.) prominently on every listing.
- Use tabular numerals for prices, sizes, dates.
- British English throughout the UI. "Organisation," "cheque," "travelled."
- Mobile first. 70%+ of Nigerian traffic is mobile.
- Use `next/image` everywhere. Never `<img>`.
- Use the `formatNaira()` helper from `lib/format.ts` — never hardcode the ₦ symbol.
- Test form paths end-to-end before merging.
- Gate admin routes with Supabase Auth middleware AND an explicit role check in the route handler. Never trust the client.
- Log every AI tool call and guardrail trigger to the database.

### Don't

- Don't ship the AI without the guardrails from `docs/ai-concierge.md`. Non-negotiable.
- Don't let the AI talk about prices, documents, or timelines it can't verify against the database.
- Don't let the AI negotiate. Ever.
- Don't auto-publish social or email content. The AI drafts, humans send.
- Don't commit API keys or secrets. Vercel env vars + Supabase secrets only.
- Don't expose Supabase service-role keys to the client.
- Don't use carousels on the hero.
- Don't use Inter, Roboto, Poppins, Montserrat. See `docs/brand.md` for the fonts to use.
- Don't use purple gradients, glassmorphism, or any generic "AI template" aesthetic.
- Don't name the blog "Blog." It's "Journal."
- Don't skip loading/error states on async components.
- Don't commit `console.log` statements.
- Don't let the AI escalate and then continue chatting. Once escalated, it goes quiet.
- Don't deploy without `pnpm typecheck && pnpm lint && pnpm test` clean.

### Hard constraints

- No scraped listings from competitors (PropertyPro, Nigeria Property Centre, etc.). Every listing is a verified Sunwealth listing.
- No fake testimonials. Omit over fabricate.
- No client-uploaded documents (title deeds, survey plans) in public storage. Private bucket, signed URLs expiring in 1 hour.
- No AI-generated property photos. Real photos only.
- No persuasive content attributing fictional quotes to real people.
- The AI must never claim to be human. If asked: "I'm an AI concierge. I can answer most questions and I'll connect you with a human whenever you'd prefer — just ask."

---

## 4. Working Rules

### Before starting any task

1. Read this file.
2. Read the relevant doc in `docs/` for the area you're touching.
3. Check `lib/types.ts` — everything downstream depends on it.
4. Run `pnpm typecheck && pnpm lint` — must be clean before you edit anything.

### Before writing code

1. **Propose a plan.** List the files you'll touch, the key changes, and any open questions. Wait for approval.
2. Don't write code until the plan is approved.
3. Never touch more than one logical section at a time.

### While writing code

1. If you're unsure, ask. Don't guess.
2. If you deviate from the relevant doc, say so explicitly and explain why.
3. Match existing patterns. If you introduce a new pattern, justify it.

### After writing code

1. Run `pnpm typecheck && pnpm lint`. Fix before continuing.
2. Show the diff summary. Don't bury changes in long explanations.
3. Flag anything incomplete or assumed.

### When you deviate from these docs

If the spec is wrong or missing something, say so — don't silently work around it. Propose a doc update in the same PR.

### When you're unsure

Pick the simpler, quieter choice. Sunwealth sells ₦500M duplexes to people in Mayfair. Gravitas beats cleverness. If it feels showy, cut it.

---

## 5. Critical Numbers and Facts (don't guess)

Things Claude Code often invents. These are the real values:

- **Phone**: +234 903 837 9755
- **RC number**: 1739523
- **Instagram handles**: @sunwealthltd (sales), @sunwealth_rent.ng (rent), @sunwealth_landandacres (land)
- **Canonical domain**: `sunwealthrealestate.com` (verify registration before committing to this)
- **Model strings**: `gpt-4o-mini` (concierge and utility), `text-embedding-3-small` (embeddings). Never hardcode — read from env (`OPENAI_CONCIERGE_MODEL`, `OPENAI_UTILITY_MODEL`, `OPENAI_EMBEDDING_MODEL`). See `docs/ai-concierge.md` for the vendor-switch history.
- **Primary currency**: NGN. Display symbol: ₦. Use `formatNaira()`.

---

*This file is the project's map, not its manual. Keep it short. Every time it gets long, move detail into `docs/`.*
