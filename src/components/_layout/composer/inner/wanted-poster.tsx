import { flourishSrc } from "../types";
import type { InnerRenderProps } from "../types";
import { useTriggerNav } from "../useTriggerNav";
import { DENSITY_MAXW } from "./shared";

/*
 * Inner: wanted-poster
 *
 * An old-west WANTED bill on aged paper: woodtype "WANTED" banner, the flourish
 * as the mugshot in a frame, the heading as the outlaw's name, the teaser as the
 * crime, and triggers as REWARD buttons. Signature motif = the torn/aged paper
 * edges.
 */

export function WantedPosterCluster({
	topic,
	index,
	lastTriggerRef,
	params,
}: InnerRenderProps) {
	const { resolveTrigger } = useTriggerNav(lastTriggerRef);

	return (
		<div className={`w-full ${DENSITY_MAXW[params.density]}`}>
			<div
				className={`wanted relative px-8 md:px-10 py-8 text-center ${params.motif ? "wanted-torn" : ""}`}
			>
				<div className="wanted-banner font-black uppercase text-4xl md:text-6xl leading-none tracking-tight">
					Wanted
				</div>
				<div className="wanted-rule" aria-hidden="true" />
				<div className="font-serif text-[11px] uppercase tracking-[0.35em] text-[#4a3013] mt-2 mb-4">
					dead or alive
				</div>

				{/* mugshot */}
				<div className="wanted-photo mx-auto mb-4 flex items-center justify-center">
					<img
						src={flourishSrc(topic.id)}
						alt=""
						aria-hidden="true"
						className="w-24 h-24 opacity-80"
						style={{ imageRendering: "pixelated", filter: "sepia(0.6)" }}
					/>
				</div>

				<h2 className="wanted-name font-black uppercase text-3xl md:text-4xl text-[#3a2410] leading-none">
					{topic.heading}
				</h2>
				<p className="font-serif italic text-sm md:text-base text-[#4a3013] leading-snug mt-3 mx-auto max-w-sm">
					{topic.teaser}
				</p>

				<div className="flex flex-col items-center gap-3 mt-6">
					{topic.triggers.map((trigger) => {
						const resolved = resolveTrigger(trigger, topic.teaser);
						if (!resolved) return null;
						return (
							<button
								key={resolved.key}
								type="button"
								onClick={(e) => resolved.navigate(e.currentTarget)}
								className="wanted-reward group inline-flex flex-col items-center px-6 py-2.5"
							>
								<span className="font-serif text-[10px] uppercase tracking-[0.3em] text-[#4a3013]">
									reward
								</span>
								<span className="font-black uppercase text-lg text-[#3a2410] leading-none group-hover:underline">
									{resolved.title}
								</span>
							</button>
						);
					})}
				</div>

				<div className="font-serif text-[10px] uppercase tracking-[0.3em] text-[#4a3013]/70 mt-5">
					reward no. {String(index + 1).padStart(3, "0")}
				</div>
			</div>
		</div>
	);
}
