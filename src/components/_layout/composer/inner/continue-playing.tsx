import type { InnerRenderProps } from "../types";
import { DENSITY_MAXW } from "./shared";

/*
 * Inner: continue-playing - "pick up where you left off."
 *
 * A current-gen console home dashboard tile is the frame: a large focused card
 * with a "CONTINUE PLAYING" eyebrow, the heading as the game title, a progress
 * bar with a fixed percentage, the topic's REAL body seated bare as the blurb,
 * and a Resume / Add-to-library action row. An optional spotlight wash lifts the
 * tile as the "focused" dashboard card. All chrome text is deterministic theater
 * - fixed strings ("68%"), never computed, all aria-hidden. No real-brand marks
 * - generic dashboard chrome only. Signature toggle (params.spotlight) = the
 * focus glow; theming knob (console) recolors the tile via the `.cpl-*` inline
 * vars (--cpl-glow / --cpl-soft / --cpl-btn - the sbb --sbb-* convention).
 */

/** console → { glow, soft, btn } - focus-glow core, tile wash, resume-button ink. */
const CONSOLES: Record<
	InnerRenderProps<"continue-playing">["params"]["console"],
	{ glow: string; soft: string; btn: string }
> = {
	onyx: { glow: "#334155", soft: "#0b0f16", btn: "#e2e8f0" },
	azure: { glow: "#1e3a8a", soft: "#0a1020", btn: "#38bdf8" },
	violet: { glow: "#4c1d95", soft: "#140a24", btn: "#a78bfa" },
};

export function ContinuePlayingCluster({
	topic,
	params,
	children,
}: InnerRenderProps<"continue-playing">) {
	const c = CONSOLES[params.console];

	return (
		<div className={`w-full ${DENSITY_MAXW[params.density]}`}>
			<div
				className={`cpl relative text-left ${params.spotlight ? "cpl--spot" : ""}`}
				style={
					{
						"--cpl-glow": c.glow,
						"--cpl-soft": c.soft,
						"--cpl-btn": c.btn,
					} as React.CSSProperties
				}
			>
				<div className="relative px-6 md:px-9 pt-6">
					<span
						className="cpl-eyebrow block text-[11px] font-bold tracking-[0.22em]"
						aria-hidden="true"
					>
						CONTINUE PLAYING
					</span>
					<h2 className="cpl-title mt-2 font-bold text-4xl md:text-6xl leading-none tracking-tight">
						{topic.heading}
					</h2>

					{/* progress bar - fixed percentage */}
					<div className="cpl-progress relative mt-4" aria-hidden="true">
						<span className="cpl-progress-fill" />
						<span className="cpl-progress-pct">68%</span>
					</div>
				</div>

				{/* the topic's REAL body - seated bare as the blurb */}
				<div className="relative px-6 md:px-9 py-6">{children}</div>

				{/* action row - decorative spans, not buttons */}
				<div
					className="relative px-6 md:px-9 pb-6 flex items-center gap-3"
					aria-hidden="true"
				>
					<span className="cpl-btn-resume inline-flex items-center gap-2 text-sm font-bold">
						▶ Resume
					</span>
					<span className="cpl-btn-add inline-flex items-center gap-2 text-sm font-semibold">
						＋ Add to library
					</span>
				</div>
			</div>
		</div>
	);
}
