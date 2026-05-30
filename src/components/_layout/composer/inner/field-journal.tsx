import type { InnerRenderProps } from "../types";
import { DENSITY_MAXW } from "./shared";

/*
 * Inner: field-journal — "kraft journal spread."
 *
 * An aged kraft / graph-paper page is the frame: a stamped+handwritten field-note
 * title with a fig. number, a dashed field rule, then the topic's REAL body (the
 * shared light plate) as the journal entry on the page. The plate sits ON the
 * kraft surface (paper-on-paper). Signature motif (params.motif) = a strip of
 * specimen tape pinning the top corner of the page.
 */

export function FieldJournalCluster({
	topic,
	index,
	params,
	children,
}: InnerRenderProps) {
	const specimen = String(index + 1).padStart(2, "0");

	return (
		<div className={`w-full ${DENSITY_MAXW[params.density]}`}>
			<div className="journal-page relative px-6 md:px-10 py-10">
				{params.motif && (
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
