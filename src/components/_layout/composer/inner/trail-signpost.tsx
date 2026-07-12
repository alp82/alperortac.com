import type { InnerRenderProps } from "../types";
import { DENSITY_GAP, DENSITY_HEADING, DENSITY_MAXW } from "./shared";

/*
 * Inner: trail-signpost - "waypoint marker."
 *
 * A trail waypoint is the frame: a diamond marker tops a wooden signpost board
 * carrying the heading as the route label, then the topic's REAL body (the
 * shared light plate) sits below as the kraft trail-note. Signature toggle
 * (params.marker) = the waypoint diamond marker; the `wood` knob stains the
 * board, the diamond border and the note border inline.
 */

/** wood → board/diamond/note stain color. */
const WOOD: Record<"pine" | "walnut" | "weathered", string> = {
	pine: "#7a5c3a",
	walnut: "#4a3220",
	weathered: "#8a8170",
};

export function TrailSignpostCluster({
	topic,
	params,
	accent,
	children,
}: InnerRenderProps<"trail-signpost">) {
	const wood = WOOD[params.wood];

	return (
		<div
			className={`flex flex-col items-center text-center w-full ${DENSITY_MAXW[params.density]} ${DENSITY_GAP[params.density]}`}
		>
			<div className="flex flex-col items-center gap-3">
				{params.marker && (
					<span
						className="w-6 h-6 rotate-45 border-[3px]"
						style={{ background: accent, borderColor: wood }}
						aria-hidden="true"
					/>
				)}
				<div className="signpost-board px-6 py-3" style={{ background: wood }}>
					<h2
						className={`${DENSITY_HEADING[params.density]} font-black uppercase tracking-tighter leading-[0.9] text-[#fdf3e2] drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]`}
					>
						{topic.heading}
					</h2>
				</div>
			</div>

			{/* The note pinned below the signpost - a kraft trail-register card so
			   the body reads on the dark stage and stays in the trail theme. */}
			<div className="w-full">
				<div
					className="relative w-full rounded-md border-2 bg-[#efe2c6] px-4 py-3 md:px-5 md:py-4 text-left shadow-[0_10px_26px_-14px_rgba(0,0,0,0.6)]"
					style={{ borderColor: wood }}
				>
					<span
						className="absolute -top-2 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-[#3a2410] shadow-[0_1px_2px_rgba(0,0,0,0.5)]"
						aria-hidden="true"
					/>
					{children}
				</div>
			</div>
		</div>
	);
}
