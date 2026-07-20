# AGENTS.md

> Keep this file concise. Update it whenever scope or design shifts.

## What this is

Alper Ortac's personal site. A personal-brand surface for fans, community, and fellow devs — not a recruiter funnel.

## The shape

A vertical scroll journey on the main path:

- **Hero (top, sky/day)** — avatar, headline, intro.
- **Linktree** — one column, sectioned by VIDEO / POSTS / CODE.
- **Craft band** — a stack of topical articles spanning the craft, tech, and personal-life threads. Each one has a heading, a one-line teaser, and 1-2 trigger cards opening a sidetrack panel.
- **Footer (ground/night)** — ambient sign-off that doubles as the Freelance / Collab contact surface: the "Let's…" headline, a message box, and a live `mailto:` "Email me" button.

**Sidetracks (deep dive subpages)** are the primary depth surface:

- Career history lives in a panel triggered from The Craft.
- Each of the four flagship projects (GoodWatch, AIStack, Forge, Manaschmiede) gets its own panel.
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

## Agent skills

### Issue tracker

Issues live in the `alp82/alperortac.com` GitHub Issues, via the `gh` CLI. See `docs/agents/issue-tracker.md`.

### Triage labels

Default canonical roles, each label string equal to its name. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context: `CONTEXT.md` + `docs/adr/` at the repo root. See `docs/agents/domain.md`.
