import type { InnerRenderProps } from "../types";
import { DENSITY_HEADING, DENSITY_MAXW } from "./shared";

/*
 * Inner: neon-sign — "neon board."
 *
 * A dark backing board is the frame: the heading rendered as lit accent-colored
 * neon tubing (layered text-shadow) is the chrome, then the topic's REAL body
 * (the shared light plate) seated below in a legible panel — dark board + neon
 * glow around the light content card, NOT glowing-tube content. Signature motif
 * (params.motif) = the glow flicker on the heading (reduced-motion safe via CSS).
 */

export function NeonSignCluster({
	topic,
	params,
	accent,
	children,
}: InnerRenderProps) {
	return (
		<div className={`w-full ${DENSITY_MAXW[params.density]}`}>
			<div
				className="neon-board relative px-8 md:px-12 py-10"
				style={{ "--neon": accent } as React.CSSProperties}
			>
				<h2
					className={`neon-text text-center ${params.motif ? "neon-flicker" : ""} ${DENSITY_HEADING[params.density]} font-black uppercase tracking-tight leading-none`}
				>
					{topic.heading}
				</h2>

				{/* light content card seated below the sign */}
				<div className="mt-8">{children}</div>
			</div>
		</div>
	);
}
