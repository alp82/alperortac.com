import type { InnerRenderProps } from "../types";
import { DecoCluster, type GroupSpec, svgBase } from "./_deco";

/* Inner: wildlife (creatures) — low/mid critters over the existing scene. */
export const WILDLIFE_SPEC: GroupSpec = {
	eyebrow: "wildlife",
	symbol: "❧",
	motifs: [
		{
			value: "butterfly",
			label: "Butterfly",
			baseW: 30,
			band: "high",
			colors: ["ink", "tinted", "vivid"],
			vivid: ["#f472b6", "#38bdf8", "#fbbf24", "#a78bfa"],
			variety: true,
			// signature: symmetric patterned wings (vivid)
			glyph: (s, f) => (
				<svg viewBox="0 0 32 28" aria-hidden="true" {...svgBase(s)}>
					<path d="M16,6 V24" />
					<path d="M16,9 Q4,1 3,9 Q2,16 16,15 Z" fill={f} fillOpacity={0.5} />
					<path
						d="M16,9 Q28,1 29,9 Q30,16 16,15 Z"
						fill={f}
						fillOpacity={0.5}
					/>
					<path
						d="M16,15 Q6,16 6,22 Q8,27 16,20 Z"
						fill={f}
						fillOpacity={0.4}
					/>
					<path
						d="M16,15 Q26,16 26,22 Q24,27 16,20 Z"
						fill={f}
						fillOpacity={0.4}
					/>
				</svg>
			),
		},
		{
			value: "deer",
			label: "Deer",
			baseW: 34,
			band: "low",
			colors: ["ink", "tinted"],
			variety: false,
			// signature: branching antlers
			glyph: (s) => (
				<svg viewBox="0 0 36 40" aria-hidden="true" {...svgBase(s)}>
					<path d="M9,38 V27 Q9,23 14,23 H22 Q26,23 26,28 V38" />
					<path d="M13,38 V31 M22,38 V31" />
					<path d="M26,25 Q28,19 28,14" />
					<circle cx="28.5" cy="12" r="2.2" />
					<path d="M28,11 L25,4 M28,11 L31,4 M26.5,7 L24,6 M29.5,7 L32,6" />
				</svg>
			),
		},
		{
			value: "fox",
			label: "Fox",
			baseW: 36,
			band: "low",
			colors: ["ink", "tinted"],
			variety: false,
			// signature: oversized bushy tail
			glyph: (s) => (
				<svg viewBox="0 0 40 30" aria-hidden="true" {...svgBase(s)}>
					<path d="M14,28 Q12,18 18,16 Q24,15 25,22 V28" />
					<path d="M25,20 Q31,8 22,4" />
					<path d="M22,4 L20,0 M22,4 L25,1" />
					<path d="M14,28 Q4,26 3,16 Q11,20 14,24" />
				</svg>
			),
		},
		{
			value: "owl",
			label: "Owl",
			baseW: 26,
			band: "low",
			colors: ["ink", "tinted"],
			variety: false,
			// signature: big round eyes on a perch
			glyph: (s) => (
				<svg viewBox="0 0 28 34" aria-hidden="true" {...svgBase(s)}>
					<path d="M5,3 L9,8 M23,3 L19,8" />
					<path d="M14,7 Q5,7 5,18 Q5,27 14,27 Q23,27 23,18 Q23,7 14,7 Z" />
					<circle cx="10" cy="15" r="3" />
					<circle cx="18" cy="15" r="3" />
					<path d="M14,17 l-2,3 h4 z" />
					<path d="M6,30 H22" />
				</svg>
			),
		},
	],
};

export function WildlifeCluster(props: InnerRenderProps<"wildlife">) {
	return <DecoCluster spec={WILDLIFE_SPEC} {...props} />;
}
