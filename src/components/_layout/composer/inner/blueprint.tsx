import type { InnerRenderProps } from "../types";
import { TOPICS } from "../../../../data/topics";
import { DENSITY_MAXW } from "./shared";

/*
 * Inner: blueprint — "drafting sheet."
 *
 * A DARK technical drawing is the frame: a grid on a tinted sheet, a title-block
 * row (fig. / scale), the heading drafted in technical mono/ink with a
 * tick-capped dimension line beneath it. The topic's REAL body (the shared light
 * plate) is FRAMED in the drawing area as the drawn artifact — dark drafting
 * chrome around the light content card. Signature toggle (`grid`) = the grid +
 * dimension ticks overlay; `paper` recolors the sheet + ink inline.
 */

/** paper → sheet bg + line/ink color (both applied inline). */
const PAPERS: Record<
	InnerRenderProps<"blueprint">["params"]["paper"],
	{ bg: string; line: string }
> = {
	cyanotype: { bg: "#10355e", line: "#cfe8ff" },
	slate: { bg: "#1f2937", line: "#cbd5e1" },
	charcoal: { bg: "#141414", line: "#d8d8d8" },
};

export function BlueprintCluster({
	topic,
	index,
	params,
	children,
}: InnerRenderProps<"blueprint">) {
	const paper = PAPERS[params.paper];
	const total = String(TOPICS.length).padStart(2, "0");

	return (
		<div className={`w-full ${DENSITY_MAXW[params.density]}`}>
			<div
				className={`blueprint relative px-7 md:px-10 py-9 text-left ${params.grid ? "blueprint-grid" : ""}`}
				style={{ background: paper.bg }}
			>
				<div
					className="flex items-start justify-between gap-3 border-b pb-2 mb-5"
					style={{ borderColor: paper.line }}
				>
					<span
						className="font-mono text-[10px] uppercase tracking-[0.3em]"
						style={{ color: paper.line }}
					>
						fig. {String(index + 1).padStart(2, "0")} — rev. A
					</span>
					<span
						className="font-mono text-[10px] uppercase tracking-[0.3em]"
						style={{ color: paper.line }}
					>
						scale 1:1
					</span>
				</div>

				<h2
					className="font-mono font-bold uppercase tracking-tight text-3xl md:text-4xl leading-none"
					style={{ color: paper.line }}
				>
					{topic.heading}
				</h2>
				{/* dimension line */}
				<div
					className="blueprint-dim mt-3 mb-6"
					aria-hidden="true"
					style={{ color: paper.line, background: paper.line }}
				>
					<span className="blueprint-dim-label" style={{ color: paper.line }}>
						{topic.heading.length} units
					</span>
				</div>

				{/* drawing area: the light content card framed on the sheet */}
				<div className="border p-3 md:p-4" style={{ borderColor: paper.line }}>
					{children}
				</div>

				<div
					className="mt-5 font-mono text-[10px] uppercase tracking-[0.3em] text-right"
					style={{ color: paper.line }}
				>
					sheet {String(index + 1).padStart(2, "0")} of {total}
				</div>
			</div>
		</div>
	);
}
