# AGENTS.md

> Keep this file concise. Update it whenever scope or design shifts.

## What this is

Alper Ortac's personal site. A personal-brand surface for fans, community, and fellow devs — not a recruiter funnel.

## The shape

A vertical scroll journey on the main path:

- **Hero (top, sky/day)** — avatar, headline, intro.
- **Linktree** — one column, sectioned by VIDEO / POSTS / CODE.
- **Story / About** — narrative middle. Ends with a trigger into the Career sidetrack.
- **Projects** — four alternating left/right triggers. Each opens its own sidetrack.
- **Freelance / Collab CTA** — one dedicated block.
- **Footer (ground/night)** — minimal, ambient.

**Sidetracks (left and right overlay panels)** are the primary depth surface:

- Each project gets its own panel.
- Career history lives in a panel triggered from Story.
- A "tune the sky" panel exposes the celestial controls as a game-y find.
- Easter eggs are planned as additional sidetracks; not built yet.

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

## Status (2026-05-18)

- v2 6-section restructure landed: Hero → Linktree → Story (+Career trigger) → Projects (4 alt-L/R triggers) → Freelance/Collab CTA → Footer.
- 6 native `<dialog>`-driven sidetrack panels live (4 project + Career + Sky-Tuning), controlled by a single `openPanel` key with `@starting-style` slide-in.
- Career timeline is placeholder pending replacement (see `src/data/career.ts` TODO).
- Alp-River illustration is placeholder pending real artwork (see `src/components/ProjectPanel.tsx` TODO).
- Easter-egg sidetracks are pure shape per CLARIFY — not built yet.
