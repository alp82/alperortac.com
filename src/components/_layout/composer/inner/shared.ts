import type { InnerBase } from "../types";

/*
 * Shared density scale for Layer-2 inner styles.
 *
 * Density is the one param every inside style shares; these maps turn it into
 * concrete max-width / vertical-gap / heading-scale values so every style reads
 * it the same way and the panel's control behaves predictably across styles.
 *
 * DEV-only — lives under composer/, dead-stripped from prod (see types.ts).
 */

/** Density → cluster vertical gap rhythm. */
export const DENSITY_GAP: Record<InnerBase["density"], string> = {
	cozy: "gap-3",
	comfortable: "gap-5",
	roomy: "gap-8",
};

/** Density → cluster max-width. */
export const DENSITY_MAXW: Record<InnerBase["density"], string> = {
	cozy: "max-w-xl",
	comfortable: "max-w-2xl",
	roomy: "max-w-3xl",
};

/** Density → heading scale (clusters live on a stage, so they trend large). */
export const DENSITY_HEADING: Record<InnerBase["density"], string> = {
	cozy: "text-4xl md:text-5xl",
	comfortable: "text-5xl md:text-7xl",
	roomy: "text-6xl md:text-8xl",
};
