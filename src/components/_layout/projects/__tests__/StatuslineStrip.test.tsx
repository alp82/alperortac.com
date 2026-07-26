// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import {
	ctxColor,
	limitColor,
	STRIP_CTX_PCT,
	STRIP_WINDOWS,
	StatuslineStrip,
} from "../StatuslineStrip";

// Truecolor values from statusline.sh, restated here so a palette drift in
// the component goes red.
const GREEN = "rgb(140, 194, 74)";
const YELLOW = "rgb(220, 200, 60)";
const RED = "rgb(220, 60, 60)";

describe("statusline colour helpers (thresholds from statusline.sh)", () => {
	it("limitColor: green < 50, yellow 50-80, red > 80", () => {
		expect(limitColor(0)).toBe(GREEN);
		expect(limitColor(49)).toBe(GREEN);
		expect(limitColor(50)).toBe(YELLOW);
		expect(limitColor(80)).toBe(YELLOW);
		expect(limitColor(81)).toBe(RED);
		expect(limitColor(100)).toBe(RED);
	});

	it("ctxColor is tighter: green < 25, yellow 25-49, red >= 50", () => {
		expect(ctxColor(0)).toBe(GREEN);
		expect(ctxColor(24)).toBe(GREEN);
		expect(ctxColor(25)).toBe(YELLOW);
		expect(ctxColor(49)).toBe(YELLOW);
		expect(ctxColor(50)).toBe(RED);
	});
});

describe("StatuslineStrip sample data", () => {
	it("the 5h cell shows the overshoot the body copy explains (usage ahead of the clock), 7d sits under it", () => {
		const fiveHour = STRIP_WINDOWS.find((w) => w.label === "5h");
		const sevenDay = STRIP_WINDOWS.find((w) => w.label === "7d");
		expect(fiveHour && fiveHour.usage > fiveHour.elapsed).toBe(true);
		expect(sevenDay && sevenDay.usage < sevenDay.elapsed).toBe(true);
	});
});

describe("StatuslineStrip rendering", () => {
	afterEach(() => {
		cleanup();
	});

	it("is one labelled image with all internals decorative (aria-hidden)", () => {
		const { container } = render(<StatuslineStrip />);
		const img = screen.getByRole("img");
		expect(img.getAttribute("aria-label")).toMatch(/statusline/i);
		const inner = img.querySelector('[aria-hidden="true"]');
		expect(inner).not.toBeNull();
		// Everything visual lives inside the hidden wrapper, so assistive tech
		// hears exactly one description, not a soup of percent signs.
		expect(container.textContent?.length).toBeGreaterThan(0);
		expect(img.firstElementChild?.getAttribute("aria-hidden")).toBe("true");
	});

	it("renders every segment of the real line: dir + branch, model, Ctx, 5h, 7d, Fable", () => {
		const { container } = render(<StatuslineStrip />);
		// The dir segment nests the branch span, so no single leaf holds the
		// whole "dir ⎇ branch" text; assert it on the container instead.
		expect(container.textContent).toContain("alperortac.com");
		expect(screen.getByText("⎇ main")).not.toBeNull();
		expect(screen.getByText("★ Fable")).not.toBeNull();
		expect(screen.getByText("Ctx")).not.toBeNull();
		for (const w of STRIP_WINDOWS) {
			expect(screen.getByText(w.label)).not.toBeNull();
			expect(screen.getByText(`${w.usage}%`)).not.toBeNull();
			expect(screen.getByText(`↻${w.reset}`)).not.toBeNull();
		}
		expect(screen.getByText(`${STRIP_CTX_PCT}%`)).not.toBeNull();
	});

	it("is static: no video, no animation classes, so reduced motion needs no guard", () => {
		const { container } = render(<StatuslineStrip />);
		expect(container.querySelector("video")).toBeNull();
		expect(container.querySelector('[class*="animate-"]')).toBeNull();
	});
});
