import type { InnerRenderProps } from "../types";
import { DENSITY_MAXW } from "./shared";

/*
 * Inner: cassette — "cassette label."
 *
 * A cassette case is the frame: two spinning reels + a tape window (motif) form
 * the chrome accent up top, the heading is hand-lettered on the label strip, then
 * the topic's REAL body (the shared light plate) sits on the label body below —
 * dark cassette shell around the light content card. Signature motif
 * (params.motif) = the two spinning tape reels (reduced-motion safe via CSS).
 */

export function CassetteCluster({
	topic,
	params,
	accent,
	children,
}: InnerRenderProps) {
	return (
		<div className={`w-full ${DENSITY_MAXW[params.density]}`}>
			<div
				className="cassette relative px-6 py-6"
				style={{ "--cassette-accent": accent } as React.CSSProperties}
			>
				{/* window with two reels */}
				<div className="cassette-window relative flex items-center justify-around px-6 py-4 mb-4">
					<span
						className={`cassette-reel ${params.motif ? "cassette-reel-spin" : ""}`}
						aria-hidden="true"
					/>
					<span className="cassette-tape-line" aria-hidden="true" />
					<span
						className={`cassette-reel ${params.motif ? "cassette-reel-spin" : ""}`}
						aria-hidden="true"
					/>
				</div>

				{/* label strip carrying the heading */}
				<div
					className="cassette-label px-4 py-3 mb-4"
					style={{ borderColor: accent }}
				>
					<h2 className="scrapbook-hand text-2xl md:text-3xl text-slate-900 leading-none">
						{topic.heading}
					</h2>
				</div>

				{/* light content card on the label body */}
				<div>{children}</div>
			</div>
		</div>
	);
}
