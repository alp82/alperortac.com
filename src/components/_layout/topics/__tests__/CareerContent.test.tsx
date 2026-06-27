// @vitest-environment jsdom

/*
 * CareerContent RED tests — written before the timeline implementation.
 *
 * The current component renders intro prose + a TriggerCard.  TriggerCard
 * calls useNavigate() unconditionally, so we must stub the router to prevent
 * a crash on render.  Once the implementation removes TriggerCard the stub
 * becomes a harmless no-op.
 *
 * Timeline-content cases (TC-02 through TC-05, TC-09, TC-10) MUST fail until
 * the <ol> timeline is implemented.  TC-01, TC-06, TC-07, TC-08 should pass
 * against the current code.
 */

import { cleanup, render, screen } from "@testing-library/react";
import { createRef } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { CAREER_TIMELINE } from "../../../../data/career";

vi.mock("@tanstack/react-router", () => ({
	useNavigate: () => vi.fn(),
}));

import { CareerContent } from "../CareerContent";

const sharedRef = createRef<HTMLElement | null>();
const sharedProps = {
	lastTriggerRef: sharedRef,
	isNight: false,
	accent: "#cbd5e1",
} as const;

describe("CareerContent", () => {
	afterEach(() => {
		cleanup();
	});

	// TC-01 — Intro prose present
	it("renders the intro prose paragraph", () => {
		render(<CareerContent {...sharedProps} />);
		expect(screen.getByText(/Professionally, I worked/)).not.toBeNull();
	});

	// TC-02 — Timeline <ol> has exactly CAREER_TIMELINE.length direct <li> items
	it(`renders an <ol> with exactly ${CAREER_TIMELINE.length} direct <li> children`, () => {
		const { container } = render(<CareerContent {...sharedProps} />);
		const ol = container.querySelector("ol");
		expect(ol).not.toBeNull();
		const directLis = ol!.querySelectorAll(":scope > li");
		expect(directLis.length).toBe(CAREER_TIMELINE.length);
	});

	// TC-03 — All company strings render
	it.each(
		CAREER_TIMELINE.map((entry) => [entry.company]),
	)("renders company %s", (company) => {
		render(<CareerContent {...sharedProps} />);
		expect(screen.getByText(company)).not.toBeNull();
	});

	// TC-04 — Role "Lead Engineer" renders (DOM text, not CSS-uppercased)
	it('renders the role "Lead Engineer"', () => {
		render(<CareerContent {...sharedProps} />);
		expect(screen.getByText("Lead Engineer")).not.toBeNull();
	});

	// TC-05 — Year "Since 2021" renders
	it('renders the year "Since 2021"', () => {
		render(<CareerContent {...sharedProps} />);
		expect(screen.getByText("Since 2021")).not.toBeNull();
	});

	// TC-06 — Trigger button absent
	it("does not render the career trigger button", () => {
		render(<CareerContent {...sharedProps} />);
		expect(screen.queryByText(/See the work history/i)).toBeNull();
	});

	// TC-07 — No example placeholder text
	it("does not render placeholder text containing Tech Innovators", () => {
		render(<CareerContent {...sharedProps} />);
		expect(screen.queryByText(/Tech Innovators/i)).toBeNull();
	});

	// TC-08 — Night-mode smoke test
	it("renders without throwing in night mode and retains intro prose", () => {
		render(
			<CareerContent
				lastTriggerRef={createRef<HTMLElement | null>()}
				isNight={true}
				accent="#1e293b"
			/>,
		);
		expect(screen.getByText(/Professionally, I worked/)).not.toBeNull();
	});

	// TC-09 — First entry's first stack tag renders
	it(`renders the first stack tag "${CAREER_TIMELINE[0]!.stack[0]!}" from the first entry`, () => {
		render(<CareerContent {...sharedProps} />);
		expect(screen.getByText(CAREER_TIMELINE[0]!.stack[0]!)).not.toBeNull();
	});

	// TC-10 — First entry description renders
	it('renders the description "Dynamic Sports Videos for Programmatic & Social."', () => {
		render(<CareerContent {...sharedProps} />);
		expect(
			screen.getByText("Dynamic Sports Videos for Programmatic & Social."),
		).not.toBeNull();
	});

	// TC-11 — accent prop reaches timeline chip/dot as inline style
	it("propagates the accent color to at least one rendered element as an inline style", () => {
		const { container } = render(
			<CareerContent
				lastTriggerRef={createRef<HTMLElement | null>()}
				isNight={false}
				accent="rgb(7, 8, 9)"
			/>,
		);
		const el = container.querySelector('[style*="rgb(7, 8, 9)"]');
		expect(el).not.toBeNull();
	});
});
