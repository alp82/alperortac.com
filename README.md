# alperortac.com

Personal site for Alper Ortac.

The page is one path: **hero → socials → projects → craft → collab**. Scrolling it drives the sky from noon through dusk to night, sets the sun and raises the moon. Every card along the way is a dive: it zooms open a floating subpage while the landscape stays visible around it.

The design vision lives in [AGENTS.md](./AGENTS.md), which is the live spec.

## Stack

- [TanStack Start](https://tanstack.com/start) (SSR, file-based routing)
- [Bun](https://bun.com/) - package manager and JS runtime
- [TypeScript](https://www.typescriptlang.org/) - `strict`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`
- [Tailwind CSS v4](https://tailwindcss.com/) (Vite plugin, no PostCSS config)
- [Biome](https://biomejs.dev/) - formatter + linter
- [Vitest](https://vitest.dev/) + jsdom - the suite is the spec's enforcement surface
- [PostHog](https://posthog.com/) - analytics, proxied through this app's own origin

## Quickstart

```bash
bun install
bun --bun run dev
```

The dev server listens on `http://localhost:3015`.

## Scripts

| Script                 | Description                                       |
| ---------------------- | ------------------------------------------------- |
| `bun run dev`          | Vite dev server on port 3015                      |
| `bun run build`        | Regenerate feed data, then production build       |
| `bun run serve`        | Preview the production build                      |
| `bun run typecheck`    | `tsc --noEmit`                                    |
| `bun run lint`         | Biome lint                                        |
| `bun run format`       | Biome format (write)                              |
| `bun run check`        | Biome CI mode (lint + format + import order)      |
| `bunx vitest run`      | The test suite                                    |
| `bun run generate:og`  | Render the Open Graph image                       |
| `bun run generate:shorts` / `generate:quotes` | Refresh the YouTube Shorts / quotes feed data |

Serving the build: `bun server.js` (reads `dist/`, honours `PORT`, defaults to 3000, and proxies `/ingest` to PostHog so analytics is first-party).

## Architecture

### One scroll driver, imperative paint

Scroll is read once per frame and turned into a single value object, then written straight onto pre-registered DOM nodes. Nothing re-renders on scroll.

- `src/components/_layout/scrollJourney/useScrollJourney.ts` owns the rAF loop and the resize-measured metrics.
- `journeyValues.ts` is pure: `computeJourney(input) -> JourneyValues` (sky colour, sun/moon position and opacity, star and shooting-star opacity, cloud offset, landscape fade, minimap window, watermark drift).
- `journeyTargets.ts` does the writing: one pass over the registered targets per frame.

Keeping the maths pure and separate is what makes the journey testable without a browser, and it keeps SSR and client markup identical - the render tree never depends on scroll position.

### The sky is data

`src/data/celestial.ts` and `src/data/skyCurve.ts` are the single source of truth for the atmosphere: three anchor colours (noon, dusk, night), a two-phase curve that says where each transition lands, and the sun/moon arc parameters. `skyAt(progress, curve)` is the one function that turns progress into a colour, and every surface that needs one calls it - the background, the minimap, and the artwork on the site's own subpage.

Nothing about the sky is persisted. The dev-only tuning panel edits session state, so a reload always returns to the committed values in `celestial.ts`.

### Vertical rhythm is one variable

`gapVh` in `celestial.ts`, rendered as `RhythmGap` between sections. Section roots add **no** vertical padding on an edge they share with a gap, so every boundary in the journey is exactly `gapVh`. This is an invariant with a test behind it: ad-hoc per-section padding once made the perceived boundary vary between 270px and 590px while every gap was technically correct.

### Sidetracks

`PanelHost` owns the dive: a trigger card zooms into a centered floating panel over the still-visible landscape, and each panel is deep-linkable (`/projects/<slug>`, `/career`, and friends) with the URL and the open panel kept in sync. Project subpages render from `src/data/projects.ts`, the same entries that feed the Projects band.

### Content is data

`src/data/` holds the source of truth for projects, links, craft topics, and quotes; components render it. Feed-backed content (YouTube Shorts, quotes) is generated into data files at build time rather than fetched at runtime.

## License

MIT - see [LICENSE](./LICENSE).
