import type { InnerRenderProps } from "../types";
import { useTriggerNav } from "../useTriggerNav";
import { DENSITY_MAXW } from "./shared";

/*
 * Inner: circuit-board
 *
 * A printed-circuit board: dark green substrate, copper traces (motif) routing
 * out from a central chip carrying the heading, the teaser silkscreened beside
 * it, and triggers as component pads with solder rings. Fits the AI topic.
 * Signature motif = the copper traces.
 */

export function CircuitBoardCluster({
	topic,
	lastTriggerRef,
	params,
	accent,
}: InnerRenderProps) {
	const { resolveTrigger } = useTriggerNav(lastTriggerRef);

	return (
		<div className={`w-full ${DENSITY_MAXW[params.density]}`}>
			<div
				className={`pcb relative px-7 md:px-10 py-9 text-left ${params.motif ? "pcb-traces" : ""}`}
				style={{ "--pcb-accent": accent } as React.CSSProperties}
			>
				{/* chip carrying the heading */}
				<div className="pcb-chip relative inline-block px-5 py-3 mb-5">
					<span className="pcb-chip-pins" aria-hidden="true" />
					<h2 className="font-mono font-bold uppercase tracking-tight text-2xl md:text-3xl text-emerald-50 leading-none relative z-10">
						{topic.heading}
					</h2>
				</div>

				<p className="font-mono text-xs md:text-sm text-emerald-100/80 leading-relaxed max-w-md mb-6">
					<span className="text-emerald-400">{"//"}</span> {topic.teaser}
				</p>

				<div className="flex flex-col gap-3">
					{topic.triggers.map((trigger) => {
						const resolved = resolveTrigger(trigger, topic.teaser);
						if (!resolved) return null;
						const { Icon } = resolved;
						return (
							<button
								key={resolved.key}
								type="button"
								onClick={(e) => resolved.navigate(e.currentTarget)}
								className="pcb-component group inline-flex items-center gap-3 px-3 py-2.5 text-left"
							>
								<span className="pcb-pad flex items-center justify-center w-8 h-8 shrink-0">
									<Icon size={15} className="text-emerald-50" />
								</span>
								<span className="flex flex-col">
									<span className="font-mono text-sm uppercase tracking-wide text-emerald-50 leading-none group-hover:text-white">
										{resolved.title}
									</span>
									<span className="font-mono text-[9px] uppercase tracking-[0.2em] text-emerald-400/70 mt-1">
										route →
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
