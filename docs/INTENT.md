# Project Intent

Keep this to roughly one page. The agents read it on every judgment-call spawn - density matters more than completeness.

## Purpose

Alper Ortac's personal site - a scroll-driven journey that lets visitors discover what Alper builds, cares about, and spends time on. The site replaces a conventional portfolio/CV with an explorable terrain: visitors scroll down and dig into the Branches (work, passion, free time, beliefs) to learn who Alper is across his eight Topics.

## Primary users

Primary: fellow builders, the community Alper engages with, and fans / curious followers who already know him or his work and want to go deeper.

Secondary (welcomed, not the focus): recruiters and prospective collaborators evaluating Alper for opportunities. The site should be interesting and informative for them - just not optimized around their funnel.

## Success criteria

- Visitors reach and engage with at least one Topic Panel per session (not just the hero/sky band).
- The eight Topics in Branches feel distinct - visitors can name what Alper actually does, not just "developer."
- The site loads and animates smoothly on common laptop + mobile hardware (no stutter on the celestial sky curve or panel transitions).
- Inbound contact via the Linktree icons (or however Alper surfaces them) comes from people who clearly looked around, not cold scrapes.
- Content placeholders get filled in over time without the structure needing rework - the scaffolding holds as real Topic content lands.

## Out of scope

- A traditional CV/resume layout. The site is the resume; PDFs and timeline-of-jobs pages are not the target form.
- A CMS or admin UI. Content lives in `src/data/` TypeScript modules and ships via git - that's intentional.
- Multi-author or guest contributions. This is a personal site, single voice.
- Server-side rendering of personalized state, accounts, or any auth-protected surface. Public site only.
- Easter eggs and hidden interactions. Deferred for a future pass once the core scroll-journey is solid - not abandoned.
