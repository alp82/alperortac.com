import { ArrowRight } from "lucide-react";
import type { InnerRenderProps } from "../types";
import { useTriggerNav } from "../useTriggerNav";
import { DENSITY_HEADING, DENSITY_MAXW } from "./shared";

/*
 * Inner: chalkboard
 *
 * A slate board in a wooden tray: the heading in a chalk-textured hand, the
 * teaser as dusty cursive, and triggers as chalk-outlined boxes with a ✓ tick.
 * Signature motif = the chalk-dust smudge wash across the slate.
 */

export function ChalkboardCluster({
	topic,
	lastTriggerRef,
	params,
}: InnerRenderProps) {
	const { resolveTrigger } = useTriggerNav(lastTriggerRef);

	return (
		<div className={`w-full ${DENSITY_MAXW[params.density]}`}>
			<div className="chalkboard relative px-8 md:px-12 py-10 text-center">
				{params.motif && <span className="chalk-dust" aria-hidden="true" />}
				<div className="relative z-10">
					<div className="chalk-hand text-[11px] uppercase tracking-[0.4em] text-white/55 mb-3">
						today's lesson
					</div>
					<h2
						className={`chalk-hand chalk-write ${DENSITY_HEADING[params.density]} text-white leading-none`}
					>
						{topic.heading}
					</h2>
					<p className="chalk-hand text-base md:text-lg text-white/80 leading-relaxed mt-4 mx-auto max-w-md">
						{topic.teaser}
					</p>

					<div className="flex flex-col items-center gap-3 mt-7">
						{topic.triggers.map((trigger) => {
							const resolved = resolveTrigger(trigger, topic.teaser);
							if (!resolved) return null;
							return (
								<button
									key={resolved.key}
									type="button"
									onClick={(e) => resolved.navigate(e.currentTarget)}
									className="chalk-box group inline-flex items-center gap-3 px-5 py-2.5 text-left"
								>
									<span className="chalk-tick" aria-hidden="true">
										✓
									</span>
									<span className="chalk-hand text-base md:text-lg text-white group-hover:text-white">
										{resolved.title}
									</span>
									<ArrowRight
										size={16}
										className="text-white/70 group-hover:translate-x-1 transition-transform"
									/>
								</button>
							);
						})}
					</div>
				</div>
				{/* chalk tray */}
				<span className="chalk-tray" aria-hidden="true" />
			</div>
		</div>
	);
}
