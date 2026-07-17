import type { InnerRenderProps } from "../types";
import { DENSITY_MAXW } from "./shared";

/*
 * Inner: chat-thread - "assistant conversation" (AI Elements patterns).
 *
 * A modern AI-chat transcript seats the topic, following the ai-sdk Elements
 * design language: a slim header (assistant wordmark + model chip), the
 * heading as the conversation title, the prompt as a constrained
 * secondary-background user bubble (right-aligned), an optional collapsed
 * "Thought for Ns" reasoning strip, the topic's REAL body seated FULL-WIDTH
 * as the assistant reply (role row + content, no bubble - Elements gives
 * assistant turns the full measure), a muted actions row, and an optional
 * prompt-input footer (textarea look + toolbar + circular submit).
 *
 * Signature toggle (params.reasoning) = the reasoning strip; params.input =
 * the prompt-input footer; theming knob (tone) = the transcript surface
 * (midnight / paper / violet), handed to the `.chat-*` classes as --chat-*
 * inline vars (the timecard --tc-* convention). The user bubble + submit
 * button read the accent prop only - never the tone.
 */

/** tone → transcript surface palette. */
const TONES: Record<
	InnerRenderProps<"chat-thread">["params"]["tone"],
	{ bg: string; ink: string; dim: string; soft: string; border: string }
> = {
	midnight: {
		bg: "rgba(9, 14, 27, 0.94)",
		ink: "#e6ecf7",
		dim: "#8b98b3",
		soft: "rgba(255, 255, 255, 0.05)",
		border: "rgba(148, 163, 184, 0.22)",
	},
	paper: {
		bg: "#fbfaf7",
		ink: "#26221b",
		dim: "#8a8375",
		soft: "rgba(38, 34, 27, 0.045)",
		border: "rgba(38, 34, 27, 0.15)",
	},
	violet: {
		bg: "rgba(22, 13, 36, 0.94)",
		ink: "#ede7f8",
		dim: "#a394c4",
		soft: "rgba(216, 180, 254, 0.07)",
		border: "rgba(196, 167, 231, 0.25)",
	},
};

const ACTIONS = [
	{ id: "copy", glyph: "⧉" },
	{ id: "retry", glyph: "↻" },
	{ id: "good", glyph: "✓" },
] as const;

export function ChatThreadCluster({
	topic,
	index,
	params,
	accent,
	children,
}: InnerRenderProps<"chat-thread">) {
	const t = TONES[params.tone];

	return (
		<div className={`w-full ${DENSITY_MAXW[params.density]}`}>
			<div
				className="chat text-left"
				style={
					{
						"--chat-bg": t.bg,
						"--chat-ink": t.ink,
						"--chat-dim": t.dim,
						"--chat-soft": t.soft,
						"--chat-border": t.border,
						"--chat-accent": accent,
					} as React.CSSProperties
				}
			>
				{/* header - assistant wordmark + model chip */}
				<div className="chat-head flex items-center justify-between gap-4 px-5 md:px-7 py-3">
					<span className="chat-wordmark flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.25em]">
						<span className="chat-spark" aria-hidden="true">
							✳
						</span>
						assistant
					</span>
					<span className="chat-model font-mono text-[11px]">
						claude&ensp;▾
					</span>
				</div>

				<div className="px-5 md:px-7 pb-6">
					{/* conversation title */}
					<h2 className="chat-title font-black tracking-tight text-4xl md:text-6xl leading-[0.95] mt-5">
						{topic.heading}
					</h2>

					{/* user turn - constrained bubble, right-aligned */}
					<div className="mt-7 flex justify-end">
						<span className="chat-user-bubble text-sm md:text-base px-4 py-2.5">
							tell me about {topic.heading.toLowerCase()}
						</span>
					</div>

					{/* reasoning strip - collapsed "thought for Ns" */}
					{params.reasoning && (
						<div className="chat-reasoning mt-6 flex items-center gap-2.5 font-mono text-xs">
							<span className="chat-reasoning-orb" aria-hidden="true" />
							<span>Thought for {index + 2}s</span>
							<span className="chat-reasoning-chev" aria-hidden="true">
								⌄
							</span>
						</div>
					)}

					{/* assistant turn - role row + FULL-WIDTH reply, no bubble */}
					<div className={params.reasoning ? "mt-4" : "mt-6"}>
						<div className="chat-role flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.2em]">
							<span className="chat-spark" aria-hidden="true">
								✳
							</span>
							assistant
						</div>
						<div className="chat-reply mt-3">{children}</div>

						{/* actions row - muted ghost icons */}
						<div className="chat-actions mt-5 flex items-center gap-1.5">
							{ACTIONS.map((a) => (
								<span key={a.id} className="chat-action" aria-hidden="true">
									{a.glyph}
								</span>
							))}
						</div>
					</div>

					{/* prompt input - bordered box, toolbar + circular submit */}
					{params.input && (
						<div className="chat-input mt-7">
							<div className="chat-input-placeholder text-sm px-4 pt-3.5 pb-8">
								Ask a follow-up…
							</div>
							<div className="chat-input-bar flex items-center justify-between px-3 pb-3">
								<span className="chat-input-plus font-mono" aria-hidden="true">
									＋
								</span>
								<span className="flex items-center gap-3">
									<span className="chat-model font-mono text-[11px]">
										claude&ensp;▾
									</span>
									<span className="chat-send" aria-hidden="true">
										↑
									</span>
								</span>
							</div>
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
