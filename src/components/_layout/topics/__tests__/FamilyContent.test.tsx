// @vitest-environment jsdom

/*
 * FamilyContent tests — pins the sentence-cased verbatim prose, the Magic the
 * Gathering paragraph, and the manaschmiede trigger moved here from Games.
 *
 * FamilyContent uses TriggerCard which calls useNavigate() unconditionally, so
 * we must stub the router to prevent a crash on render — mirroring the
 * GamesContent test pattern.
 */

import { cleanup, render, screen } from "@testing-library/react";
import { createRef } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@tanstack/react-router", () => ({
	useNavigate: () => vi.fn(),
}));

import { FamilyContent } from "../FamilyContent";

const sharedRef = createRef<HTMLElement | null>();
const sharedProps = {
	lastTriggerRef: sharedRef,
	isNight: false,
	accent: "#ccc",
} as const;

describe("FamilyContent", () => {
	afterEach(() => {
		cleanup();
	});

	it("renders the sentence-cased opening paragraph", () => {
		render(<FamilyContent {...sharedProps} />);
		expect(screen.getByText(/Family\. Love my wife/)).not.toBeNull();
	});

	it("renders the Magic the Gathering paragraph", () => {
		render(<FamilyContent {...sharedProps} />);
		expect(
			screen.getByText(
				/I like Magic the Gathering\. Created an app that helps me building decks, printing them and playing with my kids\./,
			),
		).not.toBeNull();
	});

	it("renders the manaschmiede trigger button", () => {
		render(<FamilyContent {...sharedProps} />);
		expect(
			screen.getByRole("button", { name: /Manaschmiede/i }),
		).not.toBeNull();
	});
});
