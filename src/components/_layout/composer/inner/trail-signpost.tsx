import { ArrowRight } from "lucide-react";
import type { InnerRenderProps } from "../types";
import { useTriggerNav } from "../useTriggerNav";
import {
	clusterTextColor,
	DENSITY_GAP,
	DENSITY_HEADING,
	DENSITY_MAXW,
	DENSITY_TEASER,
} from "./shared";

/*
 * Inner: trail-signpost
 *
 * Centered recast of the trail approach: a diamond waypoint marker tops the
 * heading, the teaser sits on a kraft note with a brown rule, and triggers are
 * wooden signpost boards. Signature motif = the waypoint diamond marker.
 */

export function TrailSignpostCluster({
	topic,
	isNight,
	lastTriggerRef,
	params,
	accent,
}: InnerRenderProps) {
	const { resolveTrigger } = useTriggerNav(lastTriggerRef);
	const headingColor = clusterTextColor(params.color, isNight);

	return (
		<div
			className={`flex flex-col items-center text-center ${DENSITY_MAXW[params.density]} ${DENSITY_GAP[params.density]}`}
		>
			<div className="flex flex-col items-center gap-3">
				{params.motif && (
					<span
						className="w-6 h-6 rotate-45 border-[3px]"
						style={{ background: accent, borderColor: "#3a2410" }}
						aria-hidden="true"
					/>
				)}
				<h2
					className={`${DENSITY_HEADING[params.density]} font-black uppercase tracking-tighter leading-[0.9] drop-shadow-[0_2px_12px_rgba(0,0,0,0.4)]`}
					style={{ color: headingColor }}
				>
					{topic.heading}
				</h2>
			</div>

			<p
				className={`${DENSITY_TEASER[params.density]} font-medium leading-relaxed text-slate-900 bg-[#faf7f1]/90 backdrop-blur-sm px-5 py-3 border-l-4 max-w-xl`}
				style={{ borderColor: "#6f4720" }}
			>
				{topic.teaser}
			</p>

			<div className="flex flex-col items-center gap-7 mt-2">
				{topic.triggers.map((trigger, ti) => {
					const resolved = resolveTrigger(trigger, topic.teaser);
					if (!resolved) return null;
					const tilt = ti % 2 === 0 ? -1.5 : 1.5;
					return (
						<button
							key={resolved.key}
							type="button"
							onClick={(e) => resolved.navigate(e.currentTarget)}
							className="signpost group relative inline-flex items-center text-left"
							style={{ transform: `rotate(${tilt}deg)` }}
						>
							<span className="signpost-post" aria-hidden="true" />
							<span className="signpost-board flex items-center gap-3 px-6 py-3.5">
								<span className="font-black uppercase tracking-tight text-amber-50 text-lg md:text-xl leading-none">
									{resolved.title}
								</span>
								<ArrowRight
									size={22}
									className="shrink-0 text-amber-100 group-hover:translate-x-1 transition-transform"
								/>
							</span>
						</button>
					);
				})}
			</div>
		</div>
	);
}
