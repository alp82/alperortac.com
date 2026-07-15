import type { InnerRenderProps } from "../types";
import { DENSITY_MAXW } from "./shared";

/*
 * Inner: code-editor
 *
 * A Modern IDE WINDOW (terminal-family sibling, immersive screen): a tab bar
 * with one active `<id>.md` tab (accent underline) and one dim ghost tab, the
 * themed heading as a markdown H1 token line (`#` in the theme's keyword
 * color, the heading text in accent), the topic's REAL body INSIDE the
 * window, and a footer status bar. Signature toggle (params.gutter) = the
 * left line-number gutter beside the chrome, continuing as a thin gutter rule
 * beside the body - the numbers never print over or interleave with the
 * prose. `theme` hands its palette to the `.editor-*` classes as --ed-bg /
 * --ed-ink / --ed-muted / --ed-keyword inline vars (timecard --tc-*
 * convention) - CSS reads only the vars. --ed-muted is decorative-only
 * (status bar, ghost tab, gutter numbers); --ed-ink clears WCAG 4.5:1 on
 * --ed-bg per theme, and --ed-muted clears 4.5:1 against every local
 * surface it actually paints on (the 8%/6% ink-mix tabs/status strips,
 * the lightest of which sets the floor) with no opacity dimming layered
 * on top.
 */

/** theme → { bg, ink, muted, keyword } - handed to CSS as --ed-* vars. */
const THEMES: Record<
	InnerRenderProps<"code-editor">["params"]["theme"],
	{ bg: string; ink: string; muted: string; keyword: string }
> = {
	onedark: {
		bg: "#282c34",
		ink: "#abb2bf",
		muted: "#98a0af",
		keyword: "#c678dd",
	},
	nord: {
		bg: "#2e3440",
		ink: "#d8dee9",
		muted: "#a5afc7",
		keyword: "#81a1c1",
	},
	monokai: {
		bg: "#272822",
		ink: "#f8f8f2",
		muted: "#a8a494",
		keyword: "#f92672",
	},
};

const GUTTER_LINES = [1, 2, 3];

export function CodeEditorCluster({
	topic,
	params,
	accent,
	children,
}: InnerRenderProps<"code-editor">) {
	const t = THEMES[params.theme];

	return (
		<div
			className={`editor-pane relative w-full font-mono text-sm md:text-[15px] leading-relaxed ${DENSITY_MAXW[params.density]}`}
			style={
				{
					"--ed-bg": t.bg,
					"--ed-ink": t.ink,
					"--ed-muted": t.muted,
					"--ed-keyword": t.keyword,
				} as React.CSSProperties
			}
		>
			<div className="editor-tabs flex items-stretch text-xs">
				<span
					className="editor-tab editor-tab-active px-4 py-2"
					style={{ boxShadow: `inset 0 -2px 0 ${accent}` }}
				>
					{topic.id}.md
				</span>
				<span
					className="editor-tab editor-tab-ghost px-4 py-2"
					aria-hidden="true"
				>
					notes.md
				</span>
			</div>

			<div className="flex px-4 md:px-5 pt-4 text-left">
				{params.gutter && (
					<div
						className="editor-gutter flex-none pr-3 md:pr-4 text-right text-xs leading-tight"
						aria-hidden="true"
					>
						{GUTTER_LINES.map((n) => (
							<span key={n} className="editor-gutter-line block">
								{n}
							</span>
						))}
					</div>
				)}
				<h2 className="min-w-0 font-bold text-2xl md:text-4xl leading-tight">
					<span className="editor-heading-hash" style={{ color: t.keyword }}>
						#
					</span>{" "}
					<span className="editor-heading-text" style={{ color: accent }}>
						{topic.heading}
					</span>
				</h2>
			</div>

			<div className="flex px-4 md:px-5 pt-3 pb-4 text-left">
				{params.gutter && (
					<span
						className="editor-gutter-rule flex-none self-stretch mr-3 md:mr-4"
						aria-hidden="true"
					/>
				)}
				<div className="min-w-0 flex-1">{children}</div>
			</div>

			<div
				className="editor-status px-4 md:px-5 py-1.5 text-left text-xs"
				aria-hidden="true"
			>
				main* · UTF-8 · Ln 1, Col 1
			</div>
		</div>
	);
}
