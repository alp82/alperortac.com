import { flourishSrc } from "../types";
import type { InnerRenderProps } from "../types";
import { useTriggerNav } from "../useTriggerNav";
import { DENSITY_MAXW } from "./shared";

/*
 * Inner: stamp-postcard
 *
 * A vintage postcard: the flourish art on the left, a perforated postage stamp
 * (accent) with a circular postmark ring stamped over the corner, the heading
 * as the greeting, and triggers as ruled address lines on the right. Signature
 * motif = the postmark ring over the stamp.
 */

export function StampPostcardCluster({
	topic,
	lastTriggerRef,
	params,
	accent,
}: InnerRenderProps) {
	const { resolveTrigger } = useTriggerNav(lastTriggerRef);

	return (
		<div className={`w-full ${DENSITY_MAXW[params.density]}`}>
			<div className="postcard relative grid grid-cols-1 md:grid-cols-2">
				{/* picture side */}
				<div
					className="postcard-pic relative flex items-center justify-center min-h-[160px]"
					style={{
						background: `radial-gradient(circle at 50% 40%, ${accent} 0%, color-mix(in srgb, ${accent} 35%, #fdf6e9) 100%)`,
					}}
				>
					<img
						src={flourishSrc(topic.id)}
						alt=""
						aria-hidden="true"
						className="w-24 h-24"
						style={{ imageRendering: "pixelated" }}
					/>
				</div>
				{/* address side */}
				<div className="relative px-6 py-6 text-left">
					{/* postage stamp + postmark */}
					<div className="absolute top-4 right-4">
						<span
							className="postcard-stamp flex items-center justify-center"
							style={{ background: accent }}
						>
							<span className="font-mono text-[8px] uppercase text-slate-900/70 leading-tight text-center">
								post
								<br />
								card
							</span>
						</span>
						{params.motif && (
							<span className="postcard-postmark" aria-hidden="true">
								<span className="postcard-postmark-bars" />
							</span>
						)}
					</div>

					<div className="font-serif text-[11px] uppercase tracking-[0.3em] text-slate-500 mb-3">
						greetings from
					</div>
					<h2 className="font-serif font-bold text-3xl md:text-4xl text-slate-900 leading-tight pr-16">
						{topic.heading}
					</h2>
					<p className="font-serif italic text-sm text-slate-600 leading-snug mt-2 pr-10">
						{topic.teaser}
					</p>

					<div className="mt-5 flex flex-col gap-2.5">
						{topic.triggers.map((trigger) => {
							const resolved = resolveTrigger(trigger, topic.teaser);
							if (!resolved) return null;
							return (
								<button
									key={resolved.key}
									type="button"
									onClick={(e) => resolved.navigate(e.currentTarget)}
									className="postcard-line group flex items-center gap-2 text-left"
								>
									<span className="font-serif text-sm text-slate-800 group-hover:text-slate-900">
										{resolved.title}
									</span>
								</button>
							);
						})}
					</div>
				</div>
			</div>
		</div>
	);
}
