# Brand Guidelines

Referenced by: `CLAUDE.md` section 2.

---

## Positioning

"Nigeria's most trusted luxury real estate partner — from plot to keys, from Lagos to London." Sunwealth is not a hustle account with a link in bio. They are a serious real estate firm with an RC number, a team, and a three-brand portfolio. The site must make that visible.

## Voice

- **Confident, never boastful.** Avoid "NO.1 TRUSTED REALTOR" shouting. Should feel like Sotheby's International, not a WhatsApp broadcast.
- **Specific over vague.** "5-bedroom fully detached duplex, Banana Island, ₦850M, C of O, fully fitted kitchen, 7-car garage" — never "luxury home in prime location."
- **Diaspora-aware.** Every piece of copy should read as if it's being scanned by someone in Houston checking it on their phone at 11 PM.
- **British English.** "Organisation," "cheque," "travelled." Our diaspora buyers skew UK/Commonwealth.
- **Don't perform.** No "✨ welcome to paradise ✨" copy. Plain English with gravitas.

## Color system

Build as CSS variables in `styles/globals.css`:

```css
--sun-ink:         #0B0E13;   /* near-black for text and primary surfaces */
--sun-paper:       #FAF7F1;   /* warm off-white background */
--sun-gold:        #C9A254;   /* signature gold, used sparingly */
--sun-gold-deep:   #9A7C3F;   /* hover/active state for gold */
--sun-sage:        #5A6B5E;   /* muted green accent — secondary CTA */
--sun-stone:       #A8A49D;   /* neutral gray for meta text, borders */
--sun-sand:        #EEE7D6;   /* card backgrounds, subtle dividers */
--sun-ember:       #8A3A2A;   /* deep terracotta for status/danger */
```

Never use pure black, pure white, purple gradients, or any "AI template" palette. Gold is the signature accent — use it deliberately, never as a wash.

## Typography

- **Display/headings**: `Canela` or, if licensing is a concern, `Fraunces` (Google Fonts). Serif with optical sizing. 500 weight for headlines. Italics for pull-quotes and editorial moments.
- **Body**: `GT Walsheim` or `Satoshi`. Clean, slightly geometric sans.
- **Numbers and prices**: `JetBrains Mono` at 500 weight — tabular numerals so ₦850,000,000 aligns across listings.

Never use Inter, Roboto, Poppins, or Montserrat. They are exhausted.

Load fonts via `next/font/google` or `next/font/local`. Never via `<link>` tags — hurts LCP.

## Logo

The client has no formal wordmark. Render as a typographic mark in the display serif:

```
sunwealth
real estate
```

Lowercase. Two lines. A thin gold hairline (1px) between. Ship as SVG components in `components/brand/` — both light (on `--sun-ink`) and dark (on `--sun-paper`) variants. Never raster images.

## Photography

- Use real property photos supplied by the client.
- During development, use high-quality architectural photography from Unsplash as placeholder. Tag every placeholder with `data-placeholder="true"` so they're trivial to find and replace.
- Warm, late-afternoon light. Avoid the cold-blue "real estate MLS" look.
- No stock photos of people. Let the properties be the protagonists.

## Layout principles

- **Editorial, not catalog.** Think *Monocle* or Christie's, not Zillow.
- **Asymmetric heroes.** Generous negative space on landing pages; controlled density on listings.
- **One dominant element per page.** Never two things competing for attention.
- 12-column grid with 80px gutters on desktop. Break the grid for hero/feature sections.
- Gold is an accent, not a color block. Use it on CTAs, underline hairlines, and small marks — never as a background.

## Alt text

Written like a human looking at the image. Examples:

- ❌ "Duplex exterior"
- ✅ "Front elevation of 5-bedroom fully detached duplex at Banana Island showing stone-clad entrance and double garage"

## Do / Don't

### Do
- Lead every page with one statement and one image.
- Use tabular numerals for prices, sizes, dates.
- Reserve image and widget dimensions to prevent layout shift.

### Don't
- Don't use carousels on the hero.
- Don't use the generic "AI template" aesthetic (purple gradients, glassmorphism).
- Don't write marketing soup. "Experience the difference where integrity and results converge" — delete and rewrite.
