# Automation Pipelines

Referenced by: `CLAUDE.md` section 2.

Four pipelines. Each one must be idempotent, observable, and reversible.

---

## Pipeline 1 — Listing Ingestion

**Trigger**: Admin saves a new property with `status: 'available'`.

### What happens

1. Cloudinary optimizes images (WebP/AVIF, multiple sizes).
2. Property page deploys on next build (ISR revalidation every 60 seconds; admin can force revalidate).
3. Claude Haiku generates, for staff review (not auto-publish):
   - An Instagram caption (hook + key features + CTA + 8-12 hashtags).
   - A WhatsApp broadcast message (concise, with inspection booking link).
   - An email newsletter blurb (for subscribers filtered by matching interest).
4. Staff reviews the generated content at `/admin/properties/[id]/marketing` and clicks "Send" per channel.
5. SEO sitemap regenerates, new URL pinged to Google.

### Never auto-publish

Social or email content always requires human review. The AI drafts, humans send. The moment we auto-publish a wrong price to 97K followers, we lose the client.

### Implementation

- `lib/automation/listing-ingestion.ts` exports `generateMarketingDrafts(propertyId: string)`
- Called from `app/api/admin/properties/route.ts` after successful property insert
- Drafts stored on `properties.marketingDrafts` (JSONB)
- "Send" actions are separate endpoints: `/api/admin/properties/[id]/send-instagram`, etc.

---

## Pipeline 2 — Inspection Booking

**Trigger**: User clicks "Book Inspection" on a property page OR the concierge calls `request_inspection`.

### What happens

1. System pulls the assigned agent's Cal.com schedule.
2. User picks a slot (in-person or video).
3. On confirmation:
   - Calendar invite sent to user + agent (Google/Outlook via Cal.com).
   - Confirmation email to user (via Resend) with property details and what to bring.
   - WhatsApp confirmation to user (if whatsapp number provided, via WasenderAPI).
   - Agent gets a WhatsApp ping: *"New inspection booked: [property], [datetime], [client name]."*
4. Auto-reminders:
   - 24h before: email + WhatsApp
   - 2h before: WhatsApp only
5. 1h after scheduled end: automatic feedback form sent to user. *"How was your inspection?"* — 1-5 rating + open text.
6. Feedback responses surface in `/admin/conversations` for agent review.

### Cancellations and reschedules

Flow through Cal.com webhooks to `/api/webhooks/cal-com`:
- Update the `inspection_requests` record
- Update the `Lead` record (move status back or forward)
- Notify the agent via WhatsApp

### Implementation

- Cal.com webhook handler in `app/api/webhooks/cal-com/route.ts` (verify `CAL_COM_WEBHOOK_SECRET`)
- Cron-based reminders: `app/api/cron/inspection-reminders/route.ts` runs hourly
- Feedback form is a public page: `/inspections/[id]/feedback`

---

## Pipeline 3 — Lead Scoring and Routing

**Trigger**: Every new or updated Lead record (database trigger or application event).

### Scoring

Claude Haiku scores the lead 0-100 based on:

- Budget stated? (+20)
- Specific area mentioned? (+15)
- Timeline given? (+15)
- Diaspora? (+20)
- Contact info captured? (+15)
- Specific property of interest? (+15)

### Routing

- **Score ≥ 70 → hot**: WhatsApp + email alert to on-duty senior agent within 60 seconds of capture. Lead status auto-set to `qualified`.
- **Score 40-69 → warm**: assigned to a junior agent's queue, email within 5 minutes.
- **Score < 40 → nurture**: enters the drip sequence (Pipeline 4).

Scoring runs again every time new information is captured (user returns, sends another message, books an inspection).

### Bias safeguards

**Never score on personal characteristics** — only stated intent and engagement. The scoring prompt explicitly bans inferring by name, location suffix, or anything that could encode bias.

Example prompt directive:

> "Score based ONLY on: stated budget, stated location, stated timeline, whether they're abroad (from explicit self-description, not name or phone prefix), contact info provided, and specific property interest. Never infer wealth, ethnicity, or seriousness from names, phone prefixes, or email domains."

### Implementation

- `lib/automation/lead-scoring.ts` exports `scoreLead(leadId: string): Promise<number>`
- Called after every `Lead` insert/update via a Supabase database webhook
- Hot-lead notifications: `lib/automation/notifications.ts` → `notifyHotLead(leadId, agentId)`

---

## Pipeline 4 — Follow-up and Re-engagement

**Trigger**: Cron job at `/api/cron/follow-up`, runs hourly via Vercel Cron.

### What happens

For every lead with `status IN ('new', 'qualified', 'cold')` and `lastContactAt` in these windows:

- **Day 1 after inquiry, no agent reply**: AI drafts a personalized follow-up for agent review. Not auto-sent. Appears in `/admin/leads/[id]` with an "Approve & Send" button.
- **Day 3, no reply from lead**: send "here are 3 more matching properties" email, personalized via the Lead's interest filters.
- **Day 7, no engagement**: WhatsApp check-in (if number provided): *"Hi [name], any further thoughts on the Ikoyi duplex? Happy to line up inspections for other options."*
- **Day 14, no engagement**: mark `status: 'cold'`, enter re-engage queue.

### Re-engage queue

Weekly job:
- AI surfaces up to 20 cold leads with new matching properties published that week
- Appears in `/admin/leads?filter=re-engage-candidates`
- Human agent picks who to reach back out to (no auto-send for re-engage — these need a personal touch)

### Opt-out handling

Every auto-send includes a stop link:
- Email: standard unsubscribe footer
- WhatsApp: "Reply STOP to opt out"

Leads who opt out:
- Move to `status: 'closed-lost'` with reason `unsubscribed`
- Never receive another automated message
- Flag visible in admin: "Do not contact"

### Implementation

- `lib/automation/follow-up.ts` exports `runFollowUpCycle()`
- Vercel Cron entry in `vercel.json`:
  ```json
  {
    "crons": [
      { "path": "/api/cron/follow-up", "schedule": "0 * * * *" },
      { "path": "/api/cron/inspection-reminders", "schedule": "0 * * * *" },
      { "path": "/api/cron/re-engage", "schedule": "0 9 * * 1" }
    ]
  }
  ```

---

## Cross-cutting requirements

### Idempotency

Every pipeline step must be safe to re-run. If the cron fires twice, nothing should double-send. Use:
- Unique event IDs on every notification
- Status checks before side effects ("has the Day 3 email already been sent for this lead?")
- Database-level uniqueness constraints where possible

### Observability

Log every pipeline run to a structured `pipeline_events` table:
- `pipeline` (name)
- `event` (what happened)
- `leadId` / `propertyId` (context)
- `outcome` (success / skipped / failed)
- `error` (if failed)
- `timestamp`

Surface in admin dashboard. Failed events get an alert to the engineering email.

### Reversibility

Admin can:
- Cancel a scheduled follow-up before it sends
- Manually set a lead back to a previous status
- Retry a failed pipeline event

No pipeline ever takes an irreversible action without an explicit human trigger (e.g. sending Instagram posts).

---

## What's NOT automated (and shouldn't be)

- **Price negotiation** — humans only
- **Payment** — humans only, via verified bank transfer or escrow
- **Document verification** — humans + lawyers only
- **Instagram posting** — AI drafts, humans post
- **Customer responses to complaints or distress** — humans only, no AI
- **Onboarding new agents** — humans only
