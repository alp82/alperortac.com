// @vitest-environment jsdom

/*
 * PosterGrid tests (#22) - the movies-tv band's flickering 3x2 channel-zap
 * grid, folded from the approved prototype (PosterGridPrototype.tsx) into
 * production with pause/touch/reduced-motion parity to the Music shelf.
 *
 * The component's outermost rendered element is BOTH the IntersectionObserver
 * target (on-screen gate) and the hover-pause wrapper (plan step 5: "the
 * wrapper" is named once for both roles) - `container.firstElementChild` is
 * used as that single locator throughout, mirroring how PersonalPanel.test.tsx
 * locates AlbumShelf's analogous wrapper structurally rather than by testid.
 *
 * Choreography timings (INTERVAL_MS=2600, OUT_MS=180, IN_MS=280) and the
 * `.poster-zap--out`/`.poster-zap--in` class names come from plan step 5/6,
 * folded verbatim from the prototype's cadence (approved) and the styles.css
 * rename convention (`.proto-zap*` -> `.poster-zap*`).
 */

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { createRef } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { FAVORITES } from "../../../../data/favorites";
import {
	installStubIntersectionObserver,
	intersect,
} from "../../../../test/stubIntersectionObserver";
import { stubMatchMedia } from "../../../../test/stubMatchMedia";
import { PosterGrid } from "../PosterGrid";

const navigate = vi.hoisted(() => vi.fn());
vi.mock("@tanstack/react-router", () => ({ useNavigate: () => navigate }));

const POSTER_SRC_RE = /^\/posters\/[^/]+\.jpg$/;

function posterImgs(container: HTMLElement) {
	return Array.from(container.querySelectorAll("img")).filter((img) =>
		POSTER_SRC_RE.test(img.getAttribute("src") ?? ""),
	);
}

const INTERVAL_MS = 2600;
const OUT_MS = 180;
const IN_MS = 280;

describe("PosterGrid - movies-tv band grid (#22)", () => {
	beforeEach(() => {
		installStubIntersectionObserver();
		stubMatchMedia(false);
		navigate.mockClear();
	});

	afterEach(() => {
		cleanup();
		vi.unstubAllGlobals();
		vi.restoreAllMocks();
		vi.useRealTimers();
	});

	// TC-PG-01
	it("renders exactly 6 posters matching /posters/*.jpg on mount", () => {
		const ref = createRef<HTMLElement | null>();
		const { container } = render(<PosterGrid lastTriggerRef={ref} />);
		expect(posterImgs(container).length).toBe(6);
	});

	// TC-PG-02
	it("constructs zero Image instances before the grid enters view", () => {
		const ImageSpy = vi.fn(function ImageCtor(this: { src: string }) {
			this.src = "";
		});
		vi.stubGlobal("Image", ImageSpy);

		const ref = createRef<HTMLElement | null>();
		render(<PosterGrid lastTriggerRef={ref} />);

		expect(ImageSpy).not.toHaveBeenCalled();
	});

	// TC-PG-03
	it("preloads all 24 favorite poster paths once the grid enters view, and does not re-fire on a second intersect", () => {
		const instances: Array<{ src: string }> = [];
		const ImageSpy = vi.fn(function ImageCtor(this: { src: string }) {
			instances.push(this);
		});
		vi.stubGlobal("Image", ImageSpy);

		const ref = createRef<HTMLElement | null>();
		const { container } = render(<PosterGrid lastTriggerRef={ref} />);
		const wrapper = container.firstElementChild as Element;

		intersect(wrapper);

		const assignedSrcs = new Set(instances.map((i) => i.src));
		for (const entry of FAVORITES) {
			expect(
				assignedSrcs.has(entry.poster),
				`Poster never preloaded: ${entry.poster}`,
			).toBe(true);
		}
		const countAfterFirst = ImageSpy.mock.calls.length;
		expect(countAfterFirst).toBeGreaterThan(0);

		intersect(wrapper);
		expect(ImageSpy.mock.calls.length).toBe(countAfterFirst);
	});

	// TC-PG-04
	it("never starts the rotation timer before the grid enters view", () => {
		vi.useFakeTimers();
		const ref = createRef<HTMLElement | null>();
		const { container } = render(<PosterGrid lastTriggerRef={ref} />);

		vi.advanceTimersByTime(INTERVAL_MS + OUT_MS + IN_MS);

		expect(container.querySelectorAll(".poster-zap--out").length).toBe(0);
		expect(container.querySelectorAll(".poster-zap--in").length).toBe(0);
	});

	// TC-PG-05
	it("carries poster-zap--out then poster-zap--in through one swap cycle once on screen", () => {
		vi.useFakeTimers();
		const ref = createRef<HTMLElement | null>();
		const { container } = render(<PosterGrid lastTriggerRef={ref} />);
		const wrapper = container.firstElementChild as Element;
		intersect(wrapper);

		expect(container.querySelectorAll(".poster-zap--out").length).toBe(0);
		expect(container.querySelectorAll(".poster-zap--in").length).toBe(0);

		vi.advanceTimersByTime(INTERVAL_MS);
		expect(container.querySelectorAll(".poster-zap--out").length).toBe(1);
		expect(container.querySelectorAll(".poster-zap--in").length).toBe(0);

		vi.advanceTimersByTime(OUT_MS);
		expect(container.querySelectorAll(".poster-zap--out").length).toBe(0);
		expect(container.querySelectorAll(".poster-zap--in").length).toBe(1);

		vi.advanceTimersByTime(IN_MS);
		expect(container.querySelectorAll(".poster-zap--out").length).toBe(0);
		expect(container.querySelectorAll(".poster-zap--in").length).toBe(0);
	});

	// TC-PG-06
	it("renders All/Films/Series filter pills with aria-pressed, All pressed by default", () => {
		const ref = createRef<HTMLElement | null>();
		render(<PosterGrid lastTriggerRef={ref} />);

		const all = screen.getByRole("button", { name: "All" });
		const films = screen.getByRole("button", { name: "Films" });
		const series = screen.getByRole("button", { name: "Series" });

		expect(all.getAttribute("aria-pressed")).toBe("true");
		expect(films.getAttribute("aria-pressed")).toBe("false");
		expect(series.getAttribute("aria-pressed")).toBe("false");
	});

	// TC-PG-07
	it("clicking Films shows only film-kind posters and marks the Films pill pressed", () => {
		const ref = createRef<HTMLElement | null>();
		const { container } = render(<PosterGrid lastTriggerRef={ref} />);
		const filmPosters = new Set(
			FAVORITES.filter((f) => f.kind === "film").map((f) => f.poster),
		);

		fireEvent.click(screen.getByRole("button", { name: "Films" }));

		expect(
			screen
				.getByRole("button", { name: "Films" })
				.getAttribute("aria-pressed"),
		).toBe("true");
		expect(
			screen.getByRole("button", { name: "All" }).getAttribute("aria-pressed"),
		).toBe("false");

		const imgs = posterImgs(container);
		expect(imgs.length).toBe(6);
		for (const img of imgs) {
			expect(filmPosters.has(img.getAttribute("src") ?? "")).toBe(true);
		}
	});

	// TC-PG-08
	it("keeps later rotation swaps within the filtered pool after switching to Films", () => {
		vi.useFakeTimers();
		const ref = createRef<HTMLElement | null>();
		const { container } = render(<PosterGrid lastTriggerRef={ref} />);
		const wrapper = container.firstElementChild as Element;
		intersect(wrapper);

		fireEvent.click(screen.getByRole("button", { name: "Films" }));

		const filmPosters = new Set(
			FAVORITES.filter((f) => f.kind === "film").map((f) => f.poster),
		);

		vi.advanceTimersByTime(INTERVAL_MS + OUT_MS + IN_MS); // one full swap cycle

		for (const img of posterImgs(container)) {
			expect(filmPosters.has(img.getAttribute("src") ?? "")).toBe(true);
		}
	});

	// TC-PG-09
	it("pauses rotation while a non-touch pointer hovers the grid, once on screen", () => {
		vi.useFakeTimers();
		const ref = createRef<HTMLElement | null>();
		const { container } = render(<PosterGrid lastTriggerRef={ref} />);
		const wrapper = container.firstElementChild as Element;
		intersect(wrapper);

		fireEvent.pointerEnter(wrapper);
		vi.advanceTimersByTime(INTERVAL_MS + OUT_MS + IN_MS);
		expect(container.querySelectorAll(".poster-zap--out").length).toBe(0);
		expect(container.querySelectorAll(".poster-zap--in").length).toBe(0);

		fireEvent.pointerLeave(wrapper);
		vi.advanceTimersByTime(INTERVAL_MS);
		expect(container.querySelectorAll(".poster-zap--out").length).toBe(1);
	});

	// TC-PG-10
	it("does NOT pause rotation on a touch pointerEnter", () => {
		vi.useFakeTimers();
		const ref = createRef<HTMLElement | null>();
		const { container } = render(<PosterGrid lastTriggerRef={ref} />);
		const wrapper = container.firstElementChild as Element;
		intersect(wrapper);

		fireEvent.pointerEnter(wrapper, { pointerType: "touch" });
		vi.advanceTimersByTime(INTERVAL_MS);
		expect(container.querySelectorAll(".poster-zap--out").length).toBe(1);
	});

	// TC-PG-11
	it("renders a pause/play toggle that stops and resumes rotation", () => {
		vi.useFakeTimers();
		const ref = createRef<HTMLElement | null>();
		const { container } = render(<PosterGrid lastTriggerRef={ref} />);
		const wrapper = container.firstElementChild as Element;
		intersect(wrapper);

		const toggle = screen.getByRole("button", {
			name: "Pause poster rotation",
		});
		expect(toggle.getAttribute("aria-pressed")).toBe("false");

		fireEvent.click(toggle);
		const resumed = screen.getByRole("button", {
			name: "Resume poster rotation",
		});
		expect(resumed.getAttribute("aria-pressed")).toBe("true");

		vi.advanceTimersByTime(INTERVAL_MS + OUT_MS + IN_MS);
		expect(container.querySelectorAll(".poster-zap--out").length).toBe(0);
		expect(container.querySelectorAll(".poster-zap--in").length).toBe(0);

		fireEvent.click(
			screen.getByRole("button", { name: "Resume poster rotation" }),
		);
		vi.advanceTimersByTime(INTERVAL_MS);
		expect(container.querySelectorAll(".poster-zap--out").length).toBe(1);
	});

	// TC-PG-12
	it("under reduced motion, swaps content on cadence but never renders zap classes", () => {
		vi.useFakeTimers();
		stubMatchMedia(true);

		const ref = createRef<HTMLElement | null>();
		const { container } = render(<PosterGrid lastTriggerRef={ref} />);
		const wrapper = container.firstElementChild as Element;
		intersect(wrapper);

		const before = posterImgs(container).map((img) => img.getAttribute("src"));

		vi.advanceTimersByTime(INTERVAL_MS + OUT_MS + IN_MS);

		expect(container.querySelectorAll(".poster-zap--out").length).toBe(0);
		expect(container.querySelectorAll(".poster-zap--in").length).toBe(0);

		const after = posterImgs(container).map((img) => img.getAttribute("src"));
		expect(after).not.toEqual(before);
	});

	// TC-PG-13
	it("clicking the grid navigates to /movies and stashes lastTriggerRef", () => {
		const ref = createRef<HTMLElement | null>();
		render(<PosterGrid lastTriggerRef={ref} />);
		const trigger = screen.getByRole("button", {
			name: /all-time favorite films and series/i,
		});
		expect(ref.current).toBeNull();

		fireEvent.click(trigger);

		expect(navigate).toHaveBeenCalledTimes(1);
		expect(navigate).toHaveBeenCalledWith({
			to: "/movies",
			resetScroll: false,
		});
		expect(ref.current).toBe(trigger);
	});

	// TC-PG-14
	it("keeps the filter pills and pause button OUTSIDE the trigger button (no nested buttons)", () => {
		const ref = createRef<HTMLElement | null>();
		render(<PosterGrid lastTriggerRef={ref} />);
		const trigger = screen.getByRole("button", {
			name: /all-time favorite films and series/i,
		});

		for (const name of ["All", "Films", "Series", "Pause poster rotation"]) {
			const button = screen.getByRole("button", { name });
			expect(trigger.contains(button)).toBe(false);
		}
	});
});
