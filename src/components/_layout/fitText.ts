export type FitTextSpec = {
	ceilingPx: number;
	fixedPx: number;
	allowancePx: number;
};

// Scales a single line's font size so it never wraps: the ghost copy is
// measured at the ceiling size, and the scalable portion (ghost minus the
// size-invariant fixed pixels: gaps, padding) is shrunk proportionally to fit
// the available width. The 24px soft floor from the design is a PREFERENCE
// only and is deliberately NOT clamped here — single-line is the hard
// invariant, so sub-floor sizes are the intended behavior on the narrowest
// phones. Only a 1px hard floor keeps the result positive and finite.
export type Ceiling = { minWidth: number; px: number };

// Resolve the largest-matching breakpoint ceiling. `ceilings` MUST be sorted
// descending by minWidth; returns the last (smallest) entry's px as the floor
// fallback for tiny/zero/negative widths (e.g. SSR where innerWidth is 0).
export function resolveCeiling(
	viewportWidth: number,
	ceilings: Ceiling[],
): number {
	for (const c of ceilings) {
		if (viewportWidth >= c.minWidth) return c.px;
	}
	// Empty `ceilings` is a caller error; Infinity makes the outer min a no-op.
	return ceilings.at(-1)?.px ?? Number.POSITIVE_INFINITY;
}

export function fitFontSize(
	containerW: number,
	ghostW: number,
	spec: FitTextSpec,
): number {
	const scalable = ghostW - spec.fixedPx;
	// jsdom/pre-layout fallback: unmeasured widths must never yield NaN/0.
	if (containerW <= 0 || scalable <= 0) return spec.ceilingPx;
	const avail = containerW - spec.fixedPx - spec.allowancePx;
	return Math.max(
		1,
		Math.min(spec.ceilingPx, (spec.ceilingPx * avail) / scalable),
	);
}
