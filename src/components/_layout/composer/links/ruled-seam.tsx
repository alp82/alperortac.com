import { linkStroke } from "../types";
import type { LinkRenderProps } from "../types";
import { railVars, useDrawIn, VBOX_H } from "./shared";

/*
 * Link: ruled-seam (VERTICAL)
 *
 * A single slim VERTICAL rule with small end-caps — a clean editorial divider
 * descending between two topics. Straddles the seam and bleeds into both stages
 * (mask-faded ends). No curve. Optional draw-in from the top downward.
 */

export function RuledSeamLink({ isNight, params, accent }: LinkRenderProps) {
	const stroke = linkStroke(params.color, accent, isNight);
	const { ref, shown } = useDrawIn(params.animate);
	const H = VBOX_H;

	return (
		<div className="cmp-seam" aria-hidden="true">
			<div className="cmp-seam-rail" style={railVars(params)}>
				<svg ref={ref} viewBox={`0 0 100 ${H}`} preserveAspectRatio="none">
					<title>ruled seam descending</title>
					<line
						x1="50"
						y1="6"
						x2="50"
						y2={H - 6}
						stroke={stroke}
						strokeWidth={params.weight}
						strokeLinecap="round"
						pathLength={1}
						style={{
							strokeDasharray: 1,
							strokeDashoffset: shown ? 0 : 1,
							transition: params.animate
								? "stroke-dashoffset 700ms ease-out"
								: undefined,
						}}
					/>
					<circle cx="50" cy="6" r={params.weight} fill={stroke} />
					<circle cx="50" cy={H - 6} r={params.weight} fill={stroke} />
				</svg>
			</div>
		</div>
	);
}
