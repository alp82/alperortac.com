import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
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

describe("PROJECTS stub entries (curia, alperortac-com)", () => {
	const find = (slug: string) => {
		const project = PROJECTS.find((p) => p.slug === slug);
		if (!project) throw new Error(`Missing project: ${slug}`);
		return project;
	};

	// Absence pins are deliberate (per plan Out of Scope): each authoring
	// ticket (#48/#50) deletes this project's absence assertions when its
	// real subpage payload lands (claude-statusline's landed with #49). `panelColor` is the one exception (ui fix
	// round): it is card-adjacent - it tints the band card's icon tile as well
	// as the panel surface - so each stub carries its own distinct tint,
	// pinned exactly, none near the band's terracotta accent (#b4531f).
	it("curia: card copy verbatim, band tint pinned, subpage payload absent", () => {
		const curia = find("curia");
		expect(curia.title).toBe("Curia");
		expect(curia.desc).toBe("AI chamber for the modern engineer.");
		expect(curia.link).toBe("https://github.com/alp82/curia");
		expect(curia.status).toBe("building");
		expect(curia.highlight).toBe(false);
		expect(curia.tags).toEqual(["AI", "Open Source"]);
		expect(curia.panelColor).toBe("#164e63");
		expect(curia.panelLight).toBeUndefined();
		expect(curia.media).toBeUndefined();
		expect(curia.problem).toBeUndefined();
		expect(curia.solution).toBeUndefined();
		expect(curia.outcome).toBeUndefined();
		expect(curia.stack).toBeUndefined();
	});

	it("alperortac-com: card copy verbatim, band tint pinned, subpage payload absent", () => {
		const site = find("alperortac-com");
		expect(site.title).toBe("alperortac.com");
		expect(site.desc).toBe(
			"Personal portfolio site: a vertical-scroll journey through atmosphere, time, and depth.",
		);
		expect(site.link).toBe("https://github.com/alp82/alperortac.com");
		expect(site.status).toBe("shipped");
		expect(site.highlight).toBe(false);
		expect(site.tags).toEqual(["Portfolio", "Open Source"]);
		expect(site.panelColor).toBe("#0369a1");
		expect(site.panelLight).toBeUndefined();
		expect(site.media).toBeUndefined();
		expect(site.problem).toBeUndefined();
		expect(site.solution).toBeUndefined();
		expect(site.outcome).toBeUndefined();
		expect(site.stack).toBeUndefined();
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
		expect(cs.highlight).toBe(false);
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
