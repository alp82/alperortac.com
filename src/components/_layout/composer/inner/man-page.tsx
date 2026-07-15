import type { InnerRenderProps } from "../types";
import { DENSITY_MAXW } from "./shared";

/*
 * Inner: man-page
 *
 * A man(1) page on dot-matrix printout stock (delicate chrome, teletype
 * lineage): the exact mono header line `<HEADING>(1)   User Commands
 * <HEADING>(1)` with a thin accent rule under it (the frame's ONLY accent -
 * everything else stays ink-and-paper retro), a NAME eyebrow over the heading
 * big in mono bold as the name line, a DESCRIPTION eyebrow ABOVE (never over)
 * the topic's REAL body, and the exact footer line. Signature toggle
 * (params.tractor) = the sprocket-hole edge strips down both sides; theming
 * knob (stock) = the printout's paper + ink (white / greenbar / aged), handed
 * to the `.manpage-*` classes as --mp-paper / --mp-ink inline vars (the
 * timecard --tc-* convention). Only the greenbar stock renders the
 * alternating-band overlay.
 */

/* stock → { paper, ink } - printout stock + printed ink. */
const STOCK: Record<
	InnerRenderProps<"man-page">["params"]["stock"],
	{ paper: string; ink: string }
> = {
	white: { paper: "#fbfbf7", ink: "#1c2321" },
	greenbar: { paper: "#f2f7ec", ink: "#25381f" },
	aged: { paper: "#efe4c9", ink: "#4a3a1f" },
};

export function ManPageCluster({
	topic,
	params,
	accent,
	children,
}: InnerRenderProps<"man-page">) {
	const s = STOCK[params.stock];
	const name = `${topic.heading.toUpperCase()}(1)`;

	return (
		<div className={`w-full ${DENSITY_MAXW[params.density]}`}>
			<div
				className="manpage-sheet relative overflow-hidden text-left"
				style={
					{
						"--mp-paper": s.paper,
						"--mp-ink": s.ink,
						backgroundColor: s.paper,
						color: s.ink,
					} as React.CSSProperties
				}
			>
				{/* greenbar banding - the alternating pale bands, greenbar stock only */}
				{params.stock === "greenbar" && (
					<span className="manpage-greenbar" aria-hidden="true" />
				)}

				{/* sprocket-hole edge strips - both sides, gated ONLY by tractor */}
				{params.tractor && (
					<>
						<span className="manpage-tractor-left" aria-hidden="true" />
						<span className="manpage-tractor-right" aria-hidden="true" />
					</>
				)}

				{/* the printed page - everything sits above the band overlay */}
				<div className="relative px-10 md:px-14 py-6">
					<div className="manpage-header-line font-mono text-xs md:text-sm whitespace-pre">
						{`${name}   User Commands   ${name}`}
					</div>
					<span
						className="manpage-accent-rule"
						style={{ backgroundColor: accent }}
						aria-hidden="true"
					/>

					<div className="manpage-eyebrow manpage-name-eyebrow font-mono text-xs tracking-[0.2em] mt-5">
						NAME
					</div>
					<h2 className="manpage-name-line font-mono font-bold text-3xl md:text-5xl leading-tight mt-1 pl-4 md:pl-6">
						{topic.heading}
					</h2>

					<div className="manpage-eyebrow manpage-description-eyebrow font-mono text-xs tracking-[0.2em] mt-6">
						DESCRIPTION
					</div>
					<div className="mt-2 pl-4 md:pl-6">{children}</div>

					<div className="manpage-footer font-mono text-xs whitespace-pre mt-8">
						{`alper 1.0   July 2026   ${name}`}
					</div>
				</div>
			</div>
		</div>
	);
}
