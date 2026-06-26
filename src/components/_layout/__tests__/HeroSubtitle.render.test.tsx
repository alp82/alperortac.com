// @vitest-environment jsdom
import { act, cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { HeroSubtitle } from "../HeroSubtitle";

// ---------------------------------------------------------------------------
// matchMedia stub — mirrors the pattern in ProjectPanel.test.tsx
// ---------------------------------------------------------------------------
function stubMatchMedia(reduced: boolean): typeof window.matchMedia {
	const original = window.matchMedia;
	window.matchMedia = vi.fn().mockImplementation((query: string) => ({
		matches: reduced ? query === "(prefers-reduced-motion: reduce)" : false,
		media: query,
		onchange: null,
		addEventListener() {},
		removeEventListener() {},
		addListener() {},
		removeListener() {},
		dispatchEvent() {
			return false;
		},
	})) as unknown as typeof window.matchMedia;
	return original;
}

describe("HeroSubtitle render (v3 two-index model)", () => {
	let originalMatchMedia: typeof window.matchMedia;

	afterEach(() => {
		cleanup();
		if (originalMatchMedia !== undefined) {
			window.matchMedia = originalMatchMedia;
		}
	});

	// TC-RENDER-01: reduced-motion aria-label and text content
	it("TC-RENDER-01: reduced-motion — aria-label is 'web enthusiast with a side project habit' and text is present", () => {
		originalMatchMedia = stubMatchMedia(true);
		const { container } = render(<HeroSubtitle />);
		const el = container.querySelector("[aria-label]");
		expect(el).not.toBeNull();
		expect(el!.getAttribute("aria-label")).toBe(
			"web enthusiast with a side project habit",
		);
		expect(container.textContent).toContain("web enthusiast");
		expect(container.textContent).toContain("with a side project habit");
	});

	// TC-RENDER-02: reduced-motion — no .hero-cursor
	it("TC-RENDER-02: reduced-motion — no .hero-cursor element rendered", () => {
		originalMatchMedia = stubMatchMedia(true);
		const { container } = render(<HeroSubtitle />);
		expect(container.querySelector(".hero-cursor")).toBeNull();
	});

	// TC-RENDER-03: reduced-motion — aria-label unchanged after act flush
	it("TC-RENDER-03: reduced-motion — aria-label unchanged after act flush", async () => {
		originalMatchMedia = stubMatchMedia(true);
		const { container } = render(<HeroSubtitle />);
		await act(() => {});
		const el = container.querySelector("[aria-label]");
		expect(el).not.toBeNull();
		expect(el!.getAttribute("aria-label")).toBe(
			"web enthusiast with a side project habit",
		);
	});

	// TC-RENDER-04: animated — .hero-cursor present after act flush
	it("TC-RENDER-04: animated — .hero-cursor present after act flush", async () => {
		originalMatchMedia = stubMatchMedia(false);
		const { container } = render(<HeroSubtitle />);
		await act(() => {});
		expect(container.querySelector(".hero-cursor")).not.toBeNull();
	});

	// TC-RENDER-05: animated — [aria-label] present
	it("TC-RENDER-05: animated — [aria-label] exists", async () => {
		originalMatchMedia = stubMatchMedia(false);
		const { container } = render(<HeroSubtitle />);
		await act(() => {});
		const el = container.querySelector("[aria-label]");
		expect(el).not.toBeNull();
	});

	// TC-RENDER-06: bg-white/50 container present
	it("TC-RENDER-06: some element has bg-white/50 class", () => {
		originalMatchMedia = stubMatchMedia(true);
		const { container } = render(<HeroSubtitle />);
		// Use attribute-substring selector because the class token contains a slash
		// which makes `.bg-white/50` an invalid CSS selector
		const el = container.querySelector('[class*="bg-white/50"]');
		expect(el).not.toBeNull();
	});

	// TC-RENDER-07: ALL inner spans are aria-hidden; only the role="img" container carries aria-label
	it("TC-RENDER-07: all inner spans aria-hidden; only the role=img container has aria-label", async () => {
		originalMatchMedia = stubMatchMedia(false);
		const { container } = render(<HeroSubtitle />);
		await act(() => {});

		// Every <span> inside the grid must be aria-hidden="true"
		const allSpans = Array.from(container.querySelectorAll("span"));
		expect(allSpans.length).toBeGreaterThan(0);
		for (const span of allSpans) {
			expect(span.getAttribute("aria-hidden")).toBe("true");
		}

		// The ONLY element with aria-label is the role="img" container
		const ariaLabelEls = Array.from(container.querySelectorAll("[aria-label]"));
		expect(ariaLabelEls.length).toBe(1);
		expect(ariaLabelEls[0]!.getAttribute("role")).toBe("img");
	});

	// TC-RENDER-08: left role cell advance — after one full retype + push beat, role text changes from "web enthusiast" to "agentic coach"
	it("TC-RENDER-08: after full right-retype + left-push, role cell text changes to 'agentic coach'", async () => {
		originalMatchMedia = stubMatchMedia(false);
		vi.useFakeTimers();

		try {
			const { container } = render(<HeroSubtitle />);
			// Flush mount effects
			await act(() => {});

			// Assert initial role text
			expect(
				container.querySelector(".justify-self-end")?.textContent,
			).toContain("web enthusiast");

			// Drive the animation tick by tick. Each timer dispatch re-subscribes the
			// next setTimeout on a microtask, so advance ONE timer at a time inside an
			// async act and let React flush the re-subscription before the next tick.
			// The left span carries key={leftIndex}, so a left advance remounts it as a
			// fresh node — re-query each loop rather than holding a stale ref.
			for (let i = 0; i < 200; i++) {
				await act(async () => {
					await vi.advanceTimersToNextTimerAsync();
				});
				if (
					container
						.querySelector(".justify-self-end")
						?.textContent?.includes("agentic coach")
				) {
					break;
				}
			}

			expect(
				container.querySelector(".justify-self-end")?.textContent,
			).toContain("agentic coach");
		} finally {
			vi.useRealTimers();
		}
	});
});
