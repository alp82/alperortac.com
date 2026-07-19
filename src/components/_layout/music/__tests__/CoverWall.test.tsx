// @vitest-environment jsdom

/*
 * CoverWallBackdrop pause-gating tests (#26) - the music band's ambient
 * backdrop cover wall. The composed gate under test is
 * `paused = reduced || coarse || !onScreen || hovered` (CoverWall.tsx):
 * nothing runs off-screen, non-touch hover pauses, coarse-pointer/no-hover
 * devices get a static wall, and - unlike PosterGrid's TC-PG-12
 * (which keeps swapping under reduced motion with the zap classes
 * suppressed) - reduced motion pauses this wall's rotation ENTIRELY, the
 * AlbumShelf semantics. Preload gating mirrors TC-PG-02/03.
 *
 * The component's outermost rendered element is BOTH the
 * IntersectionObserver target and the hover-pause wrapper -
 * `container.firstElementChild` is the single locator, the PosterGrid.test
 * convention. Timings: the shelf cadence (INTERVAL_MS=2800) + useRotation's
 * default flick phases (200/340ms) and the `.album-flick-out/-in` classes.
 */

import { cleanup, fireEvent, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ALBUMS } from "../../../../data/personal";
import {
	installStubIntersectionObserver,
	intersect,
} from "../../../../test/stubIntersectionObserver";
import { stubMatchMedia } from "../../../../test/stubMatchMedia";
import { CoverWallBackdrop } from "../CoverWall";

const INTERVAL_MS = 2800;
const OUT_MS = 200;
const IN_MS = 340;

function flickCount(container: HTMLElement) {
	return (
		container.querySelectorAll(".album-flick-out").length +
		container.querySelectorAll(".album-flick-in").length
	);
}

function coverSrcs(container: HTMLElement) {
	return Array.from(container.querySelectorAll("img")).map((img) =>
		img.getAttribute("src"),
	);
}

describe("CoverWallBackdrop - pause gating (#26)", () => {
	beforeEach(() => {
		installStubIntersectionObserver();
		stubMatchMedia(false);
	});

	afterEach(() => {
		cleanup();
		vi.unstubAllGlobals();
		vi.restoreAllMocks();
		vi.useRealTimers();
	});

	// TC-CW-01
	it("never starts the rotation timer before the wall enters view", () => {
		vi.useFakeTimers();
		const { container } = render(<CoverWallBackdrop />);

		vi.advanceTimersByTime(INTERVAL_MS + OUT_MS + IN_MS);
		expect(flickCount(container)).toBe(0);
	});

	// TC-CW-02
	it("rotates once on screen: album-flick-out appears after one cadence", () => {
		vi.useFakeTimers();
		const { container } = render(<CoverWallBackdrop />);
		intersect(container.firstElementChild as Element);

		vi.advanceTimersByTime(INTERVAL_MS);
		expect(container.querySelectorAll(".album-flick-out").length).toBe(1);
	});

	// TC-CW-03
	it("pauses rotation while a non-touch pointer hovers the wall, resumes on leave", () => {
		vi.useFakeTimers();
		const { container } = render(<CoverWallBackdrop />);
		const wrapper = container.firstElementChild as Element;
		intersect(wrapper);

		fireEvent.pointerEnter(wrapper);
		vi.advanceTimersByTime(INTERVAL_MS + OUT_MS + IN_MS);
		expect(flickCount(container)).toBe(0);

		fireEvent.pointerLeave(wrapper);
		vi.advanceTimersByTime(INTERVAL_MS);
		expect(container.querySelectorAll(".album-flick-out").length).toBe(1);
	});

	// TC-CW-04
	it("does NOT pause rotation on a touch pointerEnter", () => {
		vi.useFakeTimers();
		const { container } = render(<CoverWallBackdrop />);
		const wrapper = container.firstElementChild as Element;
		intersect(wrapper);

		fireEvent.pointerEnter(wrapper, { pointerType: "touch" });
		vi.advanceTimersByTime(INTERVAL_MS);
		expect(container.querySelectorAll(".album-flick-out").length).toBe(1);
	});

	// TC-CW-05: reduced motion pauses the wall ENTIRELY (AlbumShelf
	// semantics - content must not change either, unlike PosterGrid's
	// swap-without-zap behavior).
	it("under reduced motion, neither flick classes nor content swaps appear on cadence", () => {
		vi.useFakeTimers();
		stubMatchMedia(true);
		const { container } = render(<CoverWallBackdrop />);
		intersect(container.firstElementChild as Element);

		const before = coverSrcs(container);
		vi.advanceTimersByTime((INTERVAL_MS + OUT_MS + IN_MS) * 2);

		expect(flickCount(container)).toBe(0);
		expect(coverSrcs(container)).toEqual(before);
	});

	// TC-CW-07: static on touch (the affirmed WCAG 2.2.2 route - no
	// controls, so a no-hover/coarse-pointer device gets NO rotation at
	// all). Local matchMedia stub: the shared stubMatchMedia only answers
	// the reduced-motion query, so the coarse query is stubbed here.
	it("on a coarse-pointer / no-hover device the wall never rotates", () => {
		vi.useFakeTimers();
		vi.stubGlobal(
			"matchMedia",
			vi.fn().mockImplementation((query: string) => ({
				matches: query === "(hover: none), (pointer: coarse)",
				media: query,
				onchange: null,
				addEventListener() {},
				removeEventListener() {},
				addListener() {},
				removeListener() {},
				dispatchEvent() {
					return false;
				},
			})),
		);

		const { container } = render(<CoverWallBackdrop />);
		intersect(container.firstElementChild as Element);

		const before = coverSrcs(container);
		vi.advanceTimersByTime((INTERVAL_MS + OUT_MS + IN_MS) * 2);

		expect(flickCount(container)).toBe(0);
		expect(coverSrcs(container)).toEqual(before);
	});

	// TC-CW-06 (TC-PG-02/03 parity): preload is on-screen-gated and one-shot.
	it("constructs zero Image instances before view; preloads all covers once on intersect, no re-fire", () => {
		const instances: Array<{ src: string }> = [];
		const ImageSpy = vi.fn(function ImageCtor(this: { src: string }) {
			instances.push(this);
		});
		vi.stubGlobal("Image", ImageSpy);

		const { container } = render(<CoverWallBackdrop />);
		expect(ImageSpy).not.toHaveBeenCalled();

		const wrapper = container.firstElementChild as Element;
		intersect(wrapper);

		const assigned = new Set(instances.map((i) => i.src));
		for (const album of ALBUMS) {
			expect(assigned.has(album.cover), `never preloaded: ${album.cover}`).toBe(
				true,
			);
		}
		const countAfterFirst = ImageSpy.mock.calls.length;

		intersect(wrapper);
		expect(ImageSpy.mock.calls.length).toBe(countAfterFirst);
	});
});
