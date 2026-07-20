import type { PanelKey } from "./sections";
import type { StorySlug } from "./stories";

export type ProjectSlug = Extract<
	PanelKey,
	"goodwatch" | "aistack" | "forge" | "manaschmiede"
>;
export type PersonalSlug = Extract<PanelKey, "music" | "movies" | "travel">;

export type Trigger =
	| { kind: "career" }
	| { kind: "project"; slug: ProjectSlug }
	| { kind: "personal"; slug: PersonalSlug }
	| { kind: "story"; slug: StorySlug };

export type TopicId =
	| "coding"
	| "career"
	| "ai"
	| "tech-stack"
	| "finance"
	| "family"
	| "travel"
	| "movies-tv"
	| "games"
	// The music BAND (a TopicId) happens to share its name with the music
	// PERSONAL slug, but the two are separate axes - kept a literal here so
	// widening PersonalSlug (e.g. adding "movies") never leaks new keys into
	// every Record<TopicId, ...> (IDENTITIES, TOPIC_ACCENT, clusters).
	| "music";

/**
 * One word-diff replacement point for the pull-request frame. Contract:
 * one line per replacement, `anchor` = exact word in the topic body the
 * struck-out `strike` precedes, first occurrence wins, data order need not
 * follow text order, unmatched anchors degrade silently.
 */
export type PrDiffReplacement = { strike: string; anchor: string };

/** `number` = vanity PR number (falls back to band index + 1). */
export type PrDiff = { number?: number; replacements: PrDiffReplacement[] };

/**
 * Quest-log frame data - the topic rendered as an RPG quest journal. All of
 * this is honest, playful shorthand for the topic's own prose (the objectives
 * are real ambitions, the party is the real roster of favourite characters),
 * never invented lore. Read by inner/quest-log.tsx; absent topics fall back to
 * generic journal chrome.
 *
 *   objective.status  "done" struck + checked · "active" the current quest ·
 *                     "todo" the open box.
 *   skill.level       0..100 bar fill (playful self-assessment).
 *   party             collected-character names shown as inventory slots.
 */
export type QuestObjective = {
	label: string;
	status: "done" | "active" | "todo";
};
export type QuestSkill = {
	label: string;
	level: number;
	/** Buff-tile glyph (one emoji/char), WoW-style. Falls back to the label initial. */
	icon?: string;
};
export type QuestLog = {
	/** Character level chip (falls back to 20). */
	level?: number;
	/** "hours played" stat string, hand-written (e.g. "9,999+"). */
	hours: string;
	/** The completion bar lifted from steam-library: a label + 0..100 percent. */
	completion: { label: string; pct: number };
	objectives: QuestObjective[];
	skills: QuestSkill[];
	/** Collected characters, shown as inventory slots. */
	party: string[];
};

export type Topic = {
	id: TopicId;
	heading: string;
	/**
	 * Generic-renderer teaser. Omit for topics promoted to their own component
	 * in `src/components/_layout/topics/` - the component owns the prose.
	 * Multi-paragraph supported via `\n\n`.
	 */
	teaser?: string;
	triggers: Trigger[];
	/** Pull-request frame word-diff data - see the PrDiffReplacement contract. */
	prDiff?: PrDiff;
	/** Quest-log frame data - see the QuestLog contract. */
	questLog?: QuestLog;
};

/**
 * Career teaser prose, shared by the `career` TOPICS entry and the dedicated
 * `CareerContent` component (so both render the same words).
 */
export const CAREER_TEASER =
	"Professionally, I worked both in small startups and tech giants like Cisco. Started as Frontend engineer with strong opinions and a knack for sharing knowledge. Started to lead small to big teams and being responsible for product goals and coordinated execution.\n\nI'm a freelance consultant. Working with fund tax compliance, intelligent traffic start-ups and robotics companies.";

/**
 * Coding teaser prose, shared by the `coding` TOPICS entry and the dedicated
 * `CodingContent` component (so both render the same words).
 */
export const CODING_TEASER =
	"Nowadays I primarily code in Typescript. Depending on the task I also use Python and Rust. Always choose the right tool for the job. Most of the time that involves spinning up Tanstack and self-hosting it on one of my Hetzner VPS.\n\nEven in the age of LLM's I'm still driven by following good coding practices. The art of crafting an elegant solution to a complex problem just makes me happy. A good session is when I'm fully locked in and ship a new version at the end.";

export const TOPICS: Topic[] = [
	{
		id: "career",
		heading: "Career",
		teaser: CAREER_TEASER,
		triggers: [{ kind: "career" }],
	},
	{
		id: "coding",
		heading: "Coding",
		teaser: CODING_TEASER,
		triggers: [{ kind: "story", slug: "early-days" }],
		prDiff: {
			number: 7,
			replacements: [
				{ strike: "jQuery", anchor: "Typescript" },
				{ strike: "leveraging synergies", anchor: "elegant" },
				{ strike: "// TODO: fix later", anchor: "self-hosting" },
				{ strike: "10x rockstar ninja", anchor: "ship" },
			],
		},
	},
	{
		id: "tech-stack",
		heading: "Tech Stack",
		// Prose lives in src/components/_layout/topics/TechStackContent.tsx.
		triggers: [],
	},
	{
		id: "ai",
		heading: "AI",
		// Prose lives in src/components/_layout/topics/AIContent.tsx.
		triggers: [
			{ kind: "project", slug: "aistack" },
			{ kind: "project", slug: "forge" },
		],
	},
	{
		id: "finance",
		heading: "Finance",
		// Prose lives in src/components/_layout/topics/FinanceContent.tsx.
		triggers: [],
	},
	{
		id: "family",
		heading: "Family",
		// Prose lives in src/components/_layout/topics/FamilyContent.tsx.
		triggers: [{ kind: "project", slug: "manaschmiede" }],
	},
	{
		id: "travel",
		heading: "Travel",
		// Prose lives in src/components/_layout/topics/TravelContent.tsx.
		// The personal trigger is the rotating EarthTrigger globe (the earth is
		// the tap-target into /travel) - travel renders through CustomContent,
		// so this entry adds no extra card; it exists so PANEL_KEY_TO_TOPIC_ID
		// parks a direct /travel load at this band (movies precedent).
		triggers: [{ kind: "personal", slug: "travel" }],
	},
	{
		id: "movies-tv",
		heading: "Movies & TV",
		// Prose lives in src/components/_layout/topics/MoviesTvContent.tsx.
		// The personal trigger is the PosterGrid (the whole grid is the
		// tap-target into /movies) - movies-tv renders through CustomContent,
		// so this entry adds no extra card; it exists so PANEL_KEY_TO_TOPIC_ID
		// parks a direct /movies load at this band (music precedent).
		triggers: [
			{ kind: "project", slug: "goodwatch" },
			{ kind: "personal", slug: "movies" },
		],
	},
	{
		id: "games",
		heading: "Games",
		// Prose lives in src/components/_layout/topics/GamesContent.tsx.
		triggers: [],
		// Quest-log frame data - honest shorthand for the GamesContent prose:
		// the objectives are real (every genre played; Witcher 3 still unfinished;
		// the pyramid co-op MMO is the exploration-phase dream), the skills nod to
		// the genres + the running "never finished it" joke, and the party is the
		// real roster of favourites from the prose. Hand-edited here alongside
		// GamesContent.tsx.
		questLog: {
			level: 20,
			hours: "9,999+",
			completion: { label: "Backlog cleared", pct: 34 },
			objectives: [
				{
					label: "Master every genre — sims, arcade, shooters, RTS, indie",
					status: "done",
				},
				{ label: "Finally finish Witcher 3", status: "active" },
				{
					label: "Build the first co-op pyramid MMO with thousands of players",
					status: "todo",
				},
			],
			skills: [
				{ label: "Real-Time Strategy", level: 90, icon: "⚔" },
				{ label: "Shooters", level: 85, icon: "🎯" },
				{ label: "Point & Click", level: 80, icon: "🗝" },
				{ label: "Finishing RPGs", level: 30, icon: "🐌" },
			],
			party: [
				"Duke Nukem",
				"Gordon Freeman",
				"Jade",
				"Kerrigan",
				"Guybrush",
				"Scorpion",
			],
		},
	},
	{
		id: "music",
		heading: "Music",
		// Prose lives in src/components/_layout/topics/MusicContent.tsx.
		triggers: [{ kind: "personal", slug: "music" }],
	},
];

/**
 * Resolve a trigger to its PanelKey - the key `deriveUrlPanel` (PanelHost)
 * produces from the URL. Career resolves to the literal "career"; every other
 * trigger resolves to its `slug`. Kept in lockstep with `useTriggerNav` (which
 * navigates by the same key) and `deriveUrlPanel` (which reads it back).
 */
function triggerPanelKey(trigger: Trigger): PanelKey {
	return trigger.kind === "career" ? "career" : trigger.slug;
}

/**
 * Reverse lookup PanelKey -> the topic id whose triggers include that key.
 * Used on a direct subpage load to park the journey scroll at the subpage's
 * place in the scroll journey (so the sky/time-of-day is correct and closing
 * returns there).
 */
export const PANEL_KEY_TO_TOPIC_ID: Partial<Record<PanelKey, TopicId>> =
	Object.fromEntries(
		TOPICS.flatMap((topic) =>
			topic.triggers.map((trigger) => [triggerPanelKey(trigger), topic.id]),
		),
	);
