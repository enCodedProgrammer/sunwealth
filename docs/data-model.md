# Data Model

Referenced by: `CLAUDE.md` section 2.

The schema is small but load-bearing. Every consumer depends on these shapes. Never change a type without updating every reader.

---

## TypeScript types

Live in `lib/types.ts`:

```ts
type UUID = string;
type ISODate = string;

export type PropertyCategory =
  | 'fully-detached-duplex'
  | 'semi-detached-duplex'
  | 'terrace-duplex'
  | 'bungalow'
  | 'apartment'
  | 'penthouse'
  | 'maisonette'
  | 'land';

export type PropertyStatus = 'available' | 'under-offer' | 'sold' | 'let';

export type ListingType = 'sale' | 'rent' | 'shortlet';

export type DocumentType =
  | 'C of O'
  | "Governor's Consent"
  | 'Deed of Assignment'
  | 'Registered Survey'
  | 'Building Approval'
  | 'Excision';

export type Property = {
  id: UUID;
  slug: string;                        // URL-safe, unique
  title: string;
  category: PropertyCategory;
  listingType: ListingType;
  status: PropertyStatus;
  subBrand: 'sales' | 'rent' | 'land';  // Which sub-brand owns this listing
  location: {
    area: string;                      // "Banana Island"
    city: 'Lagos';
    state: string;                     // "Lagos State"
    coordinates?: { lat: number; lng: number };
  };
  price: {
    amount: number;
    currency: 'NGN';
    basis: 'outright' | 'per-annum' | 'per-night' | 'per-plot' | 'per-sqm';
  };
  size: { value: number; unit: 'sqm' | 'plot' | 'acre' };
  bedrooms?: number;
  bathrooms?: number;
  features: string[];                  // ["Swimming pool", "BQ", "24/7 power", ...]
  documents: DocumentType[];
  images: { src: string; alt: string; isPrimary?: boolean; order: number }[];
  description: string;                 // markdown
  nearbyLandmarks?: string[];
  paymentPlans?: { label: string; duration: string; note?: string }[];
  virtualTourUrl?: string;             // Matterport or YouTube
  publishedAt: ISODate;
  updatedAt: ISODate;
};

export type LeadSource = 'website' | 'whatsapp' | 'instagram-dm' | 'referral' | 'google';

export type LeadStatus =
  | 'new'
  | 'qualified'
  | 'inspection-booked'
  | 'negotiating'
  | 'closed-won'
  | 'closed-lost'
  | 'cold';

export type Lead = {
  id: UUID;
  name?: string;
  email?: string;
  phone?: string;
  whatsapp?: string;
  country?: string;                    // ISO code, "GB" | "US" | "NG" ...
  isDiaspora: boolean;
  source: LeadSource;
  firstSeenAt: ISODate;
  lastContactAt: ISODate;
  status: LeadStatus;
  score: number;                       // 0-100
  budget?: { min?: number; max?: number; currency: 'NGN' | 'USD' | 'GBP' };
  interestedCategories: PropertyCategory[];
  interestedAreas: string[];
  assignedAgentId?: UUID;
  propertiesInterestedIn: UUID[];      // FK -> Property.id
  notes: string;                       // human-edited
  tags: string[];
};

export type ConciergeConversation = {
  id: UUID;
  leadId?: UUID;                       // null until contact info captured
  channel: 'website' | 'whatsapp';
  sessionId: string;
  messages: ConciergeMessage[];
  escalated: boolean;                  // true once handed to human
  escalationReason?: string;
  startedAt: ISODate;
  lastMessageAt: ISODate;
};

export type ConciergeMessage = {
  role: 'user' | 'assistant' | 'system' | 'tool';
  content: string;
  toolCalls?: { name: string; input: unknown; output: unknown }[];
  timestamp: ISODate;
};

export type KnowledgeDocument = {
  id: UUID;
  title: string;
  category: 'verification' | 'payment' | 'diaspora' | 'legal' | 'company' | 'faq';
  content: string;                     // markdown, edited by staff
  embedding?: number[];                // pgvector
  updatedAt: ISODate;
  updatedBy: UUID;                     // staff user
};

export type Agent = {
  id: UUID;
  name: string;
  role: 'senior' | 'junior' | 'admin';
  subBrand: 'sales' | 'rent' | 'land' | 'all';
  email: string;
  whatsapp: string;
  calBookingUrl: string;               // Cal.com link
  isActive: boolean;
};

export type InspectionStatus =
  | 'pending'
  | 'confirmed'
  | 'completed'
  | 'cancelled'
  | 'no-show';

export type InspectionRequest = {
  id: UUID;
  propertyId: UUID;                    // FK -> Property.id
  leadId?: UUID;                       // FK -> Lead.id (nullable: captured pre-lead)
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
  preferredAt?: ISODate;
  isVirtual: boolean;
  status: InspectionStatus;
  notes?: string;
  calBookingId?: string;               // Cal.com booking reference
  createdAt: ISODate;
  updatedAt: ISODate;
};
```

## Supabase schema

Maps 1:1 to the types above. **Postgres columns are snake_case** (DB convention);
TypeScript types stay camelCase. The mapping happens at the data-access boundary
in `lib/db/*`. Never leak snake_case into components or the AI tools.

Tables:

- `properties` — primary listing table
- `leads` — CRM
- `concierge_conversations` — one row per chat session
- `concierge_messages` — individual messages within a conversation
- `knowledge_documents` — the AI's factual knowledge (embedded for semantic search)
- `agents` — staff records
- `inspection_requests` — bookings made through the site or AI

### Important constraints

- `properties.slug` unique, indexed.
- `properties.status` indexed — used in every public query.
- `leads.score` indexed — used by the hot-lead trigger.
- `knowledge_documents.embedding` uses `vector(1536)` (matches OpenAI text-embedding-3-small).
- Foreign keys: `leads.assignedAgentId → agents.id`, `concierge_conversations.leadId → leads.id`, `inspection_requests.propertyId → properties.id`.

### Row-Level Security (RLS)

Enable on every table from day one.

**Public tables (read-only for anonymous):**
```sql
-- properties: public can read only what's published and not sold
CREATE POLICY "public_read_available" ON properties
  FOR SELECT TO anon
  USING (status <> 'sold' AND sub_brand IS NOT NULL);
```

**Admin tables (staff only):**
```sql
-- leads, conversations, knowledge_documents, agents: only authenticated users with role
CREATE POLICY "admin_only" ON leads
  FOR ALL TO authenticated
  USING (auth.jwt() ->> 'role' IN ('admin', 'senior', 'junior'));
```

`auth.jwt() ->> 'role'` reads a root claim on the access token. Supabase stores
staff roles in `app_metadata` by default, so configure an **access-token hook**
that promotes `app_metadata.role` to a root `role` claim before the first staff
login. Without the hook, every staff policy silently denies.

**Private storage bucket:** for client documents (title deeds, surveys). Never public. Signed URLs with 1-hour expiry.

## Migrations

Store in `supabase/migrations/`. Conventional naming: `001_create_properties.sql`, `002_create_leads.sql`, etc. Never edit a migration after it's applied to production — create a new one.

## Seeding

Seed file at `supabase/seed.sql`. Should create:
- 3 placeholder properties (one for each sub-brand)
- 1 agent record
- 3 knowledge documents (one each: verification process, refund policy, diaspora buying process)

Placeholders are clearly marked with `[PLACEHOLDER]` in titles so they're not accidentally shipped to production.
