import type { InnerRenderProps } from "../types";
import { DENSITY_MAXW } from "./shared";

/*
 * Inner: agent-console - "a coding-agent run" (the chat concept's winner,
 * wayfinder #14: violet console + the chat elements merged in).
 *
 * The topic seated as an agent run à la Claude Code: a mono console header
 * (wordmark + run number), the heading as the task line, an optional block
 * of a "thought for Ns" reasoning pill + tool-call steps (read / grep /
 * edit rows with check marks - the agentic loop made visible), the topic's
 * REAL body as the final answer block, a status footer (done · tools ·
 * tokens), and optional chat chrome from the ai-sdk Elements patterns
 * (params.input): a muted actions row after the answer + an "ask a
 * follow-up…" prompt-input footer with model chip and accent submit.
 * Signature toggle (params.steps) = the reasoning + tool-call block;
 * theming knob (finish) = the console surface (obsidian / violet /
 * matrix), handed to the `.acon-*` classes as --acon-* inline vars (the
 * timecard --tc-* convention). The prompt glyph, running lamp and submit
 * button read the accent prop only - never the finish.
 */

/** finish → console surface palette. */
const FINISHES: Record<
	InnerRenderProps<"agent-console">["params"]["finish"],
	{ bg: string; ink: string; dim: string; border: string; ok: string }
> = {
	obsidian: {
		bg: "rgba(10, 12, 16, 0.95)",
		ink: "#e7eaf0",
		dim: "#7d8595",
		border: "rgba(125, 133, 149, 0.25)",
		ok: "#4ade80",
	},
	violet: {
		bg: "rgba(20, 12, 32, 0.95)",
		ink: "#ece5f7",
		dim: "#9d8fc0",
		border: "rgba(157, 143, 192, 0.28)",
		ok: "#c4b5fd",
	},
	matrix: {
		bg: "rgba(5, 14, 9, 0.95)",
		ink: "#d8f3e0",
		dim: "#5f8a6d",
		border: "rgba(95, 138, 109, 0.3)",
		ok: "#34d399",
	},
};

/** The agentic loop made visible - fixed console chrome. */
const STEPS = [
	{ id: "read", label: "read", detail: "src/data/topics.ts" },
	{ id: "grep", label: "grep", detail: '"agentic workflow"' },
	{ id: "edit", label: "edit", detail: "topics.ts (+4 −1)" },
] as const;

const ACTIONS = [
	{ id: "copy", glyph: "⧉" },
	{ id: "retry", glyph: "↻" },
	{ id: "good", glyph: "✓" },
] as const;

export function AgentConsoleCluster({
	topic,
	index,
	params,
	accent,
	children,
}: InnerRenderProps<"agent-console">) {
	const f = FINISHES[params.finish];

	return (
		<div className={`w-full ${DENSITY_MAXW[params.density]}`}>
			<div
				className="acon text-left font-mono"
				style={
					{
						"--acon-bg": f.bg,
						"--acon-ink": f.ink,
						"--acon-dim": f.dim,
						"--acon-border": f.border,
						"--acon-ok": f.ok,
						"--acon-accent": accent,
					} as React.CSSProperties
				}
			>
				{/* console header - wordmark + run number */}
				<div className="acon-head flex items-center justify-between gap-4 px-5 md:px-7 py-3 text-[11px] uppercase tracking-[0.25em]">
					<span className="flex items-center gap-2.5">
						<span className="acon-lamp" aria-hidden="true" />
						claude code
					</span>
					<span className="acon-run">
						run {String(index + 1).padStart(2, "0")}
					</span>
				</div>

				<div className="px-5 md:px-7 pb-6">
					{/* task line - prompt glyph + the heading as the task */}
					<div className="mt-5 flex items-baseline gap-3">
						<span
							className="acon-prompt text-2xl md:text-4xl"
							aria-hidden="true"
						>
							❯
						</span>
						<h2 className="acon-task font-black tracking-tight text-4xl md:text-6xl leading-[0.95]">
							{topic.heading}
						</h2>
					</div>

					{/* the run - reasoning pill + tool-call steps */}
					{params.steps && (
						<>
							<div className="acon-reason mt-6 flex items-center gap-2.5 text-xs w-fit">
								<span className="acon-reason-orb" aria-hidden="true" />
								<span>thought for {index + 2}s</span>
								<span className="acon-reason-chev" aria-hidden="true">
									⌄
								</span>
							</div>
							<div className="acon-steps mt-4 text-xs md:text-sm">
								{STEPS.map((s) => (
									<div
										key={s.id}
										className="acon-step flex items-center gap-3 py-1.5"
									>
										<span className="acon-check" aria-hidden="true">
											✓
										</span>
										<span className="acon-tool">{s.label}</span>
										<span className="acon-detail truncate">{s.detail}</span>
									</div>
								))}
							</div>
						</>
					)}

					{/* the answer block - the topic's REAL body */}
					<div
						className={`acon-answer font-sans ${params.steps ? "mt-5" : "mt-6"}`}
					>
						{children}
					</div>

					{/* actions row - muted ghost icons (chat chrome) */}
					{params.input && (
						<div className="acon-actions mt-5 flex items-center gap-1.5">
							{ACTIONS.map((a) => (
								<span key={a.id} className="acon-action" aria-hidden="true">
									{a.glyph}
								</span>
							))}
						</div>
					)}

					{/* status footer */}
					<div className="acon-status mt-6 flex items-center gap-2.5 text-[11px] uppercase tracking-[0.2em]">
						<span className="acon-status-dot" aria-hidden="true" />
						done · 3 tools · {(index + 1) * 3}.2k tokens
					</div>

					{/* prompt input - ask a follow-up (chat chrome) */}
					{params.input && (
						<div className="acon-input mt-6">
							<div className="acon-input-placeholder text-xs md:text-sm px-4 pt-3.5 pb-7">
								❯ ask a follow-up…
							</div>
							<div className="flex items-center justify-end gap-3 px-3 pb-3">
								<span className="acon-model text-[11px]">claude&ensp;▾</span>
								<span className="acon-send" aria-hidden="true">
									↑
								</span>
							</div>
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
