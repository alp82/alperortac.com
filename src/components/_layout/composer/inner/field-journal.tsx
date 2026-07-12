import type { CSSProperties } from "react";
import type { InnerRenderProps } from "../types";
import { DENSITY_MAXW } from "./shared";

/*
 * Inner: field-journal - "kraft journal spread."
 *
 * An aged kraft / graph-paper page is the frame: a stamped+handwritten field-note
 * title with a fig. number, a dashed field rule, then the topic's REAL body (the
 * shared light plate) as the journal entry on the page. The plate sits ON the
 * page surface (paper-on-paper). Signature toggle (params.tape) = a strip of
 * specimen tape pinning the top corner of the page; the `paper` knob restocks the
 * page (kraft / graph grid / aged tone) inline.
 */

/** paper → inline override for the `.journal-page` surface. */
const PAPER: Record<"kraft" | "graph" | "aged", CSSProperties> = {
	kraft: {
		background: "#ece0c8",
	},
	graph: {
		backgroundColor: "#f3f1e9",
		backgroundImage:
			"repeating-linear-gradient(to right, rgba(70,110,160,0.12) 0 1px, transparent 1px 22px), repeating-linear-gradient(to bottom, rgba(70,110,160,0.12) 0 1px, transparent 1px 22px)",
	},
	aged: {
		backgroundColor: "#e2d3b0",
		backgroundImage:
			"radial-gradient(ellipse at 100% 0%, rgba(74,50,32,0.32) 0%, transparent 45%)",
	},
};

export function FieldJournalCluster({
	topic,
	index,
	params,
	children,
}: InnerRenderProps<"field-journal">) {
	const specimen = String(index + 1).padStart(2, "0");

	return (
		<div className={`w-full ${DENSITY_MAXW[params.density]}`}>
			<div
				className="journal-page relative px-6 md:px-10 py-10"
				style={PAPER[params.paper]}
			>
				{params.tape && (
					<span
						className="specimen-tape"
						style={{ top: "-9px", left: "22%" }}
						aria-hidden="true"
					/>
				)}

				<div className="flex items-baseline justify-between gap-4 border-b-2 border-dashed border-[#b8a98c] pb-2 mb-6">
					<h2 className="journal-hand text-4xl md:text-6xl text-[#3a2410] leading-none">
						{topic.heading}
					</h2>
					<span className="font-mono text-[10px] uppercase tracking-[0.3em] text-[#6f4720] shrink-0 border border-[#b8a98c] px-2 py-1 -rotate-3">
						fig. {specimen}
					</span>
				</div>

				{children}

				<div className="mt-5 font-mono text-[10px] uppercase tracking-[0.3em] text-[#6f4720]/70">
					field notes · {topic.id}
				</div>
			</div>
		</div>
	);
}
