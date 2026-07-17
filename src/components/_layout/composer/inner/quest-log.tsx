import type { QuestLog } from "../../../../data/topics";
import type { InnerRenderProps } from "../types";
import { DENSITY_MAXW } from "./shared";

/*
 * Inner: quest-log - "main quest."
 *
 * A modern RPG quest journal is the frame, driven by the topic's own
 * `questLog` data (honest shorthand for its prose - see the QuestLog contract):
 * a "MAIN QUEST" eyebrow + level chip, the heading as the quest name, a stats
 * strip (hours played + a completion bar, lifted from the steam-library frame),
 * the tracked-objectives checklist ABOVE the prose, the topic's REAL body seated
 * bare as the quest briefing, then a buffs panel (WoW-style square buff tiles -
 * glyph + the level as the stack count) + a party inventory row of collected
 * characters. When a topic has no `questLog` the
 * frame falls back to generic journal chrome so it still renders anywhere.
 * All chrome is deterministic and aria-hidden (the prose in the body carries the
 * accessible content). Signature toggle (params.objectives) = the objectives
 * checklist; theming knob (journal) recolors via the `.qlog-*` inline vars
 * (--qlog-ink / --qlog-soft / --qlog-line - the sbb --sbb-* convention).
 */

/** journal → { ink, soft, line } - accent ink, faded wash, hairline color. */
const JOURNALS: Record<
	InnerRenderProps<"quest-log">["params"]["journal"],
	{ ink: string; soft: string; line: string }
> = {
	arcane: { ink: "#a78bfa", soft: "#171430", line: "#3a2f66" },
	ember: { ink: "#fbbf24", soft: "#241a0f", line: "#5a3f1a" },
	verdant: { ink: "#4ade80", soft: "#0f2018", line: "#1f4d38" },
};

/** Generic journal fallback for any topic without its own questLog data. */
const FALLBACK: QuestLog = {
	level: 20,
	hours: "999+",
	completion: { label: "Completion", pct: 42 },
	objectives: [
		{ label: "Reach the next checkpoint", status: "done" },
		{ label: "Clear the region", status: "active" },
		{ label: "Return to camp", status: "todo" },
	],
	skills: [
		{ label: "Exploration", level: 80 },
		{ label: "Persistence", level: 55 },
	],
	party: [],
};

const CHECK: Record<QuestLog["objectives"][number]["status"], string> = {
	done: "☑",
	active: "◈",
	todo: "☐",
};

export function QuestLogCluster({
	topic,
	params,
	children,
}: InnerRenderProps<"quest-log">) {
	const j = JOURNALS[params.journal];
	const q = topic.questLog ?? FALLBACK;
	const level = q.level ?? 20;

	return (
		<div className={`w-full ${DENSITY_MAXW[params.density]}`}>
			<div
				className="qlog relative text-left"
				style={
					{
						"--qlog-ink": j.ink,
						"--qlog-soft": j.soft,
						"--qlog-line": j.line,
					} as React.CSSProperties
				}
			>
				<div className="relative px-6 pt-5 md:px-9">
					<div className="flex items-center justify-between gap-4">
						<span
							className="qlog-eyebrow inline-flex items-center gap-2 text-[11px] font-bold tracking-[0.22em]"
							aria-hidden="true"
						>
							<span className="qlog-diamond">◆</span> MAIN QUEST
						</span>
						<span
							className="qlog-level text-[11px] font-bold"
							aria-hidden="true"
						>
							Lv. {level}
						</span>
					</div>
					<h2 className="qlog-title mt-2 font-bold text-3xl leading-none tracking-tight md:text-5xl">
						{topic.heading}
					</h2>

					{/* stats strip - hours played + completion bar (steam-library lift) */}
					<div
						className="qlog-stats relative mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-[12px] font-semibold"
						aria-hidden="true"
					>
						<span className="qlog-hours">⏱ {q.hours} hrs played</span>
						<span className="qlog-completion">
							<span className="qlog-completion-label">
								{q.completion.label} {q.completion.pct}%
							</span>
							<span className="qlog-bar">
								<span
									className="qlog-bar-fill"
									style={{ width: `${q.completion.pct}%` }}
								/>
							</span>
						</span>
					</div>
				</div>

				{/* tracked objectives - ABOVE the prose */}
				{params.objectives && (
					<div className="relative px-6 pt-5 md:px-9" aria-hidden="true">
						<span className="qlog-section-label">Objectives</span>
						<ul className="qlog-objectives mt-2 space-y-1.5 text-[13px]">
							{q.objectives.map((o) => (
								<li
									key={o.label}
									className={`qlog-obj flex items-center gap-2.5 qlog-obj--${o.status}`}
								>
									<span className="qlog-check">{CHECK[o.status]}</span>
									<span>{o.label}</span>
								</li>
							))}
						</ul>
					</div>
				)}

				{/* the topic's REAL body - seated bare as the quest briefing */}
				<div className="relative px-6 py-6 md:px-9">{children}</div>

				{/* skills panel + party inventory footer */}
				<div
					className="qlog-foot relative mx-6 mb-5 grid gap-5 pt-4 md:mx-9 sm:grid-cols-2"
					aria-hidden="true"
				>
					<div className="qlog-skills">
						<span className="qlog-section-label">Buffs</span>
						{/* WoW-style buff tiles: square icon, the level as the stack count */}
						<ul className="mt-2 flex flex-wrap gap-2.5">
							{q.skills.map((s) => (
								<li key={s.label} className="qlog-buff">
									<span className="qlog-buff-tile">
										<span className="qlog-buff-icon">
											{s.icon ?? s.label.charAt(0)}
										</span>
										<span className="qlog-buff-count">{s.level}</span>
									</span>
									<span className="qlog-buff-label">{s.label}</span>
								</li>
							))}
						</ul>
					</div>

					{q.party.length > 0 && (
						<div className="qlog-party">
							<span className="qlog-section-label">Party</span>
							<div className="mt-2 flex flex-wrap gap-1.5">
								{q.party.map((name) => (
									<span key={name} className="qlog-slot">
										<span className="qlog-slot-mark">{name.charAt(0)}</span>
										{name}
									</span>
								))}
							</div>
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
