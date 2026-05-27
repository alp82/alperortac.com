import type { InnerRenderProps } from "../types";
import { useTriggerNav } from "../useTriggerNav";
import { DENSITY_MAXW } from "./shared";

/*
 * Inner: blueprint
 *
 * A technical drawing: cyan grid paper, the heading as a drafted title with a
 * dimension line beneath it (tick-capped, labelled), mono annotations, and
 * triggers as callout bubbles with leader lines. Signature motif = the grid +
 * dimension ticks overlay.
 */

export function BlueprintCluster({
	topic,
	index,
	lastTriggerRef,
	params,
}: InnerRenderProps) {
	const { resolveTrigger } = useTriggerNav(lastTriggerRef);

	return (
		<div className={`w-full ${DENSITY_MAXW[params.density]}`}>
			<div
				className={`blueprint relative px-7 md:px-10 py-9 text-left ${params.motif ? "blueprint-grid" : ""}`}
			>
				<div className="flex items-start justify-between gap-3 border-b border-cyan-200/40 pb-2 mb-5">
					<span className="font-mono text-[10px] uppercase tracking-[0.3em] text-cyan-100/80">
						fig. {String(index + 1).padStart(2, "0")} — rev. A
					</span>
					<span className="font-mono text-[10px] uppercase tracking-[0.3em] text-cyan-100/80">
						scale 1:1
					</span>
				</div>

				<h2 className="font-mono font-bold uppercase tracking-tight text-3xl md:text-4xl text-cyan-50 leading-none">
					{topic.heading}
				</h2>
				{/* dimension line */}
				<div className="blueprint-dim mt-3 mb-5" aria-hidden="true">
					<span className="blueprint-dim-label">
						{topic.heading.length} units
					</span>
				</div>

				<p className="font-mono text-xs md:text-sm text-cyan-100/85 leading-relaxed max-w-md">
					{topic.teaser}
				</p>

				<div className="mt-6 flex flex-col gap-3">
					{topic.triggers.map((trigger) => {
						const resolved = resolveTrigger(trigger, topic.teaser);
						if (!resolved) return null;
						return (
							<button
								key={resolved.key}
								type="button"
								onClick={(e) => resolved.navigate(e.currentTarget)}
								className="blueprint-callout group inline-flex items-center gap-3 text-left"
							>
								<span className="blueprint-bullet" aria-hidden="true" />
								<span className="blueprint-bubble px-4 py-2">
									<span className="font-mono text-sm uppercase tracking-wide text-cyan-50 group-hover:text-white">
										{resolved.title}
									</span>
								</span>
							</button>
						);
					})}
				</div>
			</div>
		</div>
	);
}
