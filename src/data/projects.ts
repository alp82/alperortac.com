import { Code2, Cpu, Palette, PlaySquare } from "lucide-react";
import type { PanelKey } from "./sections";

export type ProjectIconKey = "PlaySquare" | "Cpu" | "Code2" | "Palette";

export const PROJECT_ICONS: Record<
	ProjectIconKey,
	React.ComponentType<{ size?: number; className?: string }>
> = {
	PlaySquare,
	Cpu,
	Code2,
	Palette,
};

export type ProjectMedia =
	| {
			type: "video";
			mp4: string;
			webm: string;
			poster?: string;
	  }
	| { type: "illustration" };

export type Project = {
	slug: Extract<
		PanelKey,
		"goodwatch" | "aistack" | "alpriver" | "manaschmiede"
	>;
	title: string;
	desc: string;
	link: string;
	tags: string[];
	color: string;
	iconKey: ProjectIconKey;
	panelColor: string;
	panelLight: string;
	media: ProjectMedia;
	problem: string;
	solution: string;
	outcome: string;
	stack: string[];
	extraLinks?: { label: string; href: string }[];
	extraSection?: { heading: string; body: string };
};

export const PROJECTS: Project[] = [
	{
		slug: "goodwatch",
		title: "GoodWatch",
		desc: "Discover, track, and share movies and TV shows effortlessly.",
		link: "https://goodwatch.app",
		tags: ["Web App", "Entertainment"],
		color: "bg-red-100 text-red-800",
		iconKey: "PlaySquare",
		panelColor: "#7f1d1d",
		panelLight: "bg-red-100 text-red-900",
		// TODO(alp): generate proper poster frames
		media: {
			type: "video",
			mp4: "/videos/goodwatch-recommendation-flow.mp4",
			webm: "/videos/goodwatch-recommendation-flow.webm",
		},
		problem:
			"Streaming is fragmented. Friends recommend titles you forget by Friday and surface-level ratings hide whether a show is actually for you.",
		solution:
			"A recommendation engine that blends critic scores, audience signals, and your own watch history into a single trustworthy pick. Lists, tracking, and sharing happen in one place.",
		outcome:
			"GoodWatch ships continuously to a growing community of cinephiles who want fewer aggregators and better matches.",
		stack: ["React", "Remix", "PostgreSQL", "TypeScript", "Tailwind"],
	},
	{
		slug: "aistack",
		title: "AIStack",
		desc: "A curated directory and stack of the best AI tools and resources.",
		link: "https://aistack.to",
		tags: ["AI", "Directory"],
		color: "bg-blue-100 text-blue-800",
		iconKey: "Cpu",
		panelColor: "#1e3a8a",
		panelLight: "bg-blue-100 text-blue-900",
		// TODO(alp): generate proper poster frames
		media: {
			type: "video",
			mp4: "/videos/aistack-hero.mp4",
			webm: "/videos/aistack-hero.webm",
		},
		problem:
			"The AI tool space ships ten new launches a day. Most directories are SEO farms; none help you compose a working stack.",
		solution:
			"A hand-curated catalogue grouped by what you actually do with it — research, build, ship — with honest notes on cost and lock-in.",
		outcome:
			"AIStack has become a reference list builders share when onboarding teammates to a new workflow.",
		stack: ["React", "TypeScript", "Tailwind", "Vite"],
		extraLinks: [{ label: "Discord", href: "https://discord.gg/5y4fpyahaF" }],
	},
	{
		slug: "alpriver",
		title: "Alp-River",
		desc: "An open-source project exploring unique data flows and architecture.",
		link: "https://github.com/alp82/alp-river",
		tags: ["Open Source", "GitHub"],
		color: "bg-emerald-100 text-emerald-800",
		iconKey: "Code2",
		panelColor: "#065f46",
		panelLight: "bg-emerald-100 text-emerald-900",
		media: { type: "illustration" },
		problem:
			"Most data flow tooling forces you to choose between rigid pipelines and unstructured glue code. Iteration is slow and observability comes last.",
		solution:
			"An open-source primitive for composing typed, stream-shaped flows with replay and inspection baked in from day one.",
		outcome:
			"Alp-River is the substrate I lean on when prototyping new ideas, and the public repo invites others to riff on the same shape.",
		stack: ["TypeScript", "Bun", "Open Source"],
		extraSection: {
			heading: "How it works",
			body: "Assumptions are not allowed, therefore every sessions starts with confirming my intent and interviewing me to actually understand the task at hand. Ideally, every goal is programmatically verifiable to guarantee success once it's done.",
		},
	},
	{
		slug: "manaschmiede",
		title: "Manaschmiede",
		desc: "Open-source creative and development tools repository.",
		link: "https://github.com/alp82/manaschmiede",
		tags: ["Open Source", "Tooling"],
		color: "bg-purple-100 text-purple-800",
		iconKey: "Palette",
		panelColor: "#4c1d95",
		panelLight: "bg-purple-100 text-purple-900",
		// TODO(alp): generate proper poster frames
		media: {
			type: "video",
			mp4: "/videos/manaschmiede-deck-creation.mp4",
			webm: "/videos/manaschmiede-deck-creation.webm",
		},
		problem:
			"Creative tinkering needs a workshop that doesn't get in the way — most existing tools either lock you in or demand you build everything from zero.",
		solution:
			"A growing collection of small, sharp tools and prototypes — card deck builders, generators, helpers — released openly so anyone can fork the pieces they need.",
		outcome:
			"Manaschmiede is the public bench where experiments live before they become projects of their own.",
		stack: ["TypeScript", "React", "Open Source"],
	},
];
