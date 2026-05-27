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
 * Inner: minimal (DEFAULT)
 *
 * The clean cluster: styled heading + teaser + plain CTA triggers, no chrome.
 * Lets the Layer-1 stage do all the talking. Signature motif = a thin accent
 * underline beneath the heading.
 */

export function MinimalCluster({
	topic,
	isNight,
	lastTriggerRef,
	params,
	accent,
}: InnerRenderProps) {
	const { resolveTrigger } = useTriggerNav(lastTriggerRef);
	const text = clusterTextColor(params.color, isNight);
	const ctaTint = params.color === "neutral" ? "#ffffff" : accent;

	return (
		<div
			className={`flex flex-col items-center text-center ${DENSITY_MAXW[params.density]} ${DENSITY_GAP[params.density]}`}
			style={{ color: text }}
		>
			<div>
				<h2
					className={`${DENSITY_HEADING[params.density]} font-black uppercase tracking-tighter leading-[0.9] drop-shadow-[0_2px_16px_rgba(0,0,0,0.45)]`}
				>
					{topic.heading}
				</h2>
				{params.motif && (
					<span
						className="mx-auto mt-4 block h-1.5 w-20 rounded-full"
						style={{ background: accent }}
						aria-hidden="true"
					/>
				)}
			</div>
			<p
				className={`${DENSITY_TEASER[params.density]} font-medium leading-relaxed max-w-2xl mx-auto opacity-90 drop-shadow-[0_2px_8px_rgba(0,0,0,0.4)]`}
			>
				{topic.teaser}
			</p>
			<div className="flex flex-wrap items-center justify-center gap-4 mt-2">
				{topic.triggers.map((trigger) => {
					const resolved = resolveTrigger(trigger, topic.teaser);
					if (!resolved) return null;
					return (
						<button
							key={resolved.key}
							type="button"
							onClick={(e) => resolved.navigate(e.currentTarget)}
							className="cmp-cta group inline-flex items-center gap-3 px-7 py-3.5 font-black uppercase tracking-widest text-sm"
							style={{ "--cmp-cta-bg": ctaTint } as React.CSSProperties}
						>
							<span>{resolved.title}</span>
							<ArrowRight
								size={18}
								className="group-hover:translate-x-1.5 transition-transform"
							/>
						</button>
					);
				})}
			</div>
		</div>
	);
}
