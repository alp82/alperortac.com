import {
	Code2,
	Cpu,
	Gauge,
	Globe,
	Landmark,
	Palette,
	PlaySquare,
	Server,
} from "lucide-react";
import type { PanelKey } from "./sections";

export type ProjectIconKey =
	| "PlaySquare"
	| "Cpu"
	| "Code2"
	| "Palette"
	| "Landmark"
	| "Gauge"
	| "Globe"
	| "Server";

export const PROJECT_ICONS: Record<
	ProjectIconKey,
	React.ComponentType<{ size?: number; className?: string }>
> = {
	PlaySquare,
	Cpu,
	Code2,
	Palette,
	Landmark,
	Gauge,
	Globe,
	Server,
};

// Shared neutral fallbacks for projects with no authored subpage payload.
// PANEL_FALLBACK_COLOR reuses the career panel's dark-slate surface (#1e293b,
// PanelHost.tsx) so a stub panel stays on-theme; PANEL_LIGHT_FALLBACK is the
// matching light slate tile pair for trigger cards.
export const PANEL_FALLBACK_COLOR = "#1e293b";
export const PANEL_LIGHT_FALLBACK = "bg-slate-100 text-slate-900";

export type ProjectMedia =
	| {
			type: "video";
			mp4: string;
			webm: string;
			poster?: string;
	  }
	| { type: "image"; src: string; alt?: string }
	| { type: "illustration" };

// Whether the project is live or actively being built. Data-only: the band
// renders NO status badge - every project here is actively maintained, so a
// "building" card looks and behaves identically to a shipped one (re-confirmed
// in the 2026-08-09 revamp grilling).
export type ProjectStatus = "building" | "shipped";

// The band's three labeled groups (2026-08-09 revamp). The group decides the
// card treatment AND the audience argument:
// - "apps": client proof. Live products, full-width poster rows.
// - "tools": dev proof. AI tooling, 2x2 self-portrait cards.
// - "personal": close to home. One slim row of two mini glass cards.
// Within a group the band renders projects in PROJECTS array order.
export type ProjectGroup = "apps" | "tools" | "personal";

// A static card image for the band: the project showing itself. `pos` is a CSS
// object-position value aiming the object-cover crop at the image's strongest
// band; `full` renders the image uncropped at its natural aspect instead.
export type ProjectCardShot = {
	src: string;
	pos?: string;
	full?: boolean;
};

// Content model (locked, ticket #43 - Option A "unified type"). One type is the
// single source of truth for both the Projects-band card and the in-site
// subpage:
// - Card core (title, desc, link, status, group, tags, color, iconKey):
//   what the band card + split control render. Required.
// - Card extras (proof, cardShot): band-only presentation fields. Optional -
//   apps carry both, image-backed tools carry cardShot, Curia and the personal
//   pair carry neither (Curia's card renders its live thread artwork; the
//   personal minis are icon-led).
// - Subpage payload (panelColor, panelLight, media, problem, solution, outcome,
//   narrative, stack): what ProjectPanel renders. OPTIONAL per Option A (landed
//   with the first card-only projects: curia, claude-statusline,
//   alperortac-com): a project may appear on the band before its subpage is
//   authored, and ProjectPanel degrades to title/desc/tags/link when they are
//   absent. The repo runs `exactOptionalPropertyTypes`, so stub entries OMIT
//   these keys entirely - never set them to `undefined`. Consumers fall back to
//   PANEL_FALLBACK_COLOR / PANEL_LIGHT_FALLBACK where a colour is needed.
export type Project = {
	slug: Extract<
		PanelKey,
		| "goodwatch"
		| "aistack"
		| "forge"
		| "manaschmiede"
		| "curia"
		| "claude-statusline"
		| "alperortac-com"
		| "alfredo"
	>;
	title: string;
	desc: string;
	link: string;
	status: ProjectStatus;
	group: ProjectGroup;
	tags: string[];
	color: string;
	iconKey: ProjectIconKey;
	// One concrete proof fact, rendered on the apps rows only.
	proof?: string;
	cardShot?: ProjectCardShot;
	panelColor?: string;
	panelLight?: string;
	media?: ProjectMedia;
	problem?: string;
	solution?: string;
	outcome?: string;
	// Authored-heading prose sections, rendered in order where the
	// Problem/Solution pair would sit. The self-reference (#50) needs them: its
	// page is about the motivation and the vision behind the site, and "Problem"
	// / "Solution" are the wrong two words for that. Every other project keeps
	// the fixed triad, so this stays empty for them.
	narrative?: { heading: string; body: string }[];
	stack?: string[];
	extraLinks?: { label: string; href: string }[];
	extraSection?: { heading: string; body: string; stages?: string[] };
};

export const PROJECTS: Project[] = [
	// ---- apps: the two live products, full poster rows ----
	{
		slug: "goodwatch",
		title: "GoodWatch",
		desc: "Discover, track, and share movies and TV shows effortlessly.",
		link: "https://goodwatch.app",
		status: "shipped",
		group: "apps",
		// TODO replace with a verified fact before the next deploy - this is the
		// prototype's placeholder proof line.
		proof: "Live since 2022 · millions of titles tracked",
		// The demo video's own poster. The crop sits low enough to skip the
		// "Stranger Things (2016)" title - the card must read as GoodWatch, not
		// as the movie.
		cardShot: {
			src: "/videos/goodwatch-recommendation-flow-poster.webp",
			pos: "45% 47%",
		},
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
		status: "shipped",
		group: "apps",
		// TODO replace with a verified fact before the next deploy - this is the
		// prototype's placeholder proof line.
		proof: "Community stacks with real cost breakdowns",
		// The hero video's own poster; the crop centres the headline block.
		cardShot: {
			src: "/videos/aistack-hero-poster.webp",
			pos: "50% 30%",
		},
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
	// ---- tools: dev proof, 2x2 self-portrait cards ----
	// The eighth project (#76), and the first addition since the seven-project
	// lock (#43). Authored subpage, "flagship-lite" - the shape Curia set for a
	// WIP system: the Problem / Solution pair, one signature section, and stack
	// chips, but no Outcome (the waitlist is still open, nothing has shipped to
	// report) and no media band (no demo asset exists). Every line of copy is
	// lifted verbatim from getalfredo.com, Alper's own writing. The tree artwork
	// is slug-gated in ProjectPanel beside the other three.
	{
		slug: "alfredo",
		title: "Alfredo",
		// The first two sentences of getalfredo.com's own meta/OG description,
		// verbatim. Truncated at a sentence boundary (the third reads "Watch them
		// all from one HQ."), never reworded - the same treatment extraSection
		// gets below.
		desc: "Alfredo is the home for your projects. Your next one is live in minutes, with auth, email, database and analytics already wired.",
		// The live app, per the AGENTS.md rule - getalfredo.com is up and taking
		// waitlist signups. The repo takes the secondary link below.
		link: "https://getalfredo.com",
		status: "building",
		group: "tools",
		// getalfredo.com's own OG image, shown in full at its natural aspect -
		// the wordmark, headline, and dashboard mock are all part of the pitch.
		cardShot: { src: "/projects/alfredo-card.png", full: true },
		tags: ["Self-Hosted", "Open Source"],
		color: "bg-amber-100 text-amber-800",
		iconKey: "Server",
		// Amber-900, the warm brown nearest the landing page's own #1e1b10
		// surface. Alfredo's real accent (#ff5d49, a coral) is deliberately not
		// the card tint: it sits inside GoodWatch's red family and beside the
		// band's terracotta (#b4531f). It is used inside the tree artwork
		// instead, where neither can reach it.
		panelColor: "#78350f",
		extraLinks: [
			{ label: "Source", href: "https://github.com/getalfredo/alfredo" },
		],
		problem:
			"Every new project makes you set up the same boilerplate again. You have an idea. Then the setup starts. You have built all of this before, and you will build it again. Or you rent it from five managed services and pay five bills for something you do not own.",
		solution:
			"Alfredo wires all of it once, on your own server. Your next project is live in minutes. Every project runs on your servers and reports to one HQ. You do not collect another set of dashboards every time you ship.",
		extraSection: {
			heading: "Under the hood",
			// The live page's own sentence ends "and the tree below is the real
			// shape". Here the drawing sits ABOVE the body (ProjectPanel renders
			// every signature artwork before its copy), so the clause is dropped
			// rather than reworded - the copy rule adapts punctuation, never
			// wording.
			body: "Alfredo is one program on one server. You point it at a plain Ubuntu 24.04 VPS, and it runs each project as a Docker Compose stack you can read. Alfredo uses three words for the pieces of that setup. It ships as a single binary compiled with Bun. Installing it is one curl command that pulls the release from GitHub.",
		},
		stack: ["Bun", "TypeScript", "Docker Compose", "Ubuntu 24.04", "MIT"],
	},
	// The three late additions (#43). They shipped card-core-only and had their
	// subpages authored one ticket each: Curia #48, claude-statusline #49,
	// alperortac.com #50. All copy is Alper's own writing.
	{
		slug: "curia",
		title: "Curia",
		desc: "AI chamber for the modern engineer.",
		link: "https://github.com/alp82/curia",
		status: "building",
		group: "tools",
		// No cardShot: the band card renders the live CuriaThread artwork - the
		// one tools card whose self-portrait is a component, not an image.
		tags: ["AI", "Open Source"],
		// A curia is the Roman senate chamber - Landmark's columned building.
		color: "bg-cyan-100 text-cyan-800",
		iconKey: "Landmark",
		// Band-tint only (panelColor is card-adjacent: it tints the band card's
		// icon tile and the panel surface, not authored subpage content). The
		// three stub tints are deliberately distinct from each other, from the
		// four flagship tints, and from the band's terracotta accent (#b4531f).
		// Cyan-900, staying in the card's own cyan family.
		panelColor: "#164e63",
		// Authored subpage (wayfinder #48), "flagship-lite": the Problem /
		// Solution pair a system this size earns, one signature section, and
		// stack chips - but no Outcome (it is still being built) and no media
		// band (no demo asset exists). The artwork is the #curia Discord thread
		// itself, slug-gated in ProjectPanel like Forge's pipeline and the
		// statusline strip.
		problem:
			"My agents run on a box at home. I do not. Knowing what is takeable, dispatching it, answering the one question a worker gets stuck on, and looking at what came out all live on the desktop I walked away from.",
		solution:
			"Curia is an always-on daemon that makes the phone a first-class client. It reads my GitHub trackers as its awareness source, dispatches a worker on a ticket into its own git worktree and tmux session, and bridges every question that worker has to Discord. Five verbs cover it: frontier, start, status, cancel, attach.",
		extraSection: {
			heading: "The golden thread",
			body: "Phone → Discord → frontier → dispatch → escalate → answer → resolve → map → preview → attach, with one command spoken rather than typed. A preview link publishes the worker's dev server to the tailnet so the page opens on the phone; attach drops any device into the same live terminal session.",
		},
		stack: ["Node", "MCP", "Discord", "tmux", "Tailscale", "Open Source"],
	},
	// Authored subpage (wayfinder #49), deliberately lighter than the flagship
	// problem/solution/outcome mold: lead blurb, the statusline itself rendered
	// as the section artwork (StatuslineStrip, slug-gated in ProjectPanel), one
	// how-to-read section, and the README's requirements as stack chips. All
	// copy is Alper's own README wording (punctuation adapted to the site's
	// no-em-dash rule).
	{
		slug: "claude-statusline",
		title: "claude-statusline",
		desc: "Single-file Bash statusline for Claude Code: model, context, and rate-limit windows at a glance.",
		link: "https://github.com/alp82/claude-statusline",
		status: "shipped",
		group: "tools",
		// The you-vs-the-clock meter, 870x270 - the aspect the tools image
		// windows are cut to, so it renders whole.
		cardShot: { src: "/projects/statusline-card.png" },
		tags: ["Claude Code", "Bash"],
		// Lime nods to the green health bar of its color-coded meters.
		color: "bg-lime-100 text-lime-800",
		iconKey: "Gauge",
		// Lime-900: the olive-green counterpart of the card's lime family.
		panelColor: "#365314",
		// The README's "See it in motion" demo page, second only to the repo.
		extraLinks: [
			{
				label: "See it in motion",
				href: "https://alp82.github.io/claude-statusline/",
			},
		],
		extraSection: {
			heading: "How to read it",
			body: "The top half of each cell is how much of the window you have used. The bottom half is how much of the window has gone by. If the top reaches further right than the bottom, you are using it faster than the clock, and you will run out before it resets. Colour follows usage: green under 50%, yellow between 50 and 80%, red above 80%.",
		},
		stack: ["Bash", "jq", "curl", "Open Source"],
	},
	{
		slug: "forge",
		title: "Forge",
		desc: "Complexity-aware agentic coding pipeline for Claude Code.",
		link: "https://github.com/alp82/forge",
		status: "shipped",
		group: "tools",
		// A pipeline-run terminal shot, 822x172 - shorter than the shared window
		// aspect, so it crops from the right: left-anchored to keep the prompt
		// and stage labels, losing only line ends.
		cardShot: { src: "/projects/forge-card.png", pos: "0% 50%" },
		tags: ["Claude Code", "Open Source"],
		color: "bg-emerald-100 text-emerald-800",
		iconKey: "Code2",
		panelColor: "#065f46",
		panelLight: "bg-emerald-100 text-emerald-900",
		media: {
			type: "video",
			mp4: "/videos/forge-pipeline.mp4",
			webm: "/videos/forge-pipeline.webm",
			poster: "/videos/forge-pipeline-poster.webp",
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
	// ---- personal: close to home, the slim mini-card row ----
	{
		slug: "alperortac-com",
		title: "alperortac.com",
		desc: "Personal portfolio site",
		link: "https://github.com/alp82/alperortac.com",
		status: "shipped",
		group: "personal",
		// Sky fits the site's own identity and sits far from the band's
		// terracotta accent (#b4531f).
		tags: ["Portfolio", "Open Source"],
		color: "bg-sky-100 text-sky-800",
		iconKey: "Globe",
		// Sky-700 (brighter azure, not sky-900): dark sky-900 sits a few hue
		// degrees from Curia's cyan-900 and the two 18% tile tints would read
		// as the same color; the -700 value keeps the sky family while staying
		// clearly apart from Curia's dark teal.
		panelColor: "#0369a1",
		// Authored subpage (wayfinder #50), a fourth shape for the one project
		// that is the page you are standing on: no Problem / Solution, because
		// the ticket's framing is Alper's motivation and vision, not a market
		// gap. Hence `narrative` (authored headings) instead of the fixed triad,
		// one signature section, and stack chips. No media band: the demo is the
		// site itself.
		narrative: [
			{
				heading: "Why I built it",
				body: "I wanted to create a personal page about myself in an authentic way, showing both my professional and personal passions. It had to be unique and stand out in a sea of always the same portfolio pages.",
			},
			{
				heading: "The vision",
				body: "Visitors should be able to learn about me, follow my content, getting interested and contact me.",
			},
		],
		extraSection: {
			heading: "The journey",
			body: "A vertical scroll journey through atmosphere, time, and depth. Scroll drives the day to dusk to night transition, the sun arc setting and the moon arc rising. Sidetracks are the depth surface: a card dives into a floating panel while the landscape stays visible around it. The column is the site's own minimap, frozen, drawn from the same sky curve you are scrolling through right now.",
		},
		stack: [
			"TanStack Start",
			"React",
			"Bun",
			"TypeScript",
			"Tailwind",
			"Biome",
		],
	},
	{
		slug: "manaschmiede",
		title: "Manaschmiede",
		desc: "Magic: The Gathering deck builder and print assistant",
		link: "https://github.com/alp82/manaschmiede",
		status: "shipped",
		group: "personal",
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
