import { useRef } from "react";
import type { FloatingIslandParams, InnerRenderProps } from "../types";
import { AccentUnderlineHeading, FrameShell } from "./FrameShell";
import { DENSITY_GAP, DENSITY_HEADING, DENSITY_MAXW } from "./shared";
import { useRelativeScrollOffset } from "./shared-hooks";

/*
 * Inner: floating-island — "cluster on a floating slab." (ported from the
 * retired Layer-1 stage of the same name)
 *
 * The cluster rests on a floating slab with a soft drop shadow; the slab bobs
 * gently as it scrolls through view, with the Minimal style's big uppercase
 * heading + accent underline as the fixed chrome. The scroll measurement ref
 * sits on an UNTRANSFORMED wrapper — getBoundingClientRect includes the
 * element's own transform, so measuring the bobbing slab itself would feed the
 * bob back into its own input (the retired stage measured the untransformed
 * article).
 *
 * Knobs — `floatHeight` grows the shadow throw + lift; `bob` is the idle drift
 * amount (0 = still); `corners` sets the slab radius; `tint` is the slab surface
 * opacity (glassy → solid). Reduced-motion safe: the listener never attaches.
 */

const RADIUS: Record<FloatingIslandParams["corners"], string> = {
	sharp: "6px",
	soft: "18px",
	pill: "32px",
};

export function FloatingIslandCluster({
	topic,
	params,
	accent,
	children,
}: InnerRenderProps<"floating-island">) {
	const ref = useRef<HTMLDivElement>(null);
	const rel = useRelativeScrollOffset(ref);

	const surface = params.tint / 100;
	const lift = -(params.floatHeight * 0.12);
	const bobPx = (rel * 24 * params.bob) / 50;
	const shadow = `0 ${24 + params.floatHeight * 0.7}px ${48 + params.floatHeight}px -30px rgba(0,0,0,0.85)`;

	const heading = (
		<AccentUnderlineHeading
			heading={topic.heading}
			accent={accent}
			headingClassName={DENSITY_HEADING[params.density]}
		/>
	);

	return (
		<div ref={ref} className="relative w-full flex flex-col items-center">
			<div
				className="cmp-island relative w-full max-w-2xl flex flex-col items-center text-center"
				style={
					{
						transform: `translate3d(0, ${lift + bobPx}px, 0)`,
						"--cmp-island-surface": String(surface),
						"--cmp-island-radius": RADIUS[params.corners],
						"--cmp-island-shadow": shadow,
					} as React.CSSProperties
				}
			>
				<div className="relative p-8 md:p-12 w-full">
					<FrameShell
						className={`flex flex-col items-center text-center ${DENSITY_GAP[params.density]}`}
						heading={heading}
						contentClassName={`w-full ${DENSITY_MAXW[params.density]}`}
					>
						{children}
					</FrameShell>
				</div>
			</div>
		</div>
	);
}
