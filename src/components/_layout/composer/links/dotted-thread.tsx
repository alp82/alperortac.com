import { linkStroke } from "../types";
import type { LinkRenderProps } from "../types";
import { railVars, useAspectViewBox, useDrawIn } from "./shared";

/*
 * Link: dotted-thread (VERTICAL)
 *
 * A simple dotted thread DESCENDING the page between two topics — a minimal
 * stitch of round dots dropping down, an understated alternative to the heavier
 * connectors. Straddles the seam and bleeds into both stages (mask-faded ends).
 * `curve` bows the thread sideways; `weight` sizes the dots; `animate` draws the
 * dots on from the top.
 *
 * Shape-preserving: the viewBox height tracks the rail's real aspect ratio
 * (useAspectViewBox) so x/y scale uniformly — the dots stay ROUND and evenly
 * spaced as Height grows (more dots, not stretched ovals).
 */

export function DottedThreadLink({
	index,
	isNight,
	params,
	accent,
}: LinkRenderProps) {
	const stroke = linkStroke(params.color, accent, isNight);
	const { ref, shown } = useDrawIn(params.animate);
	const H = useAspectViewBox(ref);
	const amp = (params.curve / 100) * 24; // sideways bow in viewBox x-units
	const dir = index % 2 === 0 ? 1 : -1;
	// single gentle bow as it descends
	const d = `M 50 4 Q ${50 + dir * amp} ${H * 0.5}, 50 ${H - 4}`;
	const dash = `0.1 ${params.weight * 2.6}`;

	return (
		<div className="cmp-seam" aria-hidden="true">
			<div className="cmp-seam-rail" style={railVars(params)}>
				<svg ref={ref} viewBox={`0 0 100 ${H}`} preserveAspectRatio="none">
					<title>dotted thread descending</title>
					<path
						d={d}
						fill="none"
						stroke={stroke}
						strokeWidth={params.weight}
						strokeLinecap="round"
						strokeDasharray={dash}
						style={{
							clipPath: shown ? "inset(0 0 0 0)" : "inset(0 0 100% 0)",
							transition: params.animate
								? "clip-path 800ms ease-out"
								: undefined,
						}}
					/>
				</svg>
			</div>
		</div>
	);
}
