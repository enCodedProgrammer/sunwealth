# Property Search

Referenced by: `CLAUDE.md` section 2.

The search is used in three places: the public search page, the admin listing manager, and the AI concierge's `search_properties` tool. **One implementation. Never duplicate.**

---

## Endpoint

`GET /api/properties/search?q=...&filters=...`

### Query params (all optional)

- `q` — free text, matches title, description, area
- `listingType` — `sale` | `rent` | `shortlet`
- `category` — comma-separated `PropertyCategory` values
- `area` — comma-separated area names
- `priceMin`, `priceMax` — integers in NGN
- `bedroomsMin` — integer
- `documents` — comma-separated, matches properties containing ALL listed docs
- `sortBy` — `price-asc` | `price-desc` | `newest` (default: `newest`)
- `limit`, `offset` — pagination. Default limit 12 for UI, 5 for AI.
- `status` — default `available`. Staff can pass `all` when authenticated.

### Response shape

Lean DTO — never return 10MB of data when a card only needs 8 fields:

```ts
type PropertySearchResult = {
  id: string;
  slug: string;
  title: string;
  category: PropertyCategory;
  listingType: ListingType;
  location: { area: string; city: string };
  price: { amount: number; currency: string; basis: string };
  bedrooms?: number;
  size: { value: number; unit: string };
  documents: DocumentType[];
  primaryImage: string;
  publishedAt: string;
};
```

```ts
type SearchResponse = {
  results: PropertySearchResult[];
  total: number;
  offset: number;
  limit: number;
};
```

---

## Implementation

### Database

PostgREST (the layer Supabase-js talks to) can only filter on real columns — it
can't target functional indexes. So the two derived values that search needs are
**stored generated columns**, populated automatically on insert/update:

```sql
price_amount BIGINT GENERATED ALWAYS AS (((price->>'amount')::bigint)) STORED,
search_text  TSVECTOR GENERATED ALWAYS AS (
               to_tsvector('english', coalesce(title, '') || ' ' || coalesce(description, ''))
             ) STORED,
```

Indexes:

- `search_text` — GIN, used for free-text `q` via `.textSearch('search_text', q, { type: 'websearch' })`.
- `price_amount` — btree, used for `priceMin`/`priceMax` via `.gte()`/`.lte()`.
- `location` — GIN on the JSONB column; area filter uses `.in('location->>area', [...])`.
- `documents` — GIN on the TEXT[] column; document filter uses `.contains('documents', [...])`.
- `status`, `sub_brand`, `listing_type`, `category`, `published_at` — plain btree indexes for the common filters and the default sort.

### Query builder

Build the query in `lib/db/properties.ts`:

```ts
export async function searchProperties(
  params: SearchParams,
  { asStaff = false }: { asStaff?: boolean } = {}
): Promise<SearchResponse> { ... }
```

One function. Used by:
- `app/api/properties/search/route.ts` (public endpoint)
- `lib/ai/tools.ts` (the AI tool calls this directly, bypassing HTTP)
- `app/admin/properties/page.tsx` (staff view — pass `asStaff: true` to see all statuses)

---

## Search UI — `/properties` page

### Layout

**Desktop (≥1024px):**
- Left sidebar (280px fixed): filter controls, sticky, scrolls independently.
- Main area: sort dropdown top-right, results grid below.
- 3-column results grid.

**Tablet (768-1023px):**
- Top filter bar collapses into a "Filters" button that opens a drawer.
- 2-column results grid.

**Mobile (<768px):**
- "Filters" button in sticky header opens bottom-sheet drawer.
- 1-column results grid.

### Filter controls

In this order, top to bottom:

1. **Listing type** — segmented control: Buy / Rent / Shortlet
2. **Area** — multi-select chip list, top 8 areas visible, "Show all" expands
3. **Price range** — dual slider with numeric NGN inputs on both ends
4. **Bedrooms** — chip selector: Any / 1 / 2 / 3 / 4 / 5+
5. **Document type** — multi-select checkboxes (C of O, Governor's Consent, etc.)
6. **Category** — multi-select (Duplex / Bungalow / Apartment / etc.)

Below the filters: "Clear all" button, and a count: "127 properties match".

### Sort options

Top-right of results:
- Newest (default)
- Price: low to high
- Price: high to low

### Results grid

Editorial cards. Each card:
- Large primary image (16:9) with subtle hover zoom
- Top-left corner: status badge if under-offer (gold) or let (stone)
- Title in display serif (Canela/Fraunces), 20px
- Area + city in sans, stone color, 14px
- Price in JetBrains Mono, 18px, ink color
- Icon row: bedrooms, bathrooms, size
- Document badges: small gold pills for "C of O" etc.

Cards link to `/properties/[slug]`.

### Empty state

When filters return 0 results:

> **No properties match those filters.**
> Try widening the price range, or ask our AI concierge to find something similar.
>
> [Ask the concierge →]

The button opens the chat widget pre-loaded with the current filters as context ("The user is looking for [filters] but we have no matches. Help them relax their criteria or suggest alternatives.")

### URL state

All filters are reflected in the URL as query params:

```
/properties?listingType=sale&area=ikoyi,banana-island&priceMin=200000000&bedroomsMin=4&sortBy=price-desc
```

This makes filters shareable and back-button-able.

---

## Saved searches (Phase 2)

Authenticated users can save a filter combination and get email alerts when new matches publish. Table: `saved_searches` with `userId`, `filters` (JSONB), `frequency` (`immediate` | `daily` | `weekly`).

---

## Performance notes

- Cache public search responses for 60 seconds at the edge (Vercel).
- Paginate, never load > 50 results in one response.
- Use `next/image` for all card images with appropriate `sizes` attribute.
- Filter sidebar state is client-side (URL params), not a server round-trip on every click.
- Debounce the free-text `q` input at 300ms.
