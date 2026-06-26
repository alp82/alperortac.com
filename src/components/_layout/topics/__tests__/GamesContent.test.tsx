// @vitest-environment jsdom

/*
 * GamesContent RED tests — written before the InlineLink internal/external
 * styling split and the "my rotation" href change.
 *
 * The current GamesContent points the "my rotation" InlineLink at the Spotify
 * URL (an external href), so TC-GC-01 (href === "#music"), TC-GC-02 (no target),
 * and TC-GC-03 (italic + decoration-wavy classes) all MUST fail until both
 * GamesContent and InlineLink are updated.
 *
 * GamesContent uses TriggerCard which calls useNavigate() unconditionally, so
 * we must stub the router to prevent a crash on render — mirroring the
 * CareerContent test pattern.
 */

import { cleanup, render, screen } from "@testing-library/react";
import { createRef } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("../../../../data/flags", () => ({ TRIGGERS_ENABLED: true }));

vi.mock("@tanstack/react-router", () => ({
	useNavigate: () => vi.fn(),
}));

import { GamesContent } from "../GamesContent";

const sharedRef = createRef<HTMLElement | null>();
const sharedProps = {
	lastTriggerRef: sharedRef,
	isNight: false,
	accent: "#ccc",
} as const;

describe("GamesContent", () => {
	afterEach(() => {
		cleanup();
	});

	// TC-GC-01 — "my rotation" link points to the internal music anchor
	it("TC-GC-01: my rotation link has href #music", () => {
		render(<GamesContent {...sharedProps} />);
		const link = screen.getByRole("link", { name: /my rotation/i });
		expect(link.getAttribute("href")).toBe("#music");
	});

	// TC-GC-02 — "my rotation" link is internal (no target)
	it("TC-GC-02: my rotation link does not have a target attribute", () => {
		render(<GamesContent {...sharedProps} />);
		const link = screen.getByRole("link", { name: /my rotation/i });
		expect(link.hasAttribute("target")).toBe(false);
	});

	// TC-GC-03 — "my rotation" link carries internal styling classes
	it("TC-GC-03: my rotation link has italic and decoration-wavy classes", () => {
		render(<GamesContent {...sharedProps} />);
		const link = screen.getByRole("link", { name: /my rotation/i });
		expect(link.classList.contains("italic")).toBe(true);
		expect(link.classList.contains("decoration-wavy")).toBe(true);
	});
});
