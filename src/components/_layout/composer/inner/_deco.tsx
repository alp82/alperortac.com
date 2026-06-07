import type { Topic } from "../../../../data/topics";
import { Segmented, Toggle } from "../DesignControls";
import type {
	AnyInnerParams,
	DecoColor,
	DecoPlacement,
	DecoProminence,
	InnerBase,
} from "../types";
import { DENSITY_HEADING, DENSITY_MAXW } from "./shared";

/*
 * Shared DECORATION engine for the environment inner groups (skyline keeps its
 * own copy; terrain / waterline / weather / wildlife / celestial all run on
 * this). The model: light line-art element glyphs scattered over the EXISTING
 * stage — no background of its own — with look-&-feel controls that are the same
 * across groups but configured per element:
 *   prominence (size+opacity) · placement (local↔spread) · variety (jitter)
 *   · color (ink/tinted/vivid, per element) · drift.
 * Stroke tone follows day↔night so it blends on any sky.
 */

export type DecoBaseParams = InnerBase & {
	motif: string;
	prominence: DecoProminence;
	placement: DecoPlacement;
	variety: "uniform" | "mixed";
	color: DecoColor;
	drift: boolean;
};

/** One element: its glyph + how it behaves. `band` puts it high (sky) or low
 * (ground); `vivid` is the translucent fill palette for color === "vivid". */
export type MotifSpec = {
	value: string;
	label: string;
	baseW: number;
	band: "high" | "low";
	colors: DecoColor[];
	vivid?: string[];
	variety: boolean;
	glyph: (stroke: string, fill: string) => React.ReactNode;
};

export type GroupSpec = {
	eyebrow: string;
	symbol: string;
	motifs: MotifSpec[];
};

const PROMINENCE: Record<DecoProminence, { scale: number; opacity: number }> = {
	whisper: { scale: 0.65, opacity: 0.4 },
	subtle: { scale: 0.9, opacity: 0.6 },
	present: { scale: 1.2, opacity: 0.8 },
	bold: { scale: 1.65, opacity: 0.95 },
};

/* `v` = distance from the band edge: top:v% for high motifs, bottom:v% for low. */
const PLACEMENTS: Record<DecoPlacement, { l: number; v: number }[]> = {
	corner: [
		{ l: 80, v: 2 },
		{ l: 90, v: 15 },
	],
	cluster: [
		{ l: 60, v: 3 },
		{ l: 74, v: 9 },
		{ l: 66, v: 18 },
		{ l: 83, v: 20 },
	],
	scatter: [
		{ l: 5, v: 6 },
		{ l: 26, v: 1 },
		{ l: 48, v: 9 },
		{ l: 70, v: 2 },
		{ l: 90, v: 14 },
		{ l: 16, v: 22 },
	],
	edges: [
		{ l: 3, v: 3 },
		{ l: 48, v: -2 },
		{ l: 94, v: 5 },
		{ l: 7, v: 22 },
		{ l: 92, v: 25 },
	],
};

/** Common presentation props for an element <svg>; spread onto it. */
export function svgBase(stroke: string) {
	return {
		className: "block h-auto w-full",
		fill: "none",
		stroke,
		strokeWidth: 1.3,
		strokeLinecap: "round" as const,
		strokeLinejoin: "round" as const,
	};
}

function strokeFor(
	color: DecoColor,
	isNight: boolean,
	hasVivid: boolean,
): string {
	const ink = isNight ? "rgba(248,250,252,0.62)" : "rgba(15,23,42,0.42)";
	if (color === "ink") return ink;
	if (color === "tinted") return isNight ? "#c7d2fe" : "#7c8aa3";
	// vivid: a soft ink outline; the fill carries the colour where there is one.
	if (hasVivid) return isNight ? "rgba(248,250,252,0.5)" : "rgba(15,23,42,0.5)";
	return isNight ? "#fde68a" : "#e0a23a";
}

export function DecoCluster({
	spec,
	topic,
	index,
	isNight,
	params,
	children,
}: {
	spec: GroupSpec;
	topic: Topic;
	index: number;
	isNight: boolean;
	params: DecoBaseParams;
	children: React.ReactNode;
}) {
	const m = spec.motifs.find((x) => x.value === params.motif) ?? spec.motifs[0];
	const prom = PROMINENCE[params.prominence];
	const spots = PLACEMENTS[params.placement];
	const fills = params.color === "vivid" ? m?.vivid : undefined;
	const stroke = strokeFor(params.color, isNight, !!m?.vivid);

	return (
		<div className={`relative w-full ${DENSITY_MAXW[params.density]}`}>
			{m && (
				<div
					className="pointer-events-none absolute inset-0"
					style={{ opacity: prom.opacity }}
					aria-hidden="true"
				>
					{spots.map((sp, i) => {
						const jitter =
							params.variety === "mixed" ? 0.8 + ((i * 37) % 45) / 100 : 1;
						const rot = params.variety === "mixed" ? ((i * 53) % 24) - 12 : 0;
						const fill = fills ? (fills[i % fills.length] ?? "none") : "none";
						const vpos =
							m.band === "low" ? { bottom: `${sp.v}%` } : { top: `${sp.v}%` };
						return (
							<div
								key={`${sp.l}-${sp.v}`}
								className={params.drift ? "cmp-drift absolute" : "absolute"}
								style={{
									left: `${sp.l}%`,
									...vpos,
									animationDelay: `${i * -2.5}s`,
								}}
							>
								<div
									style={{
										width: `${m.baseW * prom.scale * jitter}px`,
										transform: `rotate(${rot}deg)`,
									}}
								>
									{m.glyph(stroke, fill)}
								</div>
							</div>
						);
					})}
				</div>
			)}

			<div className="relative z-10 flex flex-col items-center text-center gap-5">
				<div
					className={`font-mono text-[11px] uppercase tracking-[0.35em] ${isNight ? "text-slate-300" : "text-slate-500"}`}
				>
					{spec.symbol} {spec.eyebrow} {String(index + 1).padStart(2, "0")}
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

const PROMINENCE_OPTS: { value: DecoProminence; label: string }[] = [
	{ value: "whisper", label: "Whisper" },
	{ value: "subtle", label: "Subtle" },
	{ value: "present", label: "Present" },
	{ value: "bold", label: "Bold" },
];
const PLACEMENT_OPTS: { value: DecoPlacement; label: string }[] = [
	{ value: "corner", label: "Corner" },
	{ value: "cluster", label: "Cluster" },
	{ value: "scatter", label: "Scatter" },
	{ value: "edges", label: "Edges" },
];
const VARIETY_OPTS: { value: "uniform" | "mixed"; label: string }[] = [
	{ value: "uniform", label: "Uniform" },
	{ value: "mixed", label: "Mixed" },
];

export function DecoControls({
	spec,
	params,
	patch,
}: {
	spec: GroupSpec;
	params: DecoBaseParams;
	patch: (p: Partial<AnyInnerParams>) => void;
}) {
	const m = spec.motifs.find((x) => x.value === params.motif) ?? spec.motifs[0];
	return (
		<>
			<Segmented
				label="Element"
				value={params.motif}
				options={spec.motifs.map((x) => ({ value: x.value, label: x.label }))}
				onChange={(v) => patch({ motif: v } as Partial<AnyInnerParams>)}
			/>
			<Segmented
				label="Prominence"
				value={params.prominence}
				options={PROMINENCE_OPTS}
				onChange={(prominence) => patch({ prominence })}
			/>
			<Segmented
				label="Placement"
				value={params.placement}
				options={PLACEMENT_OPTS}
				onChange={(placement) => patch({ placement })}
			/>
			{m?.variety && (
				<Segmented
					label="Variety"
					value={params.variety}
					options={VARIETY_OPTS}
					onChange={(variety) => patch({ variety })}
				/>
			)}
			<Segmented
				label="Color"
				value={params.color}
				options={(m?.colors ?? ["ink"]).map((co) => ({
					value: co,
					label: co.charAt(0).toUpperCase() + co.slice(1),
				}))}
				onChange={(color) => patch({ color })}
			/>
			<Toggle
				label="Drift"
				checked={params.drift}
				onChange={(drift) => patch({ drift })}
			/>
		</>
	);
}
