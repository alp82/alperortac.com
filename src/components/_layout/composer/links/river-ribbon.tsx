import { linkStroke } from "../types";
import type { LinkRenderProps } from "../types";
import { railVars, revealDownStyle, useDrawIn, VBOX_H } from "./shared";

/*
 * Link: river-ribbon (VERTICAL)
 *
 * A flowing water ribbon DESCENDING the page between two topics — a filled band
 * that weaves side to side as it falls, with a lighter mid-current highlight,
 * nodding to the site's journey-down-a-river feel. Straddles the seam and
 * bleeds into both stages (mask-faded ends via .cmp-seam-rail). `weight`
 * thickens the ribbon, `curve` sets the horizontal meander amplitude, `index`
 * alternates the weave direction, `animate` reveals it top→bottom on enter.
 */

export function RiverRibbonLink({
	index,
	isNight,
	params,
	accent,
}: LinkRenderProps) {
	const base =
		params.color === "ink"
			? isNight
				? "#38bdf8"
				: "#7dd3fc"
			: linkStroke(params.color, accent, isNight);
	const { ref, shown } = useDrawIn(params.animate);
	const amp = (params.curve / 100) * 26; // horizontal meander in viewBox x-units
	const dir = index % 2 === 0 ? 1 : -1;
	const w = 4 + params.weight * 2; // ribbon half-thickness in viewBox x-units
	const midX = 50;
	const H = VBOX_H;
	// centerline weaves left↔right as y descends 0→H (S as it falls)
	const cx0 = midX - dir * amp;
	const cx1 = midX + dir * amp;
	const center = `M ${cx0} 4 C ${cx0} ${H * 0.34}, ${cx1} ${H * 0.66}, ${cx1} ${H - 4}`;
	// ribbon = right edge down, left edge back up, closed
	const ribbon =
		`M ${cx0 + w} 4 C ${cx0 + w} ${H * 0.34}, ${cx1 + w} ${H * 0.66}, ${cx1 + w} ${H - 4} ` +
		`L ${cx1 - w} ${H - 4} C ${cx1 - w} ${H * 0.66}, ${cx0 - w} ${H * 0.34}, ${cx0 - w} 4 Z`;

	return (
		<div className="cmp-seam" aria-hidden="true">
			<div className="cmp-seam-rail" style={railVars(params)}>
				<svg
					ref={ref}
					viewBox={`0 0 100 ${H}`}
					preserveAspectRatio="none"
					style={revealDownStyle(shown, 1000, params.animate)}
				>
					<title>river ribbon descending</title>
					<path d={ribbon} fill={base} opacity={0.55} />
					<path
						d={center}
						fill="none"
						stroke="rgba(255,255,255,0.7)"
						strokeWidth={Math.max(params.weight * 0.5, 0.8)}
						strokeLinecap="round"
					/>
				</svg>
			</div>
		</div>
	);
}
