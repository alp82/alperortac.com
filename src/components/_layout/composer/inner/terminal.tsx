import type { InnerRenderProps } from "../types";
import { DENSITY_MAXW } from "./shared";

/*
 * Inner: terminal
 *
 * A terminal WINDOW that frames the content as a card: a title bar (glass
 * traffic lights + a `~/topics/<id>` label), a session line
 * `alp@site:~/topics/<id>` and a `❯ cat <id>.md` prompt, the themed heading
 * as a display-scale `# <heading>` comment over a dim rule, then the topic's
 * REAL body INSIDE the window, closed by a trailing prompt with the blinking
 * cursor. Signature toggle = the blinking cursor; `scheme` hands its palette
 * to the `.terminal-*` classes as --term-bg / --term-ink / --term-glyph /
 * --term-glow inline vars (timecard --tc-* convention) - CSS reads only the
 * vars. A static vignette + raster overlay give the pane its depth.
 */

/** scheme → { bg, ink, glyph, glow } - handed to CSS as --term-* vars. */
const SCHEMES: Record<
	InnerRenderProps<"terminal">["params"]["scheme"],
	{ bg: string; ink: string; glyph: string; glow: string }
> = {
	midnight: {
		bg: "#0c1320",
		ink: "#c8d3e6",
		glyph: "#7dd3fc",
		glow: "rgba(125, 211, 252, 0.5)",
	},
	matrix: {
		bg: "#06120a",
		ink: "#7ef0a0",
		glyph: "#22c55e",
		glow: "rgba(34, 197, 94, 0.5)",
	},
	amber: {
		bg: "#19110a",
		ink: "#ffd9a0",
		glyph: "#f59e0b",
		glow: "rgba(245, 158, 11, 0.5)",
	},
	ice: {
		bg: "#0b1622",
		ink: "#cfe8ff",
		glyph: "#38bdf8",
		glow: "rgba(56, 189, 248, 0.5)",
	},
};

/* Neutral inner shading so the traffic lights read as glass - stock-agnostic
 * by design, same rule as the timecard's shadow carve-out. */
const DOT_GLASS =
	"inset 0 1px 1.5px rgba(255, 255, 255, 0.45), inset 0 -1px 1.5px rgba(0, 0, 0, 0.35)";

export function TerminalCluster({
	topic,
	params,
	accent,
	children,
}: InnerRenderProps<"terminal">) {
	const scheme = SCHEMES[params.scheme];

	return (
		<div
			className={`terminal-pane relative w-full font-mono text-sm md:text-[15px] leading-relaxed ${DENSITY_MAXW[params.density]}`}
			style={
				{
					"--term-bg": scheme.bg,
					"--term-ink": scheme.ink,
					"--term-glyph": scheme.glyph,
					"--term-glow": scheme.glow,
				} as React.CSSProperties
			}
		>
			{/* static depth overlays - decoration only, never over the DOM tree
			    of the content (siblings, painted beneath the relative content) */}
			<div
				className="terminal-vignette"
				aria-hidden="true"
				style={{ pointerEvents: "none" }}
			/>
			<div
				className="terminal-raster"
				aria-hidden="true"
				style={{ pointerEvents: "none" }}
			/>

			<div className="terminal-bar relative flex items-center gap-2 px-4 py-2.5">
				<span
					className="terminal-dot w-3 h-3 rounded-full bg-red-500/80"
					style={{ boxShadow: DOT_GLASS }}
				/>
				<span
					className="terminal-dot w-3 h-3 rounded-full bg-amber-400/80"
					style={{ boxShadow: DOT_GLASS }}
				/>
				<span
					className="terminal-dot w-3 h-3 rounded-full"
					style={{ background: "var(--term-glyph)", boxShadow: DOT_GLASS }}
				/>
				<span className="flex-1 text-center text-xs tracking-wide opacity-80">
					~/topics/{topic.id}
				</span>
				{/* balances the traffic lights so the label stays centered */}
				<span className="w-[42px]" aria-hidden="true" />
			</div>

			<div className="relative px-4 md:px-5 py-4 text-left">
				<div className="opacity-80">alp@site:~/topics/{topic.id}</div>
				<div>
					<span className="terminal-glyph">❯</span> cat {topic.id}.md
				</div>

				<h2
					className="mt-3 font-bold text-2xl md:text-4xl leading-tight"
					style={{ color: accent, textShadow: "0 0 18px var(--term-glow)" }}
				>
					# {topic.heading}
				</h2>
				<div className="terminal-rule mt-1" aria-hidden="true">
					────────────
				</div>

				<div className="mt-3">{children}</div>

				<div className="mt-4 flex items-center">
					<span className="terminal-glyph">❯</span>
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
