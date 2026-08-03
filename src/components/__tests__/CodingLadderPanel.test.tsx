// @vitest-environment jsdom

/*
 * CodingLadderPanel tests - the two mechanics, one per breakpoint.
 *
 * The panel measures its geometry against the .panel-surface dialog it normally
 * lives in. A test render has no such ancestor and jsdom reports a zero-width
 * box anyway, so the layout effect bails and the page stays on its first year,
 * 1995. That is the contract these tests cover: the static ladder, the rack
 * state at 1995, and which of the two mechanics each breakpoint builds.
 */

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { CODING_STOPS, CODING_YEARS, unitCountsAt } from "../../data/coding";
import { STORY_BY_SLUG } from "../../data/stories";
import { CodingLadderPanel } from "../CodingLadderPanel";

const story = STORY_BY_SLUG["early-days"];

/* Width-aware matchMedia stub - the panel asks for `(max-width: 900px)`. */
function stubViewport(mobile: boolean) {
	vi.stubGlobal(
		"matchMedia",
		vi.fn().mockImplementation((query: string) => ({
			matches: query.includes("max-width") ? mobile : false,
			media: query,
			onchange: null,
			addEventListener() {},
			removeEventListener() {},
			addListener() {},
			removeListener() {},
			dispatchEvent: () => false,
		})),
	);
}

const renderPanel = (onClose = vi.fn()) =>
	render(<CodingLadderPanel story={story} onClose={onClose} />);

describe("CodingLadderPanel", () => {
	afterEach(() => {
		cleanup();
		vi.unstubAllGlobals();
	});

	// TC-CL-01
	it("renders the title with the story title id", () => {
		stubViewport(false);
		renderPanel();
		const title = document.getElementById("story-early-days-title");
		expect(title).not.toBeNull();
		expect(title?.textContent).toBe("EverythingI have run");
	});

	// TC-CL-02
	it("names the page Coding above the title", () => {
		stubViewport(false);
		const { container } = renderPanel();
		expect(container.querySelector(".coding-kicker")?.textContent).toBe(
			"Coding",
		);
	});

	// TC-CL-03
	it("draws one axis rung per year, 1995 to 2026", () => {
		stubViewport(false);
		const { container } = renderPanel();
		const rungs = container.querySelectorAll(".coding-yr");
		expect(rungs.length).toBe(CODING_YEARS.length);
		expect(rungs[0]?.textContent).toBe("1995");
		expect(rungs[rungs.length - 1]?.textContent).toBe("2026");
	});

	// TC-CL-04
	it("marks only the years that carry a stop", () => {
		stubViewport(false);
		const { container } = renderPanel();
		const marked = Array.from(container.querySelectorAll(".coding-yr-has")).map(
			(el) => Number(el.textContent),
		);
		expect(marked).toEqual(CODING_STOPS.map((s) => s.year));
	});

	// TC-CL-05
	it("builds the desktop lane with one card per stop, in year order", () => {
		stubViewport(false);
		const { container } = renderPanel();
		const cards = container.querySelectorAll(".coding-lane > .coding-card");
		expect(cards.length).toBe(CODING_STOPS.length);
		const caps = Array.from(cards).map(
			(card) => card.querySelector(".coding-cap")?.textContent,
		);
		expect(caps).toEqual(CODING_STOPS.map((s) => s.cap));
	});

	// TC-CL-06
	it("renders every beat and opinion verbatim on its card", () => {
		stubViewport(false);
		const { container } = renderPanel();
		const cards = container.querySelectorAll(".coding-lane > .coding-card");
		CODING_STOPS.forEach((stop, i) => {
			const card = cards[i];
			const beats = Array.from(
				card?.querySelectorAll(".coding-beat") ?? [],
			).map((p) => p.textContent);
			expect(beats).toEqual(stop.beats);
			expect(card?.querySelector(".coding-op")?.textContent ?? undefined).toBe(
				stop.op,
			);
		});
	});

	// TC-CL-07
	it("labels a rack change without git vocabulary", () => {
		stubViewport(false);
		const { container } = renderPanel();
		const first = container.querySelector(".coding-lane > .coding-card");
		const tags = Array.from(first?.querySelectorAll(".coding-tag") ?? []).map(
			(t) => t.textContent,
		);
		expect(tags).toEqual([
			"racked QBasic",
			"racked Turbo Pascal",
			"racked Delphi",
		]);
	});

	// TC-CL-08
	it("marks the year 1995 card as the one you are standing in", () => {
		stubViewport(false);
		const { container } = renderPanel();
		const active = container.querySelectorAll(".coding-card-active");
		expect(active.length).toBe(1);
		expect(active[0]?.querySelector(".coding-cap")?.textContent).toBe(
			CODING_STOPS[0]?.cap,
		);
	});

	// TC-CL-09
	it("shows the rack in its 1995 state - three running, none dark", () => {
		stubViewport(false);
		const { container } = renderPanel();
		expect(container.querySelector(".coding-rack-now")?.textContent).toBe(
			"1995",
		);
		const rows = Array.from(
			container.querySelectorAll(".coding-rack .coding-unit"),
		);
		expect(rows.map((r) => r.querySelector(".coding-nm")?.textContent)).toEqual(
			["QBasic", "Turbo Pascal", "Delphi"],
		);
		for (const row of rows) {
			expect(row.classList.contains("coding-unit-live")).toBe(true);
		}
		expect(unitCountsAt(1995)).toEqual({ live: 3, dark: 0 });
	});

	// TC-CL-10
	it("hides a rail that has nothing racked yet", () => {
		stubViewport(false);
		const { container } = renderPanel();
		const rails = Array.from(
			container.querySelectorAll(".coding-rack .coding-grp > h4"),
		).map((h) => h.textContent);
		expect(rails).toEqual(["language"]);
	});

	// TC-CL-11
	it("builds no phone strip and no sheet on the desktop", () => {
		stubViewport(false);
		const { container } = renderPanel();
		expect(container.querySelector(".coding-window")).toBeNull();
		expect(container.querySelector(".coding-sheet")).toBeNull();
	});

	// TC-CL-12
	it("builds the strip and the sheet on the phone, and no desktop lane or rack", () => {
		stubViewport(true);
		const { container } = renderPanel();
		expect(container.querySelector(".coding-lane")).toBeNull();
		expect(container.querySelector(".coding-rack")).toBeNull();
		expect(container.querySelector(".coding-window")).not.toBeNull();
		expect(container.querySelector(".coding-sheet")).not.toBeNull();
	});

	// TC-CL-13
	it("puts every card in ONE strip on the phone", () => {
		stubViewport(true);
		const { container } = renderPanel();
		const strips = container.querySelectorAll(".coding-strip");
		expect(strips.length).toBe(1);
		expect(strips[0]?.querySelectorAll(".coding-prose").length).toBe(
			CODING_STOPS.length,
		);
	});

	// TC-CL-14
	it("keeps the phone prose readable to a screen reader", () => {
		stubViewport(true);
		const { container } = renderPanel();
		const win = container.querySelector(".coding-window");
		expect(win?.getAttribute("aria-hidden")).toBeNull();
		expect(screen.getAllByText(CODING_STOPS[0]?.beats[0] ?? "").length).toBe(1);
	});

	// TC-CL-15
	it("hides the dark units on the phone sheet until asked", () => {
		stubViewport(true);
		const { container } = renderPanel();
		const sheet = container.querySelector(".coding-sheet");
		expect(sheet?.classList.contains("coding-hide-dark")).toBe(true);
		const button = screen.getByRole("button", { name: /dark/ });
		expect(button.textContent).toBe("+0 dark");

		fireEvent.click(button);
		expect(sheet?.classList.contains("coding-hide-dark")).toBe(false);
		expect(button.textContent).toBe("hide dark");
	});

	// TC-CL-16
	it("splits the phone rack into two fixed bays", () => {
		stubViewport(true);
		const { container } = renderPanel();
		expect(
			container.querySelectorAll(".coding-sheet-fit > .coding-bay").length,
		).toBe(2);
	});

	// TC-CL-17
	it('renders "Back to main" and "Close" buttons that call onClose', () => {
		stubViewport(false);
		const onClose = vi.fn();
		renderPanel(onClose);
		fireEvent.click(screen.getByRole("button", { name: "Back to main" }));
		expect(onClose).toHaveBeenCalledTimes(1);
		fireEvent.click(screen.getByRole("button", { name: "Close" }));
		expect(onClose).toHaveBeenCalledTimes(2);
	});

	// TC-CL-18
	it("survives a render with no .panel-surface ancestor to measure against", () => {
		stubViewport(false);
		expect(() => renderPanel()).not.toThrow();
		expect(document.getElementById("story-early-days-title")).not.toBeNull();
	});
});
