# Our Love Map — Design System

> _"Every love story has a map. This one is yours."_

**Our Love Map** is a romantic SaaS that lets couples build an interactive map page — photos, messages, and meaningful locations from their relationship — delivered via QR Code through email. Think of it as a keepsake hybrid of a love letter and Google Maps: a private, beautifully designed corner of the internet for two.

This design system is the visual + tonal source of truth for the product.

---

## Product overview

Our Love Map has **two distinct surfaces**, each with its own theme:

| Surface | Theme | Background | Purpose |
|---|---|---|---|
| **1. Landing & Wizard** | Light, warm, inviting | `#FBF5F0` cream | Marketing, onboarding, "build your map" form flow |
| **2. Public map page** | Dark, intimate, cinematic | `#25212A` near-black | The finished keepsake — opened on a phone via QR |

The light surface is about **convincing and guiding** — it sells the dream and holds the user's hand through the creation wizard. The dark surface is about **revelation and emotion** — when the recipient scans the QR, the experience should feel like opening a love letter at night by candlelight.

Stack: **React + Vite + TailwindCSS + Framer Motion**. Mobile-first.

## Provided inputs

- `uploads/logo.svg` — the brand mark (a stylized connected-dots motif → route/map metaphor)
- Brand notes: colors, typography, dual-theme concept, stack, tone ("romantic, modern, emotional")

No codebase, Figma, or existing copy was provided — this system is built from brand fundamentals up, with clearly labeled assumptions flagged for review.

---

## Content fundamentals

### Voice
Romantic but not saccharine. Modern but not cold. The product is Portuguese-first (Brazilian market: _"SaaS romântico"_), so bilingual templates are provided — Portuguese primary, English as fallback for this system's preview cards.

### Tone
- **Warm, second-person, singular-intimate.** Speak to _one_ person building a gift for _one_ person. Use "você" / "you," never "users."
- **Emotional words in italic serif** — a signature move. `Sua história em um <em>mapa</em>.`
- **Low-key confident.** The product is small and beautiful; never shout.
- **Sentence case** for UI and buttons. Title Case is reserved for proper names.
- **No exclamation marks** except on a single celebratory moment (e.g. the "sent!" confirmation).
- **Emoji: sparingly, and only heart-adjacent.** ♥ (U+2665), ✦, ✧, →. Never 🎉🔥💯. When in doubt, use a typographic flourish instead.

### Examples

✅ **Do**
- "Um mapa só de vocês dois." _(A map just for the two of you.)_
- "Escolha os lugares que contam a história."
- "Pronto. Seu QR Code está a caminho."
- "Começou em Lisboa. Ainda não acabou."

🚫 **Don't**
- "Start building YOUR perfect relationship map TODAY!!! 🔥💕🎉"
- "Users can add up to 10 locations."
- "Click here to proceed to the next step."

### Copywriting patterns
- **Italicize the feeling.** One word per line, max. `A gente guarda seus <em>momentos</em>.`
- **Short lines.** Poetry, not paragraphs. Aim 5–9 words per marketing line.
- **Numbers are characters.** "3 lugares, 27 fotos, uma história."
- **Ellipses and em-dashes** are fine. Semicolons feel too formal.

---

## Visual foundations

### Color philosophy
The palette is **warm-lavender-rose** — not pink, not purple, but the blend you get when a sunset hits a plum. The cream background (`#FBF5F0`) is critical: it's the skin-tone of the whole light experience, giving everything a paper/letter quality. Pure white is reserved for elevated cards — it creates a gentle layer contrast without ever feeling corporate.

On dark, `#25212A` is a _warm_ near-black (purple-leaning), never true black. It preserves the intimacy of the brand when the user flips into cinematic mode.

- **Primary #F56C73 coral-rose** — CTAs, hearts, the "route line" on maps
- **Title #413C7B indigo-violet** — headings, navbar, map pins, body emphasis
- **Accent #BF77F6 lavender** — decorative highlights, secondary badges, sparkles
- **Surface #DBD9E1** — muted lavender-gray for dividers and chips
- **Semantic success/warn/error** are muted, warm-leaning (no pure green/red)

### Typography
- **DM Serif Display** (regular + italic) for headings and emotional emphasis. The italic is the star — it's where the brand's romance lives.
- **Plus Jakarta Sans** (300–800) for UI, body, labels, data. Modern, soft, neutral.
- The brand's signature typographic move: a serif heading broken up by a single _italicized_ word in coral. `Sua <em style="color:#F56C73">história</em> em um mapa.`

### Backgrounds
- **Cream paper** (`#FBF5F0`) on light — flat, never gradient
- **Warm near-black** (`#25212A`) on dark — occasionally enhanced with a subtle radial glow behind hero content (accent lavender at ~15% opacity)
- **Photo-forward layouts** on the public map page — polaroid-style cards float over the dark base
- No hand-drawn illustrations, no repeating patterns, no noise/grain (clean product, emotional through color and type)

### Cards & surfaces
- **Light-theme cards:** white background, radius `--r-lg` (20px), shadow `--sh-md` (soft lavender-tinted, never gray)
- **Dark-theme cards:** `--olm-dark-800` background, radius `--r-lg`, subtle 1px border `rgba(251,245,240,0.08)`, optional accent glow
- **Polaroids (public map page):** square-ish white frame, slight rotation (±2deg), caption in handwriting-feel (italic serif)
- **Chips & pills:** `--r-pill`, tight vertical padding, `--olm-surface-soft` background

### Borders
- Sparingly used on light; dividers are `--olm-surface` at 60% opacity
- On dark, hairline borders `rgba(251,245,240,0.08)` define card edges
- No harsh black outlines, ever

### Shadows
- **Warm, lavender-tinted** — see `--sh-*` tokens. Never gray shadows.
- **Glow shadows** (`--sh-glow-primary`, `--sh-glow-accent`) on hover for featured CTAs and key map pins

### Corner radii
- Inputs/chips: `--r-md` (14px)
- Cards: `--r-lg` (20px)
- Hero cards, modals: `--r-xl` (28px)
- Buttons: `--r-pill`
- The brand tilts **generous and soft** — no 4px or sharp corners anywhere

### Motion
- Easing: `cubic-bezier(0.2, 0.8, 0.2, 1)` (emphasized) for almost everything — slightly overshooting
- Soft-spring `cubic-bezier(0.34, 1.56, 0.64, 1)` for emotional moments (heart beats, pin drops, "sent" confirmations)
- Durations: fast (150ms), base (240ms), slow (420ms)
- **Fade + rise** is the default reveal pattern (y: 12px → 0, opacity 0 → 1)
- **No bouncy UI chrome.** Bounces are reserved for emotional payloads — hearts, pins landing, the final reveal.
- Framer Motion is the expected driver in production

### Hover & press states
- **Buttons:** hover = 6% darker background OR `translateY(-1px)` + glow shadow. Press = `scale(0.98)`.
- **Links:** hover = `var(--olm-primary)` color, no underline animation (the color shift is enough)
- **Cards:** hover = `translateY(-2px)` + shadow step up. Press = `scale(0.995)`.
- **Map pins:** hover = soft glow halo, 1.08× scale

### Layout rules
- **Mobile-first.** Breakpoints: 480 / 768 / 1024 / 1280.
- Max content width: **1120px** on marketing, **720px** on wizard forms, **full-bleed** on the public map page.
- **Generous vertical rhythm** — sections breathe at 96px (desktop) / 64px (mobile).
- Navbar is 72px fixed on light (translucent cream with 8px blur); the public page has no chrome at all — map is the canvas.

### Transparency & blur
- **Blurred navbar** on scroll: `background: rgba(251,245,240,0.72); backdrop-filter: blur(14px);`
- Modals/sheets: `backdrop-filter: blur(20px)` over a 40% dark-tint overlay
- **Use sparingly** — the brand is primarily opaque and confident; blur is accent only

### Imagery
- **Warm, low-contrast, color-rich** photos — golden hour, candlelight, film grain-like color grading (but not actual grain). Never cool/blue.
- Public map page photos: **square polaroid crops**, slight rotation
- Marketing photos: **full-bleed hero** with a cream-paper vignette at the edges

---

## Iconography

- **Primary icon system: [Lucide](https://lucide.dev) via CDN** — clean 1.75–2px strokes, rounded joins. Matches the soft confident vibe.
  ```html
  <script src="https://unpkg.com/lucide@latest/dist/umd/lucide.min.js"></script>
  ```
- **Stroke weight:** 1.75px (default) in UI; 2.25px in navbar for presence
- **Color:** inherits from `currentColor`. On light, default to `--fg-3`; on dark, default to `--dfg-2`.
- **Key icons in use:** `map-pin`, `heart`, `camera`, `calendar`, `qr-code`, `arrow-right`, `mail`, `sparkles`, `plus`
- **No emoji** in UI chrome. Emoji only appears in user-generated content (captions, messages).
- **Unicode flourishes** — `✦ ✧ ♥` used tastefully as decorative typographic elements between headings (never as functional icons).
- The **brand mark** (three dots along a curved path — see `assets/logo.svg`) reads as a map route. It's the signature visual and should be recognizable at 24px.

---

## Index

Root files:
- [`README.md`](./README.md) — this document
- [`SKILL.md`](./SKILL.md) — agent-invocable wrapper for Claude Code / skills
- [`colors_and_type.css`](./colors_and_type.css) — all design tokens as CSS vars

Folders:
- `assets/` — logos and brand assets (SVG)
- `preview/` — small HTML cards powering the Design System tab
- `ui_kits/landing_wizard/` — React-ish JSX kit for the light marketing + form flow
- `ui_kits/public_map/` — JSX kit for the dark public-page experience

---

## Open questions / caveats

1. **No real product photos provided.** Previews use CSS-drawn placeholders labeled `photo` — swap with actual shoots before shipping marketing.
2. **No existing codebase or Figma.** Component choices are opinionated best-guesses grounded in the brand notes. Please review and annotate changes.
3. **Portuguese copy is the primary voice** — confirm translations match the brand's preferred register (familiar "você" is assumed).
4. **Font files are loaded via Google Fonts CDN.** Self-hosted woff2 can replace if needed.
