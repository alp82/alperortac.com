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
	return (
		<div
			aria-hidden="true"
			data-testid="rhythm-gap"
			style={{ height: `${gapVh}vh` }}
		/>
	);
}
