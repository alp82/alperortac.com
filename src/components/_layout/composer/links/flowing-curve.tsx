import { linkStroke } from "../types";
import type { LinkRenderProps } from "../types";
import { railVars, useDrawIn, VBOX_H } from "./shared";

/*
 * Link: flowing-curve (VERTICAL)
 *
 * A smooth S-curve DESCENDING the page, weaving side to side as it falls and
 * alternating its initial weave by index. `curve` sets the meander amplitude;
 * `weave` sets how many bends fall down the descent (single → triple).
 * `animate` draws the stroke top→bottom as it enters view.
 */

const WEAVE: Record<"single" | "double" | "triple", number> = {
	single: 1,
	double: 2,
	triple: 3,
};

export function FlowingCurveLink({
	index,
	isNight,
	params,
	accent,
}: LinkRenderProps<"flowing-curve">) {
	const stroke = linkStroke(params.color, accent, isNight);
	const { ref, shown } = useDrawIn(params.animate);
	const amp = (params.curve / 100) * 40; // horizontal meander in viewBox x-units
	const dir = index % 2 === 0 ? 1 : -1;
	const H = VBOX_H;
	const bends = WEAVE[params.weave];
	// One cubic half-wave per bend, bowing alternately to each side; stitched
	// top→bottom through the centerline so the bends read as one flowing snake.
	const seg = (H - 12) / bends;
	let d = "M 50 6";
	for (let i = 0; i < bends; i++) {
		const y0 = 6 + i * seg;
		const xc = 50 + dir * (i % 2 === 0 ? 1 : -1) * amp;
		d += ` C ${xc} ${y0 + seg * 0.34}, ${xc} ${y0 + seg * 0.66}, 50 ${y0 + seg}`;
	}

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
