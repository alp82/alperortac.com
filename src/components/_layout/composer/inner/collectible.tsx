import { Sparkles } from "lucide-react";
import type { InnerRenderProps } from "../types";
import { DENSITY_MAXW } from "./shared";

/*
 * Inner: collectible — "trading card."
 *
 * A WIDE ornate trading-card panel: the gilt rarity border frames a name banner
 * (card title + a holo type/rarity line as chrome) over a thin holo accent rail,
 * then the topic's REAL body (the shared light plate) seated in the card's body
 * as its flavor area. Widened from the old narrow portrait card to hold the
 * plate. Keeps the collectible identity via the corner rarity-gem stat. Signature
 * motif (params.motif) = the Sparkles foil accent on the gem.
 */

export function CollectibleCluster({
	topic,
	index,
	params,
	accent,
	children,
}: InnerRenderProps) {
	const num = String(index + 1).padStart(2, "0");

	return (
		<div className={`w-full ${DENSITY_MAXW[params.density]}`}>
			<div className="collectible-card relative">
				<div className="collectible-banner flex items-center justify-between gap-3 px-4 py-2.5">
					<h2 className="font-black uppercase tracking-tight text-2xl md:text-3xl text-slate-900 leading-none truncate">
						{topic.heading}
					</h2>
					<span className="relative shrink-0 inline-flex items-center justify-center">
						<span
							className="w-7 h-7 rounded-full border-2 border-slate-900 shadow-[2px_2px_0_0_#0f172a]"
							style={{ background: accent }}
							aria-hidden="true"
						/>
						{params.motif && (
							<Sparkles
								size={14}
								className="absolute text-slate-900/70"
								aria-hidden="true"
							/>
						)}
					</span>
				</div>

				{/* holo type/rarity line as chrome */}
				<div
					className="mt-2 flex items-center justify-between px-1 font-mono text-[10px] uppercase tracking-[0.3em] text-slate-700"
					style={{
						borderTop: `2px solid ${accent}`,
						borderBottom: "1px solid #c9a14a",
					}}
				>
					<span className="py-1">★ rare · {topic.id}</span>
					<span className="py-1">no. {num}/08</span>
				</div>

				{/* card body: the light content plate as the flavor area */}
				<div className="collectible-flavor mx-1.5 mb-1.5 mt-2 px-4 py-3 text-left">
					{children}
				</div>
			</div>
		</div>
	);
}
