import type { InnerRenderProps } from "../types";
import { useTriggerNav } from "../useTriggerNav";
import { DENSITY_HEADING, DENSITY_MAXW } from "./shared";

/*
 * Inner: neon-sign
 *
 * A glowing neon-tube sign on a dark backing board: the heading rendered as lit
 * accent-colored tubing (layered text-shadow), the teaser as a dim sub-tube,
 * and triggers as outlined neon buttons that brighten on hover. Signature motif
 * = the glow flicker on the heading — reduced-motion safe (flicker disabled
 * under prefers-reduced-motion via CSS).
 */

export function NeonSignCluster({
	topic,
	lastTriggerRef,
	params,
	accent,
}: InnerRenderProps) {
	const { resolveTrigger } = useTriggerNav(lastTriggerRef);

	return (
		<div className={`w-full ${DENSITY_MAXW[params.density]}`}>
			<div
				className="neon-board relative px-8 md:px-12 py-12 text-center"
				style={{ "--neon": accent } as React.CSSProperties}
			>
				<h2
					className={`neon-text ${params.motif ? "neon-flicker" : ""} ${DENSITY_HEADING[params.density]} font-black uppercase tracking-tight leading-none`}
				>
					{topic.heading}
				</h2>
				<p className="neon-sub text-base md:text-lg font-medium mt-5 mx-auto max-w-md leading-relaxed">
					{topic.teaser}
				</p>

				<div className="flex flex-wrap items-center justify-center gap-4 mt-8">
					{topic.triggers.map((trigger) => {
						const resolved = resolveTrigger(trigger, topic.teaser);
						if (!resolved) return null;
						return (
							<button
								key={resolved.key}
								type="button"
								onClick={(e) => resolved.navigate(e.currentTarget)}
								className="neon-btn group px-6 py-3 font-black uppercase tracking-widest text-sm"
							>
								{resolved.title}
							</button>
						);
					})}
				</div>
			</div>
		</div>
	);
}
