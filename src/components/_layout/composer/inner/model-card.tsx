import type { InnerRenderProps } from "../types";
import { DENSITY_MAXW } from "./shared";

/*
 * Inner: model-card - "the topic as a released model."
 *
 * A printed model card (the ticket-stub/nameplate ephemera lineage) seats the
 * topic as a model release: an eyebrow band (MODEL CARD + mono version chip),
 * the heading as the model name, a three-cell spec strip and the topic's
 * REAL body seated below as the description. Signature toggle (params.specs)
 * = the spec strip; theming knob (stock) = the card stock (paper / mint /
 * slate), handed to the `.mcard-*` classes as --mc-paper / --mc-ink /
 * --mc-dim / --mc-line inline vars (the timecard --tc-* convention). The
 * version chip reads the accent prop only - never the stock.
 */

/** stock → card paper palette. */
const STOCKS: Record<
	InnerRenderProps<"model-card">["params"]["stock"],
	{ paper: string; ink: string; dim: string; line: string }
> = {
	paper: {
		paper: "#f8f6f1",
		ink: "#211d15",
		dim: "#847c6b",
		line: "rgba(33, 29, 21, 0.18)",
	},
	mint: {
		paper: "#eef6f0",
		ink: "#17251c",
		dim: "#6f8578",
		line: "rgba(23, 37, 28, 0.18)",
	},
	slate: {
		paper: "#eceff4",
		ink: "#1a2230",
		dim: "#71798a",
		line: "rgba(26, 34, 48, 0.18)",
	},
};

/** The spec strip is fixed card chrome - playful specs for a human model. */
const SPECS = [
	{ id: "params", label: "params", value: "1 human" },
	{ id: "context", label: "context", value: "unbounded" },
	{ id: "alignment", label: "alignment", value: "curious" },
] as const;

export function ModelCardCluster({
	topic,
	index,
	params,
	accent,
	children,
}: InnerRenderProps<"model-card">) {
	const s = STOCKS[params.stock];

	return (
		<div className={`w-full ${DENSITY_MAXW[params.density]}`}>
			<div
				className="mcard text-left"
				style={
					{
						"--mc-paper": s.paper,
						"--mc-ink": s.ink,
						"--mc-dim": s.dim,
						"--mc-line": s.line,
						"--mc-accent": accent,
					} as React.CSSProperties
				}
			>
				{/* eyebrow band - card type + version chip */}
				<div className="mcard-band flex flex-wrap items-center justify-between gap-x-4 gap-y-2 px-6 md:px-8 pt-5">
					<span className="mcard-eyebrow font-mono text-[11px] uppercase tracking-[0.35em]">
						model card
					</span>
					<span className="mcard-version font-mono text-[11px] font-semibold">
						v{index + 1}.0
					</span>
				</div>

				{/* model name */}
				<div className="px-6 md:px-8 pt-3 pb-5">
					<h2 className="mcard-name font-black tracking-tight text-4xl md:text-6xl leading-[0.95]">
						{topic.heading}
					</h2>
				</div>

				{/* spec strip - three ruled cells */}
				{params.specs && (
					<div className="mcard-specs grid grid-cols-3">
						{SPECS.map((cell) => (
							<div key={cell.id} className="mcard-spec px-4 md:px-6 py-3">
								<div className="mcard-spec-label font-mono text-[10px] uppercase tracking-[0.25em]">
									{cell.label}
								</div>
								<div className="mcard-spec-value font-semibold text-sm md:text-base mt-1">
									{cell.value}
								</div>
							</div>
						))}
					</div>
				)}

				{/* the card's content - the REAL body as the model description */}
				<div className="mcard-body px-6 md:px-8 py-6">{children}</div>
			</div>
		</div>
	);
}
