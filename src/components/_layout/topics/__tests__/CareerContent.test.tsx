// @vitest-environment jsdom

/*
 * CareerContent tests - restored contract.
 *
 * The band contract is: the two-paragraph CAREER_TEASER prose (Paragraph
 * primitive, CodingContent pattern) followed by a "See the work history"
 * TriggerCard (trigger.kind "career") that dives to the CareerPanel
 * subpage. There is no highlight strip and no timeline - the 7-entry
 * work-history timeline lives only on the CareerPanel subpage (see
 * CareerPanel.test.tsx).
 *
 * CareerContent uses TriggerCard which calls useNavigate() unconditionally,
 * so we must stub the router to prevent a crash on render - mirroring the
 * GamesContent test pattern.
 */

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { createRef } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

const navigate = vi.hoisted(() => vi.fn());
vi.mock("@tanstack/react-router", () => ({ useNavigate: () => navigate }));

import { CareerContent } from "../CareerContent";

const sharedProps = {
	lastTriggerRef: createRef<HTMLElement | null>(),
} as const;

describe("CareerContent", () => {
	afterEach(() => {
		cleanup();
		navigate.mockClear();
	});

	// TC-CC-01 - no timeline <ol> anywhere in output
	it("does not render an <ol> timeline", () => {
		const { container } = render(<CareerContent {...sharedProps} />);
		expect(container.querySelector("ol")).toBeNull();
	});

	// TC-CC-03a - first teaser paragraph's opening phrase renders
	it("renders the career teaser's first paragraph opening phrase", () => {
		render(<CareerContent {...sharedProps} />);
		expect(
			screen.getByText(/Professionally, I worked both in small startups/i),
		).not.toBeNull();
	});

	// TC-CC-03b - second teaser paragraph's opening phrase renders
	it("renders the career teaser's second paragraph opening phrase", () => {
		render(<CareerContent {...sharedProps} />);
		expect(screen.getByText(/I'm a freelance consultant/i)).not.toBeNull();
	});

	// TC-CC-04 - non-highlight companies do not leak into the band
	it.each([
		["Spirable"],
		["enercast"],
		["Joulex"],
		["miobambino"],
	])("does not render the non-highlight company %s", (company) => {
		render(<CareerContent {...sharedProps} />);
		expect(screen.queryByText(new RegExp(company))).toBeNull();
	});

	// TC-CC-05 - no stack chips
	it('does not render the stack chip "Python"', () => {
		render(<CareerContent {...sharedProps} />);
		expect(screen.queryByText("Python")).toBeNull();
	});

	// TC-CC-06 - no year metadata
	it('does not render the year "Since 2021"', () => {
		render(<CareerContent {...sharedProps} />);
		expect(screen.queryByText("Since 2021")).toBeNull();
	});

	// no highlight-strip <ul>, no strip labels on the band
	it("does not render a highlight strip <ul>", () => {
		const { container } = render(<CareerContent {...sharedProps} />);
		expect(container.querySelector("ul")).toBeNull();
	});

	it.each([
		["Genius Sports - Lead Engineer"],
		["Cisco - Frontend Engineer"],
		["Acama Systems - Founder"],
	])('does not render the strip label "%s"', (label) => {
		render(<CareerContent {...sharedProps} />);
		expect(screen.queryByText(label)).toBeNull();
	});

	// TC-CC-13 - a single "See the work history" TriggerCard button renders
	it('renders exactly one "See the work history" trigger button', () => {
		render(<CareerContent {...sharedProps} />);
		const buttons = screen.getAllByRole("button", {
			name: /see the work history/i,
		});
		expect(buttons.length).toBe(1);
	});

	// TC-CC-14 - the trigger button appears after the second teaser paragraph in DOM order
	it("renders the trigger button after the second teaser paragraph in document order", () => {
		render(<CareerContent {...sharedProps} />);
		const secondParagraph = screen.getByText(/I'm a freelance consultant/i);
		const trigger = screen.getByRole("button", {
			name: /see the work history/i,
		});
		// DOCUMENT_POSITION_FOLLOWING (4) set means `trigger` follows the paragraph.
		const position = secondParagraph.compareDocumentPosition(trigger);
		expect(position & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
	});

	// TC-CC-16 - clicking the trigger button navigates to /career and pins the ref
	it('clicking "see the work history" navigates to /career with resetScroll false and sets lastTriggerRef', () => {
		const ref = createRef<HTMLElement | null>();
		render(<CareerContent {...sharedProps} lastTriggerRef={ref} />);
		const button = screen.getByRole("button", {
			name: /see the work history/i,
		});
		fireEvent.click(button);
		expect(navigate).toHaveBeenCalledWith({
			to: "/career",
			resetScroll: false,
		});
		expect(ref.current).toBe(button);
	});
});
