/*
 * Forge subpage pipeline model (wayfinder #30). The seven stages, which of
 * them run at each task size, and the per-stage subagent fan-out — enough to
 * demo how Forge scales work with task size. Toy numbers; tune them here to
 * match Forge's actual behavior.
 */

export type Size = "S" | "M" | "L" | "XL";

export type StageKey =
	| "intent"
	| "scout"
	| "blueprint"
	| "tests"
	| "build"
	| "review"
	| "ship";

export type Stage = {
	key: StageKey;
	emoji: string;
	label: string;
	/** What Forge does at this stage, one honest line. */
	what: string;
	/** The subagent role that fans out here (null = single orchestrator step). */
	role: "research" | "planning" | "tests" | "execution" | "review" | null;
};

export const STAGES: Stage[] = [
	{
		key: "intent",
		emoji: "🔎",
		label: "Intent",
		what: "Confirms what you actually want and interviews you until the task is unambiguous. No assumptions allowed.",
		role: null,
	},
	{
		key: "scout",
		emoji: "🧭",
		label: "Scout",
		what: "Research subagents fan out across the codebase to gather the context the task depends on.",
		role: "research",
	},
	{
		key: "blueprint",
		emoji: "📐",
		label: "Blueprint",
		what: "Planning subagents draft a plan that is, ideally, programmatically verifiable.",
		role: "planning",
	},
	{
		key: "tests",
		emoji: "🧪",
		label: "Tests",
		what: "Writes the checks first, so success is provable the moment the build is done.",
		role: "tests",
	},
	{
		key: "build",
		emoji: "🔨",
		label: "Build",
		what: "Execution subagents write the code against the blueprint and the tests.",
		role: "execution",
	},
	{
		key: "review",
		emoji: "🔬",
		label: "Review",
		what: "Review subagents check the diff back against your intent and the tests.",
		role: "review",
	},
	{
		key: "ship",
		emoji: "🚀",
		label: "Ship",
		what: "Ships once every check is green.",
		role: null,
	},
];

/** Subagents spawned per fan-out stage, scaling with task size. */
const FANOUT: Record<Size, Partial<Record<StageKey, number>>> = {
	S: { scout: 1, blueprint: 1, tests: 1, build: 1, review: 1 },
	M: { scout: 2, blueprint: 1, tests: 1, build: 2, review: 1 },
	L: { scout: 3, blueprint: 2, tests: 1, build: 3, review: 2 },
	XL: { scout: 4, blueprint: 3, tests: 2, build: 5, review: 3 },
};

export function agentsAt(size: Size, key: StageKey): number {
	return FANOUT[size][key] ?? 1;
}

/**
 * Which stages run at each size. Small is a lean two-step pass; bigger tasks
 * earn more of the pipeline. Order always follows STAGES.
 */
const STAGE_SETS: Record<Size, StageKey[]> = {
	S: ["intent", "build"],
	M: ["intent", "scout", "build", "review"],
	L: ["intent", "scout", "blueprint", "tests", "build", "review", "ship"],
	XL: ["intent", "scout", "blueprint", "tests", "build", "review", "ship"],
};

export function stagesFor(size: Size): Stage[] {
	const allowed = new Set(STAGE_SETS[size]);
	return STAGES.filter((s) => allowed.has(s.key));
}

/** Total fan-out subagents (orchestrator-only steps don't count). */
export function totalAgents(size: Size): number {
	return stagesFor(size).reduce(
		(sum, s) => sum + (s.role ? agentsAt(size, s.key) : 0),
		0,
	);
}

export const SIZE_META: Record<
	Size,
	{ label: string; blurb: string; tint: string }
> = {
	S: { label: "Small", blurb: "A quick, contained change.", tint: "#34d399" },
	M: { label: "Medium", blurb: "A feature-sized task.", tint: "#fbbf24" },
	L: {
		label: "Large",
		blurb: "Touches several moving parts.",
		tint: "#fb923c",
	},
	XL: {
		label: "Extra Large",
		blurb: "A big, multi-front effort.",
		tint: "#f87171",
	},
};
