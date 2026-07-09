// @vitest-environment jsdom
import { act, cleanup, fireEvent, render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { YOUTUBE_SHORTS } from "../../../data/youtubeShorts";
import { stubMatchMedia } from "../../../test/stubMatchMedia";
import { FindMeSection } from "../FindMeSection";
import { viewsLabel } from "../social/ShortsCarousel";
import { SOCIAL_GROUPS, SOCIAL_LINKS } from "../social/socialLinks";

// ---------------------------------------------------------------------------
// Render tests for FindMeSection's C1 composition: a leading Shorts carousel
// (rail) followed by the platform chip directory. Directory assertions read
// the real SOCIAL_LINKS/SOCIAL_GROUPS registry rather than hardcoding labels
// or hrefs; carousel assertions read the real (build-time-generated)
// YOUTUBE_SHORTS data. Follows the jsdom-annotation + render-harness
// convention of FollowMeRow.render.test.tsx.
// ---------------------------------------------------------------------------

afterEach(() => {
	cleanup();
	vi.unstubAllGlobals();
	vi.useRealTimers();
});

// Anchors that live inside the rail belong to the carousel, not the chip
// directory — used throughout to scope directory-only assertions.
function directoryAnchors(container: HTMLElement): HTMLAnchorElement[] {
	const rail = container.querySelector(".shorts-rail");
	return Array.from(container.querySelectorAll("a")).filter(
		(a) => !rail || !rail.contains(a),
	);
}

describe("FindMeSection directory", () => {
	it("renders the 'Find Me Online' heading", () => {
		const { container } = render(<FindMeSection isNight={false} />);
		const h2 = Array.from(container.querySelectorAll("h2")).find((h) =>
			/find me online/i.test(h.textContent ?? ""),
		);
		expect(h2).toBeTruthy();
	});

	it("renders every SOCIAL_GROUPS title", () => {
		const { container } = render(<FindMeSection isNight={false} />);
		const h3Texts = Array.from(container.querySelectorAll("h3")).map(
			(h) => h.textContent ?? "",
		);
		for (const group of SOCIAL_GROUPS) {
			expect(h3Texts.some((t) => t.includes(group.title))).toBe(true);
		}
	});

	it("renders exactly 9 chip anchors matching the flattened SOCIAL_LINKS in order", () => {
		const { container } = render(<FindMeSection isNight={false} />);
		const anchors = directoryAnchors(container);
		expect(SOCIAL_LINKS.length).toBe(9);
		expect(anchors.length).toBe(9);
		SOCIAL_LINKS.forEach((link, i) => {
			expect(anchors[i]?.getAttribute("href")).toBe(link.href);
		});
	});

	it("every chip className includes btn-brutalist--chip", () => {
		const { container } = render(<FindMeSection isNight={false} />);
		for (const anchor of directoryAnchors(container)) {
			expect(anchor.className).toContain("btn-brutalist--chip");
		}
	});

	it("the X link is rendered as a chip", () => {
		const { container } = render(<FindMeSection isNight={false} />);
		const xAnchor = directoryAnchors(container).find(
			(a) => a.getAttribute("href") === "https://x.com/alperortac",
		);
		expect(xAnchor).toBeTruthy();
		expect(xAnchor?.className).toContain("btn-brutalist--chip");
	});

	it("isNight={true} adds btn-brutalist--night to every chip", () => {
		const { container } = render(<FindMeSection isNight={true} />);
		const anchors = directoryAnchors(container);
		expect(anchors.length).toBeGreaterThan(0);
		for (const anchor of anchors) {
			expect(anchor.className).toContain("btn-brutalist--night");
		}
	});

	it("isNight={false} does not add btn-brutalist--night to any chip", () => {
		const { container } = render(<FindMeSection isNight={false} />);
		const anchors = directoryAnchors(container);
		expect(anchors.length).toBeGreaterThan(0);
		for (const anchor of anchors) {
			expect(anchor.className).not.toContain("btn-brutalist--night");
		}
	});

	it("no arrow-right icon renders anywhere in the directory (removed ArrowRight regression guard)", () => {
		const { container } = render(<FindMeSection isNight={false} />);
		expect(container.querySelector(".lucide-arrow-right")).toBeNull();
	});
});

describe("FindMeSection carousel", () => {
	it("renders exactly YOUTUBE_SHORTS.length cards in the rail", () => {
		const { container } = render(<FindMeSection isNight={false} />);
		const rail = container.querySelector(".shorts-rail");
		expect(rail).toBeTruthy();
		const cards = rail?.querySelectorAll("a") ?? [];
		expect(cards.length).toBe(YOUTUBE_SHORTS.length);
	});

	it("each card anchor targets its short's YouTube Shorts URL, in data order, with target=_blank and rel~noopener", () => {
		const { container } = render(<FindMeSection isNight={false} />);
		const rail = container.querySelector(".shorts-rail") as HTMLElement;
		const anchors = Array.from(rail.querySelectorAll("a"));
		YOUTUBE_SHORTS.forEach((short, i) => {
			const anchor = anchors[i];
			expect(anchor?.getAttribute("href")).toBe(
				`https://www.youtube.com/shorts/${short.id}`,
			);
			expect(anchor?.getAttribute("target")).toBe("_blank");
			expect(anchor?.getAttribute("rel") ?? "").toContain("noopener");
		});
	});

	it("every anchor inside .shorts-rail is a youtube.com/shorts link (X is not in the rail)", () => {
		const { container } = render(<FindMeSection isNight={false} />);
		const rail = container.querySelector(".shorts-rail") as HTMLElement;
		const anchors = Array.from(rail.querySelectorAll("a"));
		expect(anchors.length).toBeGreaterThan(0);
		for (const anchor of anchors) {
			expect(anchor.getAttribute("href")).toMatch(
				/^https:\/\/www\.youtube\.com\/shorts\//,
			);
		}
		const xInRail = anchors.some(
			(a) => a.getAttribute("href") === "https://x.com/alperortac",
		);
		expect(xInRail).toBe(false);
	});

	it("each card shows its title, the channel name, an oardefault thumbnail, and its views label", () => {
		const { container } = render(<FindMeSection isNight={false} />);
		const rail = container.querySelector(".shorts-rail") as HTMLElement;
		const anchors = Array.from(rail.querySelectorAll("a"));
		YOUTUBE_SHORTS.forEach((short, i) => {
			const card = anchors[i];
			expect(card?.textContent ?? "").toContain(short.title);
			expect(card?.textContent ?? "").toContain("Alper Ortac");
			const img = card?.querySelector("img");
			expect(img).toBeTruthy();
			expect(img?.getAttribute("src") ?? "").toMatch(/oardefault/);
			expect(card?.textContent ?? "").toContain(viewsLabel(short.views));
		});
	});

	it("the centered play glyph has exactly 2 paths: red #FF0000 and white #FFFFFF notch", () => {
		const { container } = render(<FindMeSection isNight={false} />);
		const rail = container.querySelector(".shorts-rail") as HTMLElement;
		const firstCard = rail.querySelector("a") as HTMLElement;
		const allPaths = Array.from(firstCard.querySelectorAll("path"));
		const red = allPaths.find((p) => p.getAttribute("fill") === "#FF0000");
		expect(red).toBeTruthy();
		const glyphSvg = red?.closest("svg");
		expect(glyphSvg).toBeTruthy();
		const glyphPaths = Array.from(
			(glyphSvg as SVGElement).querySelectorAll("path"),
		);
		expect(glyphPaths.length).toBe(2);
		const white = glyphPaths.find((p) => p.getAttribute("fill") === "#FFFFFF");
		expect(white).toBeTruthy();
		expect(white?.getAttribute("d")).toBe("M9.597 15.19V8.824l6.007 3.184z");
	});

	it("DOM order: .shorts-rail precedes the chip directory", () => {
		const { container } = render(<FindMeSection isNight={false} />);
		const rail = container.querySelector(".shorts-rail");
		const postsHeading = Array.from(container.querySelectorAll("h3")).find(
			(h) => /posts/i.test(h.textContent ?? ""),
		);
		expect(rail).toBeTruthy();
		expect(postsHeading).toBeTruthy();
		const position = rail?.compareDocumentPosition(
			postsHeading as Node,
		) as number;
		expect(Boolean(position & Node.DOCUMENT_POSITION_FOLLOWING)).toBe(true);
	});

	it("the rail element is keyboard-focusable (tabIndex 0)", () => {
		const { container } = render(<FindMeSection isNight={false} />);
		const rail = container.querySelector(".shorts-rail") as HTMLElement;
		expect(rail.tabIndex).toBe(0);
	});

	it("ArrowRight keydown on the rail is defaultPrevented and does not throw (zero-step guard)", () => {
		const { container } = render(<FindMeSection isNight={false} />);
		const rail = container.querySelector(".shorts-rail") as HTMLElement;
		expect(() => {
			const event = new KeyboardEvent("keydown", {
				key: "ArrowRight",
				bubbles: true,
				cancelable: true,
			});
			rail.dispatchEvent(event);
			expect(event.defaultPrevented).toBe(true);
		}).not.toThrow();
	});

	it("falls back from oardefault to hqdefault on first thumbnail error, then hides the image on a second error", () => {
		const { container } = render(<FindMeSection isNight={false} />);
		const rail = container.querySelector(".shorts-rail") as HTMLElement;
		const firstCard = rail.querySelector("a") as HTMLElement;
		const img = firstCard.querySelector("img") as HTMLImageElement;
		expect(img.getAttribute("src") ?? "").toMatch(/oardefault/);

		fireEvent.error(img);
		const fallbackImg = firstCard.querySelector("img") as HTMLImageElement;
		expect(fallbackImg.getAttribute("src") ?? "").toMatch(/hqdefault/);

		fireEvent.error(fallbackImg);
		const shortId = YOUTUBE_SHORTS[0]?.id ?? "";
		const thumbImgs = Array.from(
			firstCard.querySelectorAll("img") as NodeListOf<HTMLImageElement>,
		).filter((el) => (el.getAttribute("src") ?? "").includes(shortId));
		expect(thumbImgs.length).toBe(0);
	});

	it("under stubMatchMedia(true) there are zero pending timers after effects settle", () => {
		vi.useFakeTimers();
		stubMatchMedia(true);
		render(<FindMeSection isNight={false} />);
		act(() => {
			vi.advanceTimersByTime(0);
		});
		expect(vi.getTimerCount()).toBe(0);
	});
});

describe("viewsLabel", () => {
	it("returns the plain integer under 1000 unformatted", () => {
		expect(viewsLabel(999)).toBe("999");
	});

	it("formats an even thousand without a trailing .0", () => {
		expect(viewsLabel(2000)).toBe("2K");
	});

	it("formats a half-thousand with one decimal place", () => {
		expect(viewsLabel(1500)).toBe("1.5K");
	});

	it("formats an arbitrary thousands value with one decimal place", () => {
		expect(viewsLabel(12400)).toBe("12.4K");
	});
});
