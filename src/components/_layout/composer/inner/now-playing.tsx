import type { InnerRenderProps } from "../types";
import { DENSITY_MAXW } from "./shared";

/*
 * Inner: now-playing - "on heavy rotation."
 *
 * A streaming app's now-playing screen is the frame: a "NOW PLAYING" eyebrow
 * beside a tiny animated EQ (reduced-motion safe via CSS), a square art tile
 * (themed gradient + ♪ glyph, no real art), the heading as the current track,
 * an "On heavy rotation" artist line, a scrubber with fixed times, an optional
 * shuffle/prev/play/next/repeat transport row, and the topic's REAL body
 * seated bare below as the queue. All chrome text is deterministic theater -
 * fixed strings ("2:47", "-1:23"), never computed, all aria-hidden. No
 * real-brand marks anywhere - generic player chrome only.
 * Signature toggle (params.transport) = the transport row; theming knob (skin)
 * recolors the player surface via the `.npw-*` inline vars
 * (--npw-shell / --npw-soft / --npw-ink - the sbb --sbb-* convention).
 */

/** skin → { shell, soft, ink } - player surface core, faded wash, accent ink. */
const SKINS: Record<
	InnerRenderProps<"now-playing">["params"]["skin"],
	{ shell: string; soft: string; ink: string }
> = {
	obsidian: { shell: "#16181d", soft: "#0d0e11", ink: "#1db954" },
	emerald: { shell: "#0f1f18", soft: "#091209", ink: "#34d399" },
	plum: { shell: "#1d1226", soft: "#120a18", ink: "#c084fc" },
};

export function NowPlayingCluster({
	topic,
	params,
	children,
}: InnerRenderProps<"now-playing">) {
	const s = SKINS[params.skin];

	return (
		<div className={`w-full ${DENSITY_MAXW[params.density]}`}>
			<div
				className="npw relative text-left"
				style={
					{
						"--npw-shell": s.shell,
						"--npw-soft": s.soft,
						"--npw-ink": s.ink,
					} as React.CSSProperties
				}
			>
				{/* eyebrow + EQ bars */}
				<div
					className="relative px-6 md:px-9 pt-5 flex items-center justify-between"
					aria-hidden="true"
				>
					<span className="npw-eyebrow text-[10px] font-extrabold tracking-[0.24em]">
						NOW PLAYING
					</span>
					<span className="npw-eq inline-flex items-end gap-[3px]">
						<span className="npw-eq-bar" />
						<span className="npw-eq-bar" />
						<span className="npw-eq-bar" />
					</span>
				</div>

				{/* art tile + track title */}
				<div className="relative px-6 md:px-9 pt-5 flex items-center gap-5">
					<span className="npw-art shrink-0" aria-hidden="true">
						♪
					</span>
					<div className="min-w-0">
						<h2 className="npw-title font-bold text-3xl md:text-5xl leading-none tracking-tight">
							{topic.heading}
						</h2>
						<p
							className="npw-artist mt-2 text-[12px] font-semibold tracking-[0.08em]"
							aria-hidden="true"
						>
							On heavy rotation · since 1998
						</p>
					</div>
				</div>

				{/* scrubber - fixed times, pure theater */}
				<div className="relative px-6 md:px-9 pt-5" aria-hidden="true">
					<div className="npw-scrub">
						<span className="npw-scrub-fill" />
						<span className="npw-scrub-dot" />
					</div>
					<div className="npw-times mt-1.5 flex justify-between text-[10px] font-semibold">
						<span>2:47</span>
						<span>-1:23</span>
					</div>
				</div>

				{/* transport row - decorative spans, not buttons */}
				{params.transport && (
					<div
						className="relative px-6 md:px-9 pt-3 flex items-center justify-center gap-6"
						aria-hidden="true"
					>
						<span className="npw-ctl">⤮</span>
						<span className="npw-ctl npw-ctl--big">⏮</span>
						<span className="npw-play inline-grid place-items-center">▶</span>
						<span className="npw-ctl npw-ctl--big">⏭</span>
						<span className="npw-ctl">🔁</span>
					</div>
				)}

				{/* the topic's REAL body - seated bare as the queue */}
				<div className="relative px-6 md:px-9 py-6">{children}</div>
			</div>
		</div>
	);
}
