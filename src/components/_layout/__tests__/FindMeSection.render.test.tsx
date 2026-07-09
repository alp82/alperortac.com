// @vitest-environment jsdom
import { act, cleanup, fireEvent, render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { YOUTUBE_SHORTS } from "../../../data/youtubeShorts";
import { stubMatchMedia } from "../../../test/stubMatchMedia";
import { stubSectionGeometry } from "../../../test/stubSectionGeometry";
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
	it("renders every SOCIAL_GROUPS title", () => {
		const { container } = render(<FindMeSection />);
		const h3Texts = Array.from(container.querySelectorAll("h3")).map(
			(h) => h.textContent ?? "",
		);
		for (const group of SOCIAL_GROUPS) {
			expect(h3Texts.some((t) => t.includes(group.title))).toBe(true);
		}
	});

	it("renders exactly 9 chip anchors matching the flattened SOCIAL_LINKS in order", () => {
		const { container } = render(<FindMeSection />);
		const anchors = directoryAnchors(container);
		expect(SOCIAL_LINKS.length).toBe(9);
		expect(anchors.length).toBe(9);
		SOCIAL_LINKS.forEach((link, i) => {
			expect(anchors[i]?.getAttribute("href")).toBe(link.href);
		});
	});

	it("every chip className includes btn-brutalist--chip", () => {
		const { container } = render(<FindMeSection />);
		for (const anchor of directoryAnchors(container)) {
			expect(anchor.className).toContain("btn-brutalist--chip");
		}
	});

	it("the X link is rendered as a chip", () => {
		const { container } = render(<FindMeSection />);
		const xAnchor = directoryAnchors(container).find(
			(a) => a.getAttribute("href") === "https://x.com/alperortac",
		);
		expect(xAnchor).toBeTruthy();
		expect(xAnchor?.className).toContain("btn-brutalist--chip");
	});

	// The isNight-prop-driven chip night tests that used to live here were
	// removed: FindMeSection no longer accepts an isNight prop — night is now
	// derived once from the whole section's own scroll position (the v4
	// whole-section day/night freeze). See the geometry-driven
	// "FindMeSection whole-section day/night freeze" describe block below for
	// their replacement (FM-N1/FM-N2/FM-N3).

	it("no arrow-right icon renders anywhere in the directory (removed ArrowRight regression guard)", () => {
		const { container } = render(<FindMeSection />);
		expect(container.querySelector(".lucide-arrow-right")).toBeNull();
	});
});

describe("FindMeSection carousel", () => {
	it("renders exactly YOUTUBE_SHORTS.length cards in the rail", () => {
		const { container } = render(<FindMeSection />);
		const rail = container.querySelector(".shorts-rail");
		expect(rail).toBeTruthy();
		const cards = rail?.querySelectorAll("a") ?? [];
		expect(cards.length).toBe(YOUTUBE_SHORTS.length);
	});

	it("each card anchor targets its short's YouTube Shorts URL, in data order, with target=_blank and rel~noopener", () => {
		const { container } = render(<FindMeSection />);
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
		const { container } = render(<FindMeSection />);
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
		const { container } = render(<FindMeSection />);
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
		const { container } = render(<FindMeSection />);
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
		const { container } = render(<FindMeSection />);
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
		const { container } = render(<FindMeSection />);
		const rail = container.querySelector(".shorts-rail") as HTMLElement;
		expect(rail.tabIndex).toBe(0);
	});

	it("ArrowRight keydown on the rail is defaultPrevented and does not throw (zero-step guard)", () => {
		const { container } = render(<FindMeSection />);
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
		const { container } = render(<FindMeSection />);
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

	it(".shorts-track sits inside .shorts-rail and holds exactly YOUTUBE_SHORTS.length card anchors", () => {
		const { container } = render(<FindMeSection />);
		const rail = container.querySelector(".shorts-rail") as HTMLElement;
		const track = rail.querySelector(".shorts-track");
		expect(track).toBeTruthy();
		expect(track?.parentElement).toBe(rail);
		const anchors = track?.querySelectorAll("a") ?? [];
		expect(anchors.length).toBe(YOUTUBE_SHORTS.length);
	});

	it("renders the scrollbar as a pointer-only affordance hidden from AT (role=presentation, aria-hidden) with a thumb, hidden in jsdom", () => {
		const { container } = render(<FindMeSection />);
		const bar = container.querySelector(".shorts-scrollbar") as HTMLElement;
		expect(bar).toBeTruthy();
		expect(bar.getAttribute("role")).toBe("presentation");
		expect(bar.getAttribute("aria-hidden")).toBe("true");
		expect(bar.hidden).toBe(true);
		expect(bar.querySelector(".shorts-scrollbar__thumb")).toBeTruthy();
	});

	// The isNight-prop-driven scrollbar night tests that used to live here
	// were removed alongside the chip ones above — see the geometry-driven
	// "FindMeSection whole-section day/night freeze" describe block below.

	it("focus on a card anchor neutralizes the browser's forced scroll on the hidden-overflow rail", () => {
		const { container } = render(<FindMeSection />);
		const rail = container.querySelector(".shorts-rail") as HTMLElement;
		const anchors = rail.querySelectorAll("a");
		const third = anchors[2] as HTMLElement;
		expect(third).toBeTruthy();
		rail.scrollLeft = 5;
		fireEvent.focusIn(third);
		expect(rail.scrollLeft).toBe(0);
	});

	it("a drag past the net-displacement threshold suppresses the following click (C1/U2)", () => {
		const { container } = render(<FindMeSection />);
		const rail = container.querySelector(".shorts-rail") as HTMLElement;
		const anchor = rail.querySelector("a") as HTMLAnchorElement;

		fireEvent.pointerDown(rail, {
			pointerId: 1,
			isPrimary: true,
			button: 0,
			clientX: 100,
		});
		fireEvent.pointerMove(rail, {
			pointerId: 1,
			isPrimary: true,
			clientX: 100 - 20,
		});
		fireEvent.pointerUp(rail, { pointerId: 1, isPrimary: true });

		const clickEvent = new MouseEvent("click", {
			bubbles: true,
			cancelable: true,
		});
		const dispatched = anchor.dispatchEvent(clickEvent);
		expect(clickEvent.defaultPrevented).toBe(true);
		expect(dispatched).toBe(false);
	});

	it("sub-threshold jitter does not suppress the click (U2)", () => {
		const { container } = render(<FindMeSection />);
		const rail = container.querySelector(".shorts-rail") as HTMLElement;
		const anchor = rail.querySelector("a") as HTMLAnchorElement;

		fireEvent.pointerDown(rail, {
			pointerId: 1,
			isPrimary: true,
			button: 0,
			clientX: 100,
		});
		fireEvent.pointerMove(rail, {
			pointerId: 1,
			isPrimary: true,
			clientX: 100 - 3,
		});
		fireEvent.pointerUp(rail, { pointerId: 1, isPrimary: true });

		const clickEvent = new MouseEvent("click", {
			bubbles: true,
			cancelable: true,
		});
		const dispatched = anchor.dispatchEvent(clickEvent);
		expect(clickEvent.defaultPrevented).toBe(false);
		expect(dispatched).toBe(true);
	});

	it("a non-primary/right-click pointerdown is ignored and does not start a drag (C3)", () => {
		const { container } = render(<FindMeSection />);
		const rail = container.querySelector(".shorts-rail") as HTMLElement;
		const anchor = rail.querySelector("a") as HTMLAnchorElement;

		fireEvent.pointerDown(rail, {
			pointerId: 1,
			isPrimary: true,
			button: 2,
			clientX: 100,
		});
		fireEvent.pointerMove(rail, {
			pointerId: 1,
			isPrimary: true,
			clientX: 100 - 40,
		});
		fireEvent.pointerUp(rail, { pointerId: 1, isPrimary: true });

		const clickEvent = new MouseEvent("click", {
			bubbles: true,
			cancelable: true,
		});
		const dispatched = anchor.dispatchEvent(clickEvent);
		expect(clickEvent.defaultPrevented).toBe(false);
		expect(dispatched).toBe(true);
	});

	it("focusin while dragging neutralizes scrollLeft but does not fight the drag (C2)", () => {
		const { container } = render(<FindMeSection />);
		const rail = container.querySelector(".shorts-rail") as HTMLElement;
		const anchors = rail.querySelectorAll("a");
		const third = anchors[2] as HTMLElement;

		fireEvent.pointerDown(rail, {
			pointerId: 1,
			isPrimary: true,
			button: 0,
			clientX: 100,
		});
		rail.scrollLeft = 5;
		expect(() => fireEvent.focusIn(third)).not.toThrow();
		expect(rail.scrollLeft).toBe(0);

		fireEvent.pointerUp(rail, { pointerId: 1, isPrimary: true });
	});

	it("under stubMatchMedia(true) there are zero pending timers after effects settle", () => {
		vi.useFakeTimers();
		stubMatchMedia(true);
		render(<FindMeSection />);
		act(() => {
			vi.advanceTimersByTime(0);
		});
		expect(vi.getTimerCount()).toBe(0);
	});
});

// v4 whole-section day/night freeze: FindMeSection no longer takes an
// isNight prop. Instead, its own SectionTitle measures the SECTION root
// (#find-me) once at mount, and every night-dependent bit inside — the
// heading, every chip, and the scrollbar indicator — must all agree with
// that single section-level phase, even when adversarially given a
// DIFFERENT rect on their own wrapper.
describe("FindMeSection whole-section day/night freeze", () => {
	afterEach(() => {
		cleanup();
	});

	// FM-N1: whole-section NIGHT consistency. Section center progress:
	// centerY = 5860 + 1800/2 = 6760; scrollProgressAt(6760 - 400, 10000, 800)
	// = (6360)/9200 ≈ 0.691 ≥ 0.55 → night.
	it("section-level night geometry drives the heading, every chip, and the scrollbar together", () => {
		const restore = stubSectionGeometry({
			scrollHeight: 10000,
			innerHeight: 800,
			rects: [{ match: "#find-me", top: 5860, height: 1800 }],
		});
		const { container } = render(<FindMeSection />);
		const h2 = Array.from(container.querySelectorAll("h2")).find(
			(h) => h.textContent?.trim() === "Find Me",
		);
		expect(h2).toBeTruthy();
		expect(h2?.className).toContain("text-white");

		const anchors = directoryAnchors(container);
		expect(anchors.length).toBeGreaterThan(0);
		for (const anchor of anchors) {
			expect(anchor.className).toContain("btn-brutalist--night");
		}

		const bar = container.querySelector(".shorts-scrollbar") as HTMLElement;
		expect(bar.className).toContain("shorts-scrollbar--night");
		restore();
	});

	// FM-N2: adversarial title-vs-section split, proving the heading follows
	// the SECTION's frozen phase, not its own (title wrapper's) rect.
	it("night side: section is night, title's own default rect is far-day — heading still follows the section (night)", () => {
		const restore = stubSectionGeometry({
			scrollHeight: 10000,
			innerHeight: 800,
			rects: [{ match: "#find-me", top: 5860, height: 1800 }],
			rect: { top: 100, height: 100 },
		});
		const { container } = render(<FindMeSection />);
		const h2 = Array.from(container.querySelectorAll("h2")).find(
			(h) => h.textContent?.trim() === "Find Me",
		);
		expect(h2).toBeTruthy();
		expect(h2?.className).toContain("text-white");
		restore();
	});

	// centerY(#find-me) = 50 + 100/2 = 100; (100-400)/9200 < 0 → clamp01 → 0 (day).
	// centerY(default/title) = 5860 + 800/2 = 6260; (6260-400)/9200 ≈ 0.637 ≥ 0.55
	// (night) — so the title's OWN rect would say night, but the section says
	// day; the heading must still follow the section.
	it("day side: section is day, title's own default rect is far-night — heading still follows the section (day)", () => {
		const restore = stubSectionGeometry({
			scrollHeight: 10000,
			innerHeight: 800,
			rects: [{ match: "#find-me", top: 50, height: 100 }],
			rect: { top: 5860, height: 800 },
		});
		const { container } = render(<FindMeSection />);
		const h2 = Array.from(container.querySelectorAll("h2")).find(
			(h) => h.textContent?.trim() === "Find Me",
		);
		expect(h2).toBeTruthy();
		expect(h2?.className).toContain("text-slate-900");
		restore();
	});

	// FM-N3: whole-section DAY consistency — no --night class anywhere.
	it("uniform day geometry: no --night class anywhere, heading is text-slate-900", () => {
		const restore = stubSectionGeometry({
			scrollHeight: 10000,
			innerHeight: 800,
			rect: { top: 50, height: 100 },
		});
		const { container } = render(<FindMeSection />);
		const h2 = Array.from(container.querySelectorAll("h2")).find(
			(h) => h.textContent?.trim() === "Find Me",
		);
		expect(h2).toBeTruthy();
		expect(h2?.className).toContain("text-slate-900");

		const anchors = directoryAnchors(container);
		for (const anchor of anchors) {
			expect(anchor.className).not.toContain("btn-brutalist--night");
		}

		const bar = container.querySelector(".shorts-scrollbar") as HTMLElement;
		expect(bar.className).not.toContain("shorts-scrollbar--night");
		restore();
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
