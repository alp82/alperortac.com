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
 * Signature toggle = the blinking cursor; `scheme` recolors the pane inline.
 */

/** scheme → pane bg + mono text + prompt-glyph color (all applied inline). */
const SCHEMES: Record<
	InnerRenderProps<"terminal">["params"]["scheme"],
	{ paneBg: string; text: string; glyph: string }
> = {
	midnight: { paneBg: "#0c1320", text: "#c8d3e6", glyph: "#7dd3fc" },
	matrix: { paneBg: "#06120a", text: "#7ef0a0", glyph: "#22c55e" },
	amber: { paneBg: "#19110a", text: "#ffd9a0", glyph: "#f59e0b" },
	ice: { paneBg: "#0b1622", text: "#cfe8ff", glyph: "#38bdf8" },
};

export function TerminalCluster({
	topic,
	params,
	accent,
	children,
}: InnerRenderProps<"terminal">) {
	const cmd = topic.id.replace(/-/g, "_");
	const scheme = SCHEMES[params.scheme];

	return (
		<div
			className={`terminal-pane relative w-full font-mono text-sm md:text-[15px] leading-relaxed ${DENSITY_MAXW[params.density]}`}
			style={{ background: scheme.paneBg }}
		>
			<div className="terminal-bar flex items-center gap-2 px-4 py-2.5">
				<span className="w-3 h-3 rounded-full bg-red-500/80" />
				<span className="w-3 h-3 rounded-full bg-amber-400/80" />
				<span
					className="w-3 h-3 rounded-full"
					style={{ background: scheme.glyph }}
				/>
				<span
					className="flex-1 text-center text-xs tracking-wide"
					style={{ color: scheme.text }}
				>
					~/topics/{topic.id}
				</span>
				{/* balances the traffic lights so the label stays centered */}
				<span className="w-[42px]" aria-hidden="true" />
			</div>

			<div className="px-4 md:px-5 py-4 text-left">
				<div style={{ color: scheme.text }}>
					<span style={{ color: scheme.glyph }}>❯</span>{" "}
					<span style={{ color: scheme.text }}>cat {cmd}.md</span>
				</div>

				<div className="mt-2 font-bold" style={{ color: accent }}>
					# {topic.heading}
				</div>

				<div className="mt-3">{children}</div>

				<div className="mt-4 flex items-center" style={{ color: scheme.text }}>
					<span style={{ color: scheme.glyph }}>❯</span>
					<span className="ml-2">
						{params.cursor && (
							<span className="terminal-cursor" aria-hidden="true" />
						)}
					</span>
				</div>
			</div>
		</div>
	);
}
