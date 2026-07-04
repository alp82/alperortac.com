import type { InnerRenderProps } from "../types";
import { DENSITY_HEADING, DENSITY_MAXW } from "./shared";

/*
 * Inner: constellation (celestial / night)
 *
 * Delicate night frame: a faint scatter of field stars in the UPPER area and a
 * thin connecting star-figure sitting RIGHT BELOW THE TITLE (in the gap before
 * the body), so the decoration reads without merging into the paragraph text.
 * Lines are hairline (vector-effect:non-scaling-stroke); nodes small + soft;
 * nothing paints a background — it floats over the landscape sky.
 *
 * Signature toggle = the connecting lines; `tint` recolors lines/eyebrow/field;
 * `figure` swaps the star-pattern.
 */

const TINT: Record<"indigo" | "cyan" | "violet", string> = {
	indigo: "#c7d2fe",
	cyan: "#7dd3fc",
	violet: "#d8b4fe",
};

type Pt = { x: number; y: number };

/* Figures drawn in a wide, short band (viewBox 0 0 100 24) under the title. */
const FIGURES: Record<"wing" | "crown" | "river", Pt[]> = {
	wing: [
		{ x: 6, y: 17 },
		{ x: 26, y: 6 },
		{ x: 46, y: 14 },
		{ x: 66, y: 5 },
		{ x: 84, y: 13 },
		{ x: 96, y: 19 },
	],
	crown: [
		{ x: 8, y: 18 },
		{ x: 24, y: 6 },
		{ x: 40, y: 16 },
		{ x: 52, y: 4 },
		{ x: 64, y: 16 },
		{ x: 80, y: 6 },
		{ x: 94, y: 18 },
	],
	river: [
		{ x: 5, y: 9 },
		{ x: 24, y: 17 },
		{ x: 42, y: 8 },
		{ x: 60, y: 18 },
		{ x: 78, y: 10 },
		{ x: 95, y: 19 },
	],
};

/* Faint field stars, confined to the UPPER half so they never land on the body. */
const FIELD: { x: number; y: number; r: number }[] = [
	{ x: 10, y: 12, r: 1 },
	{ x: 26, y: 30, r: 1.3 },
	{ x: 44, y: 8, r: 1 },
	{ x: 60, y: 26, r: 1 },
	{ x: 74, y: 10, r: 1.3 },
	{ x: 90, y: 22, r: 1 },
	{ x: 18, y: 46, r: 1 },
	{ x: 82, y: 44, r: 1 },
];

export function ConstellationCluster({
	topic,
	index,
	params,
	children,
}: InnerRenderProps<"constellation">) {
	const tint = TINT[params.tint];
	const fig = FIGURES[params.figure];
	const path = fig
		.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`)
		.join(" ");

	return (
		<div className={`relative w-full ${DENSITY_MAXW[params.density]}`}>
			{/* faint field stars — upper half only */}
			<div
				className="pointer-events-none absolute inset-x-0 top-0 h-1/2"
				aria-hidden="true"
			>
				{FIELD.map((s) => (
					<span
						key={`f-${s.x}-${s.y}`}
						className="absolute rounded-full"
						style={{
							left: `${s.x}%`,
							top: `${s.y}%`,
							width: `${s.r}px`,
							height: `${s.r}px`,
							background: tint,
							opacity: 0.5,
						}}
					/>
				))}
			</div>

			<div className="relative z-10 flex flex-col items-center text-center gap-5">
				<div
					className="font-mono text-[11px] uppercase tracking-[0.35em]"
					style={{ color: tint }}
				>
					◆ constellation {String(index + 1).padStart(2, "0")}
				</div>
				<h2
					className={`${DENSITY_HEADING[params.density]} font-black uppercase tracking-tighter text-white leading-[0.9] [text-shadow:0_2px_10px_rgba(0,0,0,0.45)]`}
				>
					{topic.heading}
				</h2>

				{/* connecting figure — compact band right below the title */}
				<svg
					className="pointer-events-none h-12 w-full max-w-md"
					viewBox="0 0 100 24"
					preserveAspectRatio="xMidYMid meet"
					aria-hidden="true"
				>
					<title>constellation</title>
					{params.lines && (
						<path
							d={path}
							fill="none"
							stroke={tint}
							strokeWidth={1}
							strokeLinecap="round"
							strokeLinejoin="round"
							vectorEffect="non-scaling-stroke"
							opacity={0.5}
						/>
					)}
					{fig.map((p) => (
						<circle
							key={`n-${p.x}-${p.y}`}
							cx={p.x}
							cy={p.y}
							r={1.1}
							fill="#f8fafc"
							opacity={0.9}
						/>
					))}
				</svg>

				<div className="w-full text-left">{children}</div>
			</div>
		</div>
	);
}
