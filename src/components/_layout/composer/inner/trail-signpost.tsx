import type { InnerRenderProps } from "../types";
import { DENSITY_GAP, DENSITY_HEADING, DENSITY_MAXW } from "./shared";

/*
 * Inner: trail-signpost — "waypoint marker."
 *
 * A trail waypoint is the frame: a diamond marker (motif) tops a wooden signpost
 * board carrying the heading as the route label, then the topic's REAL body (the
 * shared light plate) sits below as the note. Signature motif (params.motif) = the
 * waypoint diamond marker.
 */

export function TrailSignpostCluster({
	topic,
	params,
	accent,
	children,
}: InnerRenderProps) {
	return (
		<div
			className={`flex flex-col items-center text-center w-full ${DENSITY_MAXW[params.density]} ${DENSITY_GAP[params.density]}`}
		>
			<div className="flex flex-col items-center gap-3">
				{params.motif && (
					<span
						className="w-6 h-6 rotate-45 border-[3px]"
						style={{ background: accent, borderColor: "#3a2410" }}
						aria-hidden="true"
					/>
				)}
				<div className="signpost-board px-6 py-3">
					<h2
						className={`${DENSITY_HEADING[params.density]} font-black uppercase tracking-tighter leading-[0.9] text-[#fdf3e2] drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]`}
					>
						{topic.heading}
					</h2>
				</div>
			</div>

			<div className="w-full">{children}</div>
		</div>
	);
}
