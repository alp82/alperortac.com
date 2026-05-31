import type { InnerRenderProps } from "../types";
import { DENSITY_HEADING } from "./shared";

/*
 * Inner: constellation
 *
 * A content panel among the stars: a dark full-bleed star field + connecting
 * lines back the stage, and a centered column holds the constellation-styled
 * heading above the topic's REAL body (the shared light plate). A soft dark
 * scrim sits behind the column so the light plate reads cleanly over the stars.
 * Ties to the celestial sky easter egg. Signature toggle = the connecting star
 * lines (params.lines); the `tint` knob recolors the lines, the field stars and
 * the eyebrow inline (the cluster stars stay white).
 */

type StarPoint = { x: number; y: number };

/** tint → connecting-line / field-star / eyebrow color. */
const TINT: Record<"indigo" | "cyan" | "violet", string> = {
	indigo: "#c7d2fe",
	cyan: "#7dd3fc",
	violet: "#d8b4fe",
};

const CLUSTERS: readonly StarPoint[][] = [
	[
		{ x: 18, y: 30 },
		{ x: 48, y: 18 },
		{ x: 74, y: 40 },
		{ x: 60, y: 72 },
		{ x: 30, y: 64 },
	],
	[
		{ x: 22, y: 52 },
		{ x: 40, y: 22 },
		{ x: 68, y: 30 },
		{ x: 82, y: 60 },
		{ x: 52, y: 78 },
	],
];

/* A wide scatter of background stars (independent of the foreground cluster). */
const FIELD: readonly StarPoint[] = [
	{ x: 6, y: 12 },
	{ x: 14, y: 78 },
	{ x: 28, y: 40 },
	{ x: 38, y: 88 },
	{ x: 50, y: 8 },
	{ x: 58, y: 54 },
	{ x: 66, y: 84 },
	{ x: 78, y: 22 },
	{ x: 88, y: 66 },
	{ x: 94, y: 36 },
	{ x: 46, y: 70 },
	{ x: 72, y: 50 },
];

export function ConstellationCluster({
	topic,
	index,
	params,
	children,
}: InnerRenderProps<"constellation">) {
	const cluster: readonly StarPoint[] =
		CLUSTERS[index % CLUSTERS.length] ?? CLUSTERS[0] ?? [];
	const linePath = cluster
		.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`)
		.join(" ");
	const tint = TINT[params.tint];

	return (
		<div className="relative w-full max-w-3xl">
			{/* full-bleed star field behind the whole cluster */}
			<svg
				className="absolute -inset-x-[12vw] -inset-y-16 w-[calc(100%+24vw)] h-[calc(100%+8rem)] pointer-events-none"
				viewBox="0 0 100 100"
				preserveAspectRatio="xMidYMid slice"
				aria-hidden="true"
			>
				<title>constellation field</title>
				{params.lines && (
					<path
						d={linePath}
						fill="none"
						stroke={tint}
						strokeWidth="0.55"
						strokeLinecap="round"
						strokeLinejoin="round"
					/>
				)}
				{cluster.map((p) => (
					<circle
						key={`c-${p.x}-${p.y}`}
						cx={p.x}
						cy={p.y}
						r="0.7"
						fill="rgba(255,255,255,0.85)"
					/>
				))}
				{FIELD.map((p) => (
					<circle
						key={`f-${p.x}-${p.y}`}
						cx={p.x}
						cy={p.y}
						r="0.35"
						fill={tint}
						fillOpacity={0.55}
					/>
				))}
			</svg>

			{/* soft dark scrim so the light plate reads over the stars */}
			<div
				className="absolute -inset-x-6 -inset-y-8 pointer-events-none rounded-[2rem]"
				style={{
					background:
						"radial-gradient(ellipse at center, rgba(7,10,20,0.45) 0%, rgba(7,10,20,0.22) 55%, transparent 100%)",
				}}
				aria-hidden="true"
			/>

			<div className="relative flex flex-col items-center text-center gap-5">
				<div
					className="text-[11px] font-mono uppercase tracking-[0.35em]"
					style={{ color: tint }}
				>
					◆ constellation {String(index + 1).padStart(2, "0")}
				</div>
				<h2
					className={`${DENSITY_HEADING[params.density]} font-black uppercase tracking-tighter text-white leading-[0.9] drop-shadow-[0_2px_14px_rgba(0,0,0,0.7)]`}
				>
					{topic.heading}
				</h2>

				<div className="w-full text-left">{children}</div>
			</div>
		</div>
	);
}
