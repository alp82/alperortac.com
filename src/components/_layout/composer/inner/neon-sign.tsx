import type { InnerRenderProps } from "../types";
import { DENSITY_HEADING, DENSITY_MAXW } from "./shared";

/*
 * Inner: neon-sign — "neon board."
 *
 * A dark backing board is the frame: the heading rendered as lit neon-colored
 * tubing (layered text-shadow) is the chrome, then the topic's REAL body
 * (the shared light plate) seated below in a legible panel — dark board + neon
 * glow around the light content card, NOT glowing-tube content. Signature toggle
 * (params.flicker) = the glow flicker on the heading (reduced-motion safe via
 * CSS); params.color sets the neon hue via the `--neon` var.
 */

/** color → neon hue for the `--neon` CSS var. */
const NEON: Record<InnerRenderProps<"neon-sign">["params"]["color"], string> = {
	pink: "#ff5fa2",
	cyan: "#5de0ff",
	lime: "#b6ff5f",
	gold: "#ffd24a",
};

export function NeonSignCluster({
	topic,
	params,
	children,
}: InnerRenderProps<"neon-sign">) {
	return (
		<div className={`w-full ${DENSITY_MAXW[params.density]}`}>
			<div
				className="neon-board relative px-8 md:px-12 py-10"
				style={{ "--neon": NEON[params.color] } as React.CSSProperties}
			>
				<h2
					className={`neon-text text-center ${params.flicker ? "neon-flicker" : ""} ${DENSITY_HEADING[params.density]} font-black uppercase tracking-tight leading-none`}
				>
					{topic.heading}
				</h2>

				{/* light content card seated below the sign */}
				<div className="mt-8">{children}</div>
			</div>
		</div>
	);
}
