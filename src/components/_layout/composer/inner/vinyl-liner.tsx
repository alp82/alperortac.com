import { flourishSrc } from "../types";
import type { InnerRenderProps } from "../types";
import { useTriggerNav } from "../useTriggerNav";
import { DENSITY_MAXW } from "./shared";

/*
 * Inner: vinyl-liner
 *
 * A record sleeve with the disc (motif) peeking out the right edge: the album
 * art carries the flourish + heading, the teaser reads as liner notes, and
 * triggers are a numbered tracklist. Signature motif = the vinyl disc sliding
 * out of the sleeve.
 */

export function VinylLinerCluster({
	topic,
	lastTriggerRef,
	params,
	accent,
}: InnerRenderProps) {
	const { resolveTrigger } = useTriggerNav(lastTriggerRef);

	return (
		<div className={`w-full ${DENSITY_MAXW[params.density]}`}>
			<div className="vinyl relative flex items-stretch">
				{/* disc peeking from behind the sleeve */}
				{params.motif && (
					<div
						className="vinyl-disc"
						style={{ "--vinyl-accent": accent } as React.CSSProperties}
						aria-hidden="true"
					>
						<span className="vinyl-disc-label" style={{ background: accent }} />
					</div>
				)}
				{/* sleeve */}
				<div className="vinyl-sleeve relative z-10 flex-1 p-5">
					<div
						className="vinyl-art relative flex items-center justify-center mb-4"
						style={{
							background: `radial-gradient(circle at 35% 30%, ${accent} 0%, #1a1a1a 95%)`,
						}}
					>
						<img
							src={flourishSrc(topic.id)}
							alt=""
							aria-hidden="true"
							className="w-20 h-20"
							style={{ imageRendering: "pixelated" }}
						/>
						<h2 className="absolute bottom-2 left-3 right-3 font-black uppercase tracking-tight text-2xl text-white leading-none drop-shadow-lg">
							{topic.heading}
						</h2>
					</div>

					<p className="font-mono text-[11px] text-slate-300 leading-relaxed mb-4">
						{topic.teaser}
					</p>

					<div className="flex flex-col">
						<div className="font-mono text-[9px] uppercase tracking-[0.3em] text-slate-500 mb-2">
							side a
						</div>
						{topic.triggers.map((trigger, ti) => {
							const resolved = resolveTrigger(trigger, topic.teaser);
							if (!resolved) return null;
							return (
								<button
									key={resolved.key}
									type="button"
									onClick={(e) => resolved.navigate(e.currentTarget)}
									className="vinyl-track group flex items-baseline gap-3 py-1.5 text-left"
								>
									<span className="font-mono text-xs text-slate-500 tabular-nums">
										A{ti + 1}
									</span>
									<span className="font-semibold text-sm text-slate-100 group-hover:text-white group-hover:underline">
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
