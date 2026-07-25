/*
 * Vertical-rhythm spacer: a transparent landscape-through gap between two
 * consecutive sections of the scroll journey. Deliberately empty - the
 * landscape/sky behind it IS the content of the gap (the band connector is
 * locked to none; the landscape is the seam). The height comes from the
 * celestial tuning state (`gapVh`), live-tunable on the Tune ☀ ☾ panel.
 */

type RhythmGapProps = {
	gapVh: number;
};

export function RhythmGap({ gapVh }: RhythmGapProps) {
	// Straight from the prop. This used to read a --gap-vh custom property that
	// the boot script set from a persisted gapVh, so a cold deep-link wouldn't
	// land its scroll against SSR-default gaps and then reflow at hydration.
	// Nothing is persisted any more (celestial.ts is the source of truth), so SSR
	// and hydration already agree and the indirection bought nothing.
	return (
		<div
			aria-hidden="true"
			data-testid="rhythm-gap"
			style={{ height: `${gapVh}vh` }}
		/>
	);
}
