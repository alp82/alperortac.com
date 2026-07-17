import type { InnerRenderProps } from "../types";
import { DENSITY_MAXW } from "./shared";

/*
 * Inner: trailer-player - "paused trailer."
 *
 * A modern video player, paused mid-trailer, is the frame: a rounded player
 * viewport with an OFFICIAL TRAILER eyebrow and the heading as the title
 * overlay at the top, the topic's REAL body as the frozen frame's content
 * (never overlaid - no big play ring over the prose; the play glyph lives in
 * the bar), and a transport bar with a scrub track (lighter buffered range,
 * played range + playhead dot), a mono timestamp and right-side glyphs. The
 * viewport is content-height chrome - it grows with the prose, never a
 * locked aspect ratio + overflow crop. All figures are fixed decorative
 * constants (buffered 71%, played 37%, "1:07 / 2:54") - never computed, no
 * Date.now/Math.random. Signature toggle (params.controls) = the transport
 * bar; theming knob (skin) = the player shell (onyx / cinema / slate),
 * handed to the `.tplr-*` classes as --tplr-shell / --tplr-bar / --tplr-ink
 * inline vars (the rack --rack-* convention).
 */

/** skin → { shell, bar, ink } - viewport surface, transport bar, label ink. */
const SKINS: Record<
	InnerRenderProps<"trailer-player">["params"]["skin"],
	{ shell: string; bar: string; ink: string }
> = {
	onyx: { shell: "#0b0e13", bar: "#141922", ink: "#e2e8f0" },
	cinema: { shell: "#170d0d", bar: "#241416", ink: "#f4e4e0" },
	slate: { shell: "#10161d", bar: "#1a232e", ink: "#dde7f1" },
};

/* Fixed transport figures - decorative constants, never computed. */
const BUFFERED_PCT = 71;
const PLAYED_PCT = 37;
const TIMESTAMP = "1:07 / 2:54";

export function TrailerPlayerCluster({
	topic,
	params,
	children,
}: InnerRenderProps<"trailer-player">) {
	const s = SKINS[params.skin];

	return (
		<div className={`w-full ${DENSITY_MAXW[params.density]}`}>
			<div
				className="tplr relative text-left"
				style={
					{
						"--tplr-shell": s.shell,
						"--tplr-bar": s.bar,
						"--tplr-ink": s.ink,
					} as React.CSSProperties
				}
			>
				{/* title overlay row at the viewport top */}
				<div className="tplr-head relative px-6 md:px-9 pt-5">
					<span
						className="tplr-eyebrow block text-[10px] font-semibold uppercase tracking-[0.4em]"
						aria-hidden="true"
					>
						Official Trailer
					</span>
					<h2 className="tplr-title mt-2 font-bold text-3xl md:text-5xl leading-tight tracking-tight">
						{topic.heading}
					</h2>
				</div>

				{/* the topic's REAL body - the paused frame's content, never overlaid */}
				<div className="relative px-6 md:px-9 py-6">{children}</div>

				{/* transport bar - play, scrub track, timestamp, right glyphs */}
				{params.controls && (
					<div
						className="tplr-transport relative px-4 md:px-6 py-3 flex items-center gap-3 md:gap-4"
						aria-hidden="true"
					>
						<span className="tplr-play text-sm leading-none">▶</span>
						<span className="tplr-track relative flex-1">
							<span
								className="tplr-buffered"
								style={{ width: `${BUFFERED_PCT}%` }}
							/>
							<span
								className="tplr-played"
								style={{ width: `${PLAYED_PCT}%` }}
							/>
							<span
								className="tplr-playhead"
								style={{ left: `${PLAYED_PCT}%` }}
							/>
						</span>
						<span className="tplr-time font-mono text-[11px] whitespace-nowrap">
							{TIMESTAMP}
						</span>
						<span className="tplr-glyphs hidden md:flex items-center gap-3 text-[11px]">
							<span>🔊</span>
							<span className="tplr-cc px-1 font-mono font-bold">CC</span>
							<span>⚙</span>
							<span>⛶</span>
						</span>
					</div>
				)}
			</div>
		</div>
	);
}
