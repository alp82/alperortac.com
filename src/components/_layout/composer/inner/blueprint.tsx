import type { InnerRenderProps } from "../types";
import { DENSITY_MAXW } from "./shared";

/*
 * Inner: blueprint — "drafting sheet."
 *
 * A DARK technical drawing is the frame: cyan grid on dark blue, a title-block row
 * (fig. / scale), the heading drafted in technical mono/cyan with a tick-capped
 * dimension line beneath it. The topic's REAL body (the shared light plate) is
 * FRAMED in the drawing area as the drawn artifact — dark drafting chrome around
 * the light content card (not cyan-line content). Signature motif (params.motif)
 * = the grid + dimension ticks overlay.
 */

export function BlueprintCluster({
	topic,
	index,
	params,
	children,
}: InnerRenderProps) {
	return (
		<div className={`w-full ${DENSITY_MAXW[params.density]}`}>
			<div
				className={`blueprint relative px-7 md:px-10 py-9 text-left ${params.motif ? "blueprint-grid" : ""}`}
			>
				<div className="flex items-start justify-between gap-3 border-b border-cyan-200/40 pb-2 mb-5">
					<span className="font-mono text-[10px] uppercase tracking-[0.3em] text-cyan-100/80">
						fig. {String(index + 1).padStart(2, "0")} — rev. A
					</span>
					<span className="font-mono text-[10px] uppercase tracking-[0.3em] text-cyan-100/80">
						scale 1:1
					</span>
				</div>

				<h2 className="font-mono font-bold uppercase tracking-tight text-3xl md:text-4xl text-cyan-50 leading-none">
					{topic.heading}
				</h2>
				{/* dimension line */}
				<div className="blueprint-dim mt-3 mb-6" aria-hidden="true">
					<span className="blueprint-dim-label">
						{topic.heading.length} units
					</span>
				</div>

				{/* drawing area: the light content card framed on the sheet */}
				<div className="border border-cyan-200/30 p-3 md:p-4">{children}</div>

				<div className="mt-5 font-mono text-[10px] uppercase tracking-[0.3em] text-cyan-100/60 text-right">
					sheet {String(index + 1).padStart(2, "0")} of —
				</div>
			</div>
		</div>
	);
}
