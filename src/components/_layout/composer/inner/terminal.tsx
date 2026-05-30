import type { InnerRenderProps } from "../types";
import { DENSITY_MAXW } from "./shared";

/*
 * Inner: terminal
 *
 * A terminal WINDOW that frames the content as a card: a title bar (traffic
 * lights + a `~/topics/<id>` label), a `❯ cat <id>.md` prompt, the themed
 * heading as a `# <heading>` comment, then the topic's REAL body (the shared
 * light plate) INSIDE the window body, closed by a trailing prompt with the
 * blinking cursor. Dark window chrome surrounds the light content card.
 * Signature motif = the blinking cursor.
 */

export function TerminalCluster({
	topic,
	params,
	accent,
	children,
}: InnerRenderProps) {
	const cmd = topic.id.replace(/-/g, "_");

	return (
		<div
			className={`terminal-pane relative w-full font-mono text-sm md:text-[15px] leading-relaxed ${DENSITY_MAXW[params.density]}`}
		>
			<div className="terminal-bar flex items-center gap-2 px-4 py-2.5">
				<span className="w-3 h-3 rounded-full bg-red-500/80" />
				<span className="w-3 h-3 rounded-full bg-amber-400/80" />
				<span className="w-3 h-3 rounded-full bg-emerald-400/80" />
				<span className="flex-1 text-center text-slate-400 text-xs tracking-wide">
					~/topics/{topic.id}
				</span>
				{/* balances the traffic lights so the label stays centered */}
				<span className="w-[42px]" aria-hidden="true" />
			</div>

			<div className="px-4 md:px-5 py-4 text-slate-100 text-left">
				<div className="text-slate-300">
					<span className="text-emerald-400">❯</span>{" "}
					<span className="text-slate-100">cat {cmd}.md</span>
				</div>

				<div className="mt-2 font-bold" style={{ color: accent }}>
					# {topic.heading}
				</div>

				<div className="mt-3">{children}</div>

				<div className="mt-4 text-slate-300 flex items-center">
					<span className="text-emerald-400">❯</span>
					<span className="ml-2">
						{params.motif && (
							<span className="terminal-cursor" aria-hidden="true" />
						)}
					</span>
				</div>
			</div>
		</div>
	);
}
