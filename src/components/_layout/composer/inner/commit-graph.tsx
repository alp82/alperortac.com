import type { InnerRenderProps } from "../types";
import { DENSITY_MAXW } from "./shared";

/*
 * Inner: commit-graph
 *
 * A commit-log card (delicate chrome): a header band with a small inline SVG
 * lane graph (a straight main lane plus a feature branch curving into it,
 * accent dot nodes) beside a mono column of fake short SHAs derived purely
 * from `index`, the heading as the HEAD commit subject `feat: <heading>` in
 * bold display type, the topic's REAL body seated clear below as the commit
 * body, and (when params.refs) a footer of ref chips. Nothing prints over the
 * prose. Theming knob (stock) = the card's paper + ink (white / cream / mist),
 * handed to the `.cg-*` classes as --cg-paper / --cg-ink inline vars (the
 * timecard --tc-* convention) so every chrome surface tracks the stock.
 */

/* stock → { paper, ink } - card stock + printed ink. */
const STOCK: Record<
	InnerRenderProps<"commit-graph">["params"]["stock"],
	{ paper: string; ink: string }
> = {
	white: { paper: "#fdfdfb", ink: "#24292f" },
	cream: { paper: "#f8f1e0", ink: "#4d3d22" },
	mist: { paper: "#eaf0f5", ink: "#2c3e50" },
};

/** Fake short SHA - a pure function of (index, row): deterministic for the
 * same index, distinct across indexes, always exactly 7 lowercase hex chars. */
function fakeSha(index: number, row: number): string {
	const n = ((index + 1) * 0x9e3779 + (row + 1) * 0x85ebca) % 0xfffffff;
	return n.toString(16).padStart(7, "0").slice(-7);
}

const SHA_ROWS = [0, 1, 2] as const;

export function CommitGraphCluster({
	topic,
	index,
	params,
	accent,
	children,
}: InnerRenderProps<"commit-graph">) {
	const s = STOCK[params.stock];

	return (
		<div className={`w-full ${DENSITY_MAXW[params.density]}`}>
			<div
				className="cg-card text-left"
				style={
					{
						"--cg-paper": s.paper,
						"--cg-ink": s.ink,
						backgroundColor: s.paper,
						color: s.ink,
					} as React.CSSProperties
				}
			>
				{/* header band - the lane graph + the SHA column, chrome only */}
				<div className="cg-band px-6 md:px-8 pt-5 pb-4">
					<div className="flex items-center gap-5">
						<span className="cg-lanes" aria-hidden="true">
							<svg
								width="52"
								height="72"
								viewBox="0 0 52 72"
								role="presentation"
							>
								{/* main lane + the feature branch curving into it */}
								<line
									x1="16"
									y1="4"
									x2="16"
									y2="68"
									stroke="var(--cg-ink)"
									strokeOpacity="0.28"
									strokeWidth="2"
								/>
								<path
									d="M16 14 C 40 20, 40 46, 16 54"
									fill="none"
									stroke="var(--cg-ink)"
									strokeOpacity="0.28"
									strokeWidth="2"
								/>
								{/* dot nodes, one per SHA row */}
								<circle cx="16" cy="14" r="4.5" fill={accent} />
								<circle cx="34" cy="34" r="4.5" fill={accent} />
								<circle cx="16" cy="54" r="4.5" fill={accent} />
							</svg>
						</span>
						<span
							className="cg-sha-col font-mono text-xs leading-6"
							aria-hidden="true"
						>
							{SHA_ROWS.map((row) => (
								<span key={row} className="cg-sha block">
									{fakeSha(index, row)}
								</span>
							))}
						</span>
					</div>
					<h2 className="cg-heading font-bold text-3xl md:text-5xl leading-tight mt-4">
						feat: {topic.heading}
					</h2>
				</div>

				{/* the commit body - clear of every piece of chrome */}
				<div className="px-6 md:px-8 py-6">{children}</div>

				{/* footer - the ref chips, gated ONLY by params.refs */}
				{params.refs && (
					<div className="cg-foot flex flex-wrap items-center gap-3 px-6 md:px-8 py-4">
						<span className="cg-ref cg-ref-head font-mono text-xs">
							HEAD -&gt; main
						</span>
						<span className="cg-ref cg-ref-tag font-mono text-xs">
							tag: v1.{index}
						</span>
					</div>
				)}
			</div>
		</div>
	);
}
