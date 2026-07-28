// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { ALFREDO_PORTERS, ALFREDO_TERMS, AlfredoTree } from "../AlfredoTree";

describe("AlfredoTree measured shape", () => {
	afterEach(() => {
		cleanup();
	});

	// The drawing is a dated transcription of the tree getalfredo.com publishes
	// itself, not an invented schematic (AGENTS.md). These two pins are what a
	// re-measure has to move: change the live tree and this file goes red, which
	// is the prompt to look at the page again rather than let the artwork lie.
	it("draws the three words the live page names, in its order", () => {
		expect(ALFREDO_TERMS.map((t) => t.word)).toEqual(["HQ", "PORTER", "TRAY"]);
	});

	it("draws the measured porter/tray shape: two servers, five trays", () => {
		expect(ALFREDO_PORTERS.map((p) => p.sub)).toEqual([
			"SERVER 01",
			"SERVER 02",
		]);
		expect(ALFREDO_PORTERS.map((p) => p.trays)).toEqual([
			["ANALYTICS", "DATABASE", "EMAIL"],
			["PAYMENTS", "UPTIME"],
		]);
	});

	// The label is PROSE, so it restates the measured shape in words the data
	// cannot generate ("under the first porter the analytics, database and email
	// trays"). That hand-copy is the drift risk: re-measure the tree, and a
	// label nobody re-read keeps describing the old one to every screen-reader
	// user. Pinned so the sighted drawing and the spoken one move together.
	it("speaks every measured node, so the label cannot outlive a re-measure", () => {
		render(<AlfredoTree />);
		const label = screen.getByRole("img").getAttribute("aria-label") ?? "";
		const spoken = label.toLowerCase();
		for (const porter of ALFREDO_PORTERS) {
			for (const tray of porter.trays) {
				expect(spoken, `label never says "${tray}"`).toContain(
					tray.toLowerCase(),
				);
			}
		}
		for (const term of ALFREDO_TERMS) {
			expect(spoken, `label never says "${term.word}"`).toContain(
				term.word.toLowerCase(),
			);
		}
	});

	// Never publishes a real infrastructure hostname (AGENTS.md, pinned for
	// CuriaThread the same way). The tree names roles, not machines: "SERVER 01"
	// is a position in the drawing, and nothing here resolves to Alper's box.
	it("names no host: no dotted hostname and no scheme anywhere in the data", () => {
		const text = JSON.stringify([ALFREDO_TERMS, ALFREDO_PORTERS]);
		expect(text).not.toMatch(/https?:\/\//);
		expect(text).not.toMatch(/\b[a-z0-9-]+\.(ts\.net|com|dev|io|net|org)\b/i);
	});
});

describe("AlfredoTree rendering", () => {
	afterEach(() => {
		cleanup();
	});

	it("is one labelled image with all internals decorative (aria-hidden)", () => {
		render(<AlfredoTree />);
		const img = screen.getByRole("img");
		expect(img.getAttribute("aria-label")).toMatch(/hq/i);
		expect(img.firstElementChild?.getAttribute("aria-hidden")).toBe("true");
	});

	it("renders the HQ, both porters, and every tray", () => {
		render(<AlfredoTree />);
		expect(screen.getByText("HQ")).not.toBeNull();
		for (const porter of ALFREDO_PORTERS) {
			expect(screen.getByText(porter.sub)).not.toBeNull();
			for (const tray of porter.trays) {
				expect(screen.getByText(tray)).not.toBeNull();
			}
		}
	});

	// The three words earn their place only if the drawing says what they mean;
	// otherwise the section body's "three words" sentence points at three empty
	// boxes. The lede lines are Alfredo's own, lifted from the same page.
	it("renders each word's own one-line definition", () => {
		render(<AlfredoTree />);
		for (const term of ALFREDO_TERMS) {
			expect(screen.getByText(term.lede)).not.toBeNull();
		}
	});

	// Static by design (the CuriaThread and StatuslineStrip precedent): nothing
	// animates, so reduced motion needs no special casing and the drawing costs
	// the dive nothing.
	it("carries no animation or transition classes", () => {
		const { container } = render(<AlfredoTree />);
		for (const el of Array.from(container.querySelectorAll("*"))) {
			expect(el.className.toString()).not.toMatch(
				/\banimate-|\btransition\b|\bmotion-/,
			);
		}
	});
});
