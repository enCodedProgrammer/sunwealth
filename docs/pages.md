# Pages

Referenced by: `CLAUDE.md` section 2.

Page-by-page specs. For brand and layout principles, see `docs/brand.md`. For search-specific UX, see `docs/search.md`.

---

## Home `/`

### Hero
One statement, one image. Suggested headline: *"Lagos luxury property, verified for the way you live now."* Sub-line under: *"Sales, rentals, and land across Ikoyi, Lekki, and VGC — with a team that answers at 2 AM London time."*

Hero image rotates server-side between 3 hand-picked properties (rebuilt on publish, not a client carousel). The hero has:
- The image (full-bleed on mobile, 60% width on desktop with text on the right)
- Headline + sub-line
- Two CTAs: "Browse properties" (primary, gold) and "Chat with our concierge" (secondary, sage, opens widget)

### Below hero (in order)

1. **Three intro blocks** — Sales, Rentals, Land. Each is a card linking to the respective section with a one-line description and a single representative image.
2. **Featured this week** — strip of 3 current listings, manually curated via admin.
3. **"How we work with diaspora buyers"** — 4-step section, short and confident:
   - Discover properties from anywhere
   - Virtual inspection with a senior agent
   - Documents verified before you wire
   - Keys handed over, remote or on the ground
   Each step: one-line description, a tiny icon, no fluff.
4. **Latest Journal entry** — single editorial card, links to `/journal/[slug]`.
5. **Footer** — see Global Components.

### Concierge

Persistent floating widget, bottom-right. See `docs/ai-concierge.md`.

---

## Properties `/properties` and `/properties/[slug]`

See `docs/search.md` for the index page.

### Single property `/properties/[slug]`

**Above the fold:**
- Full-width primary image (16:9)
- Image gallery below, click opens lightbox
- Price and key specs in a prominent block, JetBrains Mono for numbers

**Layout (desktop):**
- Left column (8/12): description, features, location, documents, payment plans
- Right column (4/12): sticky sidebar with price, CTAs, agent info

**Right sidebar:**
- Price (large, JetBrains Mono)
- Status badge (Available / Under Offer)
- **Book inspection** button (primary, gold) — opens inspection flow
- **Ask the concierge about this property** — opens chat pre-populated with the property context
- WhatsApp deep link: `https://wa.me/2349038379755?text=Hi, I'm interested in [Property Name] — [URL]`
- Call link: `tel:+2349038379755`
- Agent photo and name (assigned agent)

**Tabs below the fold:**
- Overview (description)
- Features (list of amenities)
- Location (map embed — OpenStreetMap via MapLibre, not Google Maps)
- Documents (C of O / Governor's Consent / etc. clearly displayed)
- Payment plans (if applicable)

**Structured data:** every property page has `schema.org/RealEstateListing` JSON-LD for Google rich results.

**Related properties:** 3 cards at the bottom showing similar listings (same area or same price band).

---

## Rentals `/rentals` and `/rentals/[slug]`

Same shape as Properties but filters by `listingType: 'rent' | 'shortlet'`. Price basis shows "per annum" or "per night" accordingly. Separate sub-brand header: "Sunwealth Rent".

---

## Land `/land` and `/land/[slug]`

Same shape but simplified:
- No bedrooms/bathrooms
- Emphasis on plot size, document status (C of O / Governor's Consent / Excision)
- Nearest landmarks prominent
- Area masterplan if available

Separate sub-brand header: "Sunwealth Land & Acres".

---

## Diaspora `/diaspora`

**Priority #1 for SEO.** Target keywords: "buy property in Lagos from abroad", "diaspora real estate Nigeria", "verified property Lagos", "Lekki property for Nigerians in UK".

### Sections (in order)

1. **Hero** — *"Buying property in Lagos from London, Houston, or Toronto? We built this for you."* Sub: *"Every property verified. Every document checked. Every step visible."*

2. **"How we verify every property before you wire a kobo"** — the actual 6-step verification process, with photos of Sunwealth staff on site.

3. **"What a virtual inspection looks like"** — embedded sample video (2-3 mins).

4. **"How remote purchase works"** — step by step:
   - Discovery (browse or chat with concierge)
   - Virtual inspection (live video walk-through with a senior agent)
   - Document verification (we send you a summary; your lawyer can verify)
   - Escrow (payment flows through a verified third party)
   - Power of Attorney (optional, for remote signing)
   - Handover (physical or via POA)

5. **"Our refund policy"** — plain English, no legalese. Single paragraph.

6. **Verified testimonials** — real diaspora clients with full names and countries, with written permission. If we don't have these yet, omit the section. Never fabricate.

7. **CTA** — "Book a 30-minute video call with a senior consultant" with Cal.com embed.

---

## Journal `/journal` and `/journal/[slug]`

Editorial content, MDX.

### Index page
- Grid of article cards, 2 columns desktop
- Each card: feature image, category, title, reading time, date
- Filter by category: Market / Legal / Diaspora / Areas / Inspection Stories

### Article page
- Title in display serif, large
- Author name + photo, date, reading time
- Hero image
- Article body in readable sans, max 680px wide
- Related properties section at the bottom (same area or category as article tags)
- Schema.org Article structured data

### Topics to prioritize
- Lagos market trends
- C of O vs Governor's Consent explained
- How to value Lekki Phase 1 vs Phase 2
- Diaspora buyer guides
- Inside a Sunwealth inspection

**Call it "Journal", never "Blog."**

---

## About `/about`

- Founder's story (short, confident, no hustle narrative)
- Team grid (real names, real photos — only with explicit consent)
- RC number: **1739523**
- Registered office address
- Awards, press mentions
- Google Maps embed of the physical office

---

## Contact `/contact`

Three equal-weight methods, side by side on desktop:

1. **Visit** — address, Google Maps pin, office hours
2. **Call** — **+234 903 837 9755**, with a WhatsApp button
3. **Email** — direct inbox, typically replies within 4 working hours

Inquiry form below:
- Name, email, phone (optional)
- Interest: Sales / Rent / Land / Other
- Message (textarea)
- Submit

**Never auto-focus the form on page load.**

Form submission creates a `Lead` record with `source: 'website'`, triggers the lead scoring pipeline (see `docs/automation.md`).

---

## Inspections `/inspections/book/[propertyId]`

Cal.com embed with the assigned agent's availability. Flow:
1. User picks "In-person" or "Video call"
2. Pick a slot
3. Enter contact info (name, email, phone, country)
4. Confirm

On confirmation, the pipeline in `docs/automation.md` (Pipeline 2) fires.

---

## Admin `/admin/*`

Staff-only. Supabase Auth with email + password, MFA required for senior/admin roles.

### Routes

- `/admin` — dashboard: today's leads, upcoming inspections, AI escalations waiting for response, listing inventory by status.
- `/admin/properties` — CRUD listings, upload photos (drag-drop to Cloudinary), preview, publish/unpublish.
- `/admin/properties/[id]/marketing` — review AI-drafted Instagram caption, WhatsApp broadcast, email newsletter blurb.
- `/admin/leads` — full CRM view, filter by score/source/status, bulk tag, assign to agent, notes timeline.
- `/admin/conversations` — read AI transcripts, approve or edit AI-drafted follow-ups, mark escalations resolved.
- `/admin/knowledge-base` — edit the AI's factual knowledge. Every save re-embeds the document. **This is the single most important admin surface — the AI is only as good as the knowledge base.**
- `/admin/settings` — agents, sub-brand routing, automation toggles, API keys (encrypted, never shown in full after entry).

### Access control

Middleware at `app/admin/layout.tsx`:
1. Check Supabase session.
2. Check user has `role` in `('admin', 'senior', 'junior')`.
3. For sensitive routes (`/admin/settings`, `/admin/knowledge-base`), require `role` in `('admin', 'senior')`.

Never trust the client. Every API route under `/api/admin/*` double-checks the role server-side.

---

## Global components

### Header
- Logo (links to `/`)
- Nav: Properties / Rentals / Land / Diaspora / Journal / About / Contact
- Mobile: hamburger drawer
- No cart, no account for public users (until saved-search feature in Phase 2)

### Footer
- Three columns on desktop:
  - **Sunwealth** — About, Contact, Journal, Diaspora
  - **Browse** — Properties, Rentals, Land
  - **Connect** — WhatsApp, Call, Email, Instagram @sunwealthltd
- RC number, address, © year
- Never include scam-bait "Subscribe for 500K off!" newsletters. Professional firms don't do that.

### Concierge widget
- Floating button bottom-right
- Expanded: 380px wide, 580px tall on desktop
- Full-screen on mobile
- Always visible, never auto-opens (respect the user)
- See `docs/ai-concierge.md` for behavior
