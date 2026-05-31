import { linkStroke } from "../types";
import type { LinkRenderProps } from "../types";
import { railVars, useDrawIn, VBOX_H } from "./shared";

/*
 * Link: ruled-seam (VERTICAL)
 *
 * A slim VERTICAL rule descending between two topics — a clean editorial
 * divider. `caps` sets the end treatment (round dot / bar tick / none); `double`
 * splits it into a parallel pair of rules. Straddles the seam, mask-faded ends.
 * Optional draw-in from the top down.
 */

export function RuledSeamLink({
	isNight,
	params,
	accent,
}: LinkRenderProps<"ruled-seam">) {
	const stroke = linkStroke(params.color, accent, isNight);
	const { ref, shown } = useDrawIn(params.animate);
	const H = VBOX_H;
	const xs = params.double ? [46, 54] : [50];

	const cap = (x: number, y: number) => {
		if (params.caps === "round")
			return <circle cx={x} cy={y} r={params.weight} fill={stroke} />;
		if (params.caps === "bar")
			return (
				<line
					x1={x - params.weight * 1.8}
					y1={y}
					x2={x + params.weight * 1.8}
					y2={y}
					stroke={stroke}
					strokeWidth={params.weight}
					strokeLinecap="round"
				/>
			);
		return null;
	};

	return (
		<div className="cmp-seam" aria-hidden="true">
			<div className="cmp-seam-rail" style={railVars(params)}>
				<svg ref={ref} viewBox={`0 0 100 ${H}`} preserveAspectRatio="none">
					<title>ruled seam descending</title>
					{xs.map((x) => (
						<g key={x}>
							<line
								x1={x}
								y1="6"
								x2={x}
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
							{cap(x, 6)}
							{cap(x, H - 6)}
						</g>
					))}
				</svg>
			</div>
		</div>
	);
}
