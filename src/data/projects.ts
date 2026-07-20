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
	| { type: "image"; src: string; alt?: string }
	| { type: "illustration" };

export type Project = {
	slug: Extract<
		PanelKey,
		"goodwatch" | "aistack" | "forge" | "manaschmiede"
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
	extraSection?: { heading: string; body: string; stages?: string[] };
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
		media: {
			type: "video",
			mp4: "/videos/goodwatch-recommendation-flow.mp4",
			webm: "/videos/goodwatch-recommendation-flow.webm",
			poster: "/videos/goodwatch-recommendation-flow-poster.webp",
		},
		problem:
			"Streaming is fragmented. Friends recommend titles you forget by Friday and surface-level ratings hide whether a show is actually for you.",
		solution:
			"A recommendation engine that understands your personal taste. It combines 70+ attributes like adrenaline, dark humor, dialog quality or cinematography into a unique fingerprint for each title. It blends critic scores, audience signals and your own watch history into trustworthy picks.",
		outcome:
			"GoodWatch ships continuously to a growing community of cinephiles who want fewer aggregators and better matches.",
		stack: ["React", "Remix", "PostgreSQL", "TypeScript", "Tailwind"],
	},
	{
		slug: "aistack",
		title: "AIStack",
		desc: "Community-driven AI stacks: what people use, how they work and what it costs.",
		link: "https://aistack.to",
		tags: ["AI", "Community"],
		color: "bg-blue-100 text-blue-800",
		iconKey: "Cpu",
		panelColor: "#1e3a8a",
		panelLight: "bg-blue-100 text-blue-900",
		media: {
			type: "video",
			mp4: "/videos/aistack-hero.mp4",
			webm: "/videos/aistack-hero.webm",
			poster: "/videos/aistack-hero-poster.webp",
		},
		problem:
			"The AI tool space ships ten new launches a day. Most directories are SEO farms; none help you compose a working stack.",
		solution:
			"AIStack is community-driven: everyone shares their stack, how they orchestrate their agents and what it costs them per month. You learn about the most cost-effective ways to get best out of popular tools for your own setup.",
		outcome: "A growing community of agentic shippers.",
		stack: ["React", "TypeScript", "Tailwind", "Vite"],
		extraLinks: [{ label: "Discord", href: "https://discord.gg/5y4fpyahaF" }],
	},
	{
		slug: "forge",
		title: "Forge",
		desc: "Complexity-aware agentic coding pipeline for Claude Code.",
		link: "https://github.com/alp82/forge",
		tags: ["Claude Code", "Open Source"],
		color: "bg-emerald-100 text-emerald-800",
		iconKey: "Code2",
		panelColor: "#065f46",
		panelLight: "bg-emerald-100 text-emerald-900",
		media: {
			type: "image",
			src: "/projects/forge-hero.png",
			alt: "Forge pipeline example in Claude Code",
		},
		problem:
			"Coding agents misunderstand your intent, make wrong assumptions and write buggy code.",
		solution:
			"I open sourced my Claude Code setup as a plugin because I genuinely think it has some unique qualities. It automatically classifies each task by complexity: S, M, L or XL. It then spawns an appropriate number of subagents to do research, planning, execution and reviewing.",
		outcome:
			"The implementation results are way better, more accurate and match your actual intentions. Due to the amount of ceremony, time to finish and token usage both increase slightly.",
		stack: ["TypeScript", "Bun", "Open Source"],
		extraSection: {
			heading: "How it works",
			body: "Assumptions are not allowed, therefore every sessions starts with confirming my intent and interviewing me to actually understand the task at hand. Ideally, every goal is programmatically verifiable to guarantee success once it's done.",
			stages: [
				"🔎 Intent",
				"🧭 Scout",
				"📐 Blueprint",
				"🧪 Tests",
				"🔨 Build",
				"🔬 Review",
				"🚀 Ship",
			],
		},
	},
	{
		slug: "manaschmiede",
		title: "Manaschmiede",
		desc: "Magic: The Gathering deck builder and print assistant",
		link: "https://github.com/alp82/manaschmiede",
		tags: ["MTG", "Print & Play"],
		color: "bg-purple-100 text-purple-800",
		iconKey: "Palette",
		panelColor: "#4c1d95",
		panelLight: "bg-purple-100 text-purple-900",
		media: {
			type: "video",
			mp4: "/videos/manaschmiede-deck-creation.mp4",
			webm: "/videos/manaschmiede-deck-creation.webm",
			poster: "/videos/manaschmiede-deck-creation-poster.webp",
		},
		problem: "Deck building takes time and needs expertise.",
		solution:
			"You choose the strategy, archetypes and core cards, and an agent helps you build a balanced deck.",
		outcome:
			"An easy and pleasant user experience to go quickly from a deck idea to a full PDF printout so that I can try different strategies with my kids.",
		stack: ["TypeScript", "React", "Open Source"],
	},
];
