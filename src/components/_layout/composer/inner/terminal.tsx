import type { InnerRenderProps } from "../types";
import { useTriggerNav } from "../useTriggerNav";
import { DENSITY_MAXW } from "./shared";

/*
 * Inner: terminal
 *
 * Centered recast: a dark translucent terminal pane centered on the stage. The
 * heading is a `cat <topic>.md`, the teaser is stdout, triggers are
 * `> [ run: … ]` prompts, and a cursor blinks at the live prompt. Deliberate
 * techy clash with the warm landscape. Signature motif = the blinking cursor.
 */

export function TerminalCluster({
	topic,
	lastTriggerRef,
	params,
	accent,
}: InnerRenderProps) {
	const { resolveTrigger } = useTriggerNav(lastTriggerRef);
	const cmd = topic.id.replace(/-/g, "_");

	return (
		<div
			className={`terminal-pane relative w-full font-mono text-sm md:text-[15px] leading-relaxed ${DENSITY_MAXW[params.density]}`}
		>
			<div className="terminal-bar flex items-center gap-2 px-4 py-2">
				<span className="w-3 h-3 rounded-full bg-red-500/80" />
				<span className="w-3 h-3 rounded-full bg-amber-400/80" />
				<span className="w-3 h-3 rounded-full bg-emerald-400/80" />
				<span className="ml-3 text-slate-400 text-xs">
					alper@site — topics/{topic.id}
				</span>
			</div>

			<div className="px-4 py-4 text-slate-100 text-left">
				<div className="text-slate-300">
					<span className="text-emerald-400">alper@site</span>
					<span className="text-slate-500">:</span>
					<span className="text-sky-400">~</span>
					<span className="text-slate-500">$ </span>
					<span className="text-slate-100">cat {cmd}.md</span>
				</div>

				<div className="mt-2" style={{ color: accent }}>
					# {topic.heading}
				</div>
				<p className="mt-1 text-slate-300 max-w-2xl">{topic.teaser}</p>

				<div className="mt-4 flex flex-col gap-1.5">
					{topic.triggers.map((trigger) => {
						const resolved = resolveTrigger(trigger, topic.teaser);
						if (!resolved) return null;
						return (
							<button
								key={resolved.key}
								type="button"
								onClick={(e) => resolved.navigate(e.currentTarget)}
								className="repl-run group text-left w-fit"
							>
								<span className="text-slate-500">{">"} </span>
								<span className="text-slate-300">[ </span>
								<span className="text-emerald-400 group-hover:underline">
									run:
								</span>{" "}
								<span className="text-slate-100 group-hover:text-white">
									{resolved.key}
								</span>
								<span className="text-slate-300"> ]</span>
								<span className="ml-2 text-slate-500 group-hover:text-slate-300">
									# {resolved.title}
								</span>
							</button>
						);
					})}
				</div>

				<div className="mt-4 text-slate-300">
					<span className="text-emerald-400">alper@site</span>
					<span className="text-slate-500">:</span>
					<span className="text-sky-400">~</span>
					<span className="text-slate-500">$ </span>
					{params.motif && (
						<span className="terminal-cursor" aria-hidden="true" />
					)}
				</div>
			</div>
		</div>
	);
}
