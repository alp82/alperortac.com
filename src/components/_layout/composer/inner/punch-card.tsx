import type { InnerRenderProps } from "../types";
import { DENSITY_MAXW } from "./shared";

/*
 * Inner: punch-card - "80-column IBM card."
 *
 * A data-processing card: the classic clipped top-left corner, a row of punched
 * holes across the head, faint printed digit bands fencing the clear center
 * field where the heading + the topic's REAL body (the shared light plate) sit,
 * and a DO NOT FOLD strip at the foot. The digit bands are CSS backgrounds on
 * empty spans, never DOM text, so they stay decoration. Signature toggle
 * (params.holes) = the punched-hole strip; theming knob (stock) = the card's
 * paper + ink (manila / salmon / mint), handed to the `.punchcard-*` classes as
 * --pc-paper / --pc-ink - load-bearing, since the punched holes are cut out in
 * PAPER color and would otherwise print manila on salmon and mint stock.
 */

/* stock → { paper, ink } - card stock + printed ink. */
const STOCK: Record<
	InnerRenderProps<"punch-card">["params"]["stock"],
	{ paper: string; ink: string }
> = {
	manila: { paper: "#e8dcc0", ink: "#4a4028" },
	salmon: { paper: "#f2ddd4", ink: "#5c3a30" },
	mint: { paper: "#dfeee4", ink: "#2c4438" },
};

export function PunchCardCluster({
	topic,
	index,
	params,
	children,
}: InnerRenderProps<"punch-card">) {
	const s = STOCK[params.stock];
	const no = String(index + 1).padStart(2, "0");

	return (
		// The card's drop shadow rides the EXISTING wrapper, not .punchcard-card:
		// the card is clip-path'd (cut corner), and clip-path clips the whole
		// paint including an outer box-shadow, so a box-shadow on the card would
		// never draw. filter: drop-shadow follows the clipped silhouette.
		<div
			className={`w-full ${DENSITY_MAXW[params.density]} drop-shadow-[0_16px_20px_rgba(60,45,20,0.35)]`}
		>
			<div
				className="punchcard-card"
				style={
					{
						"--pc-paper": s.paper,
						"--pc-ink": s.ink,
						backgroundColor: s.paper,
						color: s.ink,
					} as React.CSSProperties
				}
			>
				{/* head - punched holes + the card's printed eyebrow */}
				{params.holes && (
					<span className="punchcard-holes" aria-hidden="true" />
				)}
				{/* opacity-85, not -60: this eyebrow is announced text, and at 0.6
				    --pc-ink on --pc-paper computes to 2.9-3.2:1 (WCAG 1.4.3 needs
				    4.5:1 at 10px). 0.85 clears it on all three stocks (5.2-5.9:1). */}
				<div className="px-6 md:px-10 pt-6 font-mono text-[10px] uppercase tracking-[0.3em] opacity-85">
					No. {no} · Eighty column
				</div>

				{/* printed digit band - CSS only, no DOM text */}
				<span className="punchcard-grid" aria-hidden="true" />

				{/* the clear center field */}
				<div className="px-6 md:px-10 py-6 text-left">
					<h2 className="font-black uppercase tracking-tight text-3xl md:text-5xl leading-none">
						{topic.heading}
					</h2>
					<div className="mt-5">{children}</div>
				</div>

				{/* printed digit band below the field */}
				<span className="punchcard-grid" aria-hidden="true" />

				{/* foot strip */}
				<div className="punchcard-foot px-6 md:px-10 py-3 font-mono text-[10px] uppercase tracking-[0.25em]">
					DO NOT FOLD, SPINDLE OR MUTILATE
				</div>
			</div>
		</div>
	);
}
