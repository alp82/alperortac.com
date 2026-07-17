import type { LinkRenderProps } from "../types";
import { linkStroke } from "../types";
import { railVars, useAspectViewBox, useDrawIn } from "./shared";

/*
 * Link: trail-dashes (VERTICAL)
 *
 * A dashed footpath DESCENDING the page - the trail world's connective tissue.
 * `curve` sets the meander; `dash` sets the dash rhythm (fine → bold);
 * `footprints` drops little prints alternating along the path. `animate` walks
 * the dashes on (wipes down). Shape-preserving viewBox so dashes keep a constant
 * length as Height grows.
 */

const DASH: Record<"fine" | "standard" | "bold", number> = {
	fine: 1.5,
	standard: 2.4,
	bold: 3.6,
};

function cubic(t: number, p0: number, p1: number, p2: number, p3: number) {
	const u = 1 - t;
	return (
		u * u * u * p0 + 3 * u * u * t * p1 + 3 * u * t * t * p2 + t * t * t * p3
	);
}

export function TrailDashesLink({
	index,
	isNight,
	params,
	accent,
}: LinkRenderProps<"trail-dashes">) {
	const stroke = linkStroke(params.color, accent, isNight);
	const path = params.color === "ink" ? "#6f4720" : stroke;
	const { ref, shown } = useDrawIn(params.animate);
	const H = useAspectViewBox(ref);
	const amp = (params.curve / 100) * 32; // horizontal meander in viewBox x-units
	const dir = index % 2 === 0 ? 1 : -1;
	const p0 = { x: 50 - dir * amp, y: 4 };
	const p1 = { x: 50 + dir * amp, y: H * 0.3 };
	const p2 = { x: 50 - dir * amp, y: H * 0.7 };
	const p3 = { x: 50 + dir * amp, y: H - 4 };
	const d = `M ${p0.x} ${p0.y} C ${p1.x} ${p1.y}, ${p2.x} ${p2.y}, ${p3.x} ${p3.y}`;
	const len = params.weight * DASH[params.dash];
	const reveal: React.CSSProperties = {
		clipPath: shown ? "inset(0 0 0 0)" : "inset(0 0 100% 0)",
		transition: params.animate ? "clip-path 900ms ease-out" : undefined,
	};
	const prints = params.footprints ? [0.22, 0.42, 0.62, 0.82] : [];

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
						strokeDasharray={`${len} ${len}`}
						style={reveal}
					/>
					{prints.map((t, i) => {
						const x = cubic(t, p0.x, p1.x, p2.x, p3.x);
						const y = cubic(t, p0.y, p1.y, p2.y, p3.y);
						const off = (i % 2 === 0 ? 1 : -1) * (params.weight + 1.5);
						return (
							<ellipse
								key={t}
								cx={x + off}
								cy={y}
								rx={params.weight * 0.9}
								ry={params.weight * 0.5}
								fill={path}
								transform={`rotate(${i % 2 === 0 ? 22 : -22} ${x + off} ${y})`}
								style={{
									opacity: shown ? 0.7 : 0,
									transition: params.animate
										? `opacity 300ms ease-out ${300 + i * 160}ms`
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
