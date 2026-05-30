import type { InnerRenderProps } from "../types";
import { DENSITY_MAXW } from "./shared";

/*
 * Inner: comic — "comic page."
 *
 * A WIDE comic page: black gutters frame a title banner (the heading in a jagged
 * accent caption box) above one large panel with the thick comic border + a
 * halftone bg accent (motif), where the topic's REAL body (the shared light
 * plate) sits as the panel's content. A speech-bubble tail in the corner keeps
 * the comic identity. Widened from the old two-panel page to hold the plate.
 * Signature motif (params.motif) = the halftone dot wash on the panel.
 */

export function ComicCluster({
	topic,
	params,
	accent,
	children,
}: InnerRenderProps) {
	return (
		<div
			className={`comic-page relative w-full p-3 ${DENSITY_MAXW[params.density]}`}
		>
			{/* title banner */}
			<div
				className="comic-caption px-4 py-2 mb-3"
				style={{ background: accent }}
			>
				<h2 className="font-black uppercase tracking-tight text-2xl md:text-4xl text-slate-900 leading-none">
					{topic.heading}
				</h2>
			</div>

			{/* main panel: light content plate over the halftone wash */}
			<div className="comic-panel relative bg-white overflow-hidden px-5 py-4 md:px-6">
				{params.motif && <span className="comic-halftone" aria-hidden="true" />}
				<div className="relative z-10 text-left">{children}</div>
				{/* speech-bubble tail keeps the comic identity */}
				<div
					className="comic-bubble absolute -bottom-3 right-6 w-9 h-9"
					aria-hidden="true"
				/>
			</div>
		</div>
	);
}
