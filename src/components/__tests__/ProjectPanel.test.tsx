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
		src: "/projects/alp-river-hero.png",
		alt: "Alp-River pipeline example in Claude Code",
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
		expect(images[0]?.getAttribute("src")).toBe("/projects/alp-river-hero.png");
		expect(images[0]?.getAttribute("alt")).toBe(
			"Alp-River pipeline example in Claude Code",
		);
		expect(container.querySelector("video")).toBeNull();
		expect(container.querySelector('[role="img"]')).toBeNull();
	});

	it("falls back to project.title + ' hero' alt text when media.alt is absent", () => {
		const { container } = render(
			<ProjectPanel
				project={{
					...mockImageProject,
					media: { type: "image", src: "/projects/alp-river-hero.png" },
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
