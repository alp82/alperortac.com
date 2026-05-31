import { linkStroke } from "../types";
import type { LinkRenderProps } from "../types";
import { railVars, useAspectViewBox, useDrawIn } from "./shared";

/*
 * Link: constellation-starline (VERTICAL)
 *
 * A faint dotted star-path DESCENDING the page, with star nodes at the bends
 * that twinkle in — the celestial world's connective tissue. `curve` sets the
 * drift; `stars` sets the node count; `glow` sets their shine. Stars twinkle in
 * top→bottom when `animate` is on. Shape-preserving viewBox so nodes stay round.
 */

const STARS: Record<"few" | "many", number> = { few: 4, many: 7 };

const GLOW: Record<"soft" | "bright", string> = {
	soft: "drop-shadow(0 0 3px rgba(255,255,255,0.8))",
	bright: "drop-shadow(0 0 6px rgba(255,255,255,0.95))",
};

export function ConstellationStarlineLink({
	index,
	isNight,
	params,
	accent,
}: LinkRenderProps<"constellation-starline">) {
	const stroke = linkStroke(params.color, accent, isNight);
	const { ref, shown } = useDrawIn(params.animate);
	const H = useAspectViewBox(ref);
	const amp = (params.curve / 100) * 32; // horizontal drift in viewBox x-units
	const dir = index % 2 === 0 ? 1 : -1;
	const count = STARS[params.stars];
	// star nodes descend top→bottom, drifting side to side (ends drift less).
	const nodes = Array.from({ length: count }, (_, i) => {
		const s = i % 2 === 0 ? dir : -dir;
		const edge = i === 0 || i === count - 1 ? 0.6 : 1;
		return {
			x: 50 + s * amp * edge,
			y: H * (0.08 + (i / (count - 1)) * 0.84),
		};
	});
	const linePath = nodes
		.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`)
		.join(" ");
	const glow = GLOW[params.glow];

	return (
		<div className="cmp-seam" aria-hidden="true">
			<div className="cmp-seam-rail" style={railVars(params)}>
				<svg ref={ref} viewBox={`0 0 100 ${H}`} preserveAspectRatio="none">
					<title>constellation starline descending</title>
					<path
						d={linePath}
						fill="none"
						stroke={stroke}
						strokeWidth={Math.max(params.weight * 0.6, 0.6)}
						strokeDasharray="2 5"
						strokeLinecap="round"
						opacity={0.6}
						style={{
							clipPath: shown ? "inset(0 0 0 0)" : "inset(0 0 100% 0)",
							transition: params.animate
								? "clip-path 900ms ease-out"
								: undefined,
						}}
					/>
					{nodes.map((p, i) => (
						<circle
							key={`${p.x}-${p.y}`}
							cx={p.x}
							cy={p.y}
							r={params.weight}
							fill={accent}
							style={{
								filter: glow,
								opacity: shown ? 1 : 0,
								transition: params.animate
									? `opacity 350ms ease-out ${i * 180}ms`
									: undefined,
							}}
						/>
					))}
				</svg>
			</div>
		</div>
	);
}
