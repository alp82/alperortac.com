import type { InnerRenderProps } from "../types";
import { DecoCluster, type GroupSpec, svgBase } from "./_deco";

/* Inner: terrain (nature / land) — low silhouettes over the existing ground. */
export const TERRAIN_SPEC: GroupSpec = {
	eyebrow: "terrain",
	symbol: "▲",
	motifs: [
		{
			value: "pine",
			label: "Pine",
			baseW: 30,
			band: "low",
			colors: ["ink", "tinted"],
			variety: true,
			// signature: stacked triangular tiers
			glyph: (s) => (
				<svg viewBox="0 0 24 42" aria-hidden="true" {...svgBase(s)}>
					<path d="M12 38 V42" />
					<path d="M12 3 L4 16 H20 Z" />
					<path d="M12 12 L3 27 H21 Z" />
					<path d="M12 21 L2 38 H22 Z" />
				</svg>
			),
		},
		{
			value: "grass",
			label: "Grass",
			baseW: 26,
			band: "low",
			colors: ["ink", "tinted"],
			variety: true,
			// signature: thin blade tufts
			glyph: (s) => (
				<svg viewBox="0 0 24 24" aria-hidden="true" {...svgBase(s)}>
					<path d="M6,24 C5,16 4,12 3,7" />
					<path d="M10,24 C10,14 11,9 11,4" />
					<path d="M14,24 C14,16 16,11 17,6" />
					<path d="M18,24 C18,17 20,14 21,9" />
				</svg>
			),
		},
		{
			value: "rocks",
			label: "Cairn",
			baseW: 34,
			band: "low",
			colors: ["ink", "tinted"],
			variety: true,
			// signature: a balanced stacked cairn
			glyph: (s) => (
				<svg viewBox="0 0 40 38" aria-hidden="true" {...svgBase(s)}>
					<ellipse cx="20" cy="32" rx="13" ry="5" />
					<ellipse cx="20" cy="23" rx="9.5" ry="4.2" />
					<ellipse cx="20" cy="15" rx="6.5" ry="3.4" />
					<ellipse cx="20" cy="9" rx="4" ry="2.6" />
				</svg>
			),
		},
		{
			value: "hills",
			label: "Hills",
			baseW: 64,
			band: "low",
			colors: ["ink", "tinted"],
			variety: false,
			// signature: a soft rolling ridge line
			glyph: (s) => (
				<svg viewBox="0 0 64 24" aria-hidden="true" {...svgBase(s)}>
					<path d="M0,22 Q16,4 32,15 Q48,24 64,8" />
				</svg>
			),
		},
	],
};

export function TerrainCluster(props: InnerRenderProps<"terrain">) {
	return <DecoCluster spec={TERRAIN_SPEC} {...props} />;
}
