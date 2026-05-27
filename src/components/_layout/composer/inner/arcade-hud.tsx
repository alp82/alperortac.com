import type { InnerRenderProps } from "../types";
import { useTriggerNav } from "../useTriggerNav";
import { DENSITY_MAXW } from "./shared";

/*
 * Inner: arcade-hud
 *
 * A retro game HUD: a pixel-edged panel with a SCORE readout and an HP bar up
 * top, the heading in chunky pixel type, the teaser as a status line, and
 * triggers as PRESS-START menu rows that blink a ► selector on hover. Signature
 * motif = CRT scanlines over the whole panel.
 */

export function ArcadeHudCluster({
	topic,
	index,
	lastTriggerRef,
	params,
	accent,
}: InnerRenderProps) {
	const { resolveTrigger } = useTriggerNav(lastTriggerRef);
	const score = String((index + 1) * 1337).padStart(6, "0");

	return (
		<div className={`w-full ${DENSITY_MAXW[params.density]}`}>
			<div
				className={`arcade relative px-6 md:px-9 py-8 text-left ${params.motif ? "arcade-scanlines" : ""}`}
				style={{ "--arcade-accent": accent } as React.CSSProperties}
			>
				{/* HUD top row */}
				<div className="flex items-center justify-between gap-4 mb-5 font-mono">
					<span className="text-[10px] uppercase tracking-[0.2em] text-emerald-300">
						score <span className="text-emerald-100">{score}</span>
					</span>
					<span className="flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-emerald-300">
						hp
						<span className="arcade-hp" aria-hidden="true">
							<span
								className="arcade-hp-fill"
								style={{ width: `${70 - index * 6}%`, background: accent }}
							/>
						</span>
					</span>
				</div>

				<h2 className="arcade-title font-black uppercase tracking-tight text-3xl md:text-5xl leading-none">
					{topic.heading}
				</h2>
				<p className="font-mono text-[11px] md:text-xs uppercase tracking-wide text-emerald-200/80 leading-relaxed mt-3">
					&gt; {topic.teaser}
				</p>

				<div className="mt-6 flex flex-col gap-2">
					{topic.triggers.map((trigger) => {
						const resolved = resolveTrigger(trigger, topic.teaser);
						if (!resolved) return null;
						return (
							<button
								key={resolved.key}
								type="button"
								onClick={(e) => resolved.navigate(e.currentTarget)}
								className="arcade-row group inline-flex items-center gap-3 px-2 py-1.5 text-left font-mono"
							>
								<span className="arcade-cursor" aria-hidden="true">
									►
								</span>
								<span className="text-sm md:text-base uppercase tracking-wide text-emerald-50 group-hover:text-white">
									{resolved.title}
								</span>
								<span className="text-[9px] uppercase tracking-[0.2em] text-emerald-400/70">
									press start
								</span>
							</button>
						);
					})}
				</div>
			</div>
		</div>
	);
}
