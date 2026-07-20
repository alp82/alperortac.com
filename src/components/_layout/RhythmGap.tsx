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
	// Height comes from --gap-vh so the boot script (skyBoot.ts) can apply the
	// stored gapVh before paint - otherwise a cold deep-link lands the scroll
	// against the SSR-default 55vh gaps, then the stored value reflows every gap
	// at hydration and slides the target section out of view. React (LayoutHost)
	// owns --gap-vh after hydration; the prop is the SSR/pre-boot fallback.
	return (
		<div
			aria-hidden="true"
			data-testid="rhythm-gap"
			style={{ height: `var(--gap-vh, ${gapVh}vh)` }}
		/>
	);
}
