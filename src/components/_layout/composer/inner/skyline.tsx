import type { InnerRenderProps } from "../types";
import { DENSITY_HEADING, DENSITY_MAXW } from "./shared";

/*
 * Inner: skyline (sky / air elements)
 *
 * The SUBTLE model: light line-art motifs float over whatever stage sky is
 * behind (no background of its own). Controls are about LOOK & FEEL, and differ
 * PER ELEMENT:
 *   - prominence : size + opacity (how dominant)
 *   - placement  : where + how many (local corner/cluster ↔ spread scatter/edges)
 *   - variety    : uniform vs mixed (jittered size + rotation) — only where it helps
 *   - color      : ink / tinted / vivid — only kite + balloon offer vivid fills
 * Stroke tone follows day↔night so it blends on any background.
 */

type Motif = "birds" | "clouds" | "plane" | "kite" | "balloon";
type Color = "ink" | "tinted" | "vivid";

/* Per-element control config (the panel reads these): which colour modes the
 * element offers, and whether "mixed" variety does anything for it. */
export const SKYLINE_COLOR_OPTS: Record<Motif, Color[]> = {
	birds: ["ink", "tinted"],
	clouds: ["ink", "tinted"],
	plane: ["ink", "tinted"],
	kite: ["ink", "tinted", "vivid"],
	balloon: ["ink", "tinted", "vivid"],
};
export const SKYLINE_HAS_VARIETY: Record<Motif, boolean> = {
	birds: true,
	clouds: true,
	plane: false,
	kite: true,
	balloon: true,
};

/* prominence → size scale + opacity (the headline "how dominant" lever). */
const PROMINENCE: Record<
	"whisper" | "subtle" | "present" | "bold",
	{ scale: number; opacity: number }
> = {
	whisper: { scale: 0.65, opacity: 0.4 },
	subtle: { scale: 0.9, opacity: 0.6 },
	present: { scale: 1.2, opacity: 0.8 },
	bold: { scale: 1.65, opacity: 0.95 },
};

/* placement → where + how many (local ↔ spread). */
const PLACEMENTS: Record<
	"corner" | "cluster" | "scatter" | "edges",
	{ l: number; t: number }[]
> = {
	corner: [
		{ l: 80, t: 2 },
		{ l: 90, t: 15 },
	],
	cluster: [
		{ l: 60, t: 3 },
		{ l: 74, t: 9 },
		{ l: 66, t: 17 },
		{ l: 83, t: 19 },
	],
	scatter: [
		{ l: 5, t: 6 },
		{ l: 26, t: 0 },
		{ l: 48, t: 9 },
		{ l: 70, t: 2 },
		{ l: 90, t: 14 },
		{ l: 16, t: 23 },
	],
	edges: [
		{ l: 3, t: 3 },
		{ l: 48, t: -3 },
		{ l: 94, t: 5 },
		{ l: 7, t: 24 },
		{ l: 92, t: 26 },
	],
};

const BASE_W: Record<Motif, number> = {
	birds: 54,
	clouds: 48,
	plane: 62,
	kite: 30,
	balloon: 30,
};

/* vivid fill palettes (used translucent, so they still blend) for colourful ones. */
const VIVID_FILLS: Partial<Record<Motif, string[]>> = {
	kite: ["#f472b6", "#38bdf8", "#fbbf24", "#a78bfa", "#34d399"],
	balloon: ["#f87171", "#60a5fa", "#fbbf24", "#34d399", "#fb923c"],
};

function strokeFor(color: Color, motif: Motif, isNight: boolean): string {
	const ink = isNight ? "rgba(248,250,252,0.62)" : "rgba(15,23,42,0.42)";
	if (color === "ink") return ink;
	if (color === "tinted") return isNight ? "#c7d2fe" : "#7c8aa3";
	// vivid: a soft ink outline; the fill carries the colour where there is one.
	if (VIVID_FILLS[motif])
		return isNight ? "rgba(248,250,252,0.5)" : "rgba(15,23,42,0.5)";
	return isNight ? "#fde68a" : "#e0a23a";
}

function MotifGlyph({
	motif,
	stroke,
	fill,
}: {
	motif: Motif;
	stroke: string;
	fill: string;
}) {
	const c = {
		className: "block h-auto w-full",
		stroke,
		strokeWidth: 1.3,
		strokeLinecap: "round" as const,
		strokeLinejoin: "round" as const,
	};
	switch (motif) {
		case "clouds":
			return (
				<svg viewBox="0 0 48 24" aria-hidden="true" fill="none" {...c}>
					<path d="M9,20 q-7,0 -7,-6 q0,-6 7,-6 q1,-6 9,-4 q4,-5 11,-1 q7,-1 7,6 q5,0 5,6 q0,5 -7,5 z" />
				</svg>
			);
		case "plane":
			return (
				<svg viewBox="0 0 64 20" aria-hidden="true" fill="none" {...c}>
					<path strokeDasharray="3 4" d="M3,12 H38" />
					<path d="M42,11 l11,-2 l5,2 l-5,2 l-11,-2 z" />
					<path d="M49,9.5 l-3,-5 M49,12.5 l-3,5" />
				</svg>
			);
		case "kite":
			return (
				<svg viewBox="0 0 32 46" aria-hidden="true" fill="none" {...c}>
					<polygon
						points="16,2 28,17 16,32 4,17"
						fill={fill}
						fillOpacity={0.55}
					/>
					<path d="M16,2 V32 M4,17 H28" />
					<path d="M16,32 q4,5 0,8 q-4,3 0,6" />
				</svg>
			);
		case "balloon":
			return (
				<svg viewBox="0 0 32 46" aria-hidden="true" fill="none" {...c}>
					<path
						d="M16,2 C6,2 3,13 8,23 C10,27 14,29 16,31 C18,29 22,27 24,23 C29,13 26,2 16,2 z"
						fill={fill}
						fillOpacity={0.55}
					/>
					<path d="M12,30 l1,5 M20,30 l-1,5" />
					<rect x="13" y="35" width="6" height="4" />
				</svg>
			);
		default:
			return (
				<svg viewBox="0 0 60 24" aria-hidden="true" fill="none" {...c}>
					<path d="M2,14 Q7,6 12,14 Q17,6 22,14" />
					<path d="M26,9 Q30,3 34,9 Q38,3 42,9" />
					<path d="M40,18 Q44,12 48,18 Q52,12 56,18" />
				</svg>
			);
	}
}

export function SkylineCluster({
	topic,
	index,
	isNight,
	params,
	children,
}: InnerRenderProps<"skyline">) {
	const prom = PROMINENCE[params.prominence];
	const spots = PLACEMENTS[params.placement];
	const stroke = strokeFor(params.color, params.motif, isNight);
	const fills =
		params.color === "vivid" ? VIVID_FILLS[params.motif] : undefined;

	return (
		<div className={`relative w-full ${DENSITY_MAXW[params.density]}`}>
			{/* line-art motifs over the existing sky — no background of its own */}
			<div
				className="pointer-events-none absolute inset-x-0 -top-8 h-[62%]"
				style={{ opacity: prom.opacity }}
				aria-hidden="true"
			>
				{spots.map((sp, i) => {
					const jitter =
						params.variety === "mixed" ? 0.8 + ((i * 37) % 45) / 100 : 1;
					const rot = params.variety === "mixed" ? ((i * 53) % 24) - 12 : 0;
					const fill = fills ? (fills[i % fills.length] ?? "none") : "none";
					return (
						<div
							key={`${sp.l}-${sp.t}`}
							className={params.drift ? "cmp-drift absolute" : "absolute"}
							style={{
								left: `${sp.l}%`,
								top: `${sp.t}%`,
								animationDelay: `${i * -2.5}s`,
							}}
						>
							<div
								style={{
									width: `${BASE_W[params.motif] * prom.scale * jitter}px`,
									transform: `rotate(${rot}deg)`,
								}}
							>
								<MotifGlyph motif={params.motif} stroke={stroke} fill={fill} />
							</div>
						</div>
					);
				})}
			</div>

			<div className="relative z-10 flex flex-col items-center text-center gap-5">
				<div
					className={`font-mono text-[11px] uppercase tracking-[0.35em] ${isNight ? "text-slate-300" : "text-slate-500"}`}
				>
					↟ skyline {String(index + 1).padStart(2, "0")}
				</div>
				<h2
					className={`${DENSITY_HEADING[params.density]} font-black uppercase tracking-tighter leading-[0.9] ${isNight ? "text-white [text-shadow:0_2px_12px_rgba(0,0,0,0.5)]" : "text-slate-900"}`}
				>
					{topic.heading}
				</h2>
				<div className="w-full text-left">{children}</div>
			</div>
		</div>
	);
}
