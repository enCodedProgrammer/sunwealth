# Technical Architecture

Referenced by: `CLAUDE.md` section 2.

---

## Stack (non-negotiable)

- **Framework**: Next.js 15+ with App Router, TypeScript strict mode.
- **Styling**: Tailwind CSS v4, design tokens as CSS variables (see `docs/brand.md`).
- **Database**: Supabase (Postgres + Storage + Auth). Use Row-Level Security from day one.
- **AI**: Claude API via the Anthropic SDK. `claude-sonnet-4-6` for the concierge, `claude-haiku-4-5-20251001` for lightweight tasks.
- **Vector store**: Supabase `pgvector` extension for the knowledge base. No separate Pinecone — keep it in one place.
- **Email**: Resend. Transactional templates in React Email.
- **WhatsApp**: WasenderAPI for v1 (cheaper, Nigerian-friendly). Migrate to Meta WhatsApp Business API when volume justifies approval.
- **Calendar**: Cal.com embedded booking (self-hosted free tier initially).
- **Forms**: React Hook Form + Zod.
- **Image CDN**: Cloudinary with unsigned uploads from the admin panel.
- **Analytics**: Vercel Analytics + Plausible (privacy-friendly, GDPR-safe for UK diaspora).
- **Deployment**: Vercel. Canonical domain: `sunwealthrealestate.com` (verify registration before work starts).

## Folder structure

```
/
├── app/
│   ├── (marketing)/
│   │   ├── page.tsx                      # Home
│   │   ├── about/page.tsx
│   │   ├── diaspora/page.tsx             # Dedicated landing for overseas buyers
│   │   ├── journal/
│   │   │   ├── page.tsx                  # Blog, called "Journal"
│   │   │   └── [slug]/page.tsx
│   │   └── contact/page.tsx
│   ├── properties/
│   │   ├── page.tsx                      # Sales listings + search
│   │   ├── [slug]/page.tsx               # Single property
│   │   └── _components/
│   ├── rentals/                          # Sunwealth Rent sub-brand
│   │   ├── page.tsx
│   │   └── [slug]/page.tsx
│   ├── land/                             # Sunwealth Land & Acres sub-brand
│   │   ├── page.tsx
│   │   └── [slug]/page.tsx
│   ├── inspections/
│   │   └── book/[propertyId]/page.tsx    # Cal.com booking embed
│   ├── admin/                            # Staff-facing dashboard (Supabase auth)
│   │   ├── layout.tsx                    # Protected route wrapper
│   │   ├── page.tsx                      # Dashboard overview
│   │   ├── properties/
│   │   ├── leads/
│   │   ├── conversations/                # AI transcripts for review
│   │   └── knowledge-base/               # Edit the AI's facts
│   └── api/
│       ├── concierge/
│       │   ├── stream/route.ts           # AI streaming endpoint
│       │   └── whatsapp/route.ts         # WhatsApp webhook receiver
│       ├── properties/
│       │   └── search/route.ts           # Search endpoint (used by AI and UI)
│       ├── inquiries/route.ts
│       ├── inspection-requests/route.ts
│       ├── admin/
│       │   ├── properties/route.ts       # CRUD for listings
│       │   └── leads/route.ts
│       └── webhooks/
│           ├── cal-com/route.ts
│           └── resend/route.ts
├── components/
│   ├── ui/                               # Button, Card, Input primitives
│   ├── brand/                            # Logo, wordmarks
│   ├── property/                         # PropertyCard, PropertyHero, PriceBlock
│   ├── concierge/                        # Chat widget, message bubbles
│   ├── admin/
│   └── marketing/
├── lib/
│   ├── ai/
│   │   ├── concierge.ts                  # System prompts, message handling
│   │   ├── tools.ts                      # Tool definitions the AI can call
│   │   ├── embeddings.ts                 # Knowledge base vector ops
│   │   └── guardrails.ts                 # Input/output safety checks
│   ├── db/
│   │   ├── schema.ts                     # Supabase table types
│   │   ├── properties.ts                 # Query helpers
│   │   └── leads.ts
│   ├── integrations/
│   │   ├── whatsapp.ts                   # WasenderAPI client
│   │   ├── resend.ts                     # Email sender
│   │   └── cal.ts                        # Cal.com embed helpers
│   ├── automation/
│   │   ├── listing-ingestion.ts
│   │   ├── lead-scoring.ts
│   │   └── follow-up.ts
│   ├── format.ts                         # formatNaira, formatArea, formatDate
│   └── types.ts
├── content/
│   └── journal/*.mdx
├── public/
│   └── images/
└── styles/
    └── globals.css
```

## Environment variables

All secrets live in Vercel env vars and `.env.local` (never committed):

```
ANTHROPIC_API_KEY
CLAUDE_CONCIERGE_MODEL=claude-sonnet-4-6
CLAUDE_UTILITY_MODEL=claude-haiku-4-5-20251001
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
RESEND_API_KEY
WASENDER_API_KEY
CLOUDINARY_CLOUD_NAME
CLOUDINARY_UPLOAD_PRESET
CAL_COM_WEBHOOK_SECRET
```

Never read model strings from component files. Always `process.env.CLAUDE_CONCIERGE_MODEL` so we can swap.

## Performance targets

- **LCP** < 2.0s on 4G, Lagos network conditions.
- **Concierge first-token latency** < 800ms.
- **Total JS bundle** for landing page < 170KB gzipped.
- **CLS** < 0.05 — reserve image and chat widget dimensions.
- **TTFB** < 600ms from Lagos, < 400ms from London.

Test on a real mid-tier Android over throttled 3G before every release.

## Accessibility

- **WCAG 2.2 AA.** Lighthouse accessibility ≥ 95 on every route.
- Concierge chat must be fully keyboard navigable with visible focus states.
- Color contrast: body text on `--sun-paper` uses `--sun-ink` only, not `--sun-stone`.
- Every interactive element has a visible focus ring. Never `outline: none` without a replacement.
- Forms have proper `<label>` elements, not placeholder-as-label.
- No auto-playing audio or video.
- `prefers-reduced-motion` respected for any animations.

## Security

- All admin routes gated by Supabase Auth middleware AND a server-side role check.
- RLS on every Supabase table from day one.
- Service-role key never exposed to the client.
- Signed URLs (1 hour expiry) for any private storage access.
- Rate limiting on all public API endpoints (see `docs/ai-concierge.md` for concierge-specific limits).
- Never log PII in plaintext. Redact BVN, NIN, card numbers before persisting any message or event.
