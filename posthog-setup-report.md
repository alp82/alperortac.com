# PostHog post-wizard report

The wizard has completed a deep integration of PostHog analytics into the Alper Ortac portfolio site. The integration covers client-side event tracking for the scroll-journey and dig mechanic, automatic pageview/session capture via `PostHogProvider`, exception tracking via `capture_exceptions: true`, and a Vite reverse proxy so all PostHog requests route through `/ingest` (EU region).

## Changes made

| File | Change |
|---|---|
| `src/routes/__root.tsx` | Added `PostHogProvider` wrapping `{children}` in `RootDocument` |
| `vite.config.ts` | Added `/ingest` reverse proxy routes (EU assets + ingestion hosts, derived from env var) |
| `src/components/DigZone.tsx` | Added `usePostHog()` hook; captures `dig_started`, `dig_revealed`, `dig_revealed_keyboard` |
| `src/hooks/useScrollDriver.ts` | Added `usePostHog()` hook; captures `scroll_milestone_reached` at 25/50/75/90% |
| `.env` | Created with `VITE_PUBLIC_POSTHOG_PROJECT_TOKEN` and `VITE_PUBLIC_POSTHOG_HOST` |

## Events instrumented

| Event | Description | File |
|---|---|---|
| `dig_started` | User makes their first pointer-down on the soil canvas. Properties: `pointer_type`. | `src/components/DigZone.tsx` |
| `dig_revealed` | User clears ≥25% of soil via dragging, revealing the hidden content. Properties: `method`, `cleared_pct`. | `src/components/DigZone.tsx` |
| `dig_revealed_keyboard` | User pressed Space or Enter to skip the dig and immediately reveal content. Properties: `key`. | `src/components/DigZone.tsx` |
| `scroll_milestone_reached` | User scrolled past a depth milestone. Properties: `milestone_pct` (25, 50, 75, or 90). | `src/hooks/useScrollDriver.ts` |

## Next steps

We've built some insights and a dashboard for you to keep an eye on user behavior, based on the events we just instrumented:

- **Dashboard — Analytics basics**: https://eu.posthog.com/project/170755/dashboard/656121
- **Dig funnel: started → revealed**: https://eu.posthog.com/project/170755/insights/48SJvRLz
- **Scroll depth milestones**: https://eu.posthog.com/project/170755/insights/fwetKaK4
- **Dig reveals over time**: https://eu.posthog.com/project/170755/insights/T10kXmA0
- **Reveal method: drag vs keyboard**: https://eu.posthog.com/project/170755/insights/1DQF3Tun
- **Dig starts over time**: https://eu.posthog.com/project/170755/insights/NdhgVS0o

### Agent skill

We've left an agent skill folder in your project at `.claude/skills/integration-tanstack-start/`. You can use this context for further agent development when using Claude Code. This will help ensure the model provides the most up-to-date approaches for integrating PostHog.
