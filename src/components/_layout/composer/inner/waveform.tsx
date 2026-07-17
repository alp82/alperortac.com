import type { InnerRenderProps } from "../types";
import { DENSITY_MAXW } from "./shared";

/*
 * Inner: waveform - "press play."
 *
 * An audio-platform track page is the frame: a round play button beside the
 * heading as the track title + an "uploaded 20 years ago" meta line, a
 * deterministic waveform strip (a FIXED bar-height pattern, played portion in
 * the tint ink, the rest muted), optional start/end timestamps, and the
 * topic's REAL body seated below as the track description. All chrome text is
 * deterministic theater - fixed strings ("1:04", "3:58"), never computed, all
 * aria-hidden. No real-brand marks anywhere - generic audio-platform chrome.
 * Signature toggle (params.timestamps) = the time labels; theming knob (tint)
 * recolors the played wave + play button via the `.wvf-*` inline vars
 * (--wvf-ink / --wvf-deep - the sbb --sbb-* convention).
 */

/** tint → { ink, deep } - played-wave / play-button ink + its darker edge. */
const TINTS: Record<
	InnerRenderProps<"waveform">["params"]["tint"],
	{ ink: string; deep: string }
> = {
	sunset: { ink: "#f97316", deep: "#c2410c" },
	ocean: { ink: "#0ea5e9", deep: "#0369a1" },
	lilac: { ink: "#a78bfa", deep: "#7c3aed" },
};

/*
 * Fixed waveform silhouette - 44 bar heights in %, hand-shaped (quiet intro,
 * two peaks, a breakdown, loud outro) so the wave reads musical without any
 * randomness; the split index marks the played/unplayed boundary.
 */
const BARS = [
	18, 26, 22, 34, 30, 46, 38, 58, 50, 66, 72, 60, 82, 74, 90, 68, 84, 58, 70,
	44, 36, 28, 40, 32, 52, 62, 78, 88, 96, 80, 92, 70, 84, 64, 76, 54, 66, 46,
	58, 38, 30, 42, 26, 20,
];
const PLAYED = 17;

export function WaveformCluster({
	topic,
	params,
	children,
}: InnerRenderProps<"waveform">) {
	const t = TINTS[params.tint];

	return (
		<div className={`w-full ${DENSITY_MAXW[params.density]}`}>
			<div
				className="wvf relative text-left"
				style={
					{
						"--wvf-ink": t.ink,
						"--wvf-deep": t.deep,
					} as React.CSSProperties
				}
			>
				{/* play button + title */}
				<div className="relative px-6 md:px-9 pt-6 flex items-center gap-5">
					<span
						className="wvf-play shrink-0 inline-grid place-items-center"
						aria-hidden="true"
					>
						▶
					</span>
					<div className="min-w-0">
						<h2 className="wvf-title font-bold text-3xl md:text-5xl leading-none tracking-tight">
							{topic.heading}
						</h2>
						<p
							className="wvf-meta mt-2 text-[11px] font-semibold tracking-[0.08em]"
							aria-hidden="true"
						>
							Alper · uploaded 20 years ago · plays it anyway
						</p>
					</div>
				</div>

				{/* waveform strip - fixed silhouette, played portion tinted */}
				<div className="relative px-6 md:px-9 pt-6" aria-hidden="true">
					<div className="wvf-wave flex items-end gap-[2px]">
						{BARS.map((h, i) => (
							<span
								// biome-ignore lint/suspicious/noArrayIndexKey: static fixed-order silhouette
								key={i}
								className={`wvf-bar ${i < PLAYED ? "wvf-bar--played" : ""}`}
								style={{ height: `${h}%` }}
							/>
						))}
					</div>
					{params.timestamps && (
						<div className="wvf-times mt-1.5 flex justify-between text-[10px] font-semibold">
							<span className="wvf-time--played">1:04</span>
							<span>3:58</span>
						</div>
					)}
				</div>

				{/* the topic's REAL body - seated below as the track description */}
				<div className="relative px-6 md:px-9 py-6">{children}</div>
			</div>
		</div>
	);
}
