import type { InnerRenderProps } from "../types";
import { DENSITY_MAXW } from "./shared";

/*
 * Inner: circuit-board — "PCB panel."
 *
 * A printed-circuit board is the frame: a tinted substrate with copper traces
 * (toggle) and corner solder-pads as chrome, a silkscreen IC carrying the
 * heading, then the topic's REAL body (the shared light plate) seated in a
 * routed area on the board — dark PCB chrome around the light content card.
 * Signature toggle (`traces`) = the copper trace routing overlay; `mask`
 * recolors the substrate + silkscreen inline.
 */

/** mask → board substrate bg + silkscreen color (both applied inline). */
const MASKS: Record<
	InnerRenderProps<"circuit-board">["params"]["mask"],
	{ board: string; silk: string }
> = {
	green: { board: "#0c3b24", silk: "#6ee7b7" },
	blue: { board: "#0b2a47", silk: "#93c5fd" },
	black: { board: "#141a17", silk: "#cbd5e1" },
	purple: { board: "#2a1140", silk: "#d8b4fe" },
};

export function CircuitBoardCluster({
	topic,
	index,
	params,
	accent,
	children,
}: InnerRenderProps<"circuit-board">) {
	const mask = MASKS[params.mask];

	return (
		<div className={`w-full ${DENSITY_MAXW[params.density]}`}>
			<div
				className={`pcb relative px-7 md:px-10 py-9 text-left ${params.traces ? "pcb-traces" : ""}`}
				style={
					{
						"--pcb-accent": accent,
						background: mask.board,
					} as React.CSSProperties
				}
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
						<h2
							className="font-mono font-bold uppercase tracking-tight text-2xl md:text-3xl leading-none relative z-10"
							style={{ color: mask.silk }}
						>
							{topic.heading}
						</h2>
					</div>
					<span
						className="font-mono text-[10px] uppercase tracking-[0.3em] whitespace-nowrap"
						style={{ color: mask.silk }}
					>
						rev {String(index + 1).padStart(2, "0")}
					</span>
				</div>

				{/* routed area seating the content plate */}
				<div className="pcb-component relative z-10 p-3 md:p-4">{children}</div>
			</div>
		</div>
	);
}
