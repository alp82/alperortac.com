# AGENTS.md

> Keep this file concise. Update it whenever scope or design shifts.

## What this is

Alper Ortac's personal site. A personal-brand surface for fans, community, and fellow devs — not a recruiter funnel.

## The shape

A vertical scroll journey on the main path:

- **Hero (top, sky/day)** — avatar, headline, intro.
- **Linktree** — one column, sectioned by VIDEO / POSTS / CODE.
- **Projects band** (shipped; wired between Socials and Craft) - a flat showcase of all work rendered from `src/data/projects.ts`, highlights sitting larger inside the terracotta sun-glow. Each card is a split control: the whole card dives to the project's in-site subpage, the corner pill opens its external page in a new tab. "Building now" items behave like shipped ones. Coexists with Craft's existing project triggers (both routes reach the same subpage); Craft is left untouched.
- **Craft band** — a stack of topical articles spanning the craft, tech, and personal-life threads. Each one has a heading, a one-line teaser, and 1-2 trigger cards opening a sidetrack panel.
- **Footer (ground/night)** — ambient sign-off that doubles as the Freelance / Collab contact surface: the "Let's…" headline, a message box, and a live `mailto:` "Email me" button.

**Sidetracks (deep dive subpages)** are the primary depth surface:

- Career history lives in a panel triggered from The Craft.
- Each of the four flagship projects (GoodWatch, AIStack, Forge, Manaschmiede) gets its own panel.
- Four personal-thread panels (Learning, Teaching, Family, Music) are placeholders today, reusing the Career-style yellow brutalist banner.
- A "tune the sky" panel exposes the celestial controls as a game-y find.

## Projects inventory & content model

Seven projects, locked (ticket #43). `src/data/projects.ts` is the single source of truth (Option A: one `Project` type feeds both the band card and the subpage).

| Project | status | highlight | external link | subpage |
| --- | --- | --- | --- | --- |
| GoodWatch | shipped | yes | goodwatch.app | exists |
| AIStack | shipped | yes | aistack.to | exists |
| Forge | shipped | no | github.com/alp82/forge | exists |
| Manaschmiede | shipped | no | github.com/alp82/manaschmiede | exists |
| Curia | building | no | github.com/alp82/curia | stub (card + degraded panel) |
| claude-statusline | shipped | no | github.com/alp82/claude-statusline | authored, light shape (#49) |
| alperortac.com | shipped | no | github.com/alp82/alperortac.com | stub (card + degraded panel) |

- **Card core** (required): title, desc, link, status, highlight, tags, color, iconKey.
- **Subpage payload** (panelColor, panelLight, media, problem, solution, outcome, stack): OPTIONAL - the Option A relaxation landed with the three stub projects. ProjectPanel degrades to title/desc/tags/link when the payload is absent (no media band, no Problem/Solution/Outcome/Stack, shared dark-slate fallback colors) and renders `desc` as an always-on lead paragraph on every subpage, flagships included. Real stub content is authored by tickets #48/#50.
- **Small projects get a lighter subpage shape** (precedent set by claude-statusline, #49): no problem/solution/outcome triad, no media band. Its page is lead blurb + one "How to read it" section whose artwork is the statusline itself (`StatuslineStrip`, a static faithful HTML render of the script's output in its own truecolor palette, slug-gated in ProjectPanel like Forge's pipeline) + the README requirements as stack chips + a "See it in motion" demo link. Copy comes from the project's own README, never invented.
- External link = the project's canonical home: the live app for apps, the GitHub repo for the repo-based ones. The self-reference (alperortac.com) points external at its own repo to avoid a circular link.

## Feel

- Nature-themed
- Warm atmosphere
- Simple, whimsical animations

## Mechanics

- **Scroll** drives the day → dusk → night transition, sun arc setting, moon arc rising.
- **Vertical rhythm** is one variable: `gapVh` in `src/data/celestial.ts`, rendered as `RhythmGap`. Section roots add NO vertical padding on an edge they share with a gap, so every boundary is exactly `gapVh` (ticket #51 - ad-hoc per-section padding had made the perceived boundary run 270px to 590px). Hero's `pt-24` (nav clearance) and the footer's `pb-16` (page end) are not boundaries and stay.
- **Progress bar / minimap** always visible. Honest linear progress.
- **Sidetracks** slide in as full-screen overlay panels with a RETURN edge connector.
- **Persistence** via localStorage, for found items only. Sky tuning is deliberately NOT persisted: `src/data/celestial.ts` is the single source of truth, the dev-only Tune panel edits session state, and a reload always returns to the committed values.
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
