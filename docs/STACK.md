# Stack

Not a dependency list. A statement of which tools the project uses at each layer, what constraints they impose, and why they were chosen. Agents read this to avoid suggesting the wrong library or pattern.

Group by layer. Each entry: tool name, the constraint it puts on the codebase, and a one-line why.

## Language and runtime

TypeScript 6 (strict) on Bun 1.3.11
- **Constraint:** `strict`, `noUncheckedIndexedAccess`, and `exactOptionalPropertyTypes` are all on. Array/record access must be narrowed. Optional properties cannot be assigned `undefined` explicitly. Bun is the package manager and script runner - no npm/yarn/pnpm lockfiles.
- **Why:** Maximum type safety on a small surface; Bun gives fast installs and a single tool for run/test/install.

## Framework

TanStack Start (file-based router) + React 19
- **Constraint:** Routes live under `src/routes/` and are generated into `src/routeTree.gen.ts` - do not hand-edit the gen file. Layout routes use the `_layout.tsx` convention. React 19 server-component patterns are not in use; treat all components as client components running through Vite.
- **Why:** File-based routing with first-class type safety, fits a static-content site without dragging in Next.js.

## Data layer

Static TypeScript modules under `src/data/`
- **Constraint:** All content (sections, topics, personal data) is hand-authored TypeScript. No database, no fetch-at-runtime for content. Schema lives in the module types - changes are PRs, not data migrations.
- **Why:** Personal site with bounded content; git history is the audit log and content is co-versioned with the code that renders it.

## Auth

None - public site.
- **Constraint:** No login flows, no protected routes, no session storage of identity.
- **Why:** Nothing to gate.

## UI / styling

Tailwind v4 (via `@tailwindcss/vite`) + lucide-react + @icons-pack/react-simple-icons
- **Constraint:** Tailwind utility classes only - no CSS modules, no styled-components. Icons come from lucide-react (generic UI) and simple-icons (brand marks). Custom CSS lives in `src/styles.css` for things Tailwind can't express (panel slide animations, etc.).
- **Why:** v4's CSS-first config keeps the design tokens close to the styles; icon split keeps brand-mark licensing clean.

## Testing

Vitest 4 + @testing-library/react + jsdom
- **Constraint:** Tests colocated under `__tests__/` next to the module they cover (e.g. `src/data/__tests__/sections.test.ts`). jsdom is the default environment. No Playwright / e2e harness yet.
- **Why:** Fast unit/component tests aligned with the Vite toolchain.
- **Gotcha:** Vitest's default include glob also collects test files inside dot-directories, so any `.prototypes/*.test.tsx` tracer counts toward the suite total. `vite.config.ts` sets no `test.include` override to narrow it. Delete prototype tracer tests when their purpose is done, or the reported test count drifts.

## Tooling

Biome 2.4.5 (lint + format), Bun (packages + scripts), Vite 8 (bundler), TanStack devtools
- **Constraint:** Biome only - no Prettier, no ESLint configs. Bun is the script runner (`bun run`, `bun test`). Vite 8 powers dev and build. TanStack devtools mounted in development for router debugging.
- **Why:** One linter/formatter, one package manager, one bundler - minimizes config drift.

## Hosting / deploy

Hetzner (via Coolify, Nixpacks auto-detect)
- **Constraint:** Self-hosted on Hetzner with Coolify orchestrating the deploy through Nixpacks auto-detection - no Dockerfile, no `nixpacks.toml`, no `start` script in the repo. Coolify runs `bun run build` and serves the TanStack Start Nitro output (`.output/server/index.mjs`). No vendor-specific edge runtime features (no Vercel edge, no Cloudflare Workers APIs).
- **Why:** Owns the infra end-to-end; no platform lock-in; cost-stable. Nixpacks keeps the deploy config out of the repo until something forces a custom build.

## Analytics

PostHog EU (`@posthog/react`) via `/ingest` reverse proxy
- **Constraint:** PostHog client routes through a same-origin `/ingest` path (configured at the hosting layer) so ad-blockers and CSP don't drop the events. EU region for data-residency.
- **Why:** Lightweight product analytics with EU hosting that fits the Hetzner setup.
