import type { InnerRenderProps } from "../types";
import { DecoCluster, type GroupSpec, svgBase } from "./_deco";

/* Inner: weather (atmosphere) — light weather motifs over the existing sky. */
export const WEATHER_SPEC: GroupSpec = {
	eyebrow: "weather",
	symbol: "❄",
	motifs: [
		{
			value: "rain",
			label: "Rain",
			baseW: 40,
			band: "high",
			colors: ["ink", "tinted"],
			variety: true,
			// signature: slanted streaks
			glyph: (s) => (
				<svg viewBox="0 0 40 24" aria-hidden="true" {...svgBase(s)}>
					<path d="M5,2 L1,11 M13,0 L9,9 M21,3 L17,12 M29,1 L25,10 M37,3 L33,12" />
				</svg>
			),
		},
		{
			value: "snow",
			label: "Snow",
			baseW: 24,
			band: "high",
			colors: ["ink", "tinted"],
			variety: true,
			// signature: six-point flake star
			glyph: (s) => (
				<svg viewBox="0 0 24 24" aria-hidden="true" {...svgBase(s)}>
					<path d="M12,2 V22 M3,7 L21,17 M21,7 L3,17" />
					<path d="M12,6 l-2.5,2 M12,6 l2.5,2 M12,18 l-2.5,-2 M12,18 l2.5,-2" />
				</svg>
			),
		},
		{
			value: "leaves",
			label: "Leaves",
			baseW: 28,
			band: "high",
			colors: ["ink", "tinted", "vivid"],
			vivid: ["#f59e0b", "#ef4444", "#d97706", "#84cc16"],
			variety: true,
			// signature: leaf with a centre vein (autumn vivid)
			glyph: (s, f) => (
				<svg viewBox="0 0 28 24" aria-hidden="true" {...svgBase(s)}>
					<path
						d="M4,20 Q12,2 24,7 Q20,21 4,20 Z"
						fill={f}
						fillOpacity={0.55}
					/>
					<path d="M6,18 Q14,11 22,9" />
				</svg>
			),
		},
		{
			value: "sunbeam",
			label: "Sunbeam",
			baseW: 48,
			band: "high",
			colors: ["ink", "tinted"],
			variety: false,
			// signature: rays radiating from a corner
			glyph: (s) => (
				<svg viewBox="0 0 48 48" aria-hidden="true" {...svgBase(s)}>
					<path d="M3,17 A14,14 0 0,1 17,3" />
					<path d="M2,2 L13,13 M2,9 L11,15 M9,2 L15,11 M2,15 L9,17 M15,2 L17,9" />
				</svg>
			),
		},
	],
};

export function WeatherCluster(props: InnerRenderProps<"weather">) {
	return <DecoCluster spec={WEATHER_SPEC} {...props} />;
}
