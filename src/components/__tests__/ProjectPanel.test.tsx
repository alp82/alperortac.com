// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import type { Project } from "../../data/projects";
import { installStubIntersectionObserver } from "../../test/stubIntersectionObserver";
import { ProjectPanel } from "../ProjectPanel";

beforeAll(() => {
	installStubIntersectionObserver();
});

const mockVideoProject: Project = {
	slug: "goodwatch",
	title: "GoodWatch",
	desc: "Discover, track, and share movies and TV shows effortlessly.",
	link: "https://goodwatch.app",
	status: "shipped",
	highlight: true,
	tags: ["Web App"],
	color: "bg-red-100 text-red-800",
	iconKey: "PlaySquare",
	panelColor: "#7f1d1d",
	panelLight: "bg-red-100 text-red-900",
	media: {
		type: "video",
		mp4: "/videos/goodwatch-recommendation-flow.mp4",
		webm: "/videos/goodwatch-recommendation-flow.webm",
	},
	problem: "test problem",
	solution: "test solution",
	outcome: "test outcome",
	stack: ["React"],
};

// Card-core-only fixture: the seven subpage-payload fields (panelColor,
// panelLight, media, problem, solution, outcome, stack) are intentionally
// omitted, mirroring a real stub project (e.g. Curia) before its subpage is
// authored (Option A, ticket #43). `iconKey` reuses an already-registered
// icon since this suite exercises ProjectPanel's degradation guards, not the
// data-layer icon registry (covered separately in projects.test.ts /
// typecheck). Cast through `as unknown as Project` because the payload
// fields aren't optional in the type yet - pinning that they're safe to omit
// is the whole point of this fixture.
const stubProject = {
	slug: "curia",
	title: "Curia",
	desc: "AI chamber for the modern engineer.",
	link: "https://github.com/alp82/curia",
	status: "building",
	highlight: false,
	tags: ["AI", "Open Source"],
	color: "bg-cyan-100 text-cyan-800",
	iconKey: "Cpu",
} as unknown as Project;

describe("ProjectPanel video lazy-mount contract", () => {
	afterEach(() => {
		cleanup();
	});

	it("does NOT render <video> when open is false", () => {
		const { container } = render(
			<ProjectPanel
				project={mockVideoProject}
				open={false}
				onClose={vi.fn()}
			/>,
		);
		expect(container.querySelector("video")).toBeNull();
	});

	it("renders <video autoPlay muted loop playsInline> when open is true", () => {
		const { container } = render(
			<ProjectPanel project={mockVideoProject} open={true} onClose={vi.fn()} />,
		);
		const video = container.querySelector("video");
		expect(video).not.toBeNull();
		expect(video?.autoplay).toBe(true);
		expect(video?.muted).toBe(true);
		expect(video?.loop).toBe(true);
		expect(video?.hasAttribute("playsinline")).toBe(true);
	});

	it("renders static fallback (no <video>) when prefers-reduced-motion is set", () => {
		const originalMatchMedia = window.matchMedia;
		window.matchMedia = vi.fn().mockImplementation((query: string) => ({
			matches: query === "(prefers-reduced-motion: reduce)",
			media: query,
			onchange: null,
			addEventListener: vi.fn(),
			removeEventListener: vi.fn(),
			addListener: vi.fn(),
			removeListener: vi.fn(),
			dispatchEvent: vi.fn(),
		})) as unknown as typeof window.matchMedia;

		try {
			const { container } = render(
				<ProjectPanel
					project={mockVideoProject}
					open={true}
					onClose={vi.fn()}
				/>,
			);
			expect(container.querySelector("video")).toBeNull();
			const poster = container.querySelector("img");
			const placeholder = container.querySelector('[role="img"]');
			expect(poster !== null || placeholder !== null).toBe(true);
		} finally {
			window.matchMedia = originalMatchMedia;
		}
	});
});

describe("ProjectPanel extraSection / extraLinks", () => {
	afterEach(() => {
		cleanup();
	});

	const extraSection = {
		heading: "How it works",
		body: "Assumptions are not allowed, therefore every sessions starts with confirming my intent and interviewing me to actually understand the task at hand. Ideally, every goal is programmatically verifiable to guarantee success once it's done.",
	};

	it("renders extraSection heading and verbatim body after Outcome", () => {
		const { container } = render(
			<ProjectPanel
				project={{ ...mockVideoProject, extraSection }}
				open={true}
				onClose={vi.fn()}
			/>,
		);
		const headings = Array.from(container.querySelectorAll("h3")).map((h) =>
			h.textContent?.trim(),
		);
		const outcomeIndex = headings.indexOf("Outcome");
		const extraIndex = headings.indexOf("How it works");
		expect(outcomeIndex).toBeGreaterThanOrEqual(0);
		expect(extraIndex).toBe(outcomeIndex + 1);
		expect(screen.getByText(extraSection.body)).not.toBeNull();
	});

	it("renders extraLinks as external anchors with target and rel", () => {
		render(
			<ProjectPanel
				project={{
					...mockVideoProject,
					extraLinks: [
						{ label: "Discord", href: "https://discord.gg/5y4fpyahaF" },
					],
				}}
				open={true}
				onClose={vi.fn()}
			/>,
		);
		const link = screen.getByRole("link", { name: /Discord/i });
		expect(link.getAttribute("href")).toBe("https://discord.gg/5y4fpyahaF");
		expect(link.getAttribute("target")).toBe("_blank");
		expect(link.getAttribute("rel")).toBe("noopener noreferrer");
	});

	it("renders neither extraSection nor extraLinks when the fields are omitted", () => {
		const { container } = render(
			<ProjectPanel project={mockVideoProject} open={true} onClose={vi.fn()} />,
		);
		const headings = Array.from(container.querySelectorAll("h3")).map((h) =>
			h.textContent?.trim(),
		);
		expect(headings).not.toContain("How it works");
		expect(screen.queryByRole("link", { name: /Discord/i })).toBeNull();
	});
});

const mockImageProject: Project = {
	...mockVideoProject,
	media: {
		type: "image",
		src: "/projects/forge-hero.png",
		alt: "Forge pipeline example in Claude Code",
	},
};

describe("ProjectPanel image media branch", () => {
	afterEach(() => {
		cleanup();
	});

	it("renders exactly one <img> with the data src and alt, no <video>, no icon placeholder", () => {
		const { container } = render(
			<ProjectPanel project={mockImageProject} open={true} onClose={vi.fn()} />,
		);
		const images = container.querySelectorAll("img");
		expect(images.length).toBe(1);
		expect(images[0]?.getAttribute("src")).toBe("/projects/forge-hero.png");
		expect(images[0]?.getAttribute("alt")).toBe(
			"Forge pipeline example in Claude Code",
		);
		expect(container.querySelector("video")).toBeNull();
		expect(container.querySelector('[role="img"]')).toBeNull();
	});

	it("falls back to project.title + ' hero' alt text when media.alt is absent", () => {
		const { container } = render(
			<ProjectPanel
				project={{
					...mockImageProject,
					media: { type: "image", src: "/projects/forge-hero.png" },
				}}
				open={true}
				onClose={vi.fn()}
			/>,
		);
		const img = container.querySelector("img");
		expect(img?.getAttribute("alt")).toBe(`${mockImageProject.title} hero`);
	});

	it("uses object-contain (not object-cover) on the image", () => {
		const { container } = render(
			<ProjectPanel project={mockImageProject} open={true} onClose={vi.fn()} />,
		);
		const img = container.querySelector("img");
		expect(img?.className).toContain("object-contain");
		expect(img?.className).not.toContain("object-cover");
	});

	it("still renders the icon fallback for illustration media", () => {
		const { container } = render(
			<ProjectPanel
				project={{ ...mockVideoProject, media: { type: "illustration" } }}
				open={true}
				onClose={vi.fn()}
			/>,
		);
		expect(container.querySelector("img")).toBeNull();
		expect(container.querySelector("video")).toBeNull();
		const icons = container.querySelectorAll("svg");
		expect(icons.length).toBeGreaterThan(0);
	});

	it("video branch behavior stays unaffected by the image branch", () => {
		const { container } = render(
			<ProjectPanel project={mockVideoProject} open={true} onClose={vi.fn()} />,
		);
		expect(container.querySelector("video")).not.toBeNull();
		expect(container.querySelector("img")).toBeNull();
	});
});

describe("ProjectPanel stage chain", () => {
	afterEach(() => {
		cleanup();
	});

	const stages = [
		"🔎 Intent",
		"🧭 Scout",
		"📐 Blueprint",
		"🧪 Tests",
		"🔨 Build",
		"🔬 Review",
		"🚀 Ship",
	];

	const extraSectionWithStages = {
		heading: "How it works",
		body: "Assumptions are not allowed, therefore every sessions starts with confirming my intent and interviewing me to actually understand the task at hand. Ideally, every goal is programmatically verifiable to guarantee success once it's done.",
		stages,
	};

	it("renders all seven stage labels in order inside the extraSection, before the body paragraph", () => {
		const { container } = render(
			<ProjectPanel
				project={{ ...mockVideoProject, extraSection: extraSectionWithStages }}
				open={true}
				onClose={vi.fn()}
			/>,
		);
		const sections = Array.from(container.querySelectorAll("section"));
		const extraSectionEl = sections.find((section) =>
			Array.from(section.querySelectorAll("h3")).some(
				(h) => h.textContent?.trim() === "How it works",
			),
		);
		expect(extraSectionEl).not.toBeUndefined();
		if (!extraSectionEl) throw new Error("extraSection not found");

		const listItems = Array.from(extraSectionEl.querySelectorAll("li"));
		const labels = listItems.map((li) =>
			Array.from(li.querySelectorAll("span"))
				.map((s) => s.textContent?.trim() ?? "")
				.filter((t) => t !== "" && t !== "→")
				.join(" "),
		);
		expect(labels).toEqual(stages);
		for (const li of listItems) {
			expect(li.className).not.toContain("uppercase");
		}

		const heading = extraSectionEl.querySelector("h3");
		const body = extraSectionEl.querySelector("p");
		const ul = extraSectionEl.querySelector("ul");
		expect(heading).not.toBeNull();
		expect(ul).not.toBeNull();
		expect(body).not.toBeNull();

		if (heading && ul && body) {
			expect(
				heading.compareDocumentPosition(ul) & Node.DOCUMENT_POSITION_FOLLOWING,
			).toBeTruthy();
			expect(
				ul.compareDocumentPosition(body) & Node.DOCUMENT_POSITION_FOLLOWING,
			).toBeTruthy();
		}
	});

	it("keeps the body byte-identical whether or not stages are present", () => {
		render(
			<ProjectPanel
				project={{ ...mockVideoProject, extraSection: extraSectionWithStages }}
				open={true}
				onClose={vi.fn()}
			/>,
		);
		expect(screen.getByText(extraSectionWithStages.body)).not.toBeNull();
	});

	it("renders stages.length - 1 aria-hidden separators, each nested inside its own <li>, never as a direct <ul> child", () => {
		const { container } = render(
			<ProjectPanel
				project={{ ...mockVideoProject, extraSection: extraSectionWithStages }}
				open={true}
				onClose={vi.fn()}
			/>,
		);
		const ul = container.querySelector("section ul");
		expect(ul).not.toBeNull();
		if (!ul) throw new Error("stage chain ul not found");

		const directSpanChildren = Array.from(ul.children).filter(
			(child) => child.tagName.toLowerCase() === "span",
		);
		expect(directSpanChildren.length).toBe(0);

		const separators = Array.from(
			ul.querySelectorAll('li [aria-hidden="true"]'),
		).filter((el) => el.textContent?.includes("→"));
		expect(separators.length).toBe(stages.length - 1);
		for (const separator of separators) {
			expect(separator.closest("li")).not.toBeNull();
			expect(separator.textContent).toContain("→");
		}
	});

	it("renders no chain elements when stages is absent", () => {
		const { container } = render(
			<ProjectPanel
				project={{
					...mockVideoProject,
					extraSection: {
						heading: "How it works",
						body: extraSectionWithStages.body,
					},
				}}
				open={true}
				onClose={vi.fn()}
			/>,
		);
		const sections = Array.from(container.querySelectorAll("section"));
		const extraSectionEl = sections.find((section) =>
			Array.from(section.querySelectorAll("h3")).some(
				(h) => h.textContent?.trim() === "How it works",
			),
		);
		expect(extraSectionEl).not.toBeUndefined();
		expect(extraSectionEl?.querySelector("ul")).toBeNull();
	});

	it("renders no chain elements when stages is an empty array", () => {
		const { container } = render(
			<ProjectPanel
				project={{
					...mockVideoProject,
					extraSection: { ...extraSectionWithStages, stages: [] },
				}}
				open={true}
				onClose={vi.fn()}
			/>,
		);
		const sections = Array.from(container.querySelectorAll("section"));
		const extraSectionEl = sections.find((section) =>
			Array.from(section.querySelectorAll("h3")).some(
				(h) => h.textContent?.trim() === "How it works",
			),
		);
		expect(extraSectionEl).not.toBeUndefined();
		expect(extraSectionEl?.querySelector("ul")).toBeNull();
	});
});

describe("ProjectPanel regressions after the copy/media pass", () => {
	afterEach(() => {
		cleanup();
	});

	it("keeps Problem, Solution, Outcome heading order unchanged", () => {
		const { container } = render(
			<ProjectPanel project={mockVideoProject} open={true} onClose={vi.fn()} />,
		);
		const headings = Array.from(container.querySelectorAll("h3")).map((h) =>
			h.textContent?.trim(),
		);
		expect(headings.slice(0, 3)).toEqual(["Problem", "Solution", "Outcome"]);
	});

	it("still renders the AIStack Discord anchor unchanged alongside the new copy", () => {
		render(
			<ProjectPanel
				project={{
					...mockVideoProject,
					desc: "Community-driven AI stacks: what people use, how they work and what it costs.",
					extraLinks: [
						{ label: "Discord", href: "https://discord.gg/5y4fpyahaF" },
					],
				}}
				open={true}
				onClose={vi.fn()}
			/>,
		);
		const link = screen.getByRole("link", { name: /Discord/i });
		expect(link.getAttribute("href")).toBe("https://discord.gg/5y4fpyahaF");
		expect(link.getAttribute("target")).toBe("_blank");
		expect(link.getAttribute("rel")).toBe("noopener noreferrer");
	});

	// B1 (challenge-gate user decision): `desc` renders as an always-on lead
	// paragraph on every subpage, including the four authored flagships.
	// Document-order pin, not just presence: the approved placement is
	// hero block, after the tags row, before the Visit/Close button row,
	// above THE PROBLEM section - a mutant that renders the blurb as the
	// last element under the Stack section must go red.
	it("renders the flagship's desc as a lead paragraph, between the hero tags and hero Visit button, above Problem", () => {
		const { container } = render(
			<ProjectPanel project={mockVideoProject} open={true} onClose={vi.fn()} />,
		);
		const blurb = screen.getByText(mockVideoProject.desc);

		const heroTagMatches = screen.getAllByText(`#${mockVideoProject.tags[0]}`);
		// sticky header renders the tag first, the hero tags row second.
		const heroTag = heroTagMatches[heroTagMatches.length - 1] as HTMLElement;

		const heroVisit = screen.getAllByRole("link", {
			name: `Visit ${mockVideoProject.title}`,
		})[1] as HTMLElement;

		const video = container.querySelector("video");
		expect(video).not.toBeNull();
		if (!video) throw new Error("expected the video media element");

		const problemHeading = screen.getByRole("heading", {
			level: 3,
			name: "Problem",
		});

		expect(
			heroTag.compareDocumentPosition(blurb) & Node.DOCUMENT_POSITION_FOLLOWING,
		).toBeTruthy();
		expect(
			blurb.compareDocumentPosition(heroVisit) &
				Node.DOCUMENT_POSITION_FOLLOWING,
		).toBeTruthy();
		expect(
			blurb.compareDocumentPosition(problemHeading) &
				Node.DOCUMENT_POSITION_FOLLOWING,
		).toBeTruthy();
	});

	it("leaves stack chip rendering untouched", () => {
		const { container } = render(
			<ProjectPanel
				project={{ ...mockVideoProject, stack: ["TypeScript", "Bun"] }}
				open={true}
				onClose={vi.fn()}
			/>,
		);
		const stackSection = Array.from(container.querySelectorAll("section")).find(
			(section) =>
				Array.from(section.querySelectorAll("h3")).some(
					(h) => h.textContent?.trim() === "Stack",
				),
		);
		expect(stackSection).not.toBeUndefined();
		const items = stackSection?.querySelectorAll("li");
		expect(items?.length).toBe(2);
		expect(Array.from(items ?? []).map((li) => li.textContent?.trim())).toEqual(
			["TypeScript", "Bun"],
		);
	});
});

describe("ProjectPanel stub degradation", () => {
	afterEach(() => {
		cleanup();
	});

	// B2/request #4: a card-core-only project (no media, no
	// problem/solution/outcome, no stack) must render a calm, finished-looking
	// page - title, tags, the desc blurb, and both external links - and must
	// not crash on the missing payload fields. The "no [role='img']" pin is
	// deliberate: that role is only the reduced-motion video fallback: lucide
	// icons are plain <svg>, so it can never false-positive here.
	it("renders title, tags, blurb, and external links; omits media and Problem/Solution/Outcome/Stack; does not throw", () => {
		expect(() => {
			render(
				<ProjectPanel project={stubProject} open={true} onClose={vi.fn()} />,
			);
		}).not.toThrow();

		// sticky header span + hero h2 both show the title
		expect(
			screen.getAllByText(stubProject.title).length,
		).toBeGreaterThanOrEqual(2);

		for (const tag of stubProject.tags) {
			expect(screen.getAllByText(`#${tag}`).length).toBeGreaterThan(0);
		}

		const blurb = screen.getByText(stubProject.desc);

		const visitLinks = screen.getAllByRole("link", {
			name: `Visit ${stubProject.title}`,
		});
		expect(visitLinks.length).toBe(2);

		// B1 document-order pin: the blurb sits in the hero block, after the
		// hero title, before the hero Visit button - not merely present
		// somewhere on the page (test-review-proven pair: green on the
		// correct placement, red on a mutant that renders the blurb as the
		// LAST element under the Stack section).
		const heroTitle = screen.getByRole("heading", {
			level: 2,
			name: stubProject.title,
		});
		const heroVisit = visitLinks[1] as HTMLElement;
		expect(
			heroTitle.compareDocumentPosition(blurb) &
				Node.DOCUMENT_POSITION_FOLLOWING,
		).toBeTruthy();
		expect(
			blurb.compareDocumentPosition(heroVisit) &
				Node.DOCUMENT_POSITION_FOLLOWING,
		).toBeTruthy();

		expect(document.querySelector("video")).toBeNull();
		expect(document.querySelector("img")).toBeNull();
		expect(document.querySelector('[role="img"]')).toBeNull();

		// Media-absence blocker fix (test-review): absence of video/img/
		// [role="img"] does not by itself prove the media block is gone - an
		// implementation that lets a payload-less project fall through to
		// the illustration branch passes all three of the above while still
		// rendering a 35vh band with a 120px icon and the hardcoded caption
		// below. Both pins are mutation-proven: green on the plan's
		// implementation (whole media block gated on `project.media`), red
		// on the fallthrough mutant.
		expect(document.querySelector('[class*="h-[35vh]"]')).toBeNull();
		expect(screen.queryByText(/Open source · TypeScript/)).toBeNull();

		for (const heading of ["Problem", "Solution", "Outcome", "Stack"]) {
			expect(
				screen.queryByRole("heading", { level: 3, name: heading }),
			).toBeNull();
		}
	});
});
