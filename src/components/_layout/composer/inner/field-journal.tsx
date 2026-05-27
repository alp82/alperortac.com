import { ArrowUpRight } from "lucide-react";
import { flourishSrc } from "../types";
import type { InnerRenderProps } from "../types";
import { useTriggerNav } from "../useTriggerNav";
import { DENSITY_GAP } from "./shared";

/*
 * Inner: field-journal
 *
 * Centered recast: a kraft journal page card holds the handwritten heading, the
 * teaser as an italic field note, and triggers as taped specimen cards. The
 * whole cluster is the page (no full-width section frame). Signature motif =
 * the washi specimen tape on each card.
 */

const TILTS = [-2.5, 1.8, -1.2, 2.4];

export function FieldJournalCluster({
	topic,
	index,
	lastTriggerRef,
	params,
}: InnerRenderProps) {
	const { resolveTrigger } = useTriggerNav(lastTriggerRef);
	const specimen = String(index + 1).padStart(2, "0");

	return (
		<div
			className={`journal-page relative px-6 md:px-10 py-10 max-w-2xl w-full ${DENSITY_GAP[params.density]}`}
		>
			<div className="flex items-baseline justify-between gap-4 border-b-2 border-dashed border-[#b8a98c] pb-2 mb-4">
				<h2 className="journal-hand text-4xl md:text-6xl text-[#3a2410] leading-none">
					{topic.heading}
				</h2>
				<span className="font-mono text-xs uppercase tracking-widest text-[#6f4720] shrink-0">
					fig. {specimen}
				</span>
			</div>

			<p className="font-serif text-lg md:text-xl leading-relaxed text-[#43321c] italic">
				{topic.teaser}
			</p>

			<div className="flex flex-wrap justify-center gap-6 mt-8">
				{topic.triggers.map((trigger, ti) => {
					const resolved = resolveTrigger(trigger, topic.teaser);
					if (!resolved) return null;
					const tilt = TILTS[(index + ti) % TILTS.length];
					return (
						<button
							key={resolved.key}
							type="button"
							onClick={(e) => resolved.navigate(e.currentTarget)}
							className="specimen group relative w-56 text-left px-4 pt-6 pb-4 hover:-translate-y-1 transition-transform"
							style={{ transform: `rotate(${tilt}deg)` }}
						>
							{params.motif && (
								<span className="specimen-tape" aria-hidden="true" />
							)}
							<img
								src={flourishSrc(topic.id)}
								alt=""
								aria-hidden="true"
								className="w-9 h-9 mb-2 opacity-80"
								style={{ imageRendering: "pixelated" }}
							/>
							<span className="block font-black uppercase tracking-tight text-[#2a1d0e] text-lg leading-tight">
								{resolved.title}
							</span>
							<span className="mt-1 flex items-center gap-1 font-mono text-[11px] uppercase tracking-wider text-[#6f4720]">
								examine
								<ArrowUpRight
									size={13}
									className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform"
								/>
							</span>
						</button>
					);
				})}
			</div>
		</div>
	);
}
