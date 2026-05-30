import type { InnerRenderProps } from "../types";
import { DENSITY_MAXW } from "./shared";

/*
 * Inner: manuscript — "illuminated page."
 *
 * A ruled vellum/parchment page is the frame, bracketed by gold flourish corners.
 * The heading is the illuminated title — an ornate accent drop-cap (motif) leads
 * it, over a rubricated incipit line — then the topic's REAL body (the shared
 * light plate) sits on the vellum as the manuscript body. Signature motif
 * (params.motif) = the illuminated drop-cap block.
 */

export function ManuscriptCluster({
	topic,
	params,
	accent,
	children,
}: InnerRenderProps) {
	const head = topic.heading;
	const drop = head.charAt(0);
	const rest = head.slice(1);

	return (
		<div className={`w-full ${DENSITY_MAXW[params.density]}`}>
			<div className="manuscript relative px-8 md:px-14 py-12 text-left">
				{/* gold flourish corners bracketing the page */}
				<span
					className="manuscript-corner manuscript-corner-tl"
					aria-hidden="true"
				/>
				<span
					className="manuscript-corner manuscript-corner-br"
					aria-hidden="true"
				/>

				<div className="manuscript-leaf font-serif text-[11px] uppercase tracking-[0.45em] mb-3">
					Incipit
				</div>
				<h2 className="font-serif text-3xl md:text-5xl text-slate-900 leading-tight flex items-start gap-1">
					{params.motif && (
						<span className="manuscript-dropcap" style={{ background: accent }}>
							{drop}
						</span>
					)}
					<span className={params.motif ? "pt-1" : ""}>
						{params.motif ? rest : head}
					</span>
				</h2>

				<div className="mt-6">{children}</div>
			</div>
		</div>
	);
}
