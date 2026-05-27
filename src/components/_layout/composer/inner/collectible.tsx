import { Sparkles } from "lucide-react";
import { flourishSrc } from "../types";
import type { InnerRenderProps } from "../types";
import { useTriggerNav } from "../useTriggerNav";

/*
 * Inner: collectible
 *
 * Centered recast: a single ornate portrait trading card centered on the stage
 * — name banner, accent illustration zone with the flourish, italic flavor
 * text, and ability-button triggers. Deliberately precious. Signature motif =
 * the Sparkles foil accent in the art zone.
 */

export function CollectibleCluster({
	topic,
	index,
	lastTriggerRef,
	params,
	accent,
}: InnerRenderProps) {
	const { resolveTrigger } = useTriggerNav(lastTriggerRef);
	// density nudges card width.
	const width =
		params.density === "cozy"
			? "w-72"
			: params.density === "roomy"
				? "w-[26rem]"
				: "w-80 md:w-96";

	return (
		<div className={`collectible-card relative ${width}`}>
			<div className="collectible-banner flex items-center justify-between gap-2 px-4 py-2">
				<h2 className="font-black uppercase tracking-tight text-xl text-slate-900 leading-none truncate">
					{topic.heading}
				</h2>
				<span className="font-mono text-[10px] text-slate-700 shrink-0">
					{String(index + 1).padStart(2, "0")}/08
				</span>
			</div>

			<div
				className="collectible-art relative flex items-center justify-center"
				style={{
					background: `radial-gradient(circle at 50% 35%, ${accent} 0%, color-mix(in srgb, ${accent} 40%, #faf7f1) 100%)`,
				}}
			>
				<img
					src={flourishSrc(topic.id)}
					alt=""
					aria-hidden="true"
					className="w-24 h-24 drop-shadow"
					style={{ imageRendering: "pixelated" }}
				/>
				{params.motif && (
					<Sparkles
						size={18}
						className="absolute top-2 right-2 text-slate-900/50"
					/>
				)}
			</div>

			<div className="collectible-flavor mx-3 my-3 px-3 py-2">
				<p className="font-serif italic text-sm leading-snug text-slate-800">
					{topic.teaser}
				</p>
			</div>

			<div className="px-3 pb-4 flex flex-col gap-2">
				{topic.triggers.map((trigger) => {
					const resolved = resolveTrigger(trigger, topic.teaser);
					if (!resolved) return null;
					const { Icon } = resolved;
					return (
						<button
							key={resolved.key}
							type="button"
							onClick={(e) => resolved.navigate(e.currentTarget)}
							className="collectible-ability group flex items-center gap-3 w-full px-3 py-2.5 text-left"
						>
							<span
								className="flex items-center justify-center w-8 h-8 shrink-0 border-2 border-slate-900"
								style={{ background: accent }}
							>
								<Icon size={16} className="text-slate-900" />
							</span>
							<span className="flex flex-col min-w-0">
								<span className="font-black uppercase tracking-tight text-sm leading-none text-slate-900 truncate">
									{resolved.title}
								</span>
								<span className="text-[10px] font-mono uppercase tracking-wider text-slate-600 group-hover:text-slate-900">
									activate ability
								</span>
							</span>
						</button>
					);
				})}
			</div>
		</div>
	);
}
