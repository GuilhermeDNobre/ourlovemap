# Handoff: Our Love Map

A romantic keepsake product where couples build a personalized "love map" of meaningful places — they fill out a guided form, choose photos and a song, and receive a printed QR code that opens a private, scrolling map page on the recipient's phone.

This handoff bundle gives a developer everything needed to rebuild the design in **React + Vite**.

---

## ⚠️ About the Design Files

The files in this bundle are **design references created in HTML/JSX** — prototypes that show intended look and behavior, **not production code to copy directly**.

The HTML prototypes use:
- Inline styles + a single CSS variable file
- React 18 from CDN with Babel-in-browser
- Multiple `<script type="text/babel">` files writing to `window` to share components

Your job is to **recreate these designs in a real React + Vite app**, using your project's conventions:
- Real ES module imports (no `window.X = X`)
- A real component library structure (`src/components/...`)
- Type-safe props (TypeScript recommended)
- A styling solution of your choice (CSS Modules, Tailwind, vanilla-extract, etc.) — but **the design tokens are the source of truth**, see `design_files/tokens.css`

The HTML prototypes are correct on intent (layout, copy, color, motion). They are wrong on **architecture** — don't ship them.

---

## Fidelity

**High-fidelity.** Colors, typography, spacing, motion, copy and interactions are final. Recreate pixel-perfectly.

The only "lofi" parts:
- Photos in polaroides are gradient placeholders → swap for real `<img>` from user uploads
- Map "streets" in the trip transitions are decorative SVG paths → keep them decorative, do NOT use a real maps API for the storytelling section
- Final screen DOES use a real map (see Screen 6 below) — recommend Mapbox GL JS or MapLibre

---

## Tech Stack

- **React 18+** with **Vite**
- **React Router** for routing
- **TypeScript** recommended
- **Mapbox GL JS** or **MapLibre GL** for the final real map screen (free MapLibre tier is fine)
- **Framer Motion** for the scroll-driven transitions in the public map page
- **react-intersection-observer** to trigger animations on scroll
- **react-dnd** or **@dnd-kit/core** for drag-to-reorder in the wizard
- A **YouTube Data API** key for the music search step
- Form state: `react-hook-form` + `zod`

---

## Routes / Pages

| Route | Component | Purpose |
|---|---|---|
| `/` | `<Landing />` | Marketing site — explains the product, examples, pricing |
| `/criar` | `<Wizard />` | 4-step form to build the map |
| `/:slug?token=…` | `<PublicMap />` | The recipient's experience — token-gated keepsake page |

The slug is derived from the couple names (e.g. `Ana e Lucas` → `ana-e-lucas`). Access is gated by a **secret token** sent to the buyer's email — without it the route returns 404.

---

## Design System

See **`design_files/DESIGN_SYSTEM.md`** for the full system. Highlights:

### Colors
```
--olm-primary:    #F56C73   (coral — heart pin, route lines, primary CTA)
--olm-primary-2:  #FAA2A7   (lighter coral)
--olm-title:      #413C7B   (deep purple — H1/H2 on light bg)
--olm-accent:     #BF77F6   (lavender — secondary accents, italics)
--olm-cream:      #FBF5F0   (light bg base)
--olm-cream-2:    #F5EFE8   (slight tint)
--olm-dark:       #25212A   (warm near-black — public map bg)
--olm-dark-800:   #2E2934   (dark surface)
--olm-success:    #6EBF8F
--olm-error:      #E26666
```

### Typography
- **Serif**: `DM Serif Display` — headings, italics for emphasis
  - Use real italic file in production (the prototype synthesizes italic from regular)
- **Sans**: `Plus Jakarta Sans` (variable, 200–800) — body, UI
- **Mono**: system mono for slug previews

### Logo
- `assets/logo.svg` — primary purple
- `assets/logo-cream.svg` — for dark backgrounds
- `assets/logo-wordmark.svg` — horizontal lockup

---

## Screens / Views

### 1. Landing page (`/`)

Light cream background. Hero, feature grid, testimonial, footer. Marketing.

**Layout:**
- `<Navbar>` — sticky top, logo + 3 links + "Criar nosso mapa" CTA
- `<Hero>` — 2-column. Left: H1 ("Um mapa do amor de vocês."), subtitle, CTA, social proof. Right: phone mockup with map preview
- `<FeatureGrid>` — 3 cards explaining the product
- `<Testimonial>` — single quote
- `<Footer>` — small print

Reference: `design_files/ui_kits/landing_wizard/index.html` (toggle to landing view)

### 2. Wizard (`/criar`)

4-step form, light bg. Two-column layout: form on the left (1.35fr), sticky preview panel on the right (1fr) showing slug + live phone preview.

**Step 1 — Vocês**
- Names (`Ana e Lucas` format), required
- Start date (`<input type="date">`), required → drives the live "you've been together for X years, Y months, Z days" counter
- Opening phrase, optional (free text, ~140 chars)

**Step 2 — Localizações**
- List of place cards. Drag the dotted handle to reorder.
- Each card: index badge, name, address (free text — no Places API in v1), description, photo upload
- "+ Adicionar lugar" button at the bottom
- Footer: `{n} de 7 (Premium)` — soft cap, doesn't enforce

**Step 3 — Música**
- YouTube search input (lupa icon left), accepts query text or full URL
- Mock track preview card after typing
- Two range sliders: `Início` (0–270s, accent coral), `Fim` (start+5 to 272s, accent lavender). Display `M:SS`.
- Loop toggle (custom switch component)

**Step 4 — Envio**
- Important banner: "QR Code e link de edição vão APENAS pra esse email"
- Email input
- Email confirmation input — validates equality live, red border + error message on mismatch
- Summary card: casal, lugares (count), música (✓ or —)

**Right panel (sticky):**
- Slug card on top — shows `ourlovemap.com/<slug>` derived from names. Note about token-protected access. **No copy button** (link is private).
- Phone preview below — live preview of cover screen with names, opening, counter, polaroide of place 1 (from step 2+), music chip (from step 3+)

**Progress dots** at the top with checkmarks for completed steps.

### 3-6. Public Map (`/:slug?token=…`)

The recipient's experience. **Vertical scroll storytelling**, mobile-first. See `design_files/ui_kits/public_map/index.html`.

#### Screen 3 — Cover

- Full viewport, dark background `--olm-dark`
- Logo (cream) + small "Um mapa pra você" eyebrow in coral
- H1: couple names with stylized "e" in coral italic
- Italic opening phrase
- Date or relationship counter
- "Começar a viagem →" CTA

The cover plays the music (autoplay where allowed; otherwise prompts on first interaction) and locks scroll until the user taps the CTA.

#### Screen 4 — Each Place (one per place)

The core repeating section. For each place:

1. The map fills the viewport, all pins **dimmed except the current one** which is bright coral with a pulsing halo.
2. As the user scrolls into the section, the place's **content card** fades + slides in from the bottom:
   - Eyebrow (`PRIMEIRO ENCONTRO`, etc.)
   - H2 (place name, serif)
   - Date (small, light gray)
   - One photo (polaroide style, slight rotation, white frame, italic caption)
   - Description in serif italic
3. A discreet **scroll-down arrow indicator** at the bottom hints at continuation.

#### Screen 5 — Trip Transition (between places)

A scroll-driven animation that fills the viewport with **decorative SVG paths** (curving "streets") drawn in the primary coral color. Paths animate via `stroke-dashoffset` tied to scroll progress. The animation should feel like flying over a stylized map. **It does NOT correspond to real geography** — it's purely visual delight. Loops, weaves, fills the screen.

Each transition uses a distinct path so consecutive trips don't look identical.

#### Screen 6 — Final real map

After the last place, the user reaches the closing screen.

- A **real interactive map** (Mapbox/MapLibre, dark style) showing all the places as markers
- Each marker has the **uploaded photo as a polaroide** floating above it (slight rotation, drop shadow, italic caption)
- Pins are connected by a coral dashed route line
- Above the map, a serif H1: **"Esse é o nosso mapa do amor."** (or similar — copy customizable per couple)
- Below the map, a section with:
  - Couple names + total relationship counter
  - **"Compartilhar no Instagram"** primary CTA — opens IG sharing flow (story share via Web Share API on mobile, copy-link fallback on desktop)
  - Secondary "Voltar ao começo ↑" link

---

## Interactions & Animations

### Wizard
- Step transitions: 240ms ease-out crossfade
- Drag-to-reorder: opacity 0.5 on dragging item, accent border on drop target
- Email mismatch: red border + error appears live
- Live preview updates: 150ms transitions on color/text changes

### Public Map
- **Each place section** uses Framer Motion's `useScroll` + `useTransform` to:
  - Fade content card in at 30%, out at 90% of section
  - Animate active pin scale from 1.0 → 1.4 with halo opacity 0 → 0.6
- **Trip transitions** use `stroke-dasharray` on SVG paths driven by scroll progress 0 → 1
- **Map screen entry** crossfades from the last trip transition. Polaroides drop in with stagger (60ms), each with subtle rotation
- **Music**: continues playing across the entire scroll. Loops if user enabled it.

### Microinteractions
- Buttons: `transform: scale(0.98)` on press, 150ms easing `cubic-bezier(0.2, 0.8, 0.2, 1)`
- Pins: 200ms ease-out scale + glow on hover
- Shadows escalate on elevation: `--sh-sm`, `--sh-md`, `--sh-lg`, `--sh-glow-primary`

---

## Design Tokens

All in `design_files/tokens.css`. Import once at the app root and reference via `var(--token-name)`.

### Spacing
4 / 8 / 12 / 16 / 24 / 32 / 48 / 64 / 96 px

### Radius
sm: 8 · md: 12 · lg: 18 · xl: 28 · pill: 999

### Shadows
- `--sh-sm`: subtle card lift
- `--sh-md`: form/wizard cards
- `--sh-lg`: phone preview, modals
- `--sh-glow-primary`: coral CTA glow on dark bg

### Easing
- `--ease-emphasized`: `cubic-bezier(0.2, 0.8, 0.2, 1)` — most UI motion
- `--ease-standard`: `cubic-bezier(0.4, 0, 0.2, 1)` — default

---

## State Management

### Wizard
```ts
type WizardData = {
  names: string;
  startDate: string;          // ISO 'YYYY-MM-DD'
  opening: string;
  places: Place[];
  music: { videoId: string; query: string; start: number; end: number; loop: boolean };
  email: string;
  emailConfirm: string;
};
type Place = {
  id: string;
  name: string;
  address: string;
  note: string;
  photo: File | string | null;  // File during edit, URL after upload
  lat?: number;                  // geocoded server-side
  lng?: number;
};
```

Use `react-hook-form` + `zod`. Persist draft in localStorage so refresh doesn't lose progress. On submit (Step 4), POST to `/api/maps`, server returns `{ slug, token }`, server emails the user.

### Public Map
- Fetch by slug + token: `GET /api/maps/:slug?token=xxx` — returns full map data or 404
- Store scroll progress for the trip transitions in component state via Framer Motion's `useScroll`
- Store music playback in a single hidden `<audio>` or YouTube IFrame Player at the app root

---

## Recommended Project Structure

```
src/
├── styles/
│   └── tokens.css                ← copy from design_files/tokens.css
├── lib/
│   ├── slug.ts                   ← derive slug from names
│   └── youtube.ts                ← YouTube embed helpers
├── components/
│   ├── ui/                       ← Button, Input, Toggle, Field, Card
│   ├── landing/                  ← Navbar, Hero, FeatureGrid, Testimonial, Footer
│   ├── wizard/
│   │   ├── Wizard.tsx            ← root, manages step state
│   │   ├── steps/
│   │   │   ├── Step1Vocês.tsx
│   │   │   ├── Step2Localizações.tsx
│   │   │   ├── Step3Música.tsx
│   │   │   └── Step4Envio.tsx
│   │   ├── PlaceCardEditor.tsx   ← drag-to-reorder card
│   │   ├── ProgressDots.tsx
│   │   ├── SlugCard.tsx
│   │   └── LivePreview.tsx
│   └── public-map/
│       ├── PublicMap.tsx         ← root, scroll orchestration
│       ├── CoverScreen.tsx
│       ├── PlaceSection.tsx      ← one per place
│       ├── TripTransition.tsx    ← decorative scroll animation
│       ├── FinalMapScreen.tsx    ← real Mapbox/MapLibre map
│       └── Polaroid.tsx
└── routes.tsx
```

---

## Slug derivation

```ts
export const slugify = (names: string) =>
  names
    .toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, "")
    .trim()
    .replace(/\s+/g, "-") || "seu-mapa";
```

---

## Copy / Voice

Portuguese (BR/PT mixed register). Familiar but not childish. Use lowercase eyebrows in serif italic for poetic moments ("nossos lugares", "começou aqui"). Use uppercase coral eyebrows in sans for UI sections ("PRIMEIRO ENCONTRO", "PASSO 2 DE 4").

The italic "e" in couple names (`Ana e Lucas`) is a signature treatment — the `e` is rendered in coral italic via the serif. Always do this where the name appears.

---

## Files in this bundle

```
design_handoff_our_love_map/
├── README.md                        ← this file
└── design_files/
    ├── DESIGN_SYSTEM.md             ← full system documentation
    ├── tokens.css                   ← all CSS variables
    ├── assets/                      ← logos (svg)
    ├── fonts/                       ← DM Serif Display, Plus Jakarta Sans
    ├── preview/                     ← single-component preview cards
    └── ui_kits/
        ├── landing_wizard/          ← landing + 4-step wizard prototype
        └── public_map/              ← cover + scroll storytelling prototype
```

To run a prototype locally: open the `index.html` in `ui_kits/<kit>/` directly. The CDN scripts boot React; no build step.

---

## Open questions / things still to decide

1. **Geocoding**: turning addresses into lat/lng for the final real map. Recommend server-side via Mapbox Geocoding API on map creation.
2. **Photo storage**: the prototype uses `URL.createObjectURL`. Production needs S3/Cloudinary/etc.
3. **Music rights**: YouTube embed is fine for personal/non-commercial. If you need direct audio, you'll need to license.
4. **Mobile-first**: the wizard prototype is desktop-leaning. The public map is already mobile-first. Make sure the wizard reflows below ~720px (preview goes below the form, not next to it).
5. **i18n**: prototype is in PT. If en is needed, externalize copy now.
