// @vitest-environment jsdom
import { cleanup, render } from "@testing-library/react";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import type { Project } from "../../data/projects";
import { ProjectPanel } from "../ProjectPanel";

beforeAll(() => {
	if (typeof globalThis.IntersectionObserver === "undefined") {
		class StubIntersectionObserver {
			observe() {}
			unobserve() {}
			disconnect() {}
			takeRecords() {
				return [];
			}
			root = null;
			rootMargin = "";
			thresholds = [];
		}
		globalThis.IntersectionObserver =
			StubIntersectionObserver as unknown as typeof IntersectionObserver;
	}
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
