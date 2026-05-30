import type { InnerRenderProps } from "../types";
import { DENSITY_HEADING, DENSITY_MAXW } from "./shared";

/*
 * Inner: marquee-bulbs — "marquee signboard."
 *
 * A theater marquee is the frame: a border of glowing light bulbs (motif) + a
 * "now showing" eyebrow + the heading in marquee letters form the chrome, then
 * the topic's REAL body (the shared light plate) sits on the board below — dark
 * lit signboard around the light content card. Distinct from the marquee-scroll
 * SECTION (a moving strip). Signature motif (params.motif) = the chasing-bulb
 * animation (reduced-motion safe via CSS).
 */

export function MarqueeBulbsCluster({
	topic,
	params,
	accent,
	children,
}: InnerRenderProps) {
	return (
		<div className={`w-full ${DENSITY_MAXW[params.density]}`}>
			<div
				className={`marquee-sign relative px-8 md:px-12 py-10 ${params.motif ? "marquee-sign-chase" : ""}`}
				style={{ "--marq-accent": accent } as React.CSSProperties}
			>
				{/* bulb border */}
				<span className="marquee-bulbs" aria-hidden="true" />

				<div className="relative z-10">
					<div
						className="text-center font-black uppercase tracking-[0.3em] text-xs mb-3"
						style={{ color: accent }}
					>
						now showing
					</div>
					<h2
						className={`text-center ${DENSITY_HEADING[params.density]} font-black uppercase tracking-tight text-white leading-none drop-shadow-[0_2px_10px_rgba(0,0,0,0.6)]`}
					>
						{topic.heading}
					</h2>

					{/* light content card on the board */}
					<div className="mt-8">{children}</div>
				</div>
			</div>
		</div>
	);
}
