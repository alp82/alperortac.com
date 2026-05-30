import type { InnerParams } from "../types";

/*
 * Shared scales for Layer-2 inner styles.
 *
 * Inner styles render a CENTERED CLUSTER (heading + teaser + triggers) inside a
 * Layer-1 stage. These maps turn the three shared params (color / density /
 * motif) into concrete values so every style reads density the same way and the
 * panel's controls behave predictably across styles.
 *
 * DEV-only — lives under composer/, dead-stripped from prod (see types.ts).
 */

/** Density → cluster max-width + vertical gap rhythm. */
export const DENSITY_GAP: Record<InnerParams["density"], string> = {
	cozy: "gap-3",
	comfortable: "gap-5",
	roomy: "gap-8",
};

export const DENSITY_MAXW: Record<InnerParams["density"], string> = {
	cozy: "max-w-xl",
	comfortable: "max-w-2xl",
	roomy: "max-w-3xl",
};

/** Density → heading scale (clusters live on a stage, so they trend large). */
export const DENSITY_HEADING: Record<InnerParams["density"], string> = {
	cozy: "text-4xl md:text-5xl",
	comfortable: "text-5xl md:text-7xl",
	roomy: "text-6xl md:text-8xl",
};

/**
 * Resolve the cluster's primary text color from the color param + night state.
 * `accent` keeps text light/dark per phase (it's the stage that carries the
 * accent); `inverted` forces the opposite of the phase; `neutral` follows it.
 */
export function clusterTextColor(
	color: InnerParams["color"],
	isNight: boolean,
): string {
	if (color === "inverted") return isNight ? "#0f172a" : "#f8fafc";
	// accent + neutral both follow the phase for legibility against the scrim.
	return isNight ? "#f8fafc" : "#0f172a";
}

/** True when the cluster should treat itself as sitting on a light surface. */
export function isLightSurface(
	color: InnerParams["color"],
	isNight: boolean,
): boolean {
	if (color === "inverted") return isNight;
	return !isNight;
}
