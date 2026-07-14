import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { PROJECTS } from "../projects";

describe("PROJECTS data", () => {
	it("has a poster set on every video media entry", () => {
		for (const project of PROJECTS) {
			if (project.media.type !== "video") continue;
			expect(
				project.media.poster,
				`Missing poster for project: ${project.slug}`,
			).toBeTruthy();
		}
	});

	it("has every referenced poster file existing on disk under public/", () => {
		const publicDir = path.resolve(process.cwd(), "public");
		for (const project of PROJECTS) {
			if (project.media.type !== "video") continue;
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
			if (project.media.type !== "image") continue;
			const filePath = path.join(publicDir, project.media.src);
			expect(
				fs.existsSync(filePath),
				`Missing image media file: ${filePath}`,
			).toBe(true);
		}
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

	it("alpriver: desc/problem/solution/outcome/tags are the locked complexity-pipeline copy", () => {
		const alpriver = find("alpriver");
		expect(alpriver.desc).toBe(
			"Complexity-aware agentic coding pipeline for Claude Code.",
		);
		expect(alpriver.problem).toBe(
			"Coding agents misunderstand your intent, make wrong assumptions and write buggy code.",
		);
		expect(alpriver.solution).toBe(
			"I open sourced my Claude Code setup as a plugin because I genuinely think it has some unique qualities. It automatically classifies each task by complexity: S, M, L or XL. It then spawns an appropriate number of subagents to do research, planning, execution and reviewing.",
		);
		expect(alpriver.outcome).toBe(
			"The implementation results are way better, more accurate and match your actual intentions. Due to the amount of ceremony, time to finish and token usage both increase slightly.",
		);
		expect(alpriver.tags).toEqual(["Claude Code", "Open Source"]);
	});

	it("alpriver: extraSection heading/body stay byte-identical and gain the seven-stage chain", () => {
		const alpriver = find("alpriver");
		expect(alpriver.extraSection?.heading).toBe("How it works");
		expect(alpriver.extraSection?.body).toBe(
			"Assumptions are not allowed, therefore every sessions starts with confirming my intent and interviewing me to actually understand the task at hand. Ideally, every goal is programmatically verifiable to guarantee success once it's done.",
		);
		expect(alpriver.extraSection?.stages).toEqual([
			"🔎 Intent",
			"🧭 Scout",
			"📐 Blueprint",
			"🧪 Tests",
			"🔨 Build",
			"🔬 Review",
			"🚀 Ship",
		]);
	});

	it("alpriver: media switches to the image variant with the hero PNG", () => {
		const alpriver = find("alpriver");
		expect(alpriver.media).toEqual({
			type: "image",
			src: "/projects/alp-river-hero.png",
			alt: "Alp-River pipeline example in Claude Code",
		});
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
