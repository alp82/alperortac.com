import { linkStroke } from "../types";
import type { LinkRenderProps } from "../types";
import { railVars, useDrawIn, VBOX_H } from "./shared";

/*
 * Link: flowing-curve (VERTICAL)
 *
 * A smooth S-curve DESCENDING the page between two topics, weaving side to side
 * as it falls and alternating its initial weave by index so the journey snakes
 * down. Straddles the seam and bleeds into both stages (mask-faded ends).
 * `curve` (0..100) sets the horizontal meander amplitude; `animate` draws the
 * stroke on top→bottom as it enters view.
 */

export function FlowingCurveLink({
	index,
	isNight,
	params,
	accent,
}: LinkRenderProps) {
	const stroke = linkStroke(params.color, accent, isNight);
	const { ref, shown } = useDrawIn(params.animate);
	const amp = (params.curve / 100) * 40; // horizontal meander in viewBox x-units
	const dir = index % 2 === 0 ? 1 : -1;
	const H = VBOX_H;
	const x0 = 50 - dir * amp;
	const x1 = 50 + dir * amp;
	const d = `M ${x0} 6 C ${x0} ${H * 0.34}, ${x1} ${H * 0.66}, ${x1} ${H - 6}`;

	return (
		<div className="cmp-seam" aria-hidden="true">
			<div className="cmp-seam-rail" style={railVars(params)}>
				<svg ref={ref} viewBox={`0 0 100 ${H}`} preserveAspectRatio="none">
					<title>flowing curve descending</title>
					<path
						d={d}
						fill="none"
						stroke={stroke}
						strokeWidth={params.weight}
						strokeLinecap="round"
						pathLength={1}
						style={{
							strokeDasharray: 1,
							strokeDashoffset: shown ? 0 : 1,
							transition: params.animate
								? "stroke-dashoffset 900ms ease-out"
								: undefined,
						}}
					/>
				</svg>
			</div>
		</div>
	);
}
