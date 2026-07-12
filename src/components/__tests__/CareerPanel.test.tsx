// @vitest-environment jsdom

/*
 * CareerPanel tests - current contract.
 *
 * CareerPanel is static markup plus the pure SubpageClose component; it needs
 * no IntersectionObserver stub (contrast with ProjectPanel.test.tsx). The
 * subpage renders the full 7-entry timeline and additionally renders the
 * verbatim `entry.highlight.story` line on exactly the 3 highlighted cards
 * (Genius Sports, Cisco Systems, Acama Systems), styled italic, positioned
 * after the description paragraph and before the stack chips.
 */

import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { CAREER_TIMELINE } from "../../data/career";
import { CareerPanel } from "../CareerPanel";

const STORY_TEXTS = [
	"Technical leadership across data orchestration, live video rendering and internal tooling. People management focused on personal growth, team building and more satisfaction at work.",
	"Owning a complex frontend app that manages an arbitrary number of business assets.",
	"Building individual web solutions for customers across the automotive, finance and health sectors.",
];

describe("CareerPanel", () => {
	afterEach(() => {
		cleanup();
	});

	// TC-CP-01 - all 7 companies render
	it.each(
		CAREER_TIMELINE.map((entry) => [entry.company]),
	)("renders company %s", (company) => {
		render(<CareerPanel onClose={vi.fn()} />);
		expect(screen.getByText(company)).not.toBeNull();
	});

	// TC-CP-02 - all 7 roles render (some roles repeat, so use getAllByText)
	it.each(
		Array.from(new Set(CAREER_TIMELINE.map((entry) => entry.role))),
	)("renders role %s", (role) => {
		render(<CareerPanel onClose={vi.fn()} />);
		expect(screen.getAllByText(role).length).toBeGreaterThanOrEqual(1);
	});

	// TC-CP-03 - timeline <ol> has exactly 7 direct <li> children
	it(`renders a timeline <ol> with exactly ${CAREER_TIMELINE.length} direct <li> children`, () => {
		const { container } = render(<CareerPanel onClose={vi.fn()} />);
		const ol = container.querySelector("ol");
		expect(ol).not.toBeNull();
		const directLis = ol!.querySelectorAll(":scope > li");
		expect(directLis.length).toBe(CAREER_TIMELINE.length);
	});

	// TC-CP-04 - rendered <li> order matches CAREER_TIMELINE order
	it("renders the <li> entries in CAREER_TIMELINE order", () => {
		const { container } = render(<CareerPanel onClose={vi.fn()} />);
		const ol = container.querySelector("ol");
		expect(ol).not.toBeNull();
		const directLis = Array.from(ol!.querySelectorAll(":scope > li"));
		expect(directLis.length).toBe(CAREER_TIMELINE.length);
		directLis.forEach((li, i) => {
			expect(
				within(li as HTMLElement).getByText(CAREER_TIMELINE[i]!.company),
			).not.toBeNull();
		});
	});

	// TC-CP-05 - non-highlight stack chips still render
	it.each([
		["Vue.JS"],
		["Qooxdoo"],
		["HTML"],
	])("renders the stack chip %s", (tech) => {
		render(<CareerPanel onClose={vi.fn()} />);
		expect(screen.getByText(tech)).not.toBeNull();
	});

	// TC-CP-06 - the 3 literal story strings render exactly, character-for-character
	it.each(
		STORY_TEXTS.map((story) => [story]),
	)("renders the highlight story %s", (story) => {
		render(<CareerPanel onClose={vi.fn()} />);
		expect(screen.getByText(story)).not.toBeNull();
	});

	// TC-CP-07 - each story is a descendant of the same <li> as its entry's role
	it.each([
		["Lead Engineer", STORY_TEXTS[0]],
		["Frontend Engineer", STORY_TEXTS[1]],
		["Founder", STORY_TEXTS[2]],
	])('associates the story for role "%s" with the same card', (role, story) => {
		const { container } = render(<CareerPanel onClose={vi.fn()} />);
		const ol = container.querySelector("ol");
		expect(ol).not.toBeNull();
		const directLis = Array.from(ol!.querySelectorAll(":scope > li"));
		const matchingLi = directLis.find((li) => {
			const scoped = within(li as HTMLElement);
			return scoped.queryByText(role as string) !== null;
		});
		expect(matchingLi).not.toBeUndefined();
		expect(
			within(matchingLi as HTMLElement).getByText(story as string),
		).not.toBeNull();
	});

	// TC-CP-08 - within a highlighted card, DOM order: desc -> story -> first stack chip
	it("orders desc paragraph before story paragraph before first stack chip on a highlighted card", () => {
		const { container } = render(<CareerPanel onClose={vi.fn()} />);
		const ol = container.querySelector("ol");
		expect(ol).not.toBeNull();
		const directLis = Array.from(ol!.querySelectorAll(":scope > li"));
		const matchingLi = directLis.find(
			(li) => within(li as HTMLElement).queryByText(STORY_TEXTS[0]!) !== null,
		);
		expect(matchingLi).not.toBeUndefined();

		const scoped = within(matchingLi as HTMLElement);
		const descNode = scoped.getByText(
			"Dynamic Sports Videos for Programmatic & Social.",
		);
		const storyNode = scoped.getByText(STORY_TEXTS[0]!);
		const firstChipNode = scoped.getByText("Python");

		const position = descNode.compareDocumentPosition(storyNode);
		expect(position & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
		const chipPosition = storyNode.compareDocumentPosition(firstChipNode);
		expect(chipPosition & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
	});

	// TC-CP-09 - exactly 3 story-styled (.italic) paragraphs render
	it("renders exactly 3 .italic story paragraphs", () => {
		const { container } = render(<CareerPanel onClose={vi.fn()} />);
		expect(container.querySelectorAll(".italic").length).toBe(3);
	});

	// TC-CP-10 - a non-highlighted entry's card contains no .italic story node
	it("renders no .italic story node on the Spirable card", () => {
		const { container } = render(<CareerPanel onClose={vi.fn()} />);
		const ol = container.querySelector("ol");
		expect(ol).not.toBeNull();
		const directLis = Array.from(ol!.querySelectorAll(":scope > li"));
		const spirableLi = directLis.find(
			(li) => within(li as HTMLElement).queryByText(/Spirable/) !== null,
		);
		expect(spirableLi).not.toBeUndefined();
		expect((spirableLi as HTMLElement).querySelectorAll(".italic").length).toBe(
			0,
		);
	});
});
