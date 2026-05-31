import type { InnerRenderProps } from "../types";
import { DENSITY_MAXW } from "./shared";

/*
 * Inner: comic — "comic page."
 *
 * A WIDE comic page: black gutters frame a title banner (the heading in a jagged
 * caption box) above one large panel with the thick comic border + a halftone bg
 * accent (toggle), where the topic's REAL body (the shared light plate) sits as
 * the panel's content. A speech-bubble tail in the corner keeps the comic
 * identity. Widened from the old two-panel page to hold the plate. Signature
 * toggle (params.halftone) = the halftone dot wash on the panel; `palette`
 * recolors the caption bg + caption heading text inline.
 */

/** palette → caption bg + caption heading text color (applied inline). */
const PALETTES: Record<
	InnerRenderProps<"comic">["params"]["palette"],
	{ captionBg: string; captionText: string }
> = {
	classic: { captionBg: "", captionText: "#0f172a" },
	noir: { captionBg: "#111827", captionText: "#f8fafc" },
	pop: { captionBg: "#ffe14d", captionText: "#0f172a" },
};

export function ComicCluster({
	topic,
	params,
	accent,
	children,
}: InnerRenderProps<"comic">) {
	const palette = PALETTES[params.palette];
	// classic uses the topic accent as the caption bg; others carry their own.
	const captionBg = palette.captionBg || accent;

	return (
		<div
			className={`comic-page relative w-full p-3 ${DENSITY_MAXW[params.density]}`}
		>
			{/* title banner */}
			<div
				className="comic-caption px-4 py-2 mb-3"
				style={{ background: captionBg }}
			>
				<h2
					className="font-black uppercase tracking-tight text-2xl md:text-4xl leading-none"
					style={{ color: palette.captionText }}
				>
					{topic.heading}
				</h2>
			</div>

			{/* main panel: light content plate over the halftone wash */}
			<div className="comic-panel relative bg-white overflow-hidden px-5 py-4 md:px-6">
				{params.halftone && (
					<span className="comic-halftone" aria-hidden="true" />
				)}
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
