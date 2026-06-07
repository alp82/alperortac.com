import type { InnerRenderProps } from "../types";
import { DecoCluster, type GroupSpec, svgBase } from "./_deco";

/* Inner: waterline (nature / water) — low water motifs over the existing scene. */
export const WATERLINE_SPEC: GroupSpec = {
	eyebrow: "waterline",
	symbol: "≈",
	motifs: [
		{
			value: "waves",
			label: "Waves",
			baseW: 60,
			band: "low",
			colors: ["ink", "tinted"],
			variety: false,
			// signature: nested ripple lines
			glyph: (s) => (
				<svg viewBox="0 0 60 24" aria-hidden="true" {...svgBase(s)}>
					<path d="M0,6 q7.5,-5 15,0 t15,0 t15,0 t15,0" />
					<path d="M0,14 q7.5,-5 15,0 t15,0 t15,0 t15,0" />
					<path d="M0,22 q7.5,-5 15,0 t15,0 t15,0 t15,0" />
				</svg>
			),
		},
		{
			value: "koi",
			label: "Koi",
			baseW: 42,
			band: "low",
			colors: ["ink", "tinted", "vivid"],
			vivid: ["#fb923c", "#f87171", "#fbbf24", "#fdba74"],
			variety: true,
			// signature: forked tail fin (+ vivid body)
			glyph: (s, f) => (
				<svg viewBox="0 0 44 24" aria-hidden="true" {...svgBase(s)}>
					<path
						d="M4,12 Q16,3 30,12 Q16,21 4,12 Z"
						fill={f}
						fillOpacity={0.55}
					/>
					<path d="M30,12 L41,5 M30,12 L41,19 M41,5 Q37,12 41,19" />
					<circle cx="11" cy="11" r="1.1" fill={s} />
				</svg>
			),
		},
		{
			value: "sailboat",
			label: "Sailboat",
			baseW: 38,
			band: "low",
			colors: ["ink", "tinted", "vivid"],
			vivid: ["#f87171", "#60a5fa", "#fbbf24", "#34d399"],
			variety: false,
			// signature: the triangular sail (vivid)
			glyph: (s, f) => (
				<svg viewBox="0 0 40 42" aria-hidden="true" {...svgBase(s)}>
					<path d="M20,32 V7" />
					<path d="M20,9 L33,30 H20 Z" fill={f} fillOpacity={0.55} />
					<path d="M7,32 H33 L29,38 H11 Z" />
				</svg>
			),
		},
		{
			value: "lighthouse",
			label: "Lighthouse",
			baseW: 30,
			band: "low",
			colors: ["ink", "tinted"],
			variety: false,
			// signature: the light beam
			glyph: (s) => (
				<svg viewBox="0 0 34 42" aria-hidden="true" {...svgBase(s)}>
					<path d="M11,40 L13,16 H21 L23,40 Z" />
					<rect x="12" y="9" width="10" height="7" />
					<path d="M22,10 L33,4 M22,15 L33,19" />
				</svg>
			),
		},
	],
};

export function WaterlineCluster(props: InnerRenderProps<"waterline">) {
	return <DecoCluster spec={WATERLINE_SPEC} {...props} />;
}
