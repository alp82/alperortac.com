// Gates the Branches trigger cards and the panels they open.
// false in production (Rollup tree-shakes the disabled paths out of the bundle).
// Flip to `true` to ship them.
export const TRIGGERS_ENABLED = import.meta.env.DEV && false;
