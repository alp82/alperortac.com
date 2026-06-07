import type { InnerRenderProps } from "../types";
import { DecoCluster, type GroupSpec, svgBase } from "./_deco";

/* Inner: celestial (night sky) — light sky motifs over the existing night. */
export const CELESTIAL_SPEC: GroupSpec = {
	eyebrow: "celestial",
	symbol: "✦",
	motifs: [
		{
			value: "stars",
			label: "Stars",
			baseW: 30,
			band: "high",
			colors: ["ink", "tinted"],
			variety: true,
			// signature: four-point sparkles
			glyph: (s) => (
				<svg viewBox="0 0 30 24" aria-hidden="true" {...svgBase(s)}>
					<path d="M8,2 Q9,7 13,8 Q9,9 8,14 Q7,9 3,8 Q7,7 8,2 Z" fill={s} />
					<path
						d="M22,10 Q23,14 26,15 Q23,16 22,20 Q21,16 18,15 Q21,14 22,10 Z"
						fill={s}
					/>
				</svg>
			),
		},
		{
			value: "moon",
			label: "Moon",
			baseW: 28,
			band: "high",
			colors: ["ink", "tinted"],
			variety: false,
			// signature: a crescent carve
			glyph: (s) => (
				<svg viewBox="0 0 28 28" aria-hidden="true" {...svgBase(s)}>
					<path d="M19,3 A12,12 0 1,0 19,25 A9,9 0 1,1 19,3 Z" />
				</svg>
			),
		},
		{
			value: "meteor",
			label: "Meteor",
			baseW: 50,
			band: "high",
			colors: ["ink", "tinted"],
			variety: true,
			// signature: a fading streak trail
			glyph: (s) => (
				<svg viewBox="0 0 52 24" aria-hidden="true" {...svgBase(s)}>
					<path d="M46,4 L10,20" strokeDasharray="1 3" />
					<path d="M46,4 L30,11" strokeWidth={2} />
					<circle cx="47" cy="4" r="2" fill={s} />
				</svg>
			),
		},
		{
			value: "saturn",
			label: "Saturn",
			baseW: 34,
			band: "high",
			colors: ["ink", "tinted", "vivid"],
			vivid: ["#fcd34d", "#fdba74", "#a78bfa", "#67e8f9"],
			variety: false,
			// signature: the tilted ring (vivid planet)
			glyph: (s, f) => (
				<svg viewBox="0 0 40 32" aria-hidden="true" {...svgBase(s)}>
					<circle cx="20" cy="16" r="8.5" fill={f} fillOpacity={0.55} />
					<ellipse
						cx="20"
						cy="16"
						rx="18"
						ry="5.5"
						transform="rotate(-20 20 16)"
					/>
				</svg>
			),
		},
	],
};

export function CelestialCluster(props: InnerRenderProps<"celestial">) {
	return <DecoCluster spec={CELESTIAL_SPEC} {...props} />;
}
