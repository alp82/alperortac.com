import type { InnerRenderProps } from "../types";
import { DENSITY_HEADING, DENSITY_MAXW } from "./shared";

/*
 * Inner: chalkboard — "slate board."
 *
 * A DARK slate board in a wooden frame is the frame: a chalk-dust wash (motif), a
 * chalk-hand "today's lesson" eyebrow + the heading written in chalk, then the
 * topic's REAL body (the shared light plate) RESTING on the slate as a pinned
 * content card — dark slate chrome around the light card, NOT chalk-text content.
 * A wooden chalk tray runs along the bottom. Signature motif (params.motif) = the
 * chalk-dust smudge wash across the slate.
 */

export function ChalkboardCluster({
	topic,
	params,
	children,
}: InnerRenderProps) {
	return (
		<div className={`w-full ${DENSITY_MAXW[params.density]}`}>
			<div className="chalkboard relative px-8 md:px-12 pt-10 pb-12">
				{params.motif && <span className="chalk-dust" aria-hidden="true" />}
				<div className="relative z-10">
					<div className="chalk-hand text-center text-[11px] uppercase tracking-[0.4em] text-white/55 mb-3">
						today's lesson
					</div>
					<h2
						className={`chalk-hand chalk-write text-center ${DENSITY_HEADING[params.density]} text-white leading-none`}
					>
						{topic.heading}
					</h2>

					{/* light content card resting on the slate */}
					<div className="mt-7">{children}</div>
				</div>
				{/* chalk tray */}
				<span className="chalk-tray" aria-hidden="true" />
			</div>
		</div>
	);
}
