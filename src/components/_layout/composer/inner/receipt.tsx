import type { InnerParams, InnerRenderProps } from "../types";

/*
 * Inner: receipt
 *
 * A monospace statement sheet (widened from the old narrow slip): thermal-paper
 * background, dashed rules, a torn-edge motif and monospace chrome. The heading
 * is the store-name header at the top, a dashed rule divides it from the topic's
 * REAL body (the shared light plate) printed on the paper below, footed by a
 * bold rule + a thank-you line. Signature motif = the jagged torn top/bottom
 * edge of the paper.
 */

/** Density nudges the statement-sheet width (the slip became a full sheet). */
const SHEET_MAXW: Record<InnerParams["density"], string> = {
	cozy: "max-w-lg",
	comfortable: "max-w-xl",
	roomy: "max-w-2xl",
};

export function ReceiptCluster({
	topic,
	index,
	params,
	accent,
	children,
}: InnerRenderProps) {
	const no = String(index + 1).padStart(4, "0");

	return (
		<div
			className={`receipt relative w-full ${SHEET_MAXW[params.density]} mx-auto px-8 md:px-10 py-9 font-mono text-slate-900 text-left ${params.motif ? "receipt-torn" : ""}`}
		>
			<div className="text-center">
				<div
					className="inline-block px-2 py-0.5 mb-2 text-[10px] uppercase tracking-[0.3em]"
					style={{ background: accent }}
				>
					receipt
				</div>
				<h2 className="font-black uppercase tracking-tight text-2xl md:text-3xl leading-none">
					{topic.heading}
				</h2>
				<div className="flex items-center justify-center gap-3 text-[10px] uppercase tracking-[0.2em] mt-2 opacity-60">
					<span>no. {no}</span>
					<span aria-hidden="true">·</span>
					<span>est. {topic.id}</span>
				</div>
			</div>

			<div className="receipt-rule" aria-hidden="true" />

			{children}

			<div className="receipt-rule receipt-rule-bold" aria-hidden="true" />

			<div className="text-center text-[10px] uppercase tracking-[0.3em] mt-3 opacity-60">
				———— * * * thank you * * * ————
			</div>
		</div>
	);
}
