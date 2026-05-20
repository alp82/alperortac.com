import type { PanelKey } from "./sections";

export type ProjectSlug = Extract<
	PanelKey,
	"goodwatch" | "aistack" | "alpriver" | "manaschmiede"
>;
export type PersonalSlug = Extract<
	PanelKey,
	"learning" | "teaching" | "family" | "music"
>;

export type Trigger =
	| { kind: "career" }
	| { kind: "project"; slug: ProjectSlug }
	| { kind: "personal"; slug: PersonalSlug };

export type TopicId = "craft" | "ai" | "movies-tv" | "games" | PersonalSlug;

export type Topic = {
	id: TopicId;
	heading: string;
	teaser: string;
	triggers: Trigger[];
};

export const TOPICS: Topic[] = [
	{
		id: "craft",
		heading: "The Craft",
		teaser:
			"Day job's freelance dev work. The rest is open source and side projects I can't stop poking at.",
		triggers: [{ kind: "career" }],
	},
	{
		id: "ai",
		heading: "AI",
		teaser:
			"Two projects came out of trying to use this stuff seriously: AIStack and Alp-River.",
		triggers: [
			{ kind: "project", slug: "aistack" },
			{ kind: "project", slug: "alpriver" },
		],
	},
	{
		id: "learning",
		heading: "Learning",
		teaser:
			"There's always one thing I'm bad at and trying to fix. The current one's in here.",
		triggers: [{ kind: "personal", slug: "learning" }],
	},
	{
		id: "teaching",
		heading: "Teaching",
		teaser:
			"I record videos and write about the build. Mostly to think it through.",
		triggers: [{ kind: "personal", slug: "teaching" }],
	},
	{
		id: "movies-tv",
		heading: "Movies & TV",
		teaser:
			"I watch too much. GoodWatch happened because picking what to watch shouldn't be the hardest part.",
		triggers: [{ kind: "project", slug: "goodwatch" }],
	},
	{
		id: "family",
		heading: "Family",
		teaser: "Mostly off-camera. The reason I bother.",
		triggers: [{ kind: "personal", slug: "family" }],
	},
	{
		id: "music",
		heading: "Music",
		teaser: "I keep way too many playlists. A few are on repeat.",
		triggers: [{ kind: "personal", slug: "music" }],
	},
	{
		id: "games",
		heading: "Games",
		teaser:
			"Board games, video games, and the design behind both. They show up in my projects more than I planned.",
		triggers: [{ kind: "project", slug: "manaschmiede" }],
	},
];
