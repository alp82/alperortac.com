import type { InnerRenderProps } from "../types";
import { DENSITY_MAXW } from "./shared";

/*
 * Inner: streaming-billboard - "featured tonight."
 *
 * A streaming app's featured-title billboard is the frame: a top chrome row
 * of category pills, the heading as tonight's featured title over a colored
 * glow wash, a match/quality badges row, a decorative Play / More Info action
 * row, the topic's REAL body seated bare below, and a thin fixed-width
 * progress strip at the foot. All chrome text is deterministic theater -
 * fixed strings ("98% Match", "#1 in Series Today"), never computed, all
 * aria-hidden. No real-brand marks anywhere - generic streaming chrome only.
 * Signature toggle (params.badges) = the badges row; theming knob (glow) =
 * the billboard wash (crimson / indigo / ember), handed to the `.sbb-*`
 * classes as --sbb-glow / --sbb-soft / --sbb-btn inline vars (the rack
 * --rack-* convention).
 */

/** glow → { glow, soft, btn } - wash core, faded wash, solid button ink. */
const GLOWS: Record<
	InnerRenderProps<"streaming-billboard">["params"]["glow"],
	{ glow: string; soft: string; btn: string }
> = {
	crimson: { glow: "#7f1d1d", soft: "#3b0a0a", btn: "#e11d48" },
	indigo: { glow: "#312e81", soft: "#141238", btn: "#6366f1" },
	ember: { glow: "#7c2d12", soft: "#331106", btn: "#ea580c" },
};

/** Fixed pill labels - generic streaming nav, no real-brand marks. */
const PILLS = ["Series", "Films", "New & Hot"];

export function StreamingBillboardCluster({
	topic,
	params,
	children,
}: InnerRenderProps<"streaming-billboard">) {
	const g = GLOWS[params.glow];

	return (
		<div className={`w-full ${DENSITY_MAXW[params.density]}`}>
			<div
				className="sbb relative text-left"
				style={
					{
						"--sbb-glow": g.glow,
						"--sbb-soft": g.soft,
						"--sbb-btn": g.btn,
					} as React.CSSProperties
				}
			>
				{/* top chrome - category pills */}
				<div
					className="sbb-nav relative px-6 md:px-9 pt-5 flex items-center gap-3 text-[11px] font-semibold tracking-[0.08em]"
					aria-hidden="true"
				>
					{PILLS.map((pill, i) => (
						<span
							key={pill}
							className={`sbb-pill ${i === 0 ? "sbb-pill--on" : ""}`}
						>
							{pill}
						</span>
					))}
				</div>

				{/* billboard zone - the heading as tonight's featured title */}
				<div className="sbb-billboard relative px-6 md:px-9 pt-8">
					<h2 className="sbb-title font-bold text-4xl md:text-6xl leading-none tracking-tight">
						{topic.heading}
					</h2>

					{params.badges && (
						<div
							className="sbb-badges relative mt-4 flex flex-wrap items-center gap-x-3 gap-y-2 text-[11px] font-semibold"
							aria-hidden="true"
						>
							<span className="sbb-match">98% Match</span>
							<span className="sbb-tag">4K</span>
							<span className="sbb-tag">2026</span>
							<span className="sbb-top">#1 in Series Today</span>
						</div>
					)}

					{/* action row - decorative spans, not buttons */}
					<div
						className="relative mt-5 flex items-center gap-3"
						aria-hidden="true"
					>
						<span className="sbb-btn-play inline-flex items-center gap-2 text-sm font-bold">
							▶ Play
						</span>
						<span className="sbb-btn-info inline-flex items-center gap-2 text-sm font-semibold">
							ⓘ More Info
						</span>
					</div>
				</div>

				{/* the topic's REAL body - seated bare below the billboard */}
				<div className="relative px-6 md:px-9 py-6">{children}</div>

				{/* progress strip - fixed width, pure theater */}
				<div
					className="sbb-progress relative mx-6 md:mx-9 mb-5"
					aria-hidden="true"
				>
					<span className="sbb-progress-fill" />
				</div>
			</div>
		</div>
	);
}
