import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { ALFREDO_TERMS } from "../../components/_layout/projects/AlfredoTree";
import { CURIA_LEGS } from "../../components/_layout/projects/CuriaThread";
import { PROJECTS } from "../projects";

describe("PROJECTS data", () => {
	it("has a poster set on every video media entry", () => {
		for (const project of PROJECTS) {
			if (project.media?.type !== "video") continue;
			expect(
				project.media.poster,
				`Missing poster for project: ${project.slug}`,
			).toBeTruthy();
		}
	});

	it("has every referenced poster file existing on disk under public/", () => {
		const publicDir = path.resolve(process.cwd(), "public");
		for (const project of PROJECTS) {
			if (project.media?.type !== "video") continue;
			if (!project.media.poster) continue;
			const filePath = path.join(publicDir, project.media.poster);
			expect(fs.existsSync(filePath), `Missing poster file: ${filePath}`).toBe(
				true,
			);
		}
	});

	it("has every referenced image media src existing on disk under public/", () => {
		const publicDir = path.resolve(process.cwd(), "public");
		for (const project of PROJECTS) {
			if (project.media?.type !== "image") continue;
			const filePath = path.join(publicDir, project.media.src);
			expect(
				fs.existsSync(filePath),
				`Missing image media file: ${filePath}`,
			).toBe(true);
		}
	});

	it("has every referenced cardShot src existing on disk under public/", () => {
		const publicDir = path.resolve(process.cwd(), "public");
		for (const project of PROJECTS) {
			if (!project.cardShot) continue;
			const filePath = path.join(publicDir, project.cardShot.src);
			expect(
				fs.existsSync(filePath),
				`Missing cardShot file: ${filePath}`,
			).toBe(true);
		}
	});

	// The 2026-08-09 revamp shape: three labeled groups in band order (within a
	// group the band renders data order). Curia is the one tools card without a
	// cardShot - it renders its live thread artwork instead; both apps carry a
	// proof line (placeholder copy until verified facts land).
	it("groups the eight projects 2 apps / 4 tools / 2 personal, in band order", () => {
		const bySlugOf = (group: string) =>
			PROJECTS.filter((p) => p.group === group).map((p) => p.slug);
		expect(bySlugOf("apps")).toEqual(["goodwatch", "aistack"]);
		expect(bySlugOf("tools")).toEqual([
			"alfredo",
			"curia",
			"claude-statusline",
			"forge",
		]);
		expect(bySlugOf("personal")).toEqual(["manaschmiede", "alperortac-com"]);
		for (const p of PROJECTS) {
			if (p.group === "apps") {
				expect(p.proof, `${p.slug} needs a proof line`).toBeTruthy();
				expect(p.cardShot, `${p.slug} needs a cardShot`).toBeTruthy();
			}
			if (p.group === "tools") {
				expect(Boolean(p.cardShot), `${p.slug} cardShot presence`).toBe(
					p.slug !== "curia",
				);
			}
		}
	});

	// The band tints every card's icon tile from panelColor; two projects
	// sharing a tint (or falling back to the same neutral) collapse into an
	// indistinguishable pair on the band - the exact defect the stub tints fix.
	it("every defined panelColor is unique across PROJECTS", () => {
		const colors = PROJECTS.map((p) => p.panelColor).filter(
			(c): c is string => typeof c === "string",
		);
		expect(new Set(colors).size).toBe(colors.length);
	});
});

// wayfinder #50: the authored alperortac.com subpage, the last of the three
// late additions to leave stub state. A fourth shape: authored-heading prose
// (`narrative`) instead of the fixed Problem/Solution pair, because the page is
// about the motivation and the vision behind the site, not a market gap. The
// journey-column artwork is slug-gated in ProjectPanel, not data.
describe("PROJECTS self-reference (alperortac-com)", () => {
	const find = (slug: string) => {
		const project = PROJECTS.find((p) => p.slug === slug);
		if (!project) throw new Error(`Missing project: ${slug}`);
		return project;
	};

	// `panelColor` is card-adjacent: it tints the band card's icon tile as well
	// as the panel surface, so it stays pinned exactly, clear of the band's
	// terracotta accent (#b4531f).
	it("card copy verbatim and the band tint stay put", () => {
		const site = find("alperortac-com");
		expect(site.title).toBe("alperortac.com");
		expect(site.desc).toBe("Personal portfolio site");
		expect(site.link).toBe("https://github.com/alp82/alperortac.com");
		expect(site.status).toBe("shipped");
		expect(site.group).toBe("personal");
		expect(site.tags).toEqual(["Portfolio", "Open Source"]);
		expect(site.panelColor).toBe("#0369a1");
		expect(site.panelLight).toBeUndefined();
	});

	it("carries the authored narrative pair verbatim: Alper's motivation, then his vision", () => {
		const site = find("alperortac-com");
		expect(site.narrative).toEqual([
			{
				heading: "Why I built it",
				body: "I wanted to create a personal page about myself in an authentic way, showing both my professional and personal passions. It had to be unique and stand out in a sea of always the same portfolio pages.",
			},
			{
				heading: "The vision",
				body: "Visitors should be able to learn about me, follow my content, getting interested and contact me.",
			},
		]);
	});

	it("carries the journey signature section and the stack chips", () => {
		const site = find("alperortac-com");
		expect(site.extraSection).toEqual({
			heading: "The journey",
			body: "A vertical scroll journey through atmosphere, time, and depth. Scroll drives the day to dusk to night transition, the sun arc setting and the moon arc rising. Sidetracks are the depth surface: a card dives into a floating panel while the landscape stays visible around it. The column is the site's own minimap, frozen, drawn from the same sky curve you are scrolling through right now.",
		});
		expect(site.stack).toEqual([
			"TanStack Start",
			"React",
			"Bun",
			"TypeScript",
			"Tailwind",
			"Biome",
		]);
	});

	// The fourth shape stays a fourth shape: the fixed triad never sneaks back
	// in beside the authored headings (it would render "Problem" above "Why I
	// built it"), and no media band appears - the demo is the site itself.
	it("uses narrative instead of the fixed triad, and carries no media band", () => {
		const site = find("alperortac-com");
		expect(site.problem).toBeUndefined();
		expect(site.solution).toBeUndefined();
		expect(site.outcome).toBeUndefined();
		expect(site.media).toBeUndefined();
	});

	// Only the self-reference bends the section headings. Every other project
	// keeps the fixed vocabulary, so `narrative` cannot quietly become the way
	// projects are written.
	it("is the only project using narrative", () => {
		const withNarrative = PROJECTS.filter((p) => p.narrative).map(
			(p) => p.slug,
		);
		expect(withNarrative).toEqual(["alperortac-com"]);
	});
});

describe("PROJECTS verbatim copy", () => {
	const find = (slug: string) => {
		const project = PROJECTS.find((p) => p.slug === slug);
		if (!project) throw new Error(`Missing project: ${slug}`);
		return project;
	};

	it("goodwatch: solution is the locked taste-fingerprint copy, other fields unchanged", () => {
		const goodwatch = find("goodwatch");
		expect(goodwatch.solution).toBe(
			"A recommendation engine that understands your personal taste. It combines 70+ attributes like adrenaline, dark humor, dialog quality or cinematography into a unique fingerprint for each title. It blends critic scores, audience signals and your own watch history into trustworthy picks.",
		);
		expect(goodwatch.desc).toBe(
			"Discover, track, and share movies and TV shows effortlessly.",
		);
		expect(goodwatch.problem).toBe(
			"Streaming is fragmented. Friends recommend titles you forget by Friday and surface-level ratings hide whether a show is actually for you.",
		);
		expect(goodwatch.outcome).toBe(
			"GoodWatch ships continuously to a growing community of cinephiles who want fewer aggregators and better matches.",
		);
		expect(goodwatch.tags).toEqual(["Web App", "Entertainment"]);
	});

	it("aistack: desc/solution/outcome/tags are the locked community-driven copy, problem and Discord link unchanged", () => {
		const aistack = find("aistack");
		expect(aistack.desc).toBe(
			"Community-driven AI stacks: what people use, how they work and what it costs.",
		);
		expect(aistack.solution).toBe(
			"AIStack is community-driven: everyone shares their stack, how they orchestrate their agents and what it costs them per month. You learn about the most cost-effective ways to get best out of popular tools for your own setup.",
		);
		expect(aistack.outcome).toBe("A growing community of agentic shippers.");
		expect(aistack.tags).toEqual(["AI", "Community"]);
		expect(aistack.problem).toBe(
			"The AI tool space ships ten new launches a day. Most directories are SEO farms; none help you compose a working stack.",
		);
		expect(aistack.extraLinks).toEqual([
			{ label: "Discord", href: "https://discord.gg/5y4fpyahaF" },
		]);
	});

	it("forge: desc/problem/solution/outcome/tags are the locked complexity-pipeline copy", () => {
		const forge = find("forge");
		expect(forge.desc).toBe(
			"Complexity-aware agentic coding pipeline for Claude Code.",
		);
		expect(forge.problem).toBe(
			"Coding agents misunderstand your intent, make wrong assumptions and write buggy code.",
		);
		expect(forge.solution).toBe(
			"I open sourced my Claude Code setup as a plugin because I genuinely think it has some unique qualities. It automatically classifies each task by complexity: S, M, L or XL. It then spawns an appropriate number of subagents to do research, planning, execution and reviewing.",
		);
		expect(forge.outcome).toBe(
			"The implementation results are way better, more accurate and match your actual intentions. Due to the amount of ceremony, time to finish and token usage both increase slightly.",
		);
		expect(forge.tags).toEqual(["Claude Code", "Open Source"]);
	});

	it("forge: extraSection heading/body stay byte-identical and gain the seven-stage chain", () => {
		const forge = find("forge");
		expect(forge.extraSection?.heading).toBe("How it works");
		expect(forge.extraSection?.body).toBe(
			"Assumptions are not allowed, therefore every sessions starts with confirming my intent and interviewing me to actually understand the task at hand. Ideally, every goal is programmatically verifiable to guarantee success once it's done.",
		);
		expect(forge.extraSection?.stages).toEqual([
			"🔎 Intent",
			"🧭 Scout",
			"📐 Blueprint",
			"🧪 Tests",
			"🔨 Build",
			"🔬 Review",
			"🚀 Ship",
		]);
	});

	it("forge: media is the Remotion pipeline video loop with a poster", () => {
		const forge = find("forge");
		expect(forge.media).toEqual({
			type: "video",
			mp4: "/videos/forge-pipeline.mp4",
			webm: "/videos/forge-pipeline.webm",
			poster: "/videos/forge-pipeline-poster.webp",
		});
	});

	// wayfinder #49: the authored claude-statusline subpage. Deliberately
	// lighter than the flagship mold - no problem/solution/outcome, no media.
	// Copy is Alper's README wording; the strip artwork is slug-gated in
	// ProjectPanel, not data.
	it("claude-statusline: card copy verbatim plus the authored light payload (how-to-read section, demo link, requirements stack; no flagship triad, no media)", () => {
		const cs = find("claude-statusline");
		expect(cs.title).toBe("claude-statusline");
		expect(cs.desc).toBe(
			"Single-file Bash statusline for Claude Code: model, context, and rate-limit windows at a glance.",
		);
		expect(cs.link).toBe("https://github.com/alp82/claude-statusline");
		expect(cs.status).toBe("shipped");
		expect(cs.group).toBe("tools");
		expect(cs.tags).toEqual(["Claude Code", "Bash"]);
		expect(cs.panelColor).toBe("#365314");
		expect(cs.extraLinks).toEqual([
			{
				label: "See it in motion",
				href: "https://alp82.github.io/claude-statusline/",
			},
		]);
		expect(cs.extraSection).toEqual({
			heading: "How to read it",
			body: "The top half of each cell is how much of the window you have used. The bottom half is how much of the window has gone by. If the top reaches further right than the bottom, you are using it faster than the clock, and you will run out before it resets. Colour follows usage: green under 50%, yellow between 50 and 80%, red above 80%.",
		});
		expect(cs.stack).toEqual(["Bash", "jq", "curl", "Open Source"]);
		// The light shape stays light: the flagship triad and media never
		// sneak in without a deliberate decision.
		expect(cs.problem).toBeUndefined();
		expect(cs.solution).toBeUndefined();
		expect(cs.outcome).toBeUndefined();
		expect(cs.media).toBeUndefined();
	});

	// wayfinder #48: the authored Curia subpage. "Flagship-lite" - the
	// Problem/Solution pair plus one signature section, but deliberately no
	// Outcome (still being built) and no media band (no demo asset exists).
	// The Discord-thread artwork is slug-gated in ProjectPanel, not data.
	it("curia: card copy verbatim plus the authored flagship-lite payload (problem, solution, golden-thread section, stack; no outcome, no media)", () => {
		const curia = find("curia");
		expect(curia.title).toBe("Curia");
		expect(curia.desc).toBe("AI chamber for the modern engineer.");
		expect(curia.link).toBe("https://curia.sh");
		expect(curia.status).toBe("building");
		expect(curia.group).toBe("tools");
		expect(curia.tags).toEqual(["AI", "Open Source"]);
		expect(curia.panelColor).toBe("#164e63");
		expect(curia.problem).toBe(
			"My agents run on a box at home. I do not. Knowing what is takeable, dispatching it, answering the one question a worker gets stuck on, and looking at what came out all live on the desktop I walked away from.",
		);
		expect(curia.solution).toBe(
			"Curia is an always-on daemon that makes the phone a first-class client. It reads my GitHub trackers as its awareness source, dispatches a worker on a ticket into its own git worktree and tmux session, and bridges every question that worker has to Discord. Five verbs cover it: frontier, start, status, cancel, attach.",
		);
		expect(curia.extraSection).toEqual({
			heading: "The golden thread",
			body: "Phone → Discord → frontier → dispatch → escalate → answer → resolve → map → preview → attach, with one command spoken rather than typed. A preview link publishes the worker's dev server to the tailnet so the page opens on the phone; attach drops any device into the same live terminal session.",
		});
		expect(curia.stack).toEqual([
			"Node",
			"MCP",
			"Discord",
			"tmux",
			"Tailscale",
			"Open Source",
		]);
		// Flagship-lite stays lite: a WIP project gets no Outcome, and no media
		// band appears without a real demo asset.
		expect(curia.outcome).toBeUndefined();
		expect(curia.media).toBeUndefined();
		// The section body names the legs in order; the artwork renders the same
		// list, so the two can never drift apart silently.
		for (const leg of CURIA_LEGS) {
			expect(curia.extraSection?.body.toLowerCase()).toContain(
				leg.toLowerCase(),
			);
		}
	});

	it("manaschmiede: desc/problem/solution/outcome/tags are the locked deck-builder copy", () => {
		const manaschmiede = find("manaschmiede");
		expect(manaschmiede.desc).toBe(
			"Magic: The Gathering deck builder and print assistant",
		);
		expect(manaschmiede.problem).toBe(
			"Deck building takes time and needs expertise.",
		);
		expect(manaschmiede.solution).toBe(
			"You choose the strategy, archetypes and core cards, and an agent helps you build a balanced deck.",
		);
		expect(manaschmiede.outcome).toBe(
			"An easy and pleasant user experience to go quickly from a deck idea to a full PDF printout so that I can try different strategies with my kids.",
		);
		expect(manaschmiede.tags).toEqual(["MTG", "Print & Play"]);
	});

	// wayfinder #76: Alfredo, the eighth project - the first addition since the
	// seven-project lock (#43). Flagship-lite, the shape Curia set: a WIP system
	// earns the Problem / Solution pair and one signature section, but no Outcome
	// (nothing has shipped to report - the waitlist is still open) and no media
	// band (no demo asset exists). Every line of copy is lifted verbatim from
	// getalfredo.com, Alper's own writing, never distilled.
	it("alfredo: card copy verbatim plus the authored flagship-lite payload (problem, solution, under-the-hood section, stack; no outcome, no media)", () => {
		const alfredo = find("alfredo");
		expect(alfredo.title).toBe("Alfredo");
		expect(alfredo.desc).toBe(
			"Alfredo is the home for your projects. Your next one is live in minutes, with auth, email, database and analytics already wired.",
		);
		// The AGENTS.md rule is the live app for apps, the repo for repo-based
		// ones. getalfredo.com is live (the waitlist landing page), so the card
		// escapes there and the repo takes the secondary link.
		expect(alfredo.link).toBe("https://getalfredo.com");
		expect(alfredo.status).toBe("building");
		// Why amber over Alfredo's own coral: see the entry's own comments in
		// projects.ts. The band renders tools as the 2x2 self-portrait grid.
		expect(alfredo.group).toBe("tools");
		expect(alfredo.tags).toEqual(["Self-Hosted", "Open Source"]);
		expect(alfredo.color).toBe("bg-amber-100 text-amber-800");
		expect(alfredo.panelColor).toBe("#78350f");
		expect(alfredo.iconKey).toBe("Server");
		expect(alfredo.problem).toBe(
			"Every new project makes you set up the same boilerplate again. You have an idea. Then the setup starts. You have built all of this before, and you will build it again. Or you rent it from five managed services and pay five bills for something you do not own.",
		);
		expect(alfredo.solution).toBe(
			"Alfredo wires all of it once, on your own server. Your next project is live in minutes. Every project runs on your servers and reports to one HQ. You do not collect another set of dashboards every time you ship.",
		);
		expect(alfredo.extraSection).toEqual({
			heading: "Under the hood",
			body: "Alfredo is one program on one server. You point it at a plain Ubuntu 24.04 VPS, and it runs each project as a Docker Compose stack you can read. Alfredo uses three words for the pieces of that setup. It ships as a single binary compiled with Bun. Installing it is one curl command that pulls the release from GitHub.",
		});
		expect(alfredo.stack).toEqual([
			"Bun",
			"TypeScript",
			"Docker Compose",
			"Ubuntu 24.04",
			"MIT",
		]);
		expect(alfredo.extraLinks).toEqual([
			{ label: "Source", href: "https://github.com/getalfredo/alfredo" },
		]);
		// Flagship-lite stays lite, and the fourth shape stays the self-
		// reference's alone.
		expect(alfredo.outcome).toBeUndefined();
		expect(alfredo.media).toBeUndefined();
		expect(alfredo.narrative).toBeUndefined();
	});

	// The copy/artwork drift guard Curia carries, in the half that belongs to the
	// DATA: the body says "three words", so adding or dropping a node without
	// touching the copy goes red instead of leaving the sentence lying. The other
	// half - that the words are still HQ, PORTER and TRAY, so a RENAME goes red
	// too - is pinned in AlfredoTree.test.tsx, next to the drawing it measures.
	it("alfredo: the under-the-hood body names as many words as the tree draws", () => {
		const alfredo = find("alfredo");
		expect(ALFREDO_TERMS).toHaveLength(3);
		expect(alfredo.extraSection?.body).toContain("three words");
	});

	it("keeps the three video media entries byte-identical", () => {
		expect(find("goodwatch").media).toEqual({
			type: "video",
			mp4: "/videos/goodwatch-recommendation-flow.mp4",
			webm: "/videos/goodwatch-recommendation-flow.webm",
			poster: "/videos/goodwatch-recommendation-flow-poster.webp",
		});
		expect(find("aistack").media).toEqual({
			type: "video",
			mp4: "/videos/aistack-hero.mp4",
			webm: "/videos/aistack-hero.webm",
			poster: "/videos/aistack-hero-poster.webp",
		});
		expect(find("manaschmiede").media).toEqual({
			type: "video",
			mp4: "/videos/manaschmiede-deck-creation.mp4",
			webm: "/videos/manaschmiede-deck-creation.webm",
			poster: "/videos/manaschmiede-deck-creation-poster.webp",
		});
	});
});
