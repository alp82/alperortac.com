// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { DEFAULT_CELESTIAL } from "../../../../data/celestial";
import { MINIMAP_BOUNDARIES, SECTION_IDS } from "../../../../data/sections";
import { skyAt } from "../../../../data/skyCurve";
import {
	JOURNEY_WAYPOINTS,
	JourneyColumn,
	MOON_TRAIL,
	SECTION_SPANS,
	SUN_TRAIL,
	YOU_ARE_HERE,
} from "../JourneyColumn";

describe("JourneyColumn waypoints", () => {
	afterEach(() => {
		cleanup();
	});

	it("is Hero plus the minimap's own boundary list, in journey order", () => {
		expect(JOURNEY_WAYPOINTS.map((w) => w.label)).toEqual([
			"Hero",
			...MINIMAP_BOUNDARIES.map((b) => b.label),
		]);
	});

	it("marks Projects as you-are-here: the band this panel was dived from", () => {
		expect(YOU_ARE_HERE).toBe(SECTION_IDS.projects);
		render(<JourneyColumn />);
		const here = document.querySelector(
			`[data-journey-waypoint="${SECTION_IDS.projects}"]`,
		);
		expect(here?.textContent).toMatch(/you are here/i);
		// Exactly one waypoint carries the mark.
		const marked = Array.from(
			document.querySelectorAll("[data-journey-waypoint]"),
		).filter((el) => /you are here/i.test(el.textContent ?? ""));
		expect(marked).toHaveLength(1);
	});

	it("renders every waypoint in declared document order", () => {
		render(<JourneyColumn />);
		const rendered = JOURNEY_WAYPOINTS.map((w) =>
			screen.getByText(w.label, { selector: "span" }),
		);
		for (let i = 1; i < rendered.length; i += 1) {
			const previous = rendered[i - 1];
			const current = rendered[i];
			if (!previous || !current) throw new Error("missing waypoint");
			expect(
				previous.compareDocumentPosition(current) &
					Node.DOCUMENT_POSITION_FOLLOWING,
			).toBeTruthy();
		}
	});
});

describe("JourneyColumn measured ladder (#55)", () => {
	afterEach(() => {
		cleanup();
	});

	// The whole point of the rework: the ladder is no longer 25% steps. If these
	// go, the drawing has silently gone back to claiming Projects sits at dusk.
	it("carries a span for every waypoint, contiguous from the top of the journey to the bottom", () => {
		const spans = JOURNEY_WAYPOINTS.map((w) => SECTION_SPANS[w.id]);
		expect(spans.every(Boolean)).toBe(true);
		const first = spans[0];
		const last = spans[spans.length - 1];
		if (!first || !last) throw new Error("missing span");
		expect(first[0]).toBe(0);
		expect(last[1]).toBe(1);
		for (let i = 1; i < spans.length; i += 1) {
			const previous = spans[i - 1];
			const current = spans[i];
			if (!previous || !current) throw new Error("missing span");
			// Bands run forward and never overlap.
			expect(current[0]).toBeGreaterThanOrEqual(previous[1]);
			expect(current[1]).toBeGreaterThan(current[0]);
		}
	});

	it("gives Craft more of the journey than every other section combined", () => {
		const craft = SECTION_SPANS.craft;
		if (!craft) throw new Error("missing Craft span");
		const craftShare = craft[1] - craft[0];
		const rest = JOURNEY_WAYPOINTS.filter((w) => w.id !== "craft").reduce(
			(total, w) => {
				const span = SECTION_SPANS[w.id];
				return total + (span ? span[1] - span[0] : 0);
			},
			0,
		);
		expect(craftShare).toBeGreaterThan(rest);
	});

	it("puts the you-are-here mark in daylight, before the sky starts turning", () => {
		const projects = SECTION_SPANS[YOU_ARE_HERE];
		if (!projects) throw new Error("missing Projects span");
		const mid = (projects[0] + projects[1]) / 2;
		// phase1[1] is where the dusk plateau begins. The mark sits well above it.
		expect(mid).toBeLessThan(DEFAULT_CELESTIAL.curve.phase1[1]);
	});

	it("brackets Craft alone and ticks the rest", () => {
		const { container } = render(<JourneyColumn />);
		const bracketed = Array.from(
			container.querySelectorAll("[data-journey-waypoint]"),
		).filter((el) =>
			(el.firstElementChild?.getAttribute("style") ?? "").includes(
				"border-right",
			),
		);
		expect(bracketed).toHaveLength(1);
		expect(bracketed[0]?.getAttribute("data-journey-waypoint")).toBe("craft");
	});
});

describe("JourneyColumn celestial fidelity", () => {
	afterEach(() => {
		cleanup();
	});

	// The drawing derives from the live celestial modules rather than copying
	// coordinates, so a sky-curve or arc retune (e.g. ticket #53) moves the
	// artwork too instead of leaving it lying.
	it("draws the gradient from the live sky curve, noon at the top and night at the bottom", () => {
		const { container } = render(<JourneyColumn />);
		const column = container.querySelector('[style*="linear-gradient"]');
		const background = column?.getAttribute("style") ?? "";
		expect(background).toContain(skyAt(0, DEFAULT_CELESTIAL.curve));
		expect(background).toContain(skyAt(1, DEFAULT_CELESTIAL.curve));
	});

	it("sets the sun, so its trail drifts toward the arc's end and fades out before the bottom", () => {
		const first = SUN_TRAIL[0];
		const last = SUN_TRAIL[SUN_TRAIL.length - 1];
		if (!first || !last) throw new Error("empty sun trail");
		expect(first.p).toBe(0);
		// startX 75 -> endX 28: the sun travels leftward as it sets.
		expect(DEFAULT_CELESTIAL.sun.endX).toBeLessThan(
			DEFAULT_CELESTIAL.sun.startX,
		);
		expect(last.x).toBeLessThan(first.x);
		// sunOpacityAt zeroes out at 0.65, so the sun never reaches full night.
		expect(last.p).toBeLessThan(1);
		expect(last.o).toBeLessThan(first.o);
	});

	it("raises the moon, so its trail starts in the second half and brightens", () => {
		const first = MOON_TRAIL[0];
		const last = MOON_TRAIL[MOON_TRAIL.length - 1];
		if (!first || !last) throw new Error("empty moon trail");
		// moonOpacityAt is 0 until 0.5: no moon in the daylight half.
		expect(first.p).toBeGreaterThan(0.5);
		expect(last.p).toBe(1);
		expect(last.o).toBeGreaterThan(first.o);
	});

	// #55: the two trails used to share the sample at 0.583 and drew ten pixels
	// apart, which read as a smudge instead of a handover. The moon's opacity
	// floor keeps one body per frame.
	it("never draws the sun and the moon in the same frame", () => {
		const sunAt = new Set(SUN_TRAIL.map((body) => body.p));
		for (const moon of MOON_TRAIL) {
			expect(sunAt.has(moon.p)).toBe(false);
		}
	});

	it("draws no stars: the sun and the moon are the only bodies", () => {
		const { container } = render(<JourneyColumn />);
		const inColumn = container.querySelectorAll(
			'[style*="linear-gradient"] > span',
		);
		expect(inColumn).toHaveLength(SUN_TRAIL.length + MOON_TRAIL.length);
	});

	it("renders one dot per trail sample", () => {
		const { container } = render(<JourneyColumn />);
		expect(container.querySelectorAll("[data-journey-sun]")).toHaveLength(
			SUN_TRAIL.length,
		);
		expect(container.querySelectorAll("[data-journey-moon]")).toHaveLength(
			MOON_TRAIL.length,
		);
	});

	it("labels the curve's own phase anchors, positioned from the curve values", () => {
		const { container } = render(<JourneyColumn />);
		const dusk = Array.from(container.querySelectorAll("div")).find(
			(el) => el.textContent?.trim() === "Dusk",
		);
		expect(dusk).not.toBeUndefined();
		expect(dusk?.getAttribute("style")).toContain(
			`${DEFAULT_CELESTIAL.curve.phase1[1] * 100}%`,
		);
	});
});

describe("JourneyColumn rendering", () => {
	afterEach(() => {
		cleanup();
	});

	it("is one labelled image with all internals decorative (aria-hidden)", () => {
		render(<JourneyColumn />);
		const img = screen.getByRole("img");
		expect(img.getAttribute("aria-label")).toMatch(/minimap/i);
		expect(img.getAttribute("aria-label")).toMatch(/you-are-here/i);
		expect(img.firstElementChild?.getAttribute("aria-hidden")).toBe("true");
	});

	it("is decorative only: nothing a keyboard user could tab into", () => {
		const { container } = render(<JourneyColumn />);
		expect(container.querySelector("a")).toBeNull();
		expect(container.querySelector("button")).toBeNull();
	});

	it("is static: no video, no animation classes, so reduced motion needs no guard", () => {
		const { container } = render(<JourneyColumn />);
		expect(container.querySelector("video")).toBeNull();
		expect(container.querySelector('[class*="animate-"]')).toBeNull();
	});
});
