import type { LinkRenderProps } from "../types";
import { linkStroke } from "../types";
import { railVars, useDrawIn, VBOX_H } from "./shared";

/*
 * Link: botanical-vine (VERTICAL)
 *
 * An organic vine GROWING DOWN the page, with leaves budding off it. The vine
 * stroke takes the connector color; leaves take the topic accent. `curve` sets
 * the weave; `foliage` sets leaf density; `bud` flowers the growing tip.
 * `animate` draws the vine top→bottom (leaves fade in after).
 */

// Leaf buds along the descending vine, anchored by the stem's Bézier parameter
// t (0 = top, 1 = bottom). side = which way the leaf buds; r = extra tilt.
const FOLIAGE: Record<
	"sparse" | "lush",
	{ t: number; side: number; r: number }[]
> = {
	sparse: [
		{ t: 0.26, side: -1, r: -20 },
		{ t: 0.5, side: 1, r: 18 },
		{ t: 0.72, side: -1, r: -12 },
	],
	lush: [
		{ t: 0.16, side: 1, r: 16 },
		{ t: 0.3, side: -1, r: -20 },
		{ t: 0.44, side: 1, r: 18 },
		{ t: 0.58, side: -1, r: -16 },
		{ t: 0.72, side: 1, r: 14 },
		{ t: 0.86, side: -1, r: -12 },
	],
};

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
}: LinkRenderProps<"botanical-vine">) {
	const stroke = linkStroke(params.color, accent, isNight);
	const vine = params.color === "ink" ? "#3f6212" : stroke;
	const { ref, shown } = useDrawIn(params.animate);
	const amp = (params.curve / 100) * 30; // horizontal weave in viewBox x-units
	const dir = index % 2 === 0 ? 1 : -1;
	const H = VBOX_H;
	const p0 = { x: 50, y: 4 };
	const p1 = { x: 50 + dir * amp, y: H * 0.3 };
	const p2 = { x: 50 - dir * amp, y: H * 0.7 };
	const p3 = { x: 50, y: H - 4 };
	const d = `M ${p0.x} ${p0.y} C ${p1.x} ${p1.y}, ${p2.x} ${p2.y}, ${p3.x} ${p3.y}`;
	const leaves = FOLIAGE[params.foliage];

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
					{leaves.map((leaf, i) => {
						const sx = cubic(leaf.t, p0.x, p1.x, p2.x, p3.x);
						const sy = cubic(leaf.t, p0.y, p1.y, p2.y, p3.y);
						const rx = 4 + params.weight;
						const ry = 2 + params.weight / 2;
						const cx = sx + leaf.side * rx;
						return (
							<ellipse
								key={`${leaf.t}-${leaf.side}`}
								cx={cx}
								cy={sy}
								rx={rx}
								ry={ry}
								fill={accent}
								stroke={vine}
								strokeWidth={Math.max(params.weight / 2, 0.6)}
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
					{params.bud && (
						// A flower at the growing tip: accent bloom with a pale center.
						<g
							style={{
								opacity: shown ? 1 : 0,
								transition: params.animate
									? `opacity 400ms ease-out ${500 + leaves.length * 150}ms`
									: undefined,
							}}
						>
							<circle
								cx={p3.x}
								cy={p3.y}
								r={params.weight * 1.8}
								fill={accent}
								stroke={vine}
								strokeWidth={Math.max(params.weight / 2, 0.6)}
							/>
							<circle
								cx={p3.x}
								cy={p3.y}
								r={params.weight * 0.7}
								fill="rgba(255,255,255,0.85)"
							/>
						</g>
					)}
				</svg>
			</div>
		</div>
	);
}
