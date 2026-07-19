// @vitest-environment jsdom

/*
 * MusicContent tests - pins the no-double-links invariant on the music band
 * (#26): the "Listen with me" TriggerCard is GONE from the band body - the
 * festival-poster frame's shelf-strip (ShelfStripTrigger in CoverWall.tsx) is
 * the one trigger into the /music subpage. Only the two external cards
 * (Last.fm, Spotify) remain interactive here.
 *
 * MusicContent no longer calls useNavigate itself, but the router is stubbed
 * anyway (the sibling content-test pattern) so a reintroduced TriggerCard
 * fails on the assertions below, not on a router crash.
 */

import { cleanup, render } from "@testing-library/react";
import { createRef } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@tanstack/react-router", () => ({
	useNavigate: () => vi.fn(),
}));

import { MusicContent } from "../MusicContent";

const sharedProps = {
	lastTriggerRef: createRef<HTMLElement | null>(),
	isNight: false,
	accent: "#ccc",
} as const;

describe("MusicContent", () => {
	afterEach(() => {
		cleanup();
	});

	it("renders no subpage trigger button (the frame's shelf strip is the one /music trigger)", () => {
		const { container } = render(<MusicContent {...sharedProps} />);
		expect(container.querySelectorAll("button").length).toBe(0);
	});

	it("keeps the two external cards: Last.fm and Spotify", () => {
		const { container } = render(<MusicContent {...sharedProps} />);
		const links = Array.from(container.querySelectorAll("a"));
		const hrefs = links.map((a) => a.getAttribute("href") ?? "");
		expect(hrefs.some((h) => h.includes("last.fm"))).toBe(true);
		expect(hrefs.some((h) => h.includes("open.spotify.com"))).toBe(true);
		expect(links.length).toBe(2);
	});
});
