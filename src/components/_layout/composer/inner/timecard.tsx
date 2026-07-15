import type { InnerRenderProps } from "../types";
import { DENSITY_MAXW } from "./shared";

/*
 * Inner: timecard - "punch-clock card."
 *
 * A workday timecard: an EMPLOYEE NO. eyebrow + the heading as the name line in
 * a header band with faint printed rows beside it, the topic's REAL body (the
 * shared light plate) seated clear in the middle as the card's content, and a
 * footer strip carrying the inked clock stamps. Nothing prints over the prose.
 * Signature toggle (params.stamps) = the inked IN / OUT stamps; theming knob
 * (stock) = the card's paper + ink (manila / buff / ledger), handed to the
 * `.timecard-*` classes as --tc-paper / --tc-ink so the printed rows track the
 * selected stock instead of hardcoding one paper color.
 */

/* stock → { paper, ink } - card stock + printed ink. */
const STOCK: Record<
	InnerRenderProps<"timecard">["params"]["stock"],
	{ paper: string; ink: string }
> = {
	manila: { paper: "#eddfc0", ink: "#4a3c22" },
	buff: { paper: "#f2e3ce", ink: "#584426" },
	ledger: { paper: "#e6ecdf", ink: "#2f3a2c" },
};

export function TimecardCluster({
	topic,
	index,
	params,
	children,
}: InnerRenderProps<"timecard">) {
	const s = STOCK[params.stock];
	const no = String(index + 1).padStart(2, "0");
	const n = (index + 1) % 10;

	return (
		<div className={`w-full ${DENSITY_MAXW[params.density]}`}>
			<div
				className="timecard-card"
				style={
					{
						"--tc-paper": s.paper,
						"--tc-ink": s.ink,
						backgroundColor: s.paper,
						color: s.ink,
					} as React.CSSProperties
				}
			>
				{/* header band - name line + the printed rows, chrome only */}
				<div className="timecard-band flex items-end justify-between gap-6 px-6 md:px-8 pt-6 pb-4">
					<div className="min-w-0">
						{/* opacity-85, not -60: announced text, and 0.6 --tc-ink on
						    --tc-paper computes to 2.9-3.4:1 - under WCAG 1.4.3's 4.5:1
						    for 10px type. 0.85 clears all three stocks (5.1-6.5:1);
						    0.75 was NOT enough (buff lands at 4.02:1). */}
						<div className="font-mono text-[10px] uppercase tracking-[0.3em] opacity-85">
							EMPLOYEE NO. {no}
						</div>
						<h2 className="font-black uppercase tracking-tight text-3xl md:text-5xl leading-none mt-1">
							{topic.heading}
						</h2>
					</div>
					<span className="timecard-rows" aria-hidden="true" />
				</div>

				{/* the card's content */}
				<div className="px-6 md:px-8 py-6 text-left">{children}</div>

				{/* footer strip - the inked clock stamps */}
				{params.stamps && (
					<div className="timecard-foot flex flex-wrap items-center gap-x-6 gap-y-2 px-6 md:px-8 py-4">
						{/* flex-wrap: .timecard-card is overflow:hidden, so a no-wrap
						    strip would silently CLIP the stamps on a ~360px viewport
						    instead of reflowing them onto a second line.
						    opacity-85 for the same 4.5:1 reason as the eyebrow above. */}
						<span className="font-mono text-[10px] uppercase tracking-[0.3em] opacity-85">
							TIME CLOCK ·
						</span>
						<span className="timecard-stamp" aria-hidden="true">
							IN 08:0{n}
						</span>
						<span className="opacity-40" aria-hidden="true">
							·
						</span>
						<span
							className="timecard-stamp timecard-stamp-out"
							aria-hidden="true"
						>
							OUT 17:{n}0
						</span>
					</div>
				)}
			</div>
		</div>
	);
}
