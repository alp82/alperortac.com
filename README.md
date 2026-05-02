# alperortac

Personal portfolio site for Alper Ortac. A vertical-scroll journey through atmosphere, time, and depth.

This repository is a **tracer** scaffold: the design vision (see [AGENTS.md](./AGENTS.md)) is partially realized as a single-page tracer that exercises the core mechanics — day -> night gradient, drifting clouds, honest-liar progress bar, drag-to-clear soil patch.

## Stack

- [TanStack Start](https://tanstack.com/start) (SSR, file-based routing)
- [Bun](https://bun.com/) — package manager and JS runtime
- [TypeScript](https://www.typescriptlang.org/) — `strict`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`
- [Tailwind CSS v4](https://tailwindcss.com/) (Vite plugin, no PostCSS config)
- [Biome](https://biomejs.dev/) — formatter + linter

## Quickstart

```bash
bun install
bun --bun run dev
```

The dev server listens on `http://localhost:3015`.

## Scripts

| Script              | Description                                  |
| ------------------- | -------------------------------------------- |
| `bun run dev`       | Vite dev server (via `bun --bun vite dev`)   |
| `bun run build`     | Production build                             |
| `bun run serve`     | Preview the production build                 |
| `bun run typecheck` | `tsc --noEmit`                               |
| `bun run lint`      | Biome lint                                   |
| `bun run format`    | Biome format (write)                         |
| `bun run check`     | Biome CI mode (lint + format + import order) |

A production `start` script and deployment configuration are intentionally out of scope for this tracer.

## Architecture

### CSS-driver pattern (hydration invariant)

A single rAF-throttled hook (`src/hooks/useScrollDriver.ts`) reads `window.scrollY` and writes two CSS custom properties — `--scroll` and `--progress` — onto `document.documentElement`. **Every visual reaction to scroll lives in `src/styles.css` and consumes those variables.**

The render code never reads `--scroll` or `--progress`, so SSR and client output are identical and React hydration is safe. This is grep-testable:

```bash
rg "var\(--scroll\)|var\(--progress\)" src/   # should hit only .css
rg "scrollY|--scroll|--progress" src/components src/routes  # should be empty
```

The hook does perform one render-side-effect: writing `aria-valuenow` to the progress bar via `document.querySelector("[data-progressbar]")`. That's a side-effect, not a render-read, so the invariant holds.

### z-index ladder (locked)

| Layer          | z-index | Position |
| -------------- | ------- | -------- |
| `SkyGradient`  | 0       | fixed    |
| `Clouds`       | 10      | fixed    |
| Scene rows     | 20      | in-flow  |
| `DigZone`      | 20      | in-flow  |
| `ProgressBar`  | 50      | fixed    |

### Honest-liar progress (decoupling note)

The progress bar is **not** a 1:1 reflection of scroll position. It runs linear from 0 -> 0.8, then half-speed from 0.8 -> 1.0. Reaching the page bottom yields ~0.9.

That last 10% (0.9 -> 1.0) is reserved for future dig discoveries: completionists can push past where they got last time. **A bar at 90% with the gradient fully night at the page bottom is intentional, not a bug.**

### Reduced motion

`prefers-reduced-motion: reduce` is respected entirely in CSS. Cloud-drift keyframes and `scroll-behavior: smooth` are wrapped in `@media (prefers-reduced-motion: no-preference)`. The scroll-driven gradient and progress bar still update — they reflect the user's own scrolling, which isn't ambient motion.

There is deliberately no JS `useReducedMotion` hook — pure-CSS gating is enough.

## Out of scope

This tracer intentionally does **not** include:

- Click-chip / hold-to-dig zones (only drag-to-clear)
- Easter eggs and tool gating
- `localStorage` persistence
- Audio
- Real linktree, project, or content data (placeholders only)
- Production `start` script and deployment configuration
- A JS reduced-motion hook (CSS handles it)

These come later. The tracer validates the foundational scroll/atmosphere/dig pattern.

## License

MIT — see [LICENSE](./LICENSE).
