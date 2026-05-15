# Public Map — Dark theme UI kit (scroll storytelling)

The recipient experience for **Our Love Map**: a full-bleed dark page accessed by scanning the QR Code. Organized as a **vertical scroll narrative** — mobile-first, one place at a time, with animated travel transitions between them.

- Background: `#25212A` warm near-black
- Primary accent: coral `#F56C73` (route line, heart pin)
- Secondary accent: lavender `#BF77F6`
- Foreground: cream `#FBF5F0`
- Headings: DM Serif Display (italic flourishes in primary)

## Flow
1. **Cover** — couple name, opening line, scroll hint
2. **PlaceSection** (×N) — dim map, active pin lit, polaroid + title + description + location in a glass container, arrow hint to scroll
3. **TravelTransition** between each place — a winding decorative route in primary coral, filled as the user scrolls ("traveling" to next place)
4. **FinalMap** — a real-feeling map with every place pinned + polaroid + headline "Esse é o nosso mapa do amor" + Instagram share CTA

## Files
- `journeyData.jsx` — the list of places (1 photo per place)
- `PlaceSection.jsx` — one story stop
- `TravelTransition.jsx` — scroll-driven animated route
- `FinalMap.jsx` — final map + IG share
- `index.html` — full interactive scrolling experience
