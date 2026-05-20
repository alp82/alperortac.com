# AGENTS.md

> Keep this file concise. Update it whenever scope or design shifts.

## What this is

Alper Ortac's personal site. A personal-brand surface for fans, community, and fellow devs — not a recruiter funnel.

## The shape

A vertical scroll journey on the main path:

- **Hero (top, sky/day)** — avatar, headline, intro.
- **Linktree** — one column, sectioned by VIDEO / POSTS / CODE.
- **Craft band** — eight topical articles (The Craft / AI / Learning / Teaching / Movies & TV / Family / Music / Games). Each one has a heading, a one-line teaser, and 1-2 trigger cards opening a sidetrack panel.
- **Freelance / Collab CTA** — one dedicated block.
- **Footer (ground/night)** — minimal, ambient.

**Sidetracks (left and right overlay panels)** are the primary depth surface:

- Career history lives in a panel triggered from The Craft.
- Each of the four flagship projects (GoodWatch, AIStack, Alp-River, Manaschmiede) gets its own panel.
- Four personal-thread panels (Learning, Teaching, Family, Music) are placeholders today, reusing the Career-style yellow brutalist banner.
- A "tune the sky" panel exposes the celestial controls as a game-y find.

## Feel

- Nature-themed
- Warm atmosphere
- Simple, whimsical animations

## Mechanics

- **Scroll** drives the day → dusk → night transition, sun arc setting, moon arc rising.
- **Progress bar / minimap** always visible. Honest linear progress.
- **Sidetracks** slide in as full-screen overlay panels with a RETURN edge connector.
- **Persistence** via localStorage — track found items / sky tuning across sessions.
- **Audio** is ambient. Default off, clear toggle.

## Constraints

- Mobile must work. Every desktop interaction needs a touch equivalent.
- Reduced-motion preference is respected.

## Status (2026-05-20)

- v3 8-topic Craft band landed: Hero → Linktree → Craft (8 topical articles: The Craft → AI → Learning → Teaching → Movies & TV → Family → Music → Games) → Freelance/Collab CTA → Footer.
- 10 native `<dialog>`-driven sidetrack panels (4 project + Career + 4 personal placeholder + Sky-Tuning), controlled by a single `openPanel` key.
- Personal panels (Learning, Teaching, Family, Music) reuse the Career yellow brutalist banner pending real content.
- Project panels and Career timeline are unchanged from v2 (placeholders still pending: see `src/data/career.ts` TODO and `src/components/ProjectPanel.tsx` Alp-River TODO).
- Panel management was extracted into `src/components/_layout/PanelHost.tsx`; trigger cards live in `src/components/_layout/SectionTriggerCard.tsx`.
