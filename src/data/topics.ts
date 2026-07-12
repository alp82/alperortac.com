import type { PanelKey } from "./sections";
import type { StorySlug } from "./stories";

export type ProjectSlug = Extract<
	PanelKey,
	"goodwatch" | "aistack" | "alpriver" | "manaschmiede"
>;
export type PersonalSlug = Extract<PanelKey, "music">;

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
	| PersonalSlug;

export type Topic = {
	id: TopicId;
	heading: string;
	/**
	 * Generic-renderer teaser. Omit for topics promoted to their own component
	 * in `src/components/_layout/topics/` — the component owns the prose.
	 * Multi-paragraph supported via `\n\n`.
	 */
	teaser?: string;
	triggers: Trigger[];
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
			{ kind: "project", slug: "alpriver" },
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
		triggers: [],
	},
	{
		id: "movies-tv",
		heading: "Movies & TV",
		// Prose lives in src/components/_layout/topics/MoviesTvContent.tsx.
		triggers: [{ kind: "project", slug: "goodwatch" }],
	},
	{
		id: "games",
		heading: "Games",
		// Prose lives in src/components/_layout/topics/GamesContent.tsx.
		triggers: [],
	},
	{
		id: "music",
		heading: "Music",
		// Prose lives in src/components/_layout/topics/MusicContent.tsx.
		triggers: [{ kind: "personal", slug: "music" }],
	},
];

/**
 * Resolve a trigger to its PanelKey — the key `deriveUrlPanel` (PanelHost)
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
