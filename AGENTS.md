# AGENTS.md

> Keep this file concise. Update it whenever scope or design shifts.

## What this is

Alper Ortac's personal site. A personal-brand surface.

## The shape

A vertical scroll journey:

- **Sky / day (top)** — linktree. Social and platform links.
- **Ground / dusk → night (bottom)** — career, freelancing, side projects
- **Sidetracks (left and right extensions)** — deeper writing, insights, content snippets, opinions. Easter eggs mostly live here.

## Feel

- Nature-themed
- Warm atmosphere
- Simple, whimsical animations.

## Mechanics

- **Scroll** drives the day → night transition and the descent.
- **Progress bar** always visible. Linear 0 → 80%. After 80% it visibly slows — depth requires effort, not just scrolling. Honest-liar pattern: completionists can push past where they got last time.
- **Persistence** via localStorage — track found items and easter eggs across sessions.
- **Audio** is ambient. Default off, clear toggle.

## Constraints

- Mobile must work. Every desktop interaction needs a touch equivalent.
- Reduced-motion preference is respected.
