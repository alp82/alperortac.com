import type { InnerRenderProps } from "../types";
import { DENSITY_MAXW } from "./shared";

/*
 * Inner: mixer - "front of house."
 *
 * A mixing desk is the frame: a strip of six channel faders across the top
 * (fixed fader positions + channel labels KCK/BAS/GTR/SYN/VOX/MST - a hand-set
 * mix, never computed), optional VU meter columns behind each fader, the
 * heading below as the session name with a "LIVE MIX · 48 kHz" meta line, and
 * the topic's REAL body seated bare as the session notes. All chrome is
 * deterministic theater, all aria-hidden. No real-brand marks - generic
 * console chrome only.
 * Signature toggle (params.meters) = the VU columns; theming knob (desk)
 * recolors the console surface via the `.mxr-*` inline vars
 * (--mxr-shell / --mxr-soft / --mxr-ink - the sbb --sbb-* convention).
 */

/** desk → { shell, soft, ink } - console surface core, faded wash, accent ink. */
const DESKS: Record<
	InnerRenderProps<"mixer">["params"]["desk"],
	{ shell: string; soft: string; ink: string }
> = {
	graphite: { shell: "#1c1e22", soft: "#121316", ink: "#fbbf24" },
	midnight: { shell: "#151a2b", soft: "#0d101c", ink: "#38bdf8" },
	sand: { shell: "#2b2118", soft: "#1a140e", ink: "#fb923c" },
};

/*
 * The fixed mix: per channel a label, a fader position (% up the slot) and a
 * VU level (% of the meter lit). Hand-set so the desk reads like a real
 * balanced mix - vocals riding high, master trimmed.
 */
const CHANNELS = [
	{ label: "KCK", fader: 62, vu: 78 },
	{ label: "BAS", fader: 55, vu: 64 },
	{ label: "GTR", fader: 70, vu: 86 },
	{ label: "SYN", fader: 48, vu: 52 },
	{ label: "VOX", fader: 76, vu: 90 },
	{ label: "MST", fader: 58, vu: 70 },
];

export function MixerCluster({
	topic,
	params,
	children,
}: InnerRenderProps<"mixer">) {
	const d = DESKS[params.desk];

	return (
		<div className={`w-full ${DENSITY_MAXW[params.density]}`}>
			<div
				className="mxr relative text-left"
				style={
					{
						"--mxr-shell": d.shell,
						"--mxr-soft": d.soft,
						"--mxr-ink": d.ink,
					} as React.CSSProperties
				}
			>
				{/* channel strip row */}
				<div
					className="mxr-desk relative px-6 md:px-9 pt-5 pb-4 flex items-end justify-between gap-2"
					aria-hidden="true"
				>
					{CHANNELS.map((ch) => (
						<span key={ch.label} className="mxr-strip">
							{params.meters && (
								<span className="mxr-vu">
									<span
										className="mxr-vu-fill"
										style={{ height: `${ch.vu}%` }}
									/>
								</span>
							)}
							<span className="mxr-slot">
								<span
									className="mxr-fader"
									style={{ bottom: `${ch.fader}%` }}
								/>
							</span>
							<span className="mxr-label">{ch.label}</span>
						</span>
					))}
				</div>

				{/* session name */}
				<div className="relative px-6 md:px-9 pt-4">
					<h2 className="mxr-title font-bold text-3xl md:text-5xl leading-none tracking-tight">
						{topic.heading}
					</h2>
					<p
						className="mxr-meta mt-2 text-[11px] font-semibold tracking-[0.14em]"
						aria-hidden="true"
					>
						LIVE MIX · 48 kHz · no clipping yet
					</p>
				</div>

				{/* the topic's REAL body - seated bare as the session notes */}
				<div className="relative px-6 md:px-9 py-6">{children}</div>
			</div>
		</div>
	);
}
