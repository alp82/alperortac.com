import { ArrowRight } from "lucide-react";
import type { InnerRenderProps } from "../types";
import { useTriggerNav } from "../useTriggerNav";
import { DENSITY_MAXW } from "./shared";

/*
 * Inner: luggage-tag
 *
 * A travel luggage tag tied on with string: a reinforced grommet hole (motif =
 * string + grommet) up top, the heading stamped as the destination, the teaser
 * on the airline-tag body, and triggers as routing rows with a flight-style
 * arrow. Signature motif = the string loop through the grommet.
 */

export function LuggageTagCluster({
	topic,
	index,
	lastTriggerRef,
	params,
	accent,
}: InnerRenderProps) {
	const { resolveTrigger } = useTriggerNav(lastTriggerRef);
	const code = topic.id.slice(0, 3).toUpperCase();

	return (
		<div
			className={`w-full ${DENSITY_MAXW[params.density]} flex justify-center`}
		>
			<div
				className="luggage relative px-7 py-7"
				style={{ "--luggage-accent": accent } as React.CSSProperties}
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
						className="luggage-code font-black text-4xl leading-none"
						style={{ color: accent }}
					>
						{code}
					</span>
					<h2 className="font-black uppercase tracking-tight text-2xl md:text-3xl text-slate-900 leading-none pb-0.5">
						{topic.heading}
					</h2>
				</div>
				<p className="text-sm text-slate-600 leading-snug mt-3 max-w-xs">
					{topic.teaser}
				</p>

				<div className="luggage-perf my-4" aria-hidden="true" />

				<div className="flex flex-col gap-2.5">
					{topic.triggers.map((trigger) => {
						const resolved = resolveTrigger(trigger, topic.teaser);
						if (!resolved) return null;
						return (
							<button
								key={resolved.key}
								type="button"
								onClick={(e) => resolved.navigate(e.currentTarget)}
								className="luggage-row group flex items-center justify-between gap-3 text-left"
							>
								<span className="font-mono text-sm uppercase tracking-wide text-slate-800 group-hover:text-slate-900">
									{resolved.title}
								</span>
								<ArrowRight
									size={15}
									className="text-slate-500 group-hover:translate-x-1 transition-transform"
								/>
							</button>
						);
					})}
				</div>
			</div>
		</div>
	);
}
