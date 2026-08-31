import { CAREER_TIMELINE } from "./career";
import { STORY_BY_SLUG } from "./stories";

/*
 * The coding subpage: one year ladder from 1995 to today, plus the rack of
 * every tool that was running in the year you are standing in. Design locked in
 * .prototypes/coding-subpage-years.html.
 *
 * PROSE RULE: every beat and every opinion in this file is Alper's own text,
 * taken from a source that already exists in the repo. Nothing here is written
 * for the page.
 *   - The five pre-2005 stops read straight off `stories.ts` (caption, beats
 *     and age all derived, so the two can never drift apart).
 *   - The seven job stops read their beats off `career.ts` (desc, then the
 *     highlight story where the entry carries one).
 *   - The last stops quote `CODING_TEASER` (topics.ts, pinned by a drift
 *     test) and the STACK_* lines below. The STACK_* lines came over verbatim
 *     from the retired Tech Stack band (TechStackContent.tsx) and are
 *     canonical HERE now - this file is their only source.
 * Three stops carry a caption and a rack change but no prose, because no source
 * text covers them yet. They read fine - a caption IS the entry for its year.
 *
 * BIRTHDAY: 5 November 1982. It falls late in the year, so for almost all of a
 * calendar year the age is (year - 1983), and that is the age the page shows.
 * The five pre-2005 stops therefore land on the years that match the ages the
 * prose itself states: 12 -> 1995, 16 -> 1999, 18 -> 2001, 19 -> 2002,
 * 20 -> 2003.
 */

const AGE_BASE = 1983;

/** The age the page shows for a year. See the birthday note above. */
export const ageInYear = (year: number) => year - AGE_BASE;

/** The year a stated age falls in - the inverse of `ageInYear`. */
export const yearOfAge = (age: number) => AGE_BASE + age;

export const CODING_Y0 = 1995;
export const CODING_Y1 = 2026;

export const CODING_YEARS: number[] = Array.from(
	{ length: CODING_Y1 - CODING_Y0 + 1 },
	(_, i) => CODING_Y0 + i,
);

export type ToolGroup =
	| "language"
	| "markup"
	| "framework"
	| "data"
	| "infra"
	| "elsewhere";

/** Rail order in the rack, top to bottom. */
export const TOOL_GROUP_ORDER: readonly ToolGroup[] = [
	"language",
	"markup",
	"framework",
	"data",
	"infra",
	"elsewhere",
];

/*
 * Which rail a tool sits on. A tool with no entry falls to "elsewhere", so a
 * new name in a rack list still shows up instead of disappearing.
 */
export const TOOL_GROUP: Record<string, ToolGroup> = {
	QBasic: "language",
	"Turbo Pascal": "language",
	Delphi: "language",
	JavaScript: "language",
	PHP: "language",
	Java: "language",
	TypeScript: "language",
	Python: "language",
	Rust: "language",

	HTML: "markup",
	CSS: "markup",
	Tailwind: "markup",

	Qooxdoo: "framework",
	Play: "framework",
	Angular: "framework",
	"Vue.js": "framework",
	React: "framework",
	Redux: "framework",
	"Tanstack Start": "framework",
	GraphQL: "framework",
	Highcharts: "framework",
	D3: "framework",

	MySQL: "data",
	PostgreSQL: "data",
	MongoDB: "data",
	Redis: "data",
	CrateDB: "data",
	Convex: "data",
	SpacetimeDB: "data",

	AWS: "infra",
	Kubernetes: "infra",
	Hetzner: "infra",
	Coolify: "infra",
	Windmill: "infra",
	Posthog: "infra",
	Grafana: "infra",
	Namecheap: "infra",

	FastTracker: "elsewhere",
	IRC: "elsewhere",
	ICQ: "elsewhere",
};

export type CodingStop = {
	year: number;
	/** Terse label for the year. Always present - it IS the entry for its year. */
	cap: string;
	beats: string[];
	/** A held opinion, set in the serif italic. */
	op?: string;
	/** Tools that start running this year. */
	rack: string[];
	/** Tools that go dark this year. */
	dark: string[];
};

/*
 * The beats of a job stop, straight off the career entry: the description
 * first, then the highlight story where the entry carries one. Matched on the
 * start of `company`, because the field also holds the location.
 */
function careerBeats(company: string): string[] {
	const entry = CAREER_TIMELINE.find((e) => e.company.startsWith(company));
	if (!entry) return [];
	return entry.highlight ? [entry.desc, entry.highlight.story] : [entry.desc];
}

/*
 * The pre-2005 stops, derived from the early-days eras so the two can never
 * drift. The era's own stated age picks the year.
 */
const EARLY_RACKS: { rack: string[]; dark: string[] }[] = [
	{ rack: ["QBasic", "Turbo Pascal", "Delphi"], dark: [] },
	{ rack: ["HTML", "CSS", "JavaScript"], dark: [] },
	{ rack: ["FastTracker"], dark: ["QBasic", "Turbo Pascal", "Delphi"] },
	/* A stop with nothing to rack, on purpose. The rack has to survive one. */
	{ rack: [], dark: [] },
	{ rack: ["IRC", "ICQ"], dark: ["FastTracker"] },
];

const EARLY_STOPS: CodingStop[] = STORY_BY_SLUG["early-days"].eras.map(
	(era, i) => ({
		year: yearOfAge(Number.parseInt(era.age, 10)),
		cap: era.caption,
		beats: era.beats,
		rack: EARLY_RACKS[i]?.rack ?? [],
		dark: EARLY_RACKS[i]?.dark ?? [],
	}),
);

/* Verbatim from CODING_TEASER (src/data/topics.ts). Pinned by test. */
const TEASER_PRACTICES =
	"Even in the age of LLM's I'm still driven by following good coding practices.";
const TEASER_CRAFT =
	"The art of crafting an elegant solution to a complex problem just makes me happy. A good session is when I'm fully locked in and ship a new version at the end.";

/* Canonical here since the Tech Stack band retired (see the prose rule). */
const STACK_HETZNER =
	"Hetzner Cloud is the best compromise between cost, performance and value.";
const STACK_NEW_APP =
	"When I spin up a new web apps, I usually build it with Tanstack Start, Tailwind and Convex.";

/**
 * The closing paragraph of the coding topic - the self-host stance. Rendered
 * twice from these parts: as the last paragraph of the main page's Coding
 * band, and as the serif closing under the subpage timeline (it used to be
 * the 2022 stop's prose). Split into parts because "serverless horrors" is a
 * link, and a data file cannot hold JSX.
 */
export const CODING_CLOSING = {
	pre: "I self-host as much as I can to avoid ",
	link: { label: "serverless horrors", href: "https://serverlesshorrors.com" },
	post: `. ${STACK_HETZNER}`,
} as const;

export const CODING_STOPS: CodingStop[] = [
	...EARLY_STOPS,

	{
		year: 2005,
		cap: "First paid work",
		beats: careerBeats("miobambino"),
		rack: ["PHP", "MySQL"],
		dark: [],
	},
	{
		year: 2007,
		cap: "My own agency",
		beats: careerBeats("Acama"),
		rack: ["Java"],
		dark: ["IRC"],
	},
	{
		year: 2009,
		cap: "Agency only",
		beats: [],
		rack: [],
		dark: ["ICQ"],
	},
	{
		year: 2012,
		cap: "Into product",
		beats: careerBeats("Joulex"),
		rack: ["Qooxdoo", "Play", "PostgreSQL"],
		dark: ["PHP", "Java"],
	},
	{
		year: 2013,
		cap: "Big tech, one big app",
		beats: careerBeats("Cisco"),
		rack: ["Angular", "GraphQL", "Highcharts", "D3"],
		dark: ["Qooxdoo", "Play", "MySQL"],
	},
	{
		year: 2016,
		cap: "The framework churn",
		beats: [],
		rack: ["Vue.js"],
		dark: ["Angular"],
	},
	{
		year: 2019,
		cap: "Types, finally",
		beats: careerBeats("enercast"),
		rack: ["TypeScript", "React", "Redux"],
		dark: ["Vue.js", "GraphQL", "D3"],
	},
	/* One tick for both 2021 entries - they start in the same year. */
	{
		year: 2021,
		cap: "Two languages, and a team",
		beats: [...careerBeats("Spirable"), ...careerBeats("Genius")],
		rack: ["Python", "AWS", "Kubernetes"],
		dark: ["Redux", "Highcharts"],
	},
	/* No prose on purpose: the self-host stance moved to CODING_CLOSING, the
	   last paragraph of the block. The caption carries the year. */
	{
		year: 2022,
		cap: "Bringing it home",
		beats: [],
		rack: ["Hetzner", "Coolify", "MongoDB", "Redis"],
		dark: [],
	},
	{
		year: 2024,
		cap: "Millions of rows",
		beats: [],
		rack: ["Windmill", "CrateDB", "Rust"],
		dark: [],
	},
	{
		year: 2025,
		cap: "The current shape",
		beats: [STACK_NEW_APP],
		rack: [
			"Tanstack Start",
			"Tailwind",
			"Convex",
			"SpacetimeDB",
			"Posthog",
			"Grafana",
			"Namecheap",
		],
		dark: ["PostgreSQL"],
	},
	/* Second stop with nothing to rack, on purpose: the closing opinion has no
	   new tools. */
	{
		year: 2026,
		cap: "How I work now",
		beats: [TEASER_PRACTICES],
		op: TEASER_CRAFT,
		rack: [],
		dark: [],
	},
];

export type CodingUnit = {
	name: string;
	group: ToolGroup;
	from: number;
	/** null while the tool is still running. */
	to: number | null;
};

/*
 * One unit per tool, its span read off the stop list: `from` is the stop that
 * racked it, `to` the stop that turned it dark.
 */
export const CODING_UNITS: CodingUnit[] = (() => {
	const units: CodingUnit[] = [];
	const byName = new Map<string, CodingUnit>();
	for (const stop of CODING_STOPS) {
		for (const name of stop.rack) {
			const unit: CodingUnit = {
				name,
				group: TOOL_GROUP[name] ?? "elsewhere",
				from: stop.year,
				to: null,
			};
			units.push(unit);
			byName.set(name, unit);
		}
		for (const name of stop.dark) {
			const unit = byName.get(name);
			if (unit) unit.to = stop.year;
		}
	}
	return units;
})();

export type CodingRail = { group: ToolGroup; units: CodingUnit[] };

export const CODING_RAILS: CodingRail[] = TOOL_GROUP_ORDER.map((group) => ({
	group,
	units: CODING_UNITS.filter((u) => u.group === group),
})).filter((rail) => rail.units.length > 0);

export type UnitState = "empty" | "live" | "dark";

export function unitStateAt(unit: CodingUnit, year: number): UnitState {
	if (year < unit.from) return "empty";
	if (unit.to !== null && year >= unit.to) return "dark";
	return "live";
}

/** The span label on a rail row. An open span keeps its trailing dash. */
export const unitYears = (unit: CodingUnit) =>
	unit.to === null ? `${unit.from}-` : `${unit.from}-${unit.to}`;

/** Index of the stop you are standing in - the last one at or before `year`. */
export function stopIndexAt(year: number): number {
	let index = 0;
	for (let i = 0; i < CODING_STOPS.length; i++) {
		const stop = CODING_STOPS[i];
		if (stop && stop.year <= year) index = i;
	}
	return index;
}

export function unitCountsAt(year: number): { live: number; dark: number } {
	let live = 0;
	let dark = 0;
	for (const unit of CODING_UNITS) {
		const state = unitStateAt(unit, year);
		if (state === "live") live++;
		if (state === "dark") dark++;
	}
	return { live, dark };
}

/** Years that carry a stop, for the axis tick treatment. */
export const CODING_STOP_YEARS: ReadonlySet<number> = new Set(
	CODING_STOPS.map((s) => s.year),
);
