# ArigatoMenu — Design System

Based on the "Foodnoms — Style Reference" (concept: a nutrition tracker). Adopted for
ArigatoMenu with the same surface, color, and layout decisions: **light theme, white
canvas, custom rounded geometric face, generous flat surfaces, and a signature 26px
border-radius applied everywhere.**

---

## 1. Design Principles / Do's

- **Flat.** No shadows anywhere. No gradients. No "3D" effects. Depth comes from
  layered flat surfaces, hairlines, and chromatic accents.
- **Rounded.** Every button, card, tag, and input uses the brand radius **26px**.
- **Two-tone headlines.** Section titles split into two phrases: the first in a
  chromatic accent (Ember Orange), the second in Graphite. Applies on `Hero`,
  `Problem`, `Kicker`, `PartnerPair`, and similar heading blocks.
- **Deliberate typography.** Display headlines `28–30px`, `line-height 1.1`.
  Micro text (captions, nav, prev sections) `12px`, weight `500–600`, wide
  letter-spacing, Graphite or Muted.
- **One color per surface.** A surface has one color and one purpose. Semantic colors
  (Ember / Verdant / Sky Blue) are reserved for meaning: brand, highlight, positive
  change, and negative change.
- **Optional vibrant gradients** *only* on the background of non-essential
  decorative slides — ArigatoMenu is flat (see above), so gradients are not used.

## 2. Don'ts

- No new chromatic colors (Grape Iris, Sunset Orange, etc.) outside this system.
- No shadows or gradients on navigation, cards, CTAs, or imagery surfaces.
- No pure black backgrounds outside the Dark App Store badge.
- No non-tonal changes in components: color accents only from this palette.

## 3. Color System

Semantic, app-level colors. **ArigatoMenu brand pair: Ember Orange (primary, brand) +
Verdant Green (highlight, "eat / enjoy").** Graphite & Paper White for neutrals.

| Token              | Hex       | Usage                                                     |
| ------------------ | --------- | --------------------------------------------------------- |
| `--color-ember-orange` | `#FF5406` | Brand — primary CTAs, headings, active states             |
| `--color-verdant-green` | `#00B33F` | Highlight — "楽しむ／食べる" 系のアクセント、成功状態      |
| `--color-signal-red-orange` | `#FF3400`   | Negative / error states                         |
| `--color-sky-blue` | `#00A9DD`   | Information / informational tags                |
| `--color-mist-blue`| `#72A2C5`   | Calm context (used sparingly)                   |
| `--color-graphite` | `#2F2F2F`   | Text / ink (main text color)                    |
| `--color-charcoal` | `#000000`   | Reserved for the dark App Store badge           |
| `--color-fog`      | `#F5F5F5`   | Page background for alternate sections, muted fills |
| `--color-paper-white` | `#FFFFFF` | Canvas / surface default                        |
| `--color-muted-text`  | `#6B6B6B` | Secondary text (derived)                       |
| `--color-hairline-border` | `#EDEDED` | Cards & dividers                       |

> In the codebase these map to CSS tokens in `src/app/globals.css`
> (`--color-primary`, `--color-accent`, `--color-muted`, `--color-border`, …).
> Only semantic tokens are referenced in components.
> `#2b2b2b`–toned "graphite" replaces warm brown ink; `#F7F3EC` paper replaces
> editorial cream.

## 4. Typography

| Face                | Usage                    | Weight            |
| ------------------- | ------------------------ | ----------------- |
| Noto Sans JP (display) | Headlines, brand wordmark | 700–900            |
| Noto Sans JP (body)    | Body text                | 400–500            |
| Micro (system sans)    | Captions, nav, prev sections | 500–600, wide tracking |

- **Display headlines:** `28–30px`, `line-height 1.1`, weight `800/900`, two-tone
  (Ember first phrase + Graphite second). Hero may go to `46–60px`.
- **Body:** `16px`, `line-height 1.6`, Graphite. Secondary text: Muted (`#6B6B6B`).
- **Micro:** `12px`, weight `500–600`, `letter-spacing` wide, Graphite/Muted.
- JP-first: the Latin-friendly display feel of Aquawax Pro is substituted by the
  rounded geometric **Noto Sans JP**; Latin extras (badges, eyebrow) use the same
  family for cohesion. If a decorative Latin face is ever needed, use
  **Nunito Sans** or **DM Sans** as a substitute for Aquawax Pro.

## 5. Spacing System

Base spacing unit: **8px** (`--spacing-8` … `--spacing-96`).

- Small paddings: `8 / 12 / 16 / 24px`
- Page section vertical padding: `96px`
- Card horizontal padding: `32px`
- Card vertical padding: `24–32px`
- Gap under section headings: `48px`

## 6. Radii

- **Brand radius — 26px.** *Everywhere:* buttons, cards, tags, inputs, phone frame.
- Tag / pill radius: `full` (when the element is small, use full; otherwise the 26px rule
  applies). In practice all main surfaces get exactly `26px`.

## 7. Surfaces & Imagery

- **Canvas:** Paper White. Alternate sections use Fog (`#F5F5F5`).
- **Cards:** Border Hairline (`#EDEDED`, `1px`), background Paper White, radius 26px.
- **CTA cards:** full-bleed chromatic Ember band (flat). White pill button inverse.
- **Imagery:** real food photos inside the phone frame; solid chromatic Protective Panels
  (e.g. Verdant Green) for placeholder blocks; chromium frames 1px hairline.
- **No shadows, no rounded-deep elevation.** Separation via hairlines + color.

## 8. Layout

- **Architecture:** sticky header (48–64px), full-width breakaway sections, max-width
  page container `1200px` with generous outer padding, centered columns.
- **Alternative "page flip"** design concept: chromatic filled sections alternating with
  white — ArigatoMenu uses Fog instead.

## 9. Components

### 9.1 Brand wordmark
Mark = 40px filled **Ember Orange** squircle (26px radius) with the white「あ」glyph.
Wordmark = "Arigato**Menu**" in display weight; 「Menu」in Ember, or full graphite.
Optional micro caption: ありがとうメニュー.

### 9.2 Header button
Primary CTA ("無料ではじめる"): Ember filled, 26px radius, hover `#FF5406`-darker (via
`hover:bg-primary/80`), scale subtle. Secondary: header link (Graphite → hover).

### 9.3 Two-tone headline
`<h2>` split — e.g. `紙のメニューを、<span class="text-primary">もっと自由に。</span>`
First phrase chromatic, rest Graphite. Keep on one visual two-line structure.

### 9.4 Phone mockup (hero / features)
- Frame: Paper White, `border: 1px hairline`, radius 26px, flat (no shadow).
- Spec: status/brand row → special banner (Ember bullet) → featured dish panel (solid
  Verdant flat panel, white content) → dish list → category chips.
- Chromatic accents: dietary chips Ember/Verdant tints.

### 9.5 Press grid (not used — ArigatoMenu has no media partners)
Rendered only when 3+ real logos exist. Reserved.

### 9.6 Download CTA card (final)
Full-width **Ember** band, white display headline, white pill button ("無料ではじめる",
Graphite label), micro caption line ("クレジットカード不要・初期費用ゼロ").

### 9.7 App data cards (feature grid)
3-column grid on white; each card: hairline border, 26px radius, icon chip
(Ember/Verdant tint circle), EN micro caption, JP bold title, muted body.

### 9.8 Chips / tags
Active: Graphite fill + white text. Inactive: white fill + hairline border + Graphite.
Dietary/allergen pills: Ember & Verdant tints (`bg-primary/10 text-primary`, etc.).

## 10. Example — Folio page style applied to the LP

Order on `/` (index): Header → Hero (two-tone + phone) → Problem (Fog) →
Features grid (White) → Usage 3-in-1 (Fog) → Onboarding steps + theming (White) →
FAQ (Fog) → Final CTA (Ember band) → Footer (White).

Implementation notes for engineers:
- Tokens: `src/app/globals.css` (see `:root`), fonts in `src/app/layout.tsx`.
- Use `border-border` hairlines; never `shadow-*`. Avoid gradients entirely.
- Radii: keep `--radius-*` all at `26px` (= `1.625rem`).
- Radius utility: `rounded-2xl`, `rounded-xl`, `rounded-lg` all resolve to 26px.