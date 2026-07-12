// @vitest-environment jsdom

/*
 * PersonalPanel tests — music album shelf contract.
 *
 * PersonalPanel now takes `open: boolean` (replacing the deleted `teaser`
 * prop). The matchMedia stub is installed BEFORE every mount so the
 * reduced-motion branch is what the shelf's first `useReducedMotion` effect
 * reads (mirrors ProjectPanel.test.tsx's reduced-motion case).
 */

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Personal } from "../../../data/personal";
import { ALBUMS } from "../../../data/personal";
import { stubMatchMedia } from "../../../test/stubMatchMedia";
import { PersonalPanel } from "../PersonalPanel";

const musicItem: Personal = {
	slug: "music",
	title: "Music",
	Icon: (() => null) as unknown as Personal["Icon"],
	tileBg: "bg-indigo-100",
	tileFg: "text-indigo-900",
	panelBg: "#312e81",
	panelFg: "#eef2ff",
};

describe("PersonalPanel — music album shelf", () => {
	beforeEach(() => {
		stubMatchMedia(false);
	});

	afterEach(() => {
		cleanup();
		vi.unstubAllGlobals();
		vi.restoreAllMocks();
	});

	// TC-PP-01
	it('renders the verbatim intro line "Some of my all-time and current favorites include:"', () => {
		render(<PersonalPanel item={musicItem} open={true} onClose={vi.fn()} />);
		expect(
			screen.getByText("Some of my all-time and current favorites include:"),
		).not.toBeNull();
	});

	// TC-PP-02
	it('renders no "PLACEHOLDER" text anywhere', () => {
		const { container } = render(
			<PersonalPanel item={musicItem} open={true} onClose={vi.fn()} />,
		);
		expect(container.textContent).not.toMatch(/PLACEHOLDER/);
	});

	// TC-PP-03
	it("renders no teaser paragraph (old teaser plumbing gone)", () => {
		const { container } = render(
			<PersonalPanel item={musicItem} open={true} onClose={vi.fn()} />,
		);
		// Every <p> is either the verbatim intro line or an "Artist — Album"
		// caption; nothing else (i.e. no leftover free-form teaser paragraph).
		const paragraphs = Array.from(container.querySelectorAll("p")).map(
			(p) => p.textContent ?? "",
		);
		for (const text of paragraphs) {
			const isIntro =
				text === "Some of my all-time and current favorites include:";
			const isCaption = /^.+ — .+$/.test(text);
			expect(
				isIntro || isCaption,
				`Unexpected paragraph text (possible teaser remnant): ${text}`,
			).toBe(true);
		}
	});

	// TC-PP-04
	it("renders exactly 12 <img> with /albums/*.jpg src when open", () => {
		const { container } = render(
			<PersonalPanel item={musicItem} open={true} onClose={vi.fn()} />,
		);
		const imgs = Array.from(container.querySelectorAll("img")).filter((img) =>
			/\/albums\/[^/]+\.jpg$/.test(img.getAttribute("src") ?? ""),
		);
		expect(imgs.length).toBe(12);
	});

	// TC-PP-05
	it('captions each cover as "Artist — Album" (em dash), matching album data', () => {
		const { container } = render(
			<PersonalPanel item={musicItem} open={true} onClose={vi.fn()} />,
		);
		const imgs = Array.from(container.querySelectorAll("img")).filter((img) =>
			/\/albums\/[^/]+\.jpg$/.test(img.getAttribute("src") ?? ""),
		);
		for (const img of imgs) {
			const src = img.getAttribute("src");
			const albumEntry = ALBUMS.find((a) => a.cover === src);
			expect(albumEntry, `No ALBUMS entry for src ${src}`).toBeDefined();
			expect(
				screen.getByText(`${albumEntry?.artist} — ${albumEntry?.album}`),
			).not.toBeNull();
		}
	});

	// TC-PP-06
	it('gives every cover img alt=""', () => {
		const { container } = render(
			<PersonalPanel item={musicItem} open={true} onClose={vi.fn()} />,
		);
		const imgs = Array.from(container.querySelectorAll("img")).filter((img) =>
			/\/albums\/[^/]+\.jpg$/.test(img.getAttribute("src") ?? ""),
		);
		expect(imgs.length).toBeGreaterThan(0);
		for (const img of imgs) {
			expect(img.getAttribute("alt")).toBe("");
		}
	});

	// TC-PP-07
	describe("preload contract", () => {
		it("constructs ZERO Image instances when mounted with open={false}", () => {
			const ImageSpy = vi.fn(function ImageCtor(this: {
				src: string;
			}) {
				this.src = "";
			});
			vi.stubGlobal("Image", ImageSpy);

			render(<PersonalPanel item={musicItem} open={false} onClose={vi.fn()} />);

			expect(ImageSpy).not.toHaveBeenCalled();
		});

		it("assigns each of the 17 cover paths to some constructed Image's src on rerender open={true}", () => {
			const instances: Array<{ src: string }> = [];
			const ImageSpy = vi.fn(function ImageCtor(this: {
				src: string;
			}) {
				instances.push(this);
			});
			vi.stubGlobal("Image", ImageSpy);

			const { rerender } = render(
				<PersonalPanel item={musicItem} open={false} onClose={vi.fn()} />,
			);
			rerender(
				<PersonalPanel item={musicItem} open={true} onClose={vi.fn()} />,
			);

			const assignedSrcs = new Set(instances.map((i) => i.src));
			for (const entry of ALBUMS) {
				expect(
					assignedSrcs.has(entry.cover),
					`Cover never preloaded: ${entry.cover}`,
				).toBe(true);
			}
		});

		it("constructs no NEW Image instances on a close -> re-open cycle", () => {
			const ImageSpy = vi.fn(function ImageCtor(this: {
				src: string;
			}) {
				this.src = "";
			});
			vi.stubGlobal("Image", ImageSpy);

			const { rerender } = render(
				<PersonalPanel item={musicItem} open={false} onClose={vi.fn()} />,
			);
			rerender(
				<PersonalPanel item={musicItem} open={true} onClose={vi.fn()} />,
			);
			const countAfterFirstOpen = ImageSpy.mock.calls.length;
			expect(countAfterFirstOpen).toBeGreaterThan(0);

			rerender(
				<PersonalPanel item={musicItem} open={false} onClose={vi.fn()} />,
			);
			rerender(
				<PersonalPanel item={musicItem} open={true} onClose={vi.fn()} />,
			);

			expect(ImageSpy.mock.calls.length).toBe(countAfterFirstOpen);
		});
	});

	// TC-PP-08
	it("renders without the shelf and without the intro line for a non-music personal item", () => {
		const gamesItem = {
			...musicItem,
			slug: "games",
		} as unknown as Personal;

		const { container } = render(
			<PersonalPanel item={gamesItem} open={true} onClose={vi.fn()} />,
		);

		expect(
			screen.queryByText("Some of my all-time and current favorites include:"),
		).toBeNull();
		const albumImgs = Array.from(container.querySelectorAll("img")).filter(
			(img) => /\/albums\/[^/]+\.jpg$/.test(img.getAttribute("src") ?? ""),
		);
		expect(albumImgs.length).toBe(0);
	});

	// TC-PP-09
	it("renders statically with no flicker classes under reduced motion, even as timers advance", () => {
		vi.useFakeTimers();
		stubMatchMedia(true);

		const { container } = render(
			<PersonalPanel item={musicItem} open={true} onClose={vi.fn()} />,
		);

		vi.advanceTimersByTime(20000);

		expect(container.querySelectorAll(".album-flick-out").length).toBe(0);
		expect(container.querySelectorAll(".album-flick-in").length).toBe(0);

		vi.useRealTimers();
	});

	// TC-PP-10
	it("carries album-flick-out then album-flick-in on the swapped cell's inner div through one swap cycle", () => {
		vi.useFakeTimers();
		stubMatchMedia(false);

		const { container } = render(
			<PersonalPanel item={musicItem} open={true} onClose={vi.fn()} />,
		);

		// Before any interval fires: no flicker classes.
		expect(container.querySelectorAll(".album-flick-out").length).toBe(0);
		expect(container.querySelectorAll(".album-flick-in").length).toBe(0);

		vi.advanceTimersByTime(2800); // default intervalMs
		expect(container.querySelectorAll(".album-flick-out").length).toBe(1);
		expect(container.querySelectorAll(".album-flick-in").length).toBe(0);

		vi.advanceTimersByTime(200); // default outMs
		expect(container.querySelectorAll(".album-flick-out").length).toBe(0);
		expect(container.querySelectorAll(".album-flick-in").length).toBe(1);

		vi.advanceTimersByTime(340); // default inMs
		expect(container.querySelectorAll(".album-flick-out").length).toBe(0);
		expect(container.querySelectorAll(".album-flick-in").length).toBe(0);

		vi.useRealTimers();
	});

	// TC-PP-11
	it("frames cells with delicate classes (rounded-md, ring-1 ring-white/10), not border-4", () => {
		const { container } = render(
			<PersonalPanel item={musicItem} open={true} onClose={vi.fn()} />,
		);
		const imgs = Array.from(container.querySelectorAll("img")).filter((img) =>
			/\/albums\/[^/]+\.jpg$/.test(img.getAttribute("src") ?? ""),
		);
		expect(imgs.length).toBeGreaterThan(0);
		for (const img of imgs) {
			const wrapper = img.closest(".rounded-md");
			expect(wrapper).not.toBeNull();
			expect(wrapper?.className).toContain("ring-1");
			expect(wrapper?.className).toContain("ring-white/10");
			expect(wrapper?.className).not.toContain("border-4");
		}
	});

	// TC-PP-12
	it("carries hover classes on cell wrappers (scale, ring, glow shadow, motion-reduce:transform-none)", () => {
		const { container } = render(
			<PersonalPanel item={musicItem} open={true} onClose={vi.fn()} />,
		);
		const imgs = Array.from(container.querySelectorAll("img")).filter((img) =>
			/\/albums\/[^/]+\.jpg$/.test(img.getAttribute("src") ?? ""),
		);
		expect(imgs.length).toBeGreaterThan(0);
		for (const img of imgs) {
			const wrapper = img.closest(".rounded-md");
			expect(wrapper).not.toBeNull();
			expect(wrapper?.className).toContain("hover:scale-[1.03]");
			expect(wrapper?.className).toContain("hover:ring-white/30");
			expect(wrapper?.className).toMatch(/hover:shadow-\[/);
			expect(wrapper?.className).toContain("motion-reduce:transform-none");
		}
	});

	// TC-PP-13
	it("renders a pause/play toggle button with an accessible name", () => {
		render(<PersonalPanel item={musicItem} open={true} onClose={vi.fn()} />);
		const toggle = screen.getByRole("button", {
			name: "Pause album rotation",
		});
		expect(toggle).not.toBeNull();
		expect(toggle.getAttribute("aria-pressed")).toBe("false");
	});

	// TC-PP-14
	it("clicking the toggle stops rotation; clicking again resumes it", () => {
		vi.useFakeTimers();
		stubMatchMedia(false);

		const { container } = render(
			<PersonalPanel item={musicItem} open={true} onClose={vi.fn()} />,
		);

		const toggle = screen.getByRole("button", {
			name: "Pause album rotation",
		});
		fireEvent.click(toggle);
		expect(
			screen.getByRole("button", { name: "Resume album rotation" }),
		).not.toBeNull();
		expect(toggle.getAttribute("aria-pressed")).toBe("true");

		vi.advanceTimersByTime(20000);
		expect(container.querySelectorAll(".album-flick-out").length).toBe(0);
		expect(container.querySelectorAll(".album-flick-in").length).toBe(0);

		fireEvent.click(toggle);
		expect(
			screen.getByRole("button", { name: "Pause album rotation" }),
		).not.toBeNull();

		vi.advanceTimersByTime(2800); // default intervalMs
		expect(container.querySelectorAll(".album-flick-out").length).toBe(1);

		vi.useRealTimers();
	});

	// TC-PP-15
	it("pauses rotation while the pointer hovers the shelf, and resumes on pointer leave", () => {
		vi.useFakeTimers();
		stubMatchMedia(false);

		const { container } = render(
			<PersonalPanel item={musicItem} open={true} onClose={vi.fn()} />,
		);

		const shelf = container.querySelector("ul")?.parentElement as Element;
		fireEvent.pointerEnter(shelf);

		vi.advanceTimersByTime(20000);
		expect(container.querySelectorAll(".album-flick-out").length).toBe(0);
		expect(container.querySelectorAll(".album-flick-in").length).toBe(0);

		fireEvent.pointerLeave(shelf);
		vi.advanceTimersByTime(2800); // default intervalMs
		expect(container.querySelectorAll(".album-flick-out").length).toBe(1);

		vi.useRealTimers();
	});

	// TC-PP-16
	it("renders exactly three transport buttons: Previous album, pause/play, Next album", () => {
		render(<PersonalPanel item={musicItem} open={true} onClose={vi.fn()} />);

		expect(
			screen.getByRole("button", { name: "Previous album" }),
		).not.toBeNull();
		expect(
			screen.getByRole("button", { name: "Pause album rotation" }),
		).not.toBeNull();
		expect(screen.getByRole("button", { name: "Next album" })).not.toBeNull();
	});

	// TC-PP-17
	it("disables the Previous album button at mount (empty history)", () => {
		render(<PersonalPanel item={musicItem} open={true} onClose={vi.fn()} />);

		const prevButton = screen.getByRole("button", { name: "Previous album" });
		expect((prevButton as HTMLButtonElement).disabled).toBe(true);
	});

	// TC-PP-18
	it("enables the Previous album button after the first completed swap", () => {
		vi.useFakeTimers();
		stubMatchMedia(false);

		render(<PersonalPanel item={musicItem} open={true} onClose={vi.fn()} />);
		const prevButton = screen.getByRole("button", { name: "Previous album" });

		vi.advanceTimersByTime(2800); // default intervalMs
		vi.advanceTimersByTime(200); // default outMs — content commits here
		vi.advanceTimersByTime(340); // default inMs

		expect((prevButton as HTMLButtonElement).disabled).toBe(false);

		vi.useRealTimers();
	});

	// TC-PP-19
	it("renders the control bar (countdown ring + button row) as a FOLLOWING sibling of the album <ul>", () => {
		const { container } = render(
			<PersonalPanel item={musicItem} open={true} onClose={vi.fn()} />,
		);

		const ul = container.querySelector("ul");
		expect(ul).not.toBeNull();
		const prevButton = screen.getByRole("button", { name: "Previous album" });

		// The control bar (and its ring/buttons) must come AFTER the grid in
		// DOM order — comparing document position confirms "following sibling"
		// (possibly nested inside a wrapper) rather than preceding it.
		const position = (ul as Element).compareDocumentPosition(prevButton);
		expect(Boolean(position & Node.DOCUMENT_POSITION_FOLLOWING)).toBe(true);
	});

	// TC-PP-20
	it("changes data-cycle on the countdown ring after an auto tick", () => {
		vi.useFakeTimers();
		stubMatchMedia(false);

		const { container } = render(
			<PersonalPanel item={musicItem} open={true} onClose={vi.fn()} />,
		);
		const fillBefore = container.querySelector(
			".album-ring-fill",
		) as SVGCircleElement;
		const cycleBefore = fillBefore?.getAttribute("data-cycle");

		vi.advanceTimersByTime(2800); // default intervalMs

		const fillAfter = container.querySelector(
			".album-ring-fill",
		) as SVGCircleElement;
		expect(fillAfter?.getAttribute("data-cycle")).not.toBe(cycleBefore);

		vi.useRealTimers();
	});

	// TC-PP-21
	it("clicking Next album while hover-paused starts a flick-out synchronously and changes data-cycle", () => {
		vi.useFakeTimers();
		stubMatchMedia(false);

		const { container } = render(
			<PersonalPanel item={musicItem} open={true} onClose={vi.fn()} />,
		);
		const shelf = container.querySelector("ul")?.parentElement as Element;
		fireEvent.pointerEnter(shelf);

		const fillBefore = container.querySelector(
			".album-ring-fill",
		) as SVGCircleElement;
		const cycleBefore = fillBefore?.getAttribute("data-cycle");

		const nextButton = screen.getByRole("button", { name: "Next album" });
		fireEvent.click(nextButton);

		expect(container.querySelectorAll(".album-flick-out").length).toBe(1);
		const fillAfter = container.querySelector(
			".album-ring-fill",
		) as SVGCircleElement;
		expect(fillAfter?.getAttribute("data-cycle")).not.toBe(cycleBefore);

		vi.useRealTimers();
	});

	// TC-PP-22
	it("rapid double-clicking Next album no-ops the second click while the first swap is in flight", () => {
		vi.useFakeTimers();
		stubMatchMedia(false);

		const { container } = render(
			<PersonalPanel item={musicItem} open={true} onClose={vi.fn()} />,
		);
		const nextButton = screen.getByRole("button", { name: "Next album" });

		fireEvent.click(nextButton);
		expect(container.querySelectorAll(".album-flick-out").length).toBe(1);

		fireEvent.click(nextButton);
		// Still exactly one flicker in flight — the second click was a no-op.
		expect(container.querySelectorAll(".album-flick-out").length).toBe(1);

		vi.useRealTimers();
	});

	// TC-PP-23
	it("clicking Previous album restores the swapped-out album's caption/img into its cell, with flicker classes", () => {
		vi.useFakeTimers();
		stubMatchMedia(false);

		const { container } = render(
			<PersonalPanel item={musicItem} open={true} onClose={vi.fn()} />,
		);

		const imgsBefore = Array.from(container.querySelectorAll("img")).map(
			(img) => img.getAttribute("src"),
		);

		const nextButton = screen.getByRole("button", { name: "Next album" });
		fireEvent.click(nextButton);
		vi.advanceTimersByTime(200); // default outMs — content commits
		vi.advanceTimersByTime(340); // default inMs

		const prevButton = screen.getByRole("button", { name: "Previous album" });
		fireEvent.click(prevButton);

		expect(container.querySelectorAll(".album-flick-out").length).toBe(1);
		vi.advanceTimersByTime(200);
		expect(container.querySelectorAll(".album-flick-in").length).toBe(1);
		vi.advanceTimersByTime(340);

		const imgsAfter = Array.from(container.querySelectorAll("img")).map((img) =>
			img.getAttribute("src"),
		);
		expect(imgsAfter).toEqual(imgsBefore);

		vi.useRealTimers();
	});

	// TC-PP-24
	it("clicking Previous album while disabled does nothing and does not throw", () => {
		vi.useFakeTimers();
		stubMatchMedia(false);

		const { container } = render(
			<PersonalPanel item={musicItem} open={true} onClose={vi.fn()} />,
		);
		const prevButton = screen.getByRole("button", { name: "Previous album" });
		expect((prevButton as HTMLButtonElement).disabled).toBe(true);

		expect(() => {
			fireEvent.click(prevButton);
		}).not.toThrow();

		expect(container.querySelectorAll(".album-flick-out").length).toBe(0);
		expect(container.querySelectorAll(".album-flick-in").length).toBe(0);

		vi.useRealTimers();
	});

	// TC-PP-25
	it("keeps the countdown ring's inline animationPlayState 'running' when active, unhovered, and unpaused", () => {
		const { container } = render(
			<PersonalPanel item={musicItem} open={true} onClose={vi.fn()} />,
		);
		const fill = container.querySelector(
			".album-ring-fill",
		) as SVGCircleElement;
		expect(fill).not.toBeNull();
		// READ INLINE STYLE — jsdom has no cascade, getComputedStyle won't work.
		expect(fill.style.animationPlayState).toBe("running");
	});

	// TC-PP-26
	it("sets the countdown ring's inline animationPlayState to 'paused' on pointerEnter and back to 'running' on pointerLeave", () => {
		const { container } = render(
			<PersonalPanel item={musicItem} open={true} onClose={vi.fn()} />,
		);
		const shelf = container.querySelector("ul")?.parentElement as Element;

		fireEvent.pointerEnter(shelf);
		let fill = container.querySelector(".album-ring-fill") as SVGCircleElement;
		expect(fill.style.animationPlayState).toBe("paused");

		fireEvent.pointerLeave(shelf);
		fill = container.querySelector(".album-ring-fill") as SVGCircleElement;
		expect(fill.style.animationPlayState).toBe("running");
	});

	// TC-PP-27
	it("sets the countdown ring's inline animationPlayState to 'paused' when toggle-paused, and back to 'running' on resume", () => {
		const { container } = render(
			<PersonalPanel item={musicItem} open={true} onClose={vi.fn()} />,
		);
		const toggle = screen.getByRole("button", {
			name: "Pause album rotation",
		});

		fireEvent.click(toggle);
		let fill = container.querySelector(".album-ring-fill") as SVGCircleElement;
		expect(fill.style.animationPlayState).toBe("paused");

		fireEvent.click(
			screen.getByRole("button", { name: "Resume album rotation" }),
		);
		fill = container.querySelector(".album-ring-fill") as SVGCircleElement;
		expect(fill.style.animationPlayState).toBe("running");
	});

	// TC-PP-28
	it("sets the countdown ring's inline animationDuration to '2800ms'", () => {
		const { container } = render(
			<PersonalPanel item={musicItem} open={true} onClose={vi.fn()} />,
		);
		const fill = container.querySelector(
			".album-ring-fill",
		) as SVGCircleElement;
		expect(fill.style.animationDuration).toBe("2800ms");
	});

	// TC-PP-29
	it("changes data-cycle on the countdown ring after a manual Next album click", () => {
		const { container } = render(
			<PersonalPanel item={musicItem} open={true} onClose={vi.fn()} />,
		);
		const fillBefore = container.querySelector(
			".album-ring-fill",
		) as SVGCircleElement;
		const cycleBefore = fillBefore?.getAttribute("data-cycle");

		fireEvent.click(screen.getByRole("button", { name: "Next album" }));

		const fillAfter = container.querySelector(
			".album-ring-fill",
		) as SVGCircleElement;
		expect(fillAfter?.getAttribute("data-cycle")).not.toBe(cycleBefore);
	});

	// TC-PP-30
	it("changes data-cycle on the countdown ring across a pause -> resume cycle", () => {
		const { container } = render(
			<PersonalPanel item={musicItem} open={true} onClose={vi.fn()} />,
		);
		const fillBefore = container.querySelector(
			".album-ring-fill",
		) as SVGCircleElement;
		const cycleBefore = fillBefore?.getAttribute("data-cycle");

		fireEvent.click(
			screen.getByRole("button", { name: "Pause album rotation" }),
		);
		fireEvent.click(
			screen.getByRole("button", { name: "Resume album rotation" }),
		);

		const fillAfter = container.querySelector(
			".album-ring-fill",
		) as SVGCircleElement;
		expect(fillAfter?.getAttribute("data-cycle")).not.toBe(cycleBefore);
	});

	// TC-PP-31
	it("gives the transport buttons the 36px delicate ghost contract (h-9 w-9 rounded-full ring-1 ring-white/10), not border-4", () => {
		render(<PersonalPanel item={musicItem} open={true} onClose={vi.fn()} />);

		for (const name of [
			"Previous album",
			"Pause album rotation",
			"Next album",
		]) {
			const button = screen.getByRole("button", { name });
			expect(button.className).toContain("h-9");
			expect(button.className).toContain("w-9");
			expect(button.className).toContain("rounded-full");
			expect(button.className).toContain("ring-1");
			expect(button.className).toContain("ring-white/10");
			expect(button.className).not.toContain("border-4");
		}
	});

	// TC-PP-32
	it("keeps the pause button uniquely resolvable by role+name, with aria-pressed toggling, alongside the new prev/next buttons", () => {
		render(<PersonalPanel item={musicItem} open={true} onClose={vi.fn()} />);

		const toggle = screen.getByRole("button", {
			name: "Pause album rotation",
		});
		expect(toggle.getAttribute("aria-pressed")).toBe("false");

		fireEvent.click(toggle);
		const resumed = screen.getByRole("button", {
			name: "Resume album rotation",
		});
		expect(resumed.getAttribute("aria-pressed")).toBe("true");

		// prev/next remain independently resolvable throughout.
		expect(
			screen.getByRole("button", { name: "Previous album" }),
		).not.toBeNull();
		expect(screen.getByRole("button", { name: "Next album" })).not.toBeNull();
	});

	// TC-PP-33
	it("clicking Next album while TOGGLE-paused also swaps immediately", () => {
		vi.useFakeTimers();
		stubMatchMedia(false);

		const { container } = render(
			<PersonalPanel item={musicItem} open={true} onClose={vi.fn()} />,
		);
		fireEvent.click(
			screen.getByRole("button", { name: "Pause album rotation" }),
		);

		fireEvent.click(screen.getByRole("button", { name: "Next album" }));

		expect(container.querySelectorAll(".album-flick-out").length).toBe(1);

		vi.useRealTimers();
	});

	// TC-PP-34
	it("does NOT pause rotation on a touch pointerEnter (a tap fires pointerenter but no reliable pointerleave)", () => {
		const { container } = render(
			<PersonalPanel item={musicItem} open={true} onClose={vi.fn()} />,
		);
		const shelf = container.querySelector("ul")?.parentElement as Element;

		fireEvent.pointerEnter(shelf, { pointerType: "touch" });

		const fill = container.querySelector(
			".album-ring-fill",
		) as SVGCircleElement;
		expect(fill.style.animationPlayState).toBe("running");
	});
});
