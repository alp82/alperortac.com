// @vitest-environment jsdom
import { act, cleanup, fireEvent, render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
	FOOTER_PHRASES,
	FOOTER_ROLES,
	FOOTER_TIMING,
} from "../../../../data/footer";
import { stubMatchMedia } from "../../../../test/stubMatchMedia";
import { FooterHeadline } from "../FooterHeadline";

describe("FooterHeadline render", () => {
	afterEach(() => {
		cleanup();
		vi.unstubAllGlobals();
		vi.useRealTimers();
	});

	const closingStatement = `${FOOTER_ROLES[0]} ${FOOTER_PHRASES[0]}`;

	it("reduced-motion - aria-label is the full closing statement and no .footer-cursor renders", () => {
		stubMatchMedia(true);
		const { container } = render(<FooterHeadline />);
		const el = container.querySelector("[aria-label]");
		expect(el).not.toBeNull();
		expect(el!.getAttribute("aria-label")).toBe(closingStatement);
		expect(el!.getAttribute("role")).toBe("img");
		expect(container.textContent).toContain(FOOTER_ROLES[0]);
		expect(container.textContent).toContain(FOOTER_PHRASES[0]);
		expect(container.querySelector(".footer-cursor")).toBeNull();
	});

	it("reduced-motion - all inner spans are aria-hidden", () => {
		stubMatchMedia(true);
		const { container } = render(<FooterHeadline />);
		const spans = Array.from(container.querySelectorAll("span"));
		expect(spans.length).toBeGreaterThan(0);
		for (const span of spans) {
			expect(span.getAttribute("aria-hidden")).toBe("true");
		}
	});

	it("animated - .footer-cursor present after act flush", async () => {
		stubMatchMedia(false);
		const { container } = render(<FooterHeadline />);
		await act(() => {});
		expect(container.querySelector(".footer-cursor")).not.toBeNull();
	});

	it("TC11 - labeled container has inline font-size of 60px (jsdom ceiling fallback, never NaN/0/empty)", () => {
		stubMatchMedia(true);
		const { container } = render(<FooterHeadline />);
		const el = container.querySelector("[aria-label]") as HTMLElement | null;
		expect(el).not.toBeNull();
		expect(el!.style.fontSize).toBe("60px");
	});

	it("TC12 - container reserves vertical space via minHeight tied to the ceiling", () => {
		stubMatchMedia(true);
		const { container } = render(<FooterHeadline />);
		const el = container.querySelector("[aria-label]") as HTMLElement | null;
		expect(el).not.toBeNull();
		expect(el!.style.minHeight).toBe("75px");
		expect(el!.style.minHeight).not.toBe("");
	});

	it("TC13 - exactly one aria-hidden ghost span exists as an invisible, absolutely positioned width marker", () => {
		stubMatchMedia(true);
		const { container } = render(<FooterHeadline />);
		const ghosts = Array.from(
			container.querySelectorAll("span.invisible.absolute"),
		);
		expect(ghosts.length).toBe(1);
		expect(ghosts[0]!.getAttribute("aria-hidden")).toBe("true");
	});

	it("TC15 - every span under the container is aria-hidden (role, phrase, cursor, ghost)", () => {
		stubMatchMedia(false);
		const { container } = render(<FooterHeadline />);
		const spans = Array.from(container.querySelectorAll("span"));
		expect(spans.length).toBeGreaterThan(0);
		for (const span of spans) {
			expect(span.getAttribute("aria-hidden")).toBe("true");
		}
	});

	it("TC17 - reduced motion: no .footer-cursor, but container still has inline font-size 60px", () => {
		stubMatchMedia(true);
		const { container } = render(<FooterHeadline />);
		expect(container.querySelector(".footer-cursor")).toBeNull();
		const el = container.querySelector("[aria-label]") as HTMLElement | null;
		expect(el).not.toBeNull();
		expect(el!.style.fontSize).toBe("60px");
	});

	it("nowrap classes: container is flex-nowrap and the phrase span is whitespace-nowrap; no legacy flex-wrap/text-size classes remain", () => {
		stubMatchMedia(true);
		const { container } = render(<FooterHeadline />);
		const el = container.querySelector("[aria-label]");
		expect(el).not.toBeNull();
		const containerClassName = el?.className ?? "";
		expect(containerClassName).toContain("flex-nowrap");
		expect(containerClassName).not.toContain("flex-wrap");
		expect(containerClassName).not.toContain("text-3xl");
		expect(containerClassName).not.toContain("md:text-5xl");
		expect(containerClassName).not.toContain("lg:text-6xl");

		// The visible (non-ghost) phrase span - a direct child of the labeled
		// container, distinct from the ghost's own nested nowrap-mirroring span
		// used only for measurement.
		const phraseSpan = container.querySelector(
			"[aria-label] > span:not(.invisible).whitespace-nowrap",
		);
		expect(phraseSpan).not.toBeNull();
		expect(phraseSpan?.className ?? "").toContain("whitespace-nowrap");
	});
});

// GAP1 - CORE BEHAVIORAL GUARANTEE: useFitText is keyed on the FULL phrase
// (`${role} ${phrase}`), never the partially typed `text`. jsdom's default
// zero-width layout makes fitFontSize short-circuit to the ceiling on every
// call, which would let a regression keyed on `text` pass every other test
// here unnoticed - so this stubs a realistic non-zero layout (mirroring
// useShortsRail's Object.defineProperty(clientWidth) + rect-stub pattern) to
// force a genuine, non-ceiling fitFontSize computation, and spies on the
// ghost's getBoundingClientRect to count re-measurements.
describe("FooterHeadline font-size keyed on phrase, not partial text", () => {
	afterEach(() => {
		cleanup();
		vi.unstubAllGlobals();
		vi.useRealTimers();
	});

	// Fake timers must be advanced one scheduled step at a time, each flushed
	// through its own `act` call: the cycle reducer's effect re-schedules its
	// *next* setTimeout from the just-committed state, so firing several due
	// callbacks inside a single un-flushed `advanceTimersByTime` window only
	// ever re-fires the stale first step instead of chaining forward.
	function tick(ms: number): void {
		act(() => {
			vi.advanceTimersByTime(ms);
		});
	}

	function ticks(count: number, ms: number): void {
		for (let i = 0; i < count; i++) tick(ms);
	}

	it("holds font-size and measurement count constant across in-phrase typing ticks, and re-measures only on a real phrase change", () => {
		vi.useFakeTimers();
		stubMatchMedia(false);
		const { container } = render(<FooterHeadline />);

		const el = container.querySelector("[aria-label]") as HTMLElement | null;
		expect(el).not.toBeNull();
		const ghost = container.querySelector(
			"span.invisible.absolute",
		) as HTMLElement | null;
		expect(ghost).not.toBeNull();
		if (el === null || ghost === null) throw new Error("unreachable");

		// Realistic non-zero layout: a narrow container and a wide ghost line,
		// so fitFontSize computes a genuine shrunk value instead of falling
		// back to the 60px ceiling.
		Object.defineProperty(el, "clientWidth", {
			value: 327,
			configurable: true,
		});
		const rectSpy = vi.fn(
			() =>
				({
					width: 1200,
					height: 20,
					top: 0,
					left: 0,
					right: 1200,
					bottom: 20,
					x: 0,
					y: 0,
					toJSON: () => ({}),
				}) as DOMRect,
		);
		ghost.getBoundingClientRect = rectSpy;

		act(() => {
			fireEvent(window, new Event("resize"));
		});

		// fitFontSize(327, 1200, FIT_SPEC) < ceiling: confirms the stubbed
		// layout is actually driving a real (non-fallback) computation.
		expect(el.style.fontSize).not.toBe("60px");
		expect(el.style.fontSize).not.toBe("");
		expect(rectSpy.mock.calls.length).toBeGreaterThan(0);

		// FOOTER_PHRASES[0] is initially typed out in full (phase="dwell",
		// turn="right"); drive: dwell -> backspacing (len0+1 ticks) lands
		// exactly on FOOTER_PHRASES[1]'s first typing tick - a genuine phrase
		// change (role+phrase key flips as soon as backspacing empties out,
		// before any char of the new phrase is typed).
		const phrase0Len = FOOTER_PHRASES[0]?.length ?? 0;
		tick(FOOTER_TIMING.dwell);
		ticks(phrase0Len + 1, FOOTER_TIMING.backspace);

		const labelAtPhrase1Start = el.getAttribute("aria-label");
		expect(labelAtPhrase1Start).toContain(FOOTER_PHRASES[1]);
		const callsAtPhrase1Start = rectSpy.mock.calls.length;
		expect(callsAtPhrase1Start).toBeGreaterThan(0);
		const fontSizeAtPhrase1Start = el.style.fontSize;

		// Several typing ticks WITHIN phrase1: `text` grows char by char, but
		// the fit-text key (`${role} ${phrase}`) does not change, since
		// `phrase` is the full target string, not the partial typed text.
		const inPhraseTicks = 3;
		ticks(inPhraseTicks, FOOTER_TIMING.type);

		expect(el.getAttribute("aria-label")).toBe(labelAtPhrase1Start);
		expect(el.style.fontSize).toBe(fontSizeAtPhrase1Start);
		expect(rectSpy.mock.calls.length).toBe(callsAtPhrase1Start);

		// Finish typing phrase1, dwell, push, dwell, then fully backspace
		// phrase1 to land on phrase2's first typing tick - another genuine
		// phrase change. The measurement count must increase here, proving
		// the hook isn't frozen forever, only held steady mid-phrase.
		const phrase1Len = FOOTER_PHRASES[1]?.length ?? 0;
		const remainingTypingTicks = phrase1Len - inPhraseTicks;
		ticks(remainingTypingTicks, FOOTER_TIMING.type);
		tick(FOOTER_TIMING.dwell);
		tick(FOOTER_TIMING.push);
		tick(FOOTER_TIMING.dwell);
		ticks(phrase1Len + 1, FOOTER_TIMING.backspace);

		expect(el.getAttribute("aria-label")).toContain(FOOTER_PHRASES[2]);
		expect(el.getAttribute("aria-label")).not.toBe(labelAtPhrase1Start);
		expect(rectSpy.mock.calls.length).toBeGreaterThan(callsAtPhrase1Start);
	});
});

// GROUP B - breakpoint-aware ceiling wiring: measure() clamps fitFontSize's
// result to resolveCeiling(window.innerWidth, FOOTER_CEILINGS), so the same
// short phrase must resolve to a lower cap on mobile than on desktop.
describe("FooterHeadline breakpoint-aware ceiling", () => {
	afterEach(() => {
		cleanup();
		vi.unstubAllGlobals();
		vi.useRealTimers();
		Object.defineProperty(window, "innerWidth", {
			configurable: true,
			value: 1024,
		});
	});

	function stubInnerWidth(width: number): void {
		Object.defineProperty(window, "innerWidth", {
			configurable: true,
			value: width,
		});
	}

	it("MOBILE CAP - a short phrase that would fit at 60px is capped down to resolveCeiling(375)=30px", () => {
		stubMatchMedia(true);
		stubInnerWidth(375);
		const { container } = render(<FooterHeadline />);

		const el = container.querySelector("[aria-label]") as HTMLElement | null;
		const ghost = container.querySelector(
			"span.invisible.absolute",
		) as HTMLElement | null;
		expect(el).not.toBeNull();
		expect(ghost).not.toBeNull();
		if (el === null || ghost === null) throw new Error("unreachable");

		// Wide-enough container + short ghost line: fitFontSize alone would
		// resolve near the 60px ceiling, but the mobile breakpoint cap must
		// still pull it down to 30px.
		Object.defineProperty(el, "clientWidth", {
			value: 327,
			configurable: true,
		});
		ghost.getBoundingClientRect = () =>
			({
				width: 20,
				height: 20,
				top: 0,
				left: 0,
				right: 20,
				bottom: 20,
				x: 0,
				y: 0,
				toJSON: () => ({}),
			}) as DOMRect;

		act(() => {
			fireEvent(window, new Event("resize"));
		});

		expect(el.style.fontSize).toBe("30px");
		expect(el.style.fontSize).not.toBe("60px");

		// minHeight reservation must scale down with the resolved mobile
		// ceiling (30 * 1.25 = 37.5px), not stay pinned at the desktop 75px.
		expect(el.style.minHeight).toBe("37.5px");
		expect(el.style.minHeight).not.toBe("75px");
	});

	it("DESKTOP UNCHANGED - a short phrase at the desktop breakpoint still resolves to the 60px ceiling", () => {
		stubMatchMedia(true);
		stubInnerWidth(1024);
		const { container } = render(<FooterHeadline />);

		const el = container.querySelector("[aria-label]") as HTMLElement | null;
		const ghost = container.querySelector(
			"span.invisible.absolute",
		) as HTMLElement | null;
		expect(el).not.toBeNull();
		expect(ghost).not.toBeNull();
		if (el === null || ghost === null) throw new Error("unreachable");

		Object.defineProperty(el, "clientWidth", {
			value: 327,
			configurable: true,
		});
		ghost.getBoundingClientRect = () =>
			({
				width: 0,
				height: 20,
				top: 0,
				left: 0,
				right: 0,
				bottom: 20,
				x: 0,
				y: 0,
				toJSON: () => ({}),
			}) as DOMRect;

		act(() => {
			fireEvent(window, new Event("resize"));
		});

		expect(el.style.fontSize).toBe("60px");
	});
});
