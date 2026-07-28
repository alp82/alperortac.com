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
| Curia | building | no | github.com/alp82/curia | authored, flagship-lite (#48) |
| claude-statusline | shipped | no | github.com/alp82/claude-statusline | authored, light shape (#49) |
| alperortac.com | shipped | no | github.com/alp82/alperortac.com | authored, self-reference shape (#50) |

- **Card core** (required): title, desc, link, status, highlight, tags, color, iconKey.
- **Subpage payload** (panelColor, panelLight, media, problem, solution, outcome, narrative, stack): OPTIONAL - the Option A relaxation landed with the three late additions, all three now authored (Curia #48, claude-statusline #49, alperortac.com #50). ProjectPanel still degrades to title/desc/tags/link when a payload is absent (no media band, no Problem/Solution/Outcome/Stack, shared dark-slate fallback colors) and renders `desc` as an always-on lead paragraph on every subpage, flagships included.
- **Small projects get a lighter subpage shape** (precedent set by claude-statusline, #49): no problem/solution/outcome triad, no media band. Its page is lead blurb + one "How to read it" section whose artwork is the statusline itself (`StatuslineStrip`, a static faithful HTML render of the script's output in its own truecolor palette, slug-gated in ProjectPanel like Forge's pipeline) + the README requirements as stack chips + a "See it in motion" demo link. Copy comes from the project's own README, never invented.
- **A WIP system gets "flagship-lite"** (precedent set by Curia, #48): the Problem / Solution pair a system-sized project earns, one signature section, and stack chips, but **no Outcome** (nothing has landed yet to report) and **no media band** (no demo asset exists). Its signature section is "The golden thread", whose artwork is the `#curia` Discord thread rendered on a phone (`CuriaThread`, a static faithful render in Discord's own dark palette, slug-gated in ProjectPanel beside the statusline strip and Forge's pipeline). - **The self-reference gets its own shape** (alperortac.com, #50): the page about the page you are standing on is framed by Alper's **motivation and vision**, not by a market gap, so the fixed Problem / Solution pair is replaced by `narrative` - authored-heading prose sections rendered in the pair's slot ("Why I built it", "The vision"). Then one signature section ("The journey") and stack chips; no Outcome, no media band, since the demo is the site itself. `narrative` is deliberately used by this one project only, pinned by test, so the fixed vocabulary stays the default. Its artwork is the site's own journey minimap frozen into a drawing (`JourneyColumn`, slug-gated in ProjectPanel beside the statusline strip, the Curia thread, and Forge's pipeline).
- **Subpage artwork derives from live modules, never transcribed values.** `JourneyColumn` builds its gradient, arcs, opacities, and phase labels by calling `skyAt` / `DEFAULT_CELESTIAL` / the minimap helpers, so a sky retune (e.g. #53) moves the drawing with it instead of leaving it quietly lying. Where a drawing cannot know a real value, it **measures once and records the measurement** - it does not invent a schematic stand-in. `JourneyColumn.SECTION_SPANS` holds each section's scroll range, measured in the running app and dated in a comment, because a section's span depends on its rendered height and no static drawing can compute it. The even ladder it replaced (#55) was not a harmless simplification: Craft is 75.5% of the scroll, so equal steps put every waypoint in the wrong sky and told the visitor the Projects band sits at dusk when it sits in flat noon. Re-measure when section heights change materially.

The four subpage shapes are therefore: flagship (triad + media), flagship-lite (pair + signature section), light (blurb + one section), self-reference (authored-heading prose + signature section).
- **Artwork never publishes real infrastructure hostnames.** `CuriaThread` shows `box.tailnet.ts.net`, not the real box: curia's attach surface sits behind tailnet membership alone, so a public page must not hand out the exact target. Pinned by test.
- External link = the project's canonical home: the live app for apps, the GitHub repo for the repo-based ones. The self-reference (alperortac.com) points external at its own repo to avoid a circular link.

## Feel

- Nature-themed
- Warm atmosphere
- Simple, whimsical animations

## Mechanics

- **Scroll** drives the day → dusk → night transition, sun arc setting, moon arc rising.
- **The scene's cast and density track progress, not only its color.** Stars thicken toward the bottom. Landscape objects vary through the day. Clouds belong to one stretch, birds to another, or both stay and their count and focus rise and fall. The sky color is one channel of the journey, not the whole of it - a section that shares its neighbour's color can still be somewhere else in the day.
- **Depth is one authored field, `--layer-depth`, read by two inputs on two separate CSS channels.** The dive reads it through `transform` (per-layer scale) and `filter` (blur), both gated on `body.dive-active`. Scroll parallax reads the same field through the `translate` longhand, which composes with `transform` instead of replacing it, so the dive comes out unchanged (ticket #59). `.dive-scene` already carries the subpage-scroll drift the same way. Put both on `transform` and the dive loses its zoom outright. **Blur never touches the scroll path**: blur that changes while a layer moves re-rasters every frame, and on software raster sixteen blurred full-viewport layers cut desktop scroll to 7.4fps (`docs/audits/scene-frame-budget.md`). Layers paint in depth order, not authoring order.
- **The depth ladder is capped by the art, not the frame budget.** Twenty-plus layers are affordable. The locked ladder is ten ridges spanning depth 0.21 to 0.93, and the scroll parallax is vertical only: 160px of rise at depth 1 against a 1440px reference, scaled down by viewport width. Vertical travel has a hard limit in both directions. Too much rise squeezes every ridge top onto one line and the ladder reads as one flat mass. Too much sink drops the nearest ridge past the bottom edge. Every bottom-anchored layer overscans the viewport by the full travel, or it pulls its own edge into view (ticket #59).
- **A ridge is opaque.** Delicacy comes from a fill that sits close to the sky color, not from a low opacity. A translucent ridge lets the star field read straight through the mountains. Each ridge paints the accumulated composite of every ridge behind it, which keeps the stacked wash that low alpha used to give (ticket #59).
- **`phase2End` is load-bearing beyond the sky.** It sets full night AND cues the shooting stars: `shootO` ramps from 0 at `phase2End` to 1 at progress 1.0 (`journeyValues.ts`), so the scroll after it is their fade-in budget. Raising it shrinks that window, and at 1.0 the shooting stars never appear. The frozen background color across the last screens is deliberate - it is the still, dark backdrop the white streaks need to read against (ticket #53).
- **The sky curve is tuned as one compromise, never per device.** A section's scroll progress depends on viewport height (the Projects band centres at 0.124 on mobile and 0.178 on desktop), so one `phase1` start has to serve both. `phase1[0]` is 0.060: mobile reaches ΔE 6.0 from noon, desktop 16.9. Starting before 0.050 warms Socials past ΔE 2 and the page loses its noon top (ticket #53).
- **Vertical rhythm** is one variable: `gapVh` in `src/data/celestial.ts`, rendered as `RhythmGap`. Section roots add NO vertical padding on an edge they share with a gap, so every boundary is exactly `gapVh` (ticket #51 - ad-hoc per-section padding had made the perceived boundary run 270px to 590px). Hero's `pt-24` (nav clearance) and the footer's `pb-16` (page end) are not boundaries and stay.
- **Progress bar / minimap** always visible. Honest linear progress.
- **Sidetracks** slide in as full-screen overlay panels with a RETURN edge connector.
- **Persistence** via localStorage, for found items only. Sky tuning is deliberately NOT persisted: `src/data/celestial.ts` is the single source of truth, the dev-only Tune panel edits session state, and a reload always returns to the committed values.
- **Audio** is ambient. Default off, clear toggle.

## Constraints

- Mobile must work. Every desktop interaction needs a touch equivalent.
- Reduced-motion preference is respected.
- **A control that wraps a whole card carries an explicit `aria-label`.** Left unlabelled, its accessible name computes from everything inside it, so the screen reader's button list announces a paragraph per card instead of a name (ticket #52 measured 102 characters per Projects card). Label it with the card's title alone, and wire `aria-describedby` to the card's own description node so tabbing still gets the context. Corollary the same ticket settled: a whole-card `<button>` may not contain a heading (phrasing content only), and that is **accepted, not worked around** - heading navigation is a skip mechanism, and adjacent single-control cards have nothing to skip, so the correctly-named button list is the survey route.

## Agent skills

### Issue tracker

Issues live in the `alp82/alperortac.com` GitHub Issues, via the `gh` CLI. See `docs/agents/issue-tracker.md`.

### Triage labels

Default canonical roles, each label string equal to its name. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context: `CONTEXT.md` + `docs/adr/` at the repo root. See `docs/agents/domain.md`.
