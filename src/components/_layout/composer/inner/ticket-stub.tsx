import { ArrowRight } from "lucide-react";
import type { InnerRenderProps } from "../types";
import { useTriggerNav } from "../useTriggerNav";
import { DENSITY_MAXW } from "./shared";

/*
 * Inner: ticket-stub
 *
 * A perforated event ticket: a bold stub on the left with the topic index, a
 * dashed tear line with round notch punches down the middle, and the heading +
 * teaser on the body. Triggers are ADMIT-ONE tear-off rows. Signature motif =
 * the perforation (notches + dashed line).
 */

export function TicketStubCluster({
	topic,
	index,
	lastTriggerRef,
	params,
	accent,
}: InnerRenderProps) {
	const { resolveTrigger } = useTriggerNav(lastTriggerRef);
	const num = String(index + 1).padStart(2, "0");

	return (
		<div className={`w-full ${DENSITY_MAXW[params.density]}`}>
			<div
				className="ticket relative flex"
				style={{ "--ticket-accent": accent } as React.CSSProperties}
			>
				{/* stub */}
				<div
					className="ticket-stub relative flex flex-col items-center justify-center px-4 py-6 shrink-0"
					style={{ background: accent }}
				>
					<span className="font-mono text-[10px] uppercase tracking-[0.3em] text-slate-900/70 [writing-mode:vertical-rl] rotate-180">
						admit one
					</span>
					<span className="absolute bottom-3 font-black text-2xl text-slate-900">
						{num}
					</span>
				</div>
				{params.motif && <span className="ticket-perf" aria-hidden="true" />}
				{/* body */}
				<div className="flex-1 px-6 py-6 text-left">
					<div className="font-mono text-[10px] uppercase tracking-[0.3em] text-slate-500 mb-2">
						general admission
					</div>
					<h2 className="font-black uppercase tracking-tight text-3xl md:text-4xl text-slate-900 leading-none">
						{topic.heading}
					</h2>
					<p className="mt-3 text-sm md:text-base text-slate-700 leading-snug">
						{topic.teaser}
					</p>

					<div className="mt-5 flex flex-col gap-2">
						{topic.triggers.map((trigger) => {
							const resolved = resolveTrigger(trigger, topic.teaser);
							if (!resolved) return null;
							return (
								<button
									key={resolved.key}
									type="button"
									onClick={(e) => resolved.navigate(e.currentTarget)}
									className="ticket-row group flex items-center justify-between gap-3 px-4 py-2.5 text-left"
								>
									<span className="flex flex-col">
										<span className="font-black uppercase tracking-tight text-sm text-slate-900 leading-none">
											{resolved.title}
										</span>
										<span className="font-mono text-[9px] uppercase tracking-[0.2em] text-slate-500 mt-1">
											admit one
										</span>
									</span>
									<ArrowRight
										size={16}
										className="text-slate-900 group-hover:translate-x-1 transition-transform"
									/>
								</button>
							);
						})}
					</div>
				</div>
			</div>
		</div>
	);
}
