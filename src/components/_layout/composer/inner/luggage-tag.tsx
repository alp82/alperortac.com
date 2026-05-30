import type { InnerRenderProps } from "../types";
import { DENSITY_MAXW } from "./shared";

/*
 * Inner: luggage-tag — "luggage tag panel."
 *
 * A WIDE travel-tag panel: the clipped top corners + a reinforced grommet hole
 * with a string loop (motif) keep the tag shape, a BAGGAGE stamp + the airport
 * code chrome sit beside the heading as the tag label, a dotted perforation
 * divides off the topic's REAL body (the shared light plate) on the tag body.
 * Widened past the old narrow tag (overriding the class's 22rem cap) to hold the
 * plate. Signature motif (params.motif) = the string loop through the grommet.
 */

export function LuggageTagCluster({
	topic,
	index,
	params,
	accent,
	children,
}: InnerRenderProps) {
	const code = topic.id.slice(0, 3).toUpperCase();

	return (
		<div className={`w-full ${DENSITY_MAXW[params.density]}`}>
			<div
				className="luggage relative px-8 md:px-10 pt-9 pb-8 mx-auto"
				style={
					{
						"--luggage-accent": accent,
						maxWidth: "100%",
					} as React.CSSProperties
				}
			>
				{/* grommet + string */}
				<div className="luggage-grommet-wrap" aria-hidden="true">
					{params.motif && <span className="luggage-string" />}
					<span className="luggage-grommet" />
				</div>

				<div className="luggage-stamp font-mono text-[10px] uppercase tracking-[0.3em] text-slate-600 mb-2 mt-3">
					baggage · {String(index + 1).padStart(2, "0")}
				</div>
				<div className="flex items-end gap-3">
					<span
						className="luggage-code font-black text-4xl md:text-5xl leading-none"
						style={{ color: accent }}
					>
						{code}
					</span>
					<h2 className="font-black uppercase tracking-tight text-2xl md:text-3xl text-slate-900 leading-none pb-0.5">
						{topic.heading}
					</h2>
				</div>

				<div className="luggage-perf my-4" aria-hidden="true" />

				<div className="text-left">{children}</div>
			</div>
		</div>
	);
}
