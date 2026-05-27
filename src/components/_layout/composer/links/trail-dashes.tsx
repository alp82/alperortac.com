import { linkStroke } from "../types";
import type { LinkRenderProps } from "../types";
import { railVars, useAspectViewBox, useDrawIn } from "./shared";

/*
 * Link: trail-dashes (VERTICAL)
 *
 * A dashed footpath DESCENDING the page between two topics — the trail-signpost
 * world's connective tissue, a trail trodden downhill. Straddles the seam and
 * bleeds into both stages (mask-faded ends). `curve` sets the side-to-side
 * meander; dash size scales with weight. `animate` walks the dashes on (wipes
 * down) as the seam enters view.
 *
 * Shape-preserving: the viewBox height tracks the rail's real aspect ratio
 * (useAspectViewBox) so x/y scale uniformly — dashes keep a CONSTANT length and
 * gap as Height grows (more dashes, not stretched ones).
 */

export function TrailDashesLink({
	index,
	isNight,
	params,
	accent,
}: LinkRenderProps) {
	const stroke = linkStroke(params.color, accent, isNight);
	const path = params.color === "ink" ? "#6f4720" : stroke;
	const { ref, shown } = useDrawIn(params.animate);
	const H = useAspectViewBox(ref);
	const amp = (params.curve / 100) * 32; // horizontal meander in viewBox x-units
	const dir = index % 2 === 0 ? 1 : -1;
	const x0 = 50 - dir * amp;
	const x1 = 50 + dir * amp;
	// gentle double-bend descent
	const d = `M ${x0} 4 C ${x1} ${H * 0.3}, ${x0} ${H * 0.7}, ${x1} ${H - 4}`;
	const dash = `${params.weight * 2.4} ${params.weight * 2.4}`;

	return (
		<div className="cmp-seam" aria-hidden="true">
			<div className="cmp-seam-rail" style={railVars(params)}>
				<svg ref={ref} viewBox={`0 0 100 ${H}`} preserveAspectRatio="none">
					<title>trail dashes descending</title>
					<path
						d={d}
						fill="none"
						stroke={path}
						strokeWidth={params.weight}
						strokeLinecap="round"
						strokeDasharray={dash}
						style={{
							clipPath: shown ? "inset(0 0 0 0)" : "inset(0 0 100% 0)",
							transition: params.animate
								? "clip-path 900ms ease-out"
								: undefined,
						}}
					/>
				</svg>
			</div>
		</div>
	);
}
