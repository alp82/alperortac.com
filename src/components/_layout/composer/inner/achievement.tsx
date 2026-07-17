import type { InnerRenderProps } from "../types";
import { DENSITY_MAXW } from "./shared";

/*
 * Inner: achievement - "unlocked."
 *
 * A console achievement/trophy unlock is the frame: a top banner with a trophy
 * medallion, "ACHIEVEMENT UNLOCKED" eyebrow, the heading as the trophy name and
 * a tier chip, an optional rarity line ("2.3% of players have this"), then the
 * topic's REAL body seated bare below as the description, and a gamerscore foot
 * chip. All chrome text is deterministic theater - fixed strings, never
 * computed, all aria-hidden. No real-brand marks - generic console chrome only.
 * Signature toggle (params.rarity) = the rarity line; theming knob (tier)
 * recolors the medallion + banner via the `.ach-*` inline vars (--ach-metal /
 * --ach-soft - the sbb --sbb-* convention).
 */

/** tier → { metal, soft, word, pct } - medallion metal, faded wash, tier word, rarity %. */
const TIERS: Record<
	InnerRenderProps<"achievement">["params"]["tier"],
	{ metal: string; soft: string; word: string; pct: string }
> = {
	platinum: {
		metal: "#cbd5e1",
		soft: "#1a2230",
		word: "Platinum",
		pct: "2.3%",
	},
	gold: { metal: "#facc15", soft: "#2a2410", word: "Gold", pct: "8.1%" },
	bronze: { metal: "#d98b4a", soft: "#291a10", word: "Bronze", pct: "21.4%" },
};

export function AchievementCluster({
	topic,
	params,
	children,
}: InnerRenderProps<"achievement">) {
	const t = TIERS[params.tier];

	return (
		<div className={`w-full ${DENSITY_MAXW[params.density]}`}>
			<div
				className="ach relative text-left"
				style={
					{
						"--ach-metal": t.metal,
						"--ach-soft": t.soft,
					} as React.CSSProperties
				}
			>
				{/* unlock banner */}
				<div className="ach-banner relative px-6 md:px-9 py-5 flex items-center gap-4">
					<span className="ach-medallion" aria-hidden="true">
						🏆
					</span>
					<div className="min-w-0">
						<span
							className="ach-eyebrow block text-[11px] font-bold tracking-[0.22em]"
							aria-hidden="true"
						>
							ACHIEVEMENT UNLOCKED
						</span>
						<h2 className="ach-title font-bold text-2xl md:text-4xl leading-tight tracking-tight">
							{topic.heading}
						</h2>
						<div
							className="mt-1 flex flex-wrap items-center gap-2"
							aria-hidden="true"
						>
							<span className="ach-tier">{t.word}</span>
							{params.rarity && (
								<span className="ach-rarity">
									◈ {t.pct} of players have this
								</span>
							)}
						</div>
					</div>
				</div>

				{/* the topic's REAL body - seated bare below the banner */}
				<div className="relative px-6 md:px-9 py-6">{children}</div>

				{/* gamerscore foot */}
				<div
					className="ach-score relative mx-6 md:mx-9 mb-5 inline-flex items-center gap-2 text-[12px] font-bold"
					aria-hidden="true"
				>
					<span className="ach-score-g">G</span>
					<span>+100 Gamerscore</span>
				</div>
			</div>
		</div>
	);
}
