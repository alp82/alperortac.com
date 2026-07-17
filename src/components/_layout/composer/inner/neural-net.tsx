import type { InnerRenderProps } from "../types";
import { DENSITY_HEADING, DENSITY_MAXW } from "./shared";

/*
 * Inner: neural-net - "a layered network under the title."
 *
 * The constellation's structured sibling: a compact feed-forward network
 * figure (four layers of nodes, hairline edges) sits in a band right below
 * the title, with a mono eyebrow above. Signature toggle (params.pulse) =
 * three signal edges animated as travelling dashes (CSS stroke-dashoffset,
 * staggered phases, stilled under reduced motion); theming knob (tint)
 * recolors edges/eyebrow (cyan / violet / ember). Nothing paints a
 * background - it floats over the landscape.
 */

const TINTS: Record<InnerRenderProps<"neural-net">["params"]["tint"], string> =
	{
		cyan: "#7dd3fc",
		violet: "#d8b4fe",
		ember: "#fdba74",
	};

type Node = { x: number; y: number };

/* Four layers in a wide, short band (viewBox 0 0 100 30). */
const LAYERS: Node[][] = [
	[
		{ x: 8, y: 8 },
		{ x: 8, y: 15 },
		{ x: 8, y: 22 },
	],
	[
		{ x: 36, y: 5 },
		{ x: 36, y: 11.5 },
		{ x: 36, y: 18.5 },
		{ x: 36, y: 25 },
	],
	[
		{ x: 64, y: 5 },
		{ x: 64, y: 11.5 },
		{ x: 64, y: 18.5 },
		{ x: 64, y: 25 },
	],
	[
		{ x: 92, y: 11 },
		{ x: 92, y: 19 },
	],
];

/** Every adjacent-layer edge, precomputed with stable keys. */
const EDGES: { key: string; from: Node; to: Node }[] = LAYERS.slice(
	0,
	-1,
).flatMap((layer, li) =>
	layer.flatMap((from, fi) =>
		(LAYERS[li + 1] ?? []).map((to, ti) => ({
			key: `e${li}-${fi}-${ti}`,
			from,
			to,
		})),
	),
);

/** The three signal paths that pulse (input → hidden → hidden → output). */
const SIGNALS: { key: string; d: string }[] = [
	{ key: "s1", d: "M 8 8 L 36 11.5 L 64 5 L 92 11" },
	{ key: "s2", d: "M 8 15 L 36 18.5 L 64 18.5 L 92 19" },
	{ key: "s3", d: "M 8 22 L 36 25 L 64 11.5 L 92 11" },
];

export function NeuralNetCluster({
	topic,
	index,
	params,
	children,
}: InnerRenderProps<"neural-net">) {
	const tint = TINTS[params.tint];

	return (
		<div className={`relative w-full ${DENSITY_MAXW[params.density]}`}>
			<div className="relative z-10 flex flex-col items-center text-center gap-5">
				<div
					className="font-mono text-[11px] uppercase tracking-[0.35em]"
					style={{ color: tint }}
				>
					◉ neural net {String(index + 1).padStart(2, "0")}
				</div>
				<h2
					className={`${DENSITY_HEADING[params.density]} font-black uppercase tracking-tighter text-white leading-[0.9] [text-shadow:0_2px_10px_rgba(0,0,0,0.45)]`}
				>
					{topic.heading}
				</h2>

				{/* the network figure - compact band right below the title */}
				<svg
					className="pointer-events-none h-16 w-full max-w-md"
					viewBox="0 0 100 30"
					preserveAspectRatio="xMidYMid meet"
					aria-hidden="true"
				>
					<title>neural net</title>
					{EDGES.map((e) => (
						<line
							key={e.key}
							x1={e.from.x}
							y1={e.from.y}
							x2={e.to.x}
							y2={e.to.y}
							stroke={tint}
							strokeWidth={1}
							vectorEffect="non-scaling-stroke"
							opacity={0.22}
						/>
					))}
					{params.pulse &&
						SIGNALS.map((s, i) => (
							<path
								key={s.key}
								className={`nnet-pulse nnet-pulse--${i + 1}`}
								d={s.d}
								fill="none"
								stroke={tint}
								strokeWidth={1.4}
								strokeLinecap="round"
								strokeLinejoin="round"
								vectorEffect="non-scaling-stroke"
							/>
						))}
					{LAYERS.flat().map((n) => (
						<circle
							key={`n-${n.x}-${n.y}`}
							cx={n.x}
							cy={n.y}
							r={1.2}
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
