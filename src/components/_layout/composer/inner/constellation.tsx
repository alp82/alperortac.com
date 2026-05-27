import type { InnerRenderProps } from "../types";
import { useTriggerNav } from "../useTriggerNav";
import { DENSITY_HEADING, DENSITY_TEASER } from "./shared";

/*
 * Inner: constellation
 *
 * Centered recast: the heading sits above a centered star field whose lines
 * connect a cluster of points; each trigger is a bright clickable "discover"
 * star. Ties to the celestial sky easter egg. Reads light (white type) since it
 * lives over the stage scrim. Signature motif = the connecting star lines.
 */

type StarPoint = { x: number; y: number };

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

export function ConstellationCluster({
	topic,
	index,
	lastTriggerRef,
	params,
	accent,
}: InnerRenderProps) {
	const { resolveTrigger } = useTriggerNav(lastTriggerRef);
	const cluster: readonly StarPoint[] =
		CLUSTERS[index % CLUSTERS.length] ?? CLUSTERS[0] ?? [];
	const anchor: StarPoint = cluster[0] ?? { x: 50, y: 50 };
	const triggers = topic.triggers
		.map((t) => resolveTrigger(t, topic.teaser))
		.filter((r): r is NonNullable<typeof r> => r !== null);
	const linePath = cluster
		.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`)
		.join(" ");

	return (
		<div className="flex flex-col items-center text-center max-w-3xl w-full gap-5">
			<div
				className="text-[11px] font-mono uppercase tracking-[0.35em]"
				style={{ color: accent }}
			>
				◆ constellation {String(index + 1).padStart(2, "0")}
			</div>
			<h2
				className={`${DENSITY_HEADING[params.density]} font-black uppercase tracking-tighter text-white leading-[0.9] drop-shadow-[0_2px_14px_rgba(0,0,0,0.7)]`}
			>
				{topic.heading}
			</h2>
			<p
				className={`${DENSITY_TEASER[params.density]} font-medium leading-relaxed text-slate-200/85 max-w-md`}
			>
				{topic.teaser}
			</p>

			<div className="relative aspect-[2/1] w-full max-w-lg mt-2">
				<svg
					className="absolute inset-0 w-full h-full pointer-events-none"
					viewBox="0 0 100 50"
					preserveAspectRatio="none"
					aria-hidden="true"
				>
					<title>constellation lines</title>
					{params.motif && (
						<path
							d={linePath}
							fill="none"
							stroke="rgba(199,210,254,0.5)"
							strokeWidth="0.5"
						/>
					)}
					{cluster.map((p) => (
						<circle
							key={`${p.x}-${p.y}`}
							cx={p.x}
							cy={p.y / 2}
							r="0.6"
							fill="rgba(255,255,255,0.5)"
						/>
					))}
				</svg>

				{triggers.map((resolved, ti) => {
					const point =
						cluster.length > 0
							? (cluster[(ti + 1) % cluster.length] ?? anchor)
							: anchor;
					return (
						<button
							key={resolved.key}
							type="button"
							onClick={(e) => resolved.navigate(e.currentTarget)}
							className="discover-star group absolute -translate-x-1/2 -translate-y-1/2"
							style={{ left: `${point.x}%`, top: `${point.y / 2}%` }}
						>
							<span
								className="star-glow"
								style={{ background: accent }}
								aria-hidden="true"
							/>
							<span className="star-label">{resolved.title}</span>
						</button>
					);
				})}
			</div>
		</div>
	);
}
