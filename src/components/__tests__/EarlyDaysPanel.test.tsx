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
import { setReducedMotion, stubMatchMedia } from "../../test/stubMatchMedia";
import {
	installStubIntersectionObserver,
	intersect,
	intersectMany,
	StubIntersectionObserver,
} from "../../test/stubIntersectionObserver";
import { EarlyDaysPanel } from "../EarlyDaysPanel";

const story = STORY_BY_SLUG["early-days"];

const AGES = ["12", "16", "19", "20s"];
const CAPTIONS = [
	"QBasic · Turbo Pascal · Delphi",
	"SELFHTML · floppies · FastTracker",
	"56k · the whole world",
	"IRC · ICQ · LAN parties",
];
const BEATS: string[][] = [
	[
		"I started coding with QBasic when I was 12. Built text adventures and generated PC speaker sounds.",
		"Then started to do a little bit of graphics with Turbo Pascal. Tried Delphi.",
	],
	[
		"Started to learn HTML and CSS when I was 16 and found my love for web development. No internet at home - my parents knew it would distract me from school, so I had to finish first.",
		"Used the school PCs to learn about SELFHTML, copied the pages to floppies to continue learning at home. Later JavaScript.",
		"Loved exploring possibilities - broke DOS and Windows often to experiment with systems. Did music via FastTracker, loved it.",
		"Got keys for the PC room at school. I was very responsible, and we played CS and StarCraft in the afternoons - my parents were proud that I was staying late at school because they thought I was learning.",
	],
	["Then internet. Mind blown."],
	[
		"Was admin in a forum for my friends, we chatted via IRC and later ICQ. Also gaming and LAN-parties. Lots of gaming. My digital life has begun.",
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
	it("renders 4 [data-era] sections with data-era 0..3 in DOM order", () => {
		const { container } = render(
			<EarlyDaysPanel story={story} onClose={vi.fn()} />,
		);
		const eras = getEraSections(container);
		expect(eras.length).toBe(4);
		expect(eras.map((e) => e.getAttribute("data-era"))).toEqual([
			"0",
			"1",
			"2",
			"3",
		]);
	});

	// TC-EP-02
	it("gives every era section the era-reveal class", () => {
		const { container } = render(
			<EarlyDaysPanel story={story} onClose={vi.fn()} />,
		);
		const eras = getEraSections(container);
		expect(eras.length).toBe(4);
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
	it("era index 2 has exactly one beat paragraph", () => {
		const { container } = render(
			<EarlyDaysPanel story={story} onClose={vi.fn()} />,
		);
		const eras = getEraSections(container);
		const era2 = eras[2]!;
		const paragraphs = era2.querySelectorAll("p");
		expect(paragraphs.length).toBe(1);
		expect(paragraphs[0]?.textContent).toBe("Then internet. Mind blown.");
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
		expect(eras.length).toBe(4);
		for (const era of eras) {
			expect(era.classList.contains("is-revealed")).toBe(false);
		}
	});

	// TC-EP-11
	it.each([
		0, 1, 2, 3,
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
		expect(eras.length).toBe(4);
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
		expect(allEras.length).toBe(4);
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
		expect(eras.length).toBe(4);
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
});
