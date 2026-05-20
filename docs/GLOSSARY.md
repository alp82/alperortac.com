# Glossary

Canonical terms for this project. Agents read this to avoid renaming the same concept three different ways across files.

## Terms

For each domain term, give the definition and the aliases to avoid. Aliases should be the names that have crept in elsewhere or that are tempting but wrong here.

### Branches

**Definition:** The middle scroll region of the site - the band between the sky/hero band above and the roots/footer band below. It contains the eight Topics that represent what Alper does and cares about: work, passion, free time, and beliefs. The internal code identifier for this region remains `SECTION_IDS.craft`; only the human-facing label is "Branches."

**Avoid:** "Craft band" (old name), "the craft section" (refers to the same region), "middle section" (too vague - say Branches when you mean this specific band).

### Topic

**Definition:** One of the eight items inside Branches. Each Topic has its own Trigger card on the page and opens into a Panel when activated. Topics are defined in `src/data/topics.ts` and are the unit of content discovery.

**Avoid:** "card" (a Trigger is a card, a Topic is the underlying content), "section" (Topics live inside the Branches section - they are not themselves sections), "tile."

### Panel

**Definition:** The slide-in dialog that opens when a visitor activates a Topic's Trigger. Panels contain the actual Topic content (career, music, teaching, family, learning, etc.) and animate in/out via the styles in `src/styles.css`. One Panel is open at a time.

**Avoid:** "modal" (Panel is not a modal in the WAI-ARIA sense - it doesn't trap focus the same way), "drawer," "sidetrack" (see Flagged ambiguities below), "popup."

### Trigger

**Definition:** The interactive card surfaced inside Branches that, when activated, opens its Topic's Panel. Implemented by `SectionTriggerCard`. Triggers are the entry points; Panels are the destinations.

**Avoid:** "button" (it's a card-shaped affordance, not a button visually), "card" by itself (too generic), "tile."

### Minimap

**Definition:** The navigation/orientation component that shows the visitor where they are in the scroll-journey and lets them jump between bands and Topics. Code lives under `src/components/minimap/` and `src/components/Minimap.tsx`.

**Avoid:** "nav," "menu," "scroll indicator," "table of contents."

### CelestialState

**Definition:** The computed state of the sky/celestial background (sun/moon position, sky color, time-of-day curve) that drives the visual atmosphere of the hero band. Tied to the SkyCurve calculation.

**Avoid:** "sky state" (acceptable casually but `CelestialState` is the canonical name in code and prose), "background state," "weather."

### SkyCurve

**Definition:** The curve / mathematical function that maps scroll position (or time) to the visual state used by CelestialState. Recent commit history adds and tests this directly.

**Avoid:** "sky function," "sun curve," "gradient curve."

### Linktree

**Definition:** The set of outbound social/contact links rendered in the layout (typically as icons - GitHub, etc., via simple-icons). Named after the pattern, not the product.

**Avoid:** "social links" (acceptable in body text, but Linktree is the code/prose term for the cluster), "contact bar," "footer links" (overlaps but is not the same).

## Relationships

- Branches contains the eight Topics. Topics are not Branches; they live inside it.
- Each Topic has one Trigger (the card) and one Panel (the slide-in content). Activating the Trigger opens the Panel.
- CelestialState is driven by SkyCurve. SkyCurve is the function; CelestialState is the value at a given scroll position.
- Linktree is layout-level, not Branches-level. It is not a Topic and does not have a Panel.
- Minimap reflects scroll position across all bands (sky / Branches / below) and can navigate to Topics inside Branches.

## Flagged ambiguities

- "Panel" vs "sidetrack" - earlier drafts called the slide-in surface a "sidetrack." Panel is the canonical term now. If "sidetrack" appears in code or comments, it refers to the same thing and should be renamed when touched.
- Deprecated terms from the previous architecture - these appear in the stale README but are NOT part of the current codebase: `DigZone`, `useScrollDriver`, "honest-liar progress bar," drag-to-clear. Do not introduce these; if you see them in code, they are legacy and slated for removal.
- "The Craft" Topic vs "Branches" region - historically both used "craft." "The Craft" is one of the eight Topics (`id: "craft"`, heading "The Craft" in `src/data/topics.ts`); the region that contains it is now "Branches" (its code id remains `SECTION_IDS.craft`). The rename **resolves the human-facing ambiguity**, but the shared `craft` identifier still leaks through code - when touching it, prefer "Branches" for the region and "The Craft" / `craft` Topic for the entry.
