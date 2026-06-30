// @vitest-environment jsdom
import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { HERO_CTA, HERO_SUMMARY } from "../../../data/hero";
import { SECTION_IDS } from "../../../data/sections";
import { HeroSubtitle } from "../HeroSubtitle";

// ---------------------------------------------------------------------------
// Render-contract tests for HeroSubtitle (static two-line summary model).
// The subtitle renders one [data-line] paragraph per HERO_SUMMARY entry plus a
// static CTA anchor. No typewriter, no cursor. Tests track HERO_SUMMARY content
// edits instead of pinning a stale copy.
// ---------------------------------------------------------------------------
describe("HeroSubtitle render (static summary model)", () => {
	afterEach(cleanup);

	it("renders one [data-line] paragraph per HERO_SUMMARY entry, in order", () => {
		const { container } = render(<HeroSubtitle />);
		const lines = Array.from(container.querySelectorAll("[data-line]"));
		expect(lines.length).toBe(HERO_SUMMARY.length);
		lines.forEach((line, i) => {
			expect(line.textContent).toBe(HERO_SUMMARY[i]);
		});
	});

	it("renders no .hero-cursor element", () => {
		const { container } = render(<HeroSubtitle />);
		expect(container.querySelector(".hero-cursor")).toBeNull();
	});

	it('wraps "passion" on line 2 in a serif-italic span without altering the line text', () => {
		const { container } = render(<HeroSubtitle />);
		const lineTwo = container.querySelector('[data-line="2"]')!;
		const span = Array.from(lineTwo.querySelectorAll("span")).find(
			(s) => s.textContent === "passion",
		)!;
		expect(span).not.toBeUndefined();
		expect(span.className).toContain("italic");
		expect(span.className).toContain("Instrument_Serif");
		expect(lineTwo.textContent).toBe(HERO_SUMMARY[1]);
	});

	it("renders the CTA anchor with text and animated chevron", () => {
		const { container } = render(<HeroSubtitle />);
		const cta = container.querySelector(`a[href="#${SECTION_IDS.findMe}"]`);
		expect(cta).not.toBeNull();
		expect(cta?.textContent).toContain(HERO_CTA);
		expect(cta?.querySelector("svg.hero-scroll-arrow")).not.toBeNull();
	});
});
