import { Sparkles } from "lucide-react";
import { TOPICS } from "../../../../data/topics";
import type { InnerRenderProps } from "../types";
import { DENSITY_MAXW } from "./shared";

/*
 * Inner: collectible - "trading card."
 *
 * A WIDE ornate trading-card panel: the rarity border frames a name banner
 * (card title + a holo type/rarity line as chrome) over a thin holo accent rail,
 * then the topic's REAL body (the shared light plate) seated in the card's body
 * as its flavor area. Widened from the old narrow portrait card to hold the
 * plate. Keeps the collectible identity via the corner rarity-gem stat. Signature
 * toggle (params.gem) = the Sparkles foil accent on the gem; `rarity` recolors
 * the card border + rarity line inline (and names the rarity word).
 */

/** rarity → the rarity word + the frame/rarity-line border color (inline). */
const RARITY: Record<
	InnerRenderProps<"collectible">["params"]["rarity"],
	{ word: string; border: string }
> = {
	common: { word: "common", border: "#9ca3af" },
	rare: { word: "rare", border: "#c9a14a" },
	legendary: { word: "legendary", border: "#a855f7" },
};

const TOTAL = String(TOPICS.length).padStart(2, "0");

export function CollectibleCluster({
	topic,
	index,
	params,
	accent,
	children,
}: InnerRenderProps<"collectible">) {
	const num = String(index + 1).padStart(2, "0");
	const rarity = RARITY[params.rarity];
	const isLegendary = params.rarity === "legendary";

	return (
		<div className={`w-full ${DENSITY_MAXW[params.density]}`}>
			<div
				className="collectible-card relative"
				style={{
					borderColor: rarity.border,
					...(isLegendary
						? {
								boxShadow:
									"0 0 0 1px rgba(168,85,247,0.5), 0 0 18px -4px rgba(168,85,247,0.6)",
							}
						: null),
				}}
			>
				{/* legendary holo strip - a thin iridescent gradient along the top */}
				{isLegendary && (
					<span
						className="absolute left-0 right-0 top-0 h-1"
						aria-hidden="true"
						style={{
							background:
								"linear-gradient(90deg, #a855f7, #22d3ee, #f472b6, #a855f7)",
						}}
					/>
				)}

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
						{params.gem && (
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
						borderTop: `2px solid ${rarity.border}`,
						borderBottom: `1px solid ${rarity.border}`,
					}}
				>
					<span className="py-1">
						★ {rarity.word} · {topic.id}
					</span>
					<span className="py-1">
						no. {num}/{TOTAL}
					</span>
				</div>

				{/* card body: the light content plate as the flavor area */}
				<div className="collectible-flavor mx-1.5 mb-1.5 mt-2 px-4 py-3 text-left">
					{children}
				</div>
			</div>
		</div>
	);
}
