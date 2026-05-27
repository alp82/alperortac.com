import type { InnerRenderProps } from "../types";
import { useTriggerNav } from "../useTriggerNav";

/*
 * Inner: receipt
 *
 * A narrow thermal-receipt slip: everything monospace, dashed rules between
 * sections, the heading as the "store name", the teaser as a printed note, and
 * triggers as line items with a faux price, footed by a TOTAL. Signature motif =
 * the jagged torn top/bottom edge of the paper.
 */

export function ReceiptCluster({
	topic,
	index,
	lastTriggerRef,
	params,
	accent,
}: InnerRenderProps) {
	const { resolveTrigger } = useTriggerNav(lastTriggerRef);
	// density nudges slip width.
	const width =
		params.density === "cozy"
			? "w-72"
			: params.density === "roomy"
				? "w-96"
				: "w-80";
	const items = topic.triggers
		.map((t) => resolveTrigger(t, topic.teaser))
		.filter((r): r is NonNullable<typeof r> => r !== null);

	return (
		<div
			className={`receipt relative ${width} mx-auto px-6 py-7 font-mono text-slate-900 text-left ${params.motif ? "receipt-torn" : ""}`}
		>
			<div className="text-center">
				<div
					className="inline-block px-2 py-0.5 mb-2 text-[10px] uppercase tracking-[0.3em]"
					style={{ background: accent }}
				>
					receipt
				</div>
				<h2 className="font-black uppercase tracking-tight text-2xl leading-none">
					{topic.heading}
				</h2>
				<div className="text-[10px] uppercase tracking-[0.2em] mt-1 opacity-60">
					no. {String(index + 1).padStart(4, "0")}
				</div>
			</div>

			<div className="receipt-rule" aria-hidden="true" />

			<p className="text-[11px] leading-relaxed opacity-80">{topic.teaser}</p>

			<div className="receipt-rule" aria-hidden="true" />

			<div className="flex flex-col gap-2">
				{items.map((resolved, i) => (
					<button
						key={resolved.key}
						type="button"
						onClick={(e) => resolved.navigate(e.currentTarget)}
						className="receipt-item group flex items-baseline justify-between gap-2 text-left"
					>
						<span className="text-xs group-hover:underline">
							{String(i + 1).padStart(2, "0")} {resolved.title}
						</span>
						<span className="receipt-dots" aria-hidden="true" />
						<span className="text-xs tabular-nums shrink-0">open →</span>
					</button>
				))}
			</div>

			<div className="receipt-rule receipt-rule-bold" aria-hidden="true" />

			<div className="flex items-baseline justify-between text-sm font-black uppercase">
				<span>Total</span>
				<span className="tabular-nums">{items.length} item(s)</span>
			</div>
			<div className="text-center text-[10px] uppercase tracking-[0.3em] mt-3 opacity-60">
				* * * thank you * * *
			</div>
		</div>
	);
}
