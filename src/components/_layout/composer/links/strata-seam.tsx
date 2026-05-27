import { linkStroke } from "../types";
import type { LinkRenderProps } from "../types";
import { railVars, revealDownStyle, useDrawIn, VBOX_H } from "./shared";

/*
 * Link: strata-seam (VERTICAL)
 *
 * A geological core descending between two topics: a few vertical sediment
 * stripes running top→bottom with a brighter mineral vein threading down the
 * middle. Ties to the dig / strata-core world — a core sample dropping through
 * the seam. Straddles the seam and bleeds into both stages (mask-faded ends).
 * No curve. `weight` sets the vein thickness; `animate` wipes the core in from
 * the top.
 */

// Vertical sediment stripes spanning the rail width (x-bands), earthy tones.
const BANDS = [
	{ x: 30, w: 9, fill: "#6f4720" },
	{ x: 39, w: 7, fill: "#8a5a28" },
	{ x: 46, w: 11, fill: "#5c4a36" },
	{ x: 57, w: 8, fill: "#7a5b3a" },
];

export function StrataSeamLink({ isNight, params, accent }: LinkRenderProps) {
	const vein = linkStroke(params.color, accent, isNight);
	const { ref, shown } = useDrawIn(params.animate);
	const H = VBOX_H;

	return (
		<div className="cmp-seam" aria-hidden="true">
			<div className="cmp-seam-rail" style={railVars(params)}>
				<svg
					ref={ref}
					viewBox={`0 0 100 ${H}`}
					preserveAspectRatio="none"
					style={revealDownStyle(shown, 900, params.animate)}
				>
					<title>strata core descending</title>
					{BANDS.map((b) => (
						<rect
							key={b.x}
							x={b.x}
							y="0"
							width={b.w}
							height={H}
							fill={b.fill}
							opacity={0.55}
						/>
					))}
					{/* mineral vein running down the core */}
					<line
						x1="50"
						y1="0"
						x2="50"
						y2={H}
						stroke={vein}
						strokeWidth={params.weight}
						opacity={0.9}
					/>
				</svg>
			</div>
		</div>
	);
}
