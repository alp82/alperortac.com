import { Fragment } from "react";
import { countDiffChars, PrDiffContext, statSquares } from "../pr-diff";
import type { InnerRenderProps } from "../types";
import { DENSITY_MAXW } from "./shared";

/*
 * Inner: pull-request
 *
 * A PR review card (delicate chrome): a header band with mono branch chips
 * `alp:feat/<id> → main` and a state badge, the heading as the PR title with
 * a dim lucky number (`#<prDiff.number>`, falling back to `#<index+1>`), a
 * github-style stat bar (`+adds -dels` counts + 5-square meter) whose counts
 * are HONESTLY derived from the topic's own teaser + prDiff replacements via
 * the pure pr-diff engine, the topic's REAL body seated clear in the middle
 * (wrapped in PrDiffContext so a diff-aware body can render the word-diff -
 * the provider adds no DOM node), and (when params.checks) a footer of
 * connected pipeline stage bubbles (ci - lint - tests). Nothing prints over
 * the prose.
 * The card is STATE-driven, not stock-driven: paper/ink are fixed constants
 * handed to the `.pr-*` classes as --pr-paper / --pr-ink inline vars (the
 * same deliberate J3 carve-out nameplate gets for being accent-driven), and
 * the add/del greens-reds ride along as fixed --pr-add / --pr-del vars; the
 * state badge colors come from records applied inline in the component
 * (terminal SCHEMES convention), never as CSS literals.
 */

/* Fixed card constants - identical across all three states by design. */
const PR_PAPER = "#f6f8fa";
const PR_INK = "#1f2328";

/** state → { label, badge } - applied inline on the state badge. */
const STATE: Record<
	InnerRenderProps<"pull-request">["params"]["state"],
	{ label: string; badge: string }
> = {
	open: { label: "Open", badge: "#1a7f37" },
	merged: { label: "Merged", badge: "#8250df" },
	draft: { label: "Draft", badge: "#59636e" },
};

const STAT_GREEN = "#2da44e";
const STAT_RED = "#cf222e";

const CHECKS = ["ci", "lint", "tests"] as const;

/** Stable keys for the always-5 stat squares (positional by design). Kept as
 * an explicit tuple rather than a compound `${kind}-${i}` key: biome's
 * noArrayIndexKey rule flags any key expression that references the map
 * index, even embedded in a template literal, so a fixed lookup array is the
 * clean-lint form here. */
const SQUARE_KEYS = ["sq1", "sq2", "sq3", "sq4", "sq5"] as const;

export function PullRequestCluster({
	topic,
	index,
	params,
	children,
}: InnerRenderProps<"pull-request">) {
	const st = STATE[params.state];
	const replacements = topic.prDiff?.replacements ?? null;
	const { adds, dels } = countDiffChars(topic.teaser ?? "", replacements ?? []);
	const squareKinds = statSquares(adds, dels);

	return (
		<div className={`w-full ${DENSITY_MAXW[params.density]}`}>
			<div
				className="pr-card text-left"
				style={
					{
						"--pr-paper": PR_PAPER,
						"--pr-ink": PR_INK,
						"--pr-add": STAT_GREEN,
						"--pr-del": STAT_RED,
						// base surface (backgroundColor) now comes from .pr-card in CSS,
						// which applies the site-wide --band-shell-alpha translucency (#40)
						color: PR_INK,
					} as React.CSSProperties
				}
			>
				{/* header band - branch chip, state badge, title + number, stat bar */}
				<div className="pr-head px-6 md:px-8 pt-5 pb-4">
					<div className="flex flex-wrap items-center gap-3">
						<span className="pr-branch-chip font-mono text-xs">
							alp:feat/{topic.id} → main
						</span>
						<span
							className="pr-state-badge text-xs font-semibold"
							style={{ backgroundColor: st.badge, color: "#ffffff" }}
						>
							{st.label}
						</span>
					</div>
					<div className="mt-3 flex flex-wrap items-baseline gap-x-3">
						<h2 className="pr-heading font-bold text-3xl md:text-5xl leading-tight">
							{topic.heading}
						</h2>
						<span className="pr-number font-mono text-lg md:text-2xl">
							#{topic.prDiff?.number ?? index + 1}
						</span>
					</div>
					<span
						className="pr-stat-bar mt-3 flex items-center gap-2.5"
						aria-hidden="true"
					>
						<span className="pr-stat-count pr-stat-count--add font-mono text-xs">
							+{adds}
						</span>
						<span className="pr-stat-count pr-stat-count--del font-mono text-xs">
							-{dels}
						</span>
						<span className="pr-stat-squares">
							{SQUARE_KEYS.map((key, i) => (
								<span
									key={key}
									className={`pr-stat-sq pr-stat-sq--${squareKinds[i]}`}
								/>
							))}
						</span>
					</span>
				</div>

				{/* the card's content - clear of every piece of chrome; the provider
				 * adds no DOM node, so children stay siblings of the chrome */}
				<div className="px-6 md:px-8 py-6">
					<PrDiffContext.Provider value={replacements}>
						{children}
					</PrDiffContext.Provider>
				</div>

				{/* footer - connected pipeline stages, gated ONLY by params.checks */}
				{params.checks && (
					<div className="pr-checks px-6 md:px-8 py-3 font-mono text-xs">
						<span className="inline-flex items-center">
							{CHECKS.map((name, i) => (
								<Fragment key={name}>
									{i > 0 && (
										<span className="pr-stage-connector" aria-hidden="true" />
									)}
									<span className="pr-stage">
										<span className="pr-stage-bubble" aria-hidden="true">
											✓
										</span>
										<span className="pr-stage-lbl">{name}</span>
									</span>
								</Fragment>
							))}
						</span>
					</div>
				)}
			</div>
		</div>
	);
}
