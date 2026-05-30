import type { InnerRenderProps } from "../types";
import { DENSITY_MAXW } from "./shared";

/*
 * Inner: circuit-board — "PCB panel."
 *
 * A printed-circuit board is the frame: dark-green substrate with copper traces
 * (motif) and corner solder-pads as chrome, a silkscreen IC carrying the heading,
 * then the topic's REAL body (the shared light plate) seated in a routed area on
 * the board — dark PCB chrome around the light content card, NOT copper-text
 * content. Signature motif (params.motif) = the copper trace routing overlay.
 */

export function CircuitBoardCluster({
	topic,
	index,
	params,
	accent,
	children,
}: InnerRenderProps) {
	return (
		<div className={`w-full ${DENSITY_MAXW[params.density]}`}>
			<div
				className={`pcb relative px-7 md:px-10 py-9 text-left ${params.motif ? "pcb-traces" : ""}`}
				style={{ "--pcb-accent": accent } as React.CSSProperties}
			>
				{/* corner solder pads */}
				<span
					className="pcb-pad absolute top-3 left-3 w-3 h-3"
					aria-hidden="true"
				/>
				<span
					className="pcb-pad absolute top-3 right-3 w-3 h-3"
					aria-hidden="true"
				/>
				<span
					className="pcb-pad absolute bottom-3 left-3 w-3 h-3"
					aria-hidden="true"
				/>
				<span
					className="pcb-pad absolute bottom-3 right-3 w-3 h-3"
					aria-hidden="true"
				/>

				<div className="relative z-10 flex items-center justify-between gap-4 mb-5">
					{/* IC carrying the heading */}
					<div className="pcb-chip relative inline-block px-5 py-3">
						<span className="pcb-chip-pins" aria-hidden="true" />
						<h2 className="font-mono font-bold uppercase tracking-tight text-2xl md:text-3xl text-emerald-50 leading-none relative z-10">
							{topic.heading}
						</h2>
					</div>
					<span className="font-mono text-[10px] uppercase tracking-[0.3em] text-emerald-300/70 whitespace-nowrap">
						rev {String(index + 1).padStart(2, "0")}
					</span>
				</div>

				{/* routed area seating the content plate */}
				<div className="pcb-component relative z-10 p-3 md:p-4">{children}</div>
			</div>
		</div>
	);
}
