import { linkStroke } from "../types";
import type { LinkRenderProps } from "../types";
import { railVars, useDrawIn, VBOX_H } from "./shared";

/*
 * Link: botanical-vine (VERTICAL)
 *
 * An organic vine GROWING DOWN the page between two topics, with small leaves
 * budding off it as it descends. Straddles the seam and bleeds into both stages
 * (mask-faded ends). The vine stroke uses the connector color; leaves take the
 * topic accent. `curve` sets how much the vine weaves side to side; `animate`
 * draws the vine on top→bottom as it enters view (leaves fade in after).
 */

// Leaf buds along the descending vine, parameterized by the stem's Bézier
// parameter t (0 = top, 1 = bottom) — NOT by raw viewBox-y — so each leaf's base
// can be anchored to the EXACT point on the curve at that t. side = which way the
// leaf buds; r = extra tilt added to the stem's local tangent angle.
const LEAVES = [
	{ t: 0.26, side: -1, r: -20 },
	{ t: 0.5, side: 1, r: 18 },
	{ t: 0.72, side: -1, r: -12 },
];

// Cubic Bézier value at parameter t for control values (p0,p1,p2,p3).
function cubic(t: number, p0: number, p1: number, p2: number, p3: number) {
	const u = 1 - t;
	return (
		u * u * u * p0 + 3 * u * u * t * p1 + 3 * u * t * t * p2 + t * t * t * p3
	);
}

export function BotanicalVineLink({
	index,
	isNight,
	params,
	accent,
}: LinkRenderProps) {
	const stroke = linkStroke(params.color, accent, isNight);
	const vine = params.color === "ink" ? "#3f6212" : stroke;
	const { ref, shown } = useDrawIn(params.animate);
	const amp = (params.curve / 100) * 30; // horizontal weave in viewBox x-units
	const dir = index % 2 === 0 ? 1 : -1;
	const H = VBOX_H;
	// vine descends, bowing out to one side then back — the SINGLE source of the
	// stem path; the leaves below evaluate this exact same cubic to stay attached.
	const p0 = { x: 50, y: 4 };
	const p1 = { x: 50 + dir * amp, y: H * 0.3 };
	const p2 = { x: 50 - dir * amp, y: H * 0.7 };
	const p3 = { x: 50, y: H - 4 };
	const d = `M ${p0.x} ${p0.y} C ${p1.x} ${p1.y}, ${p2.x} ${p2.y}, ${p3.x} ${p3.y}`;

	return (
		<div className="cmp-seam" aria-hidden="true">
			<div className="cmp-seam-rail" style={railVars(params)}>
				<svg ref={ref} viewBox={`0 0 100 ${H}`} preserveAspectRatio="none">
					<title>botanical vine descending</title>
					<path
						d={d}
						fill="none"
						stroke={vine}
						strokeWidth={params.weight}
						strokeLinecap="round"
						pathLength={1}
						style={{
							strokeDasharray: 1,
							strokeDashoffset: shown ? 0 : 1,
							transition: params.animate
								? "stroke-dashoffset 1000ms ease-out"
								: undefined,
						}}
					/>
					{LEAVES.map((leaf, i) => {
						// Exact point on the stem at this leaf's t — the leaf BASE anchors
						// here, so it sprouts from the vine at every curve + height.
						const sx = cubic(leaf.t, p0.x, p1.x, p2.x, p3.x);
						const sy = cubic(leaf.t, p0.y, p1.y, p2.y, p3.y);
						const rx = 4 + params.weight;
						const ry = 2 + params.weight / 2;
						// push the ellipse CENTER outward from the stem by ~rx so its inner
						// tip meets the stem (base on the vine, blade pointing outward).
						const cx = sx + leaf.side * rx;
						const cy = sy;
						return (
							<ellipse
								key={`${leaf.t}-${leaf.side}`}
								cx={cx}
								cy={cy}
								rx={rx}
								ry={ry}
								fill={accent}
								stroke={vine}
								strokeWidth={Math.max(params.weight / 2, 0.6)}
								// rotate about the STEM anchor (sx,sy), not the leaf center, so
								// the blade swings around its attachment point on the vine.
								transform={`rotate(${leaf.r} ${sx} ${sy})`}
								style={{
									opacity: shown ? 0.9 : 0,
									transition: params.animate
										? `opacity 400ms ease-out ${500 + i * 150}ms`
										: undefined,
								}}
							/>
						);
					})}
				</svg>
			</div>
		</div>
	);
}
