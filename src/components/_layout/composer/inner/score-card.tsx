import type { InnerRenderProps } from "../types";
import { DENSITY_MAXW } from "./shared";

/*
 * Inner: score-card - "the aggregator verdict."
 *
 * A review-aggregator card is the frame: a header row with an SVG critic
 * score ring + CRITICS label, an audience score cell, and the heading as the
 * reviewed title; the topic's REAL body seated clear in the middle as the
 * review; a one-line critics-consensus footer with fixed review-count
 * metadata. Card paper/ink are fixed constants handed to the `.score-*`
 * classes as --score-paper / --score-ink inline vars (the pull-request /
 * status-page carve-out: the card is VERDICT-driven, not stock-driven).
 * Signature toggle (params.consensus) = the consensus footer; theming knob
 * (verdict) = the reported verdict (acclaimed / fresh / mixed) which
 * recolors the ring and badge via --score-tone (the status-page STATUS
 * convention). All figures are fixed decorative constants - the ring's
 * dasharray is computed from the record's critic value at module scope,
 * deterministic and SSR-stable.
 */

/* Fixed card constants - identical across all three verdicts by design. */
const SCORE_PAPER = "#ffffff";
const SCORE_INK = "#0f172a";

/** verdict → { critic, audience, tone, blurb } - scores, state color, consensus. */
const VERDICTS: Record<
	InnerRenderProps<"score-card">["params"]["verdict"],
	{ critic: number; audience: number; tone: string; blurb: string }
> = {
	acclaimed: {
		critic: 94,
		audience: 91,
		tone: "#059669",
		blurb:
			"A rare season where every thread pays off - critics call it appointment viewing.",
	},
	fresh: {
		critic: 87,
		audience: 84,
		tone: "#65a30d",
		blurb:
			"Confident, warm and better than it needs to be - an easy recommendation.",
	},
	mixed: {
		critic: 58,
		audience: 66,
		tone: "#d97706",
		blurb:
			"Flashes of brilliance undercut by an uneven back half, critics say.",
	},
};

/* Ring geometry - one circle, dasharray derived from each verdict's critic
 * score at module scope (deterministic theater, no runtime math surprises). */
const RING_R = 26;
const RING_C = 2 * Math.PI * RING_R;
const RING_DASH: Record<keyof typeof VERDICTS, string> = {
	acclaimed: `${(VERDICTS.acclaimed.critic / 100) * RING_C} ${RING_C}`,
	fresh: `${(VERDICTS.fresh.critic / 100) * RING_C} ${RING_C}`,
	mixed: `${(VERDICTS.mixed.critic / 100) * RING_C} ${RING_C}`,
};

export function ScoreCardCluster({
	topic,
	params,
	children,
}: InnerRenderProps<"score-card">) {
	const v = VERDICTS[params.verdict];

	return (
		<div className={`w-full ${DENSITY_MAXW[params.density]}`}>
			<div
				className="score-card text-left"
				style={
					{
						"--score-paper": SCORE_PAPER,
						"--score-ink": SCORE_INK,
						"--score-tone": v.tone,
						backgroundColor: SCORE_PAPER,
						color: SCORE_INK,
					} as React.CSSProperties
				}
			>
				{/* header - critic ring, audience cell, the reviewed title */}
				<div className="score-head px-6 md:px-8 pt-5 pb-4">
					<div className="flex flex-wrap items-center gap-x-5 gap-y-3">
						<span
							className="score-ring-cell inline-flex items-center gap-2"
							aria-hidden="true"
						>
							<svg
								className="score-ring"
								width="64"
								height="64"
								viewBox="0 0 64 64"
								role="presentation"
							>
								<circle
									className="score-ring-track"
									cx="32"
									cy="32"
									r={RING_R}
									fill="none"
									strokeWidth="5"
								/>
								<circle
									className="score-ring-arc"
									cx="32"
									cy="32"
									r={RING_R}
									fill="none"
									strokeWidth="5"
									strokeLinecap="round"
									strokeDasharray={RING_DASH[params.verdict]}
									transform="rotate(-90 32 32)"
								/>
								<text
									className="score-ring-num"
									x="32"
									y="37"
									textAnchor="middle"
								>
									{v.critic}
								</text>
							</svg>
							<span className="score-label text-[10px] font-bold uppercase tracking-[0.2em]">
								Critics
							</span>
						</span>
						<span
							className="score-aud inline-flex items-baseline gap-2"
							aria-hidden="true"
						>
							<span className="score-aud-num font-bold text-2xl">
								{v.audience}%
							</span>
							<span className="score-label text-[10px] font-bold uppercase tracking-[0.2em]">
								Audience
							</span>
						</span>
					</div>
					<h2 className="mt-3 font-bold text-3xl md:text-5xl leading-tight">
						{topic.heading}
					</h2>
				</div>

				{/* the topic's REAL body - the review itself, clear of all chrome */}
				<div className="px-6 md:px-8 py-6">{children}</div>

				{/* consensus footer - one-line blurb + fixed review counts */}
				{params.consensus && (
					<div className="score-foot px-6 md:px-8 py-4" aria-hidden="true">
						<p className="score-blurb text-sm italic">{v.blurb}</p>
						<p className="score-meta mt-1 font-mono text-xs">
							212 reviews · 5,000+ ratings
						</p>
					</div>
				)}
			</div>
		</div>
	);
}
