import { ArrowRight } from "lucide-react";
import type { InnerRenderProps } from "../types";
import { useTriggerNav } from "../useTriggerNav";
import { clusterTextColor, DENSITY_MAXW } from "./shared";

/*
 * Inner: museum
 *
 * Centered recast of the museum placard: restrained serif type inside a thin
 * frame, an accent tick above the exhibit number, the teaser as an italic
 * caption, triggers as quiet "view" plates. Calm restraint against the loud
 * landscape. Signature motif = the thin double frame around the cluster.
 */

export function MuseumCluster({
	topic,
	index,
	isNight,
	lastTriggerRef,
	params,
	accent,
}: InnerRenderProps) {
	const { resolveTrigger } = useTriggerNav(lastTriggerRef);
	const textColor = clusterTextColor(params.color, isNight);
	const frameColor = isNight ? "rgba(248,250,252,0.6)" : "rgba(15,23,42,0.5)";

	return (
		<div
			className={`relative w-full text-center px-8 md:px-12 py-12 ${DENSITY_MAXW[params.density]} ${params.motif ? "museum-frame" : ""}`}
			style={{ color: textColor, borderColor: frameColor }}
		>
			<span
				className="block mx-auto mb-6 h-1 w-12"
				style={{ background: accent }}
				aria-hidden="true"
			/>
			<div className="font-serif text-[11px] uppercase tracking-[0.4em] mb-4 opacity-60">
				Exhibit {String(index + 1).padStart(2, "0")}
			</div>
			<h2 className="font-serif text-4xl md:text-6xl font-semibold tracking-tight">
				{topic.heading}
			</h2>
			<p className="font-serif italic text-base md:text-xl leading-relaxed mt-5 mx-auto max-w-md opacity-85">
				{topic.teaser}
			</p>

			<div className="flex flex-col items-center gap-3 mt-9">
				{topic.triggers.map((trigger) => {
					const resolved = resolveTrigger(trigger, topic.teaser);
					if (!resolved) return null;
					return (
						<button
							key={resolved.key}
							type="button"
							onClick={(e) => resolved.navigate(e.currentTarget)}
							className="museum-plate group inline-flex items-center gap-2 px-5 py-2.5 font-serif text-sm tracking-wide transition-colors"
							style={{ color: textColor, borderColor: frameColor }}
						>
							<span>View {resolved.title}</span>
							<ArrowRight
								size={15}
								className="group-hover:translate-x-1 transition-transform"
							/>
						</button>
					);
				})}
			</div>
		</div>
	);
}
