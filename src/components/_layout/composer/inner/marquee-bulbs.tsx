import type { InnerRenderProps } from "../types";
import { useTriggerNav } from "../useTriggerNav";
import { DENSITY_HEADING, DENSITY_MAXW } from "./shared";

/*
 * Inner: marquee-bulbs
 *
 * A theater marquee: the heading framed by a border of glowing light bulbs
 * (motif = the chasing-bulb animation, reduced-motion safe), the teaser as the
 * "now showing" line, and triggers as marquee buttons. Distinct from the
 * marquee-scroll SECTION — this is a static lit signboard, not a moving strip.
 */

export function MarqueeBulbsCluster({
	topic,
	lastTriggerRef,
	params,
	accent,
}: InnerRenderProps) {
	const { resolveTrigger } = useTriggerNav(lastTriggerRef);

	return (
		<div className={`w-full ${DENSITY_MAXW[params.density]}`}>
			<div
				className={`marquee-sign relative px-8 md:px-12 py-10 text-center ${params.motif ? "marquee-sign-chase" : ""}`}
				style={{ "--marq-accent": accent } as React.CSSProperties}
			>
				{/* bulb border */}
				<span className="marquee-bulbs" aria-hidden="true" />

				<div className="relative z-10">
					<div
						className="font-black uppercase tracking-[0.3em] text-xs mb-3"
						style={{ color: accent }}
					>
						now showing
					</div>
					<h2
						className={`${DENSITY_HEADING[params.density]} font-black uppercase tracking-tight text-white leading-none drop-shadow-[0_2px_10px_rgba(0,0,0,0.6)]`}
					>
						{topic.heading}
					</h2>
					<p className="text-base md:text-lg text-amber-50/85 leading-relaxed mt-4 mx-auto max-w-md">
						{topic.teaser}
					</p>

					<div className="flex flex-wrap items-center justify-center gap-3 mt-7">
						{topic.triggers.map((trigger) => {
							const resolved = resolveTrigger(trigger, topic.teaser);
							if (!resolved) return null;
							return (
								<button
									key={resolved.key}
									type="button"
									onClick={(e) => resolved.navigate(e.currentTarget)}
									className="marquee-btn group px-6 py-3 font-black uppercase tracking-widest text-sm text-slate-900"
									style={{ background: accent }}
								>
									{resolved.title}
								</button>
							);
						})}
					</div>
				</div>
			</div>
		</div>
	);
}
