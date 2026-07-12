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
