import { Zap } from "lucide-react";
import { flourishSrc } from "../types";
import type { InnerRenderProps } from "../types";
import { useTriggerNav } from "../useTriggerNav";
import { DENSITY_MAXW } from "./shared";

/*
 * Inner: comic
 *
 * Centered recast: a compact comic page centered on the stage — black gutters,
 * a jagged caption box over the accent establishing panel, a speech-bubble
 * teaser, and one action panel per trigger with motion lines. High-energy ink.
 * Signature motif = the halftone dot wash on the panels.
 */

export function ComicCluster({
	topic,
	lastTriggerRef,
	params,
	accent,
}: InnerRenderProps) {
	const { resolveTrigger } = useTriggerNav(lastTriggerRef);

	return (
		<div
			className={`comic-page relative w-full p-3 ${DENSITY_MAXW[params.density]}`}
		>
			<div className="grid grid-cols-2 gap-3">
				<div
					className="comic-panel relative col-span-2 min-h-[140px] flex items-center justify-center overflow-hidden"
					style={{ background: accent }}
				>
					{params.motif && (
						<span className="comic-halftone" aria-hidden="true" />
					)}
					<img
						src={flourishSrc(topic.id)}
						alt=""
						aria-hidden="true"
						className="w-20 h-20 relative z-10"
						style={{ imageRendering: "pixelated" }}
					/>
					<div className="comic-caption absolute top-2 left-2 px-3 py-1.5">
						<span className="font-black uppercase tracking-tight text-lg md:text-2xl text-slate-900 leading-none">
							{topic.heading}
						</span>
					</div>
				</div>

				<div className="comic-panel col-span-2 bg-white flex items-center p-4">
					<div className="comic-bubble relative px-4 py-3">
						<p className="font-bold text-slate-900 leading-snug text-sm md:text-base">
							{topic.teaser}
						</p>
					</div>
				</div>

				{topic.triggers.map((trigger) => {
					const resolved = resolveTrigger(trigger, topic.teaser);
					if (!resolved) return null;
					return (
						<button
							key={resolved.key}
							type="button"
							onClick={(e) => resolved.navigate(e.currentTarget)}
							className="comic-action comic-panel group relative col-span-2 min-h-[80px] flex items-center justify-center overflow-hidden bg-white px-4 py-4"
						>
							<span className="comic-motion" aria-hidden="true" />
							<span className="relative z-10 inline-flex items-center gap-2">
								<Zap
									size={20}
									className="text-slate-900 group-hover:scale-125 transition-transform"
									fill="currentColor"
								/>
								<span className="comic-pow font-black uppercase tracking-tight text-xl md:text-2xl text-slate-900">
									{resolved.title}!
								</span>
							</span>
						</button>
					);
				})}
			</div>
		</div>
	);
}
