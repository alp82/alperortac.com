// @vitest-environment jsdom

/*
 * EarlyDaysPanel tests - age-anchored era timeline contract.
 *
 * The shared IntersectionObserver stub is installed in EVERY test (including
 * reduced-motion ones): useReducedMotion returns false on the first render
 * pass, so the timeline constructs an observer before the reduced-motion
 * flip lands. Reduced-motion tests still need the stub present even though
 * they never call intersect().
 */

import {
	act,
	cleanup,
	fireEvent,
	render,
	screen,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { STORY_BY_SLUG } from "../../data/stories";
import {
	installStubIntersectionObserver,
	intersect,
	intersectMany,
	StubIntersectionObserver,
} from "../../test/stubIntersectionObserver";
import { setReducedMotion, stubMatchMedia } from "../../test/stubMatchMedia";
import { EarlyDaysPanel } from "../EarlyDaysPanel";

const story = STORY_BY_SLUG["early-days"];

const AGES = ["12", "16", "18", "19", "20s"];
const CAPTIONS = [
	"QBasic · Turbo Pascal · Delphi",
	"SELFHTML · floppies · CSS",
	"PC-room keys · CS · StarCraft · FastTracker",
	"56k · the whole world",
	"IRC · ICQ · LAN parties",
];
const BEATS: string[][] = [
	[
		"I started coding with QBasic when I was 12 - text adventures and sounds squeezed out of the PC speaker. Then a bit of graphics in Turbo Pascal, and a look at Delphi.",
	],
	[
		"At 16 I found my love for web development: HTML and CSS. There was no internet at home - my parents knew it would pull me away from school, so I had to finish first.",
		"I learned from SELFHTML on the school PCs and copied the pages onto floppies to keep going at home. Later, JavaScript.",
	],
	[
		"I got the keys to the PC room at school. I was responsible with them - and in the afternoons we played CS and StarCraft. My parents were proud I was staying late; they thought I was learning.",
		"I broke DOS and Windows constantly just to see what would happen, and made music in FastTracker - loved it.",
	],
	["Then, internet. Mind blown."],
	[
		"I was admin in a forum for my friends. We talked on IRC, later ICQ. Gaming and LAN parties - lots of gaming. My digital life had begun.",
	],
];

describe("EarlyDaysPanel", () => {
	beforeEach(() => {
		installStubIntersectionObserver();
		stubMatchMedia(false);
	});

	afterEach(() => {
		cleanup();
		vi.unstubAllGlobals();
	});

	function getEraSections(container: HTMLElement): HTMLElement[] {
		return Array.from(container.querySelectorAll<HTMLElement>("[data-era]"));
	}

	// TC-EP-01
	it("renders 5 [data-era] sections with data-era 0..4 in DOM order", () => {
		const { container } = render(
			<EarlyDaysPanel story={story} onClose={vi.fn()} />,
		);
		const eras = getEraSections(container);
		expect(eras.length).toBe(5);
		expect(eras.map((e) => e.getAttribute("data-era"))).toEqual([
			"0",
			"1",
			"2",
			"3",
			"4",
		]);
	});

	// TC-EP-02
	it("gives every era section the era-reveal class", () => {
		const { container } = render(
			<EarlyDaysPanel story={story} onClose={vi.fn()} />,
		);
		const eras = getEraSections(container);
		expect(eras.length).toBe(5);
		for (const era of eras) {
			expect(era.classList.contains("era-reveal")).toBe(true);
		}
	});

	// TC-EP-03
	it.each(
		AGES.map((age, i) => [i, age]),
	)("era %i shows age+suffix %s in an aria-hidden element", (index, expected) => {
		const { container } = render(
			<EarlyDaysPanel story={story} onClose={vi.fn()} />,
		);
		const eras = getEraSections(container);
		const era = eras[index as number]!;
		const ageEl = era.querySelector('[aria-hidden="true"]');
		expect(ageEl).not.toBeNull();
		expect(ageEl?.textContent).toBe(expected);
	});

	// TC-EP-04
	it.each(
		CAPTIONS.map((caption, i) => [i, caption]),
	)("era %i renders the verbatim caption %s", (_index, caption) => {
		render(<EarlyDaysPanel story={story} onClose={vi.fn()} />);
		expect(screen.getByText(caption as string)).not.toBeNull();
	});

	// TC-EP-05
	it.each(
		BEATS.map((beats, i) => [i, beats]),
	)("era %i renders its beat paragraphs verbatim and in order", (index, beats) => {
		const { container } = render(
			<EarlyDaysPanel story={story} onClose={vi.fn()} />,
		);
		const eras = getEraSections(container);
		const era = eras[index as number]!;
		const paragraphs = Array.from(era.querySelectorAll("p")).map(
			(p) => p.textContent ?? "",
		);
		expect(paragraphs).toEqual(beats);
	});

	// TC-EP-06
	it("era index 3 has exactly one beat paragraph", () => {
		const { container } = render(
			<EarlyDaysPanel story={story} onClose={vi.fn()} />,
		);
		const eras = getEraSections(container);
		const era3 = eras[3]!;
		const paragraphs = era3.querySelectorAll("p");
		expect(paragraphs.length).toBe(1);
		expect(paragraphs[0]?.textContent).toBe("Then, internet. Mind blown.");
	});

	// TC-EP-07
	it('renders era 1 beats containing the exact " - " substring', () => {
		render(<EarlyDaysPanel story={story} onClose={vi.fn()} />);
		for (const beat of BEATS[1]!) {
			if (beat.includes(" - ")) {
				expect(screen.getByText(beat)).not.toBeNull();
			}
		}
	});

	// TC-EP-08
	it("renders the QBasic beat exactly once", () => {
		render(<EarlyDaysPanel story={story} onClose={vi.fn()} />);
		expect(screen.getAllByText(/I started coding with QBasic/).length).toBe(1);
	});

	// TC-EP-09
	it("reveals no era on initial render", () => {
		const { container } = render(
			<EarlyDaysPanel story={story} onClose={vi.fn()} />,
		);
		const eras = getEraSections(container);
		expect(eras.length).toBe(5);
		for (const era of eras) {
			expect(era.classList.contains("is-revealed")).toBe(false);
		}
	});

	// TC-EP-11
	it.each([
		0, 1, 2, 3, 4,
	])("intersecting era %i reveals only that era (fresh render)", (index) => {
		const { container } = render(
			<EarlyDaysPanel story={story} onClose={vi.fn()} />,
		);
		const eras = getEraSections(container);
		intersect(eras[index]!);
		eras.forEach((era, i) => {
			expect(era.classList.contains("is-revealed")).toBe(i === index);
		});
	});

	// TC-EP-12
	it("intersecting with isIntersecting=false does not reveal", () => {
		const { container } = render(
			<EarlyDaysPanel story={story} onClose={vi.fn()} />,
		);
		const eras = getEraSections(container);
		intersect(eras[0]!, false);
		expect(eras[0]?.classList.contains("is-revealed")).toBe(false);
	});

	// TC-EP-13
	it("stays revealed after leaving the viewport (reveal is sticky)", () => {
		const { container } = render(
			<EarlyDaysPanel story={story} onClose={vi.fn()} />,
		);
		const eras = getEraSections(container);
		const era = eras[0]!;
		intersect(era, true);
		intersect(era, false);
		expect(era.classList.contains("is-revealed")).toBe(true);
	});

	// TC-EP-14
	it("intersecting an already-revealed era twice does not throw or duplicate the class", () => {
		const { container } = render(
			<EarlyDaysPanel story={story} onClose={vi.fn()} />,
		);
		const eras = getEraSections(container);
		const era = eras[0]!;
		expect(() => {
			intersect(era, true);
			intersect(era, true);
		}).not.toThrow();
		const classCount = era.className
			.split(/\s+/)
			.filter((c) => c === "is-revealed").length;
		expect(classCount).toBe(1);
	});

	// TC-EP-15
	it("reveals all eras immediately under reduced motion, without any intersect calls", () => {
		stubMatchMedia(true);
		const { container } = render(
			<EarlyDaysPanel story={story} onClose={vi.fn()} />,
		);
		const eras = getEraSections(container);
		expect(eras.length).toBe(5);
		for (const era of eras) {
			expect(era.classList.contains("is-revealed")).toBe(true);
		}
	});

	// TC-EP-16
	it("leaves no era unrevealed under reduced motion", () => {
		stubMatchMedia(true);
		const { container } = render(
			<EarlyDaysPanel story={story} onClose={vi.fn()} />,
		);
		const allEras = getEraSections(container);
		expect(allEras.length).toBe(5);
		const unrevealed = allEras.filter(
			(era) => !era.classList.contains("is-revealed"),
		);
		expect(unrevealed.length).toBe(0);
	});

	// TC-EP-17
	it("renders the story title with the expected id and text", () => {
		render(<EarlyDaysPanel story={story} onClose={vi.fn()} />);
		const title = document.getElementById("story-early-days-title");
		expect(title).not.toBeNull();
		expect(title?.textContent).toBe("The Early Days");
	});

	// TC-EP-18
	it('renders "Back to main" and "Close" buttons that call onClose', () => {
		const onClose = vi.fn();
		render(<EarlyDaysPanel story={story} onClose={onClose} />);

		fireEvent.click(screen.getByRole("button", { name: "Back to main" }));
		expect(onClose).toHaveBeenCalledTimes(1);

		fireEvent.click(screen.getByRole("button", { name: "Close" }));
		expect(onClose).toHaveBeenCalledTimes(2);
	});

	// TC-EP-19
	it("renders an svg icon preceding the title", () => {
		const { container } = render(
			<EarlyDaysPanel story={story} onClose={vi.fn()} />,
		);
		const svg = container.querySelector("svg");
		const title = document.getElementById("story-early-days-title");
		expect(svg).not.toBeNull();
		expect(title).not.toBeNull();
		const position = (svg as Element).compareDocumentPosition(title as Element);
		expect(Boolean(position & Node.DOCUMENT_POSITION_FOLLOWING)).toBe(true);
	});

	// TC-EP-20
	it("live-updates all eras to revealed when reduced-motion flips on after mount, without any intersect calls", () => {
		const { container } = render(
			<EarlyDaysPanel story={story} onClose={vi.fn()} />,
		);
		const eras = getEraSections(container);
		expect(eras.length).toBe(5);
		expect(eras.every((era) => era.classList.contains("is-revealed"))).toBe(
			false,
		);

		act(() => {
			setReducedMotion(true);
		});

		for (const era of eras) {
			expect(era.classList.contains("is-revealed")).toBe(true);
		}
	});

	// TC-EP-21
	it("disconnects the observer instance on unmount", () => {
		const { container, unmount } = render(
			<EarlyDaysPanel story={story} onClose={vi.fn()} />,
		);
		const eras = getEraSections(container);
		const instance = StubIntersectionObserver.instances.find((inst) =>
			inst.targets.has(eras[0]!),
		);
		expect(instance).toBeDefined();
		expect(instance?.disconnected).toBe(false);

		unmount();

		expect(instance?.disconnected).toBe(true);
	});

	// TC-EP-22
	it("reveals a multi-entry first batch together with era-reveal-instant, while a later batch reveals without it", () => {
		const { container } = render(
			<EarlyDaysPanel story={story} onClose={vi.fn()} />,
		);
		const eras = getEraSections(container);

		intersectMany([eras[0]!, eras[1]!]);
		expect(eras[0]?.classList.contains("is-revealed")).toBe(true);
		expect(eras[1]?.classList.contains("is-revealed")).toBe(true);
		expect(eras[0]?.classList.contains("era-reveal-instant")).toBe(true);
		expect(eras[1]?.classList.contains("era-reveal-instant")).toBe(true);

		intersect(eras[2]!);
		expect(eras[2]?.classList.contains("is-revealed")).toBe(true);
		expect(eras[2]?.classList.contains("era-reveal-instant")).toBe(false);
	});

	// TC-EP-23
	it.each(
		AGES.map((age, i) => [i, `Age ${age}`]),
	)("era %i exposes an sr-only, non-aria-hidden element with text %s", (index, expected) => {
		const { container } = render(
			<EarlyDaysPanel story={story} onClose={vi.fn()} />,
		);
		const eras = getEraSections(container);
		const era = eras[index as number]!;
		const srOnlyEl = era.querySelector(".sr-only");
		expect(srOnlyEl).not.toBeNull();
		expect(srOnlyEl?.textContent).toBe(expected);
		expect(srOnlyEl?.getAttribute("aria-hidden")).not.toBe("true");
	});

	// TC-EP-24
	it("puts every era numeral on an aria-hidden CRT chip with the age + suffix", () => {
		const { container } = render(
			<EarlyDaysPanel story={story} onClose={vi.fn()} />,
		);
		const eras = getEraSections(container);
		expect(eras.length).toBe(5);
		eras.forEach((era, i) => {
			const chip = era.querySelector<HTMLElement>(".era-chip");
			expect(chip).not.toBeNull();
			expect(chip?.getAttribute("aria-hidden")).toBe("true");
			expect(chip?.textContent).toBe(AGES[i]);
			const suffix = chip?.querySelector(".era-chip-suffix");
			expect(suffix).not.toBeNull();
		});
	});

	// TC-EP-25
	it("renders every era caption on the amber-phosphor era-title element", () => {
		const { container } = render(
			<EarlyDaysPanel story={story} onClose={vi.fn()} />,
		);
		const titles = Array.from(
			container.querySelectorAll<HTMLElement>(".era-title"),
		);
		expect(titles.map((t) => t.textContent)).toEqual(CAPTIONS);
	});

	// TC-EP-26
	it("renders the chip treatment unconditionally, ignoring any ?variant= param (prototype deleted)", () => {
		const original = window.location.href;
		window.history.pushState({}, "", "/?variant=cream");
		try {
			const { container } = render(
				<EarlyDaysPanel story={story} onClose={vi.fn()} />,
			);
			expect(container.querySelectorAll(".era-chip").length).toBe(5);
			// The throwaway variant switcher and its controls are gone for good.
			expect(container.querySelector('[aria-label="next variant"]')).toBeNull();
			expect(
				container.querySelector('[aria-label="previous variant"]'),
			).toBeNull();
		} finally {
			window.history.pushState({}, "", original);
		}
	});
});
