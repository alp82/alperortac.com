// @vitest-environment jsdom
import { act, cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { HERO_CURIOUS, HERO_OUTCOME } from "../../../data/hero";
import { HeroSubtitle } from "../HeroSubtitle";
import { formatManifesto } from "../useSequentialCycle";

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

// Manifesto derived from the REAL pools (settled pool[0] for each slot) so this
// suite tracks hero.ts content edits instead of pinning a stale copy that drifts.
const MANIFESTO_0 = formatManifesto(
	HERO_CURIOUS[0] ?? "",
	HERO_OUTCOME[0] ?? "",
);

// Pattern every valid manifesto must match (full sentence shape).
const MANIFESTO_RE =
	/^I'm a web enthusiast, endlessly curious about .+, building side projects that come out .+\.$/;

describe("HeroSubtitle render (two-row typewriter model)", () => {
	let originalMatchMedia: typeof window.matchMedia;

	afterEach(() => {
		cleanup();
		if (originalMatchMedia !== undefined) {
			window.matchMedia = originalMatchMedia;
		}
	});

	// HR-01 ----------------------------------------------------------------
	it("HR-01: reduced-motion — aria-label is the full pool[0] manifesto; text contains curious + outcome words", () => {
		originalMatchMedia = stubMatchMedia(true);
		const { container } = render(<HeroSubtitle />);
		const el = container.querySelector("[aria-label]");
		expect(el).not.toBeNull();
		expect(el?.getAttribute("aria-label")).toBe(MANIFESTO_0);
		expect(container.textContent).toContain(HERO_CURIOUS[0] ?? "");
		expect(container.textContent).toContain(HERO_OUTCOME[0] ?? "");
	});

	// HR-02 ----------------------------------------------------------------
	it("HR-02: reduced-motion — no .hero-cursor element rendered", () => {
		originalMatchMedia = stubMatchMedia(true);
		const { container } = render(<HeroSubtitle />);
		expect(container.querySelector(".hero-cursor")).toBeNull();
	});

	// HR-03 ----------------------------------------------------------------
	it("HR-03: reduced-motion — aria-label unchanged after act() flush", async () => {
		originalMatchMedia = stubMatchMedia(true);
		const { container } = render(<HeroSubtitle />);
		await act(() => {});
		const el = container.querySelector("[aria-label]");
		expect(el).not.toBeNull();
		expect(el?.getAttribute("aria-label")).toBe(MANIFESTO_0);
	});

	// HR-04 ----------------------------------------------------------------
	it("HR-04: animated — .hero-cursor absent immediately after mount+flush (initial dwell); present after advancing into a typewriter phase", async () => {
		originalMatchMedia = stubMatchMedia(false);
		vi.useFakeTimers();

		try {
			const { container } = render(<HeroSubtitle />);
			// Flush mount effects — still in initial dwell, no cursor yet
			await act(() => {});
			expect(container.querySelector(".hero-cursor")).toBeNull();

			// Advance tick-by-tick until cursor appears (a typewriter slot is editing)
			let cursorFound = false;
			for (let i = 0; i < 150; i++) {
				await act(async () => {
					await vi.advanceTimersToNextTimerAsync();
				});
				if (container.querySelector(".hero-cursor")) {
					cursorFound = true;
					break;
				}
			}

			expect(cursorFound).toBe(true);
			expect(container.querySelectorAll(".hero-cursor").length).toBe(1);
		} finally {
			vi.useRealTimers();
		}
	});

	// HR-05 ----------------------------------------------------------------
	it("HR-05: first paint is static — exactly one [aria-label] on role='img'; aria-label equals MANIFESTO_0; no cursor before effects flush", () => {
		originalMatchMedia = stubMatchMedia(false);
		const { container } = render(<HeroSubtitle />);

		const ariaLabelEls = Array.from(container.querySelectorAll("[aria-label]"));
		expect(ariaLabelEls.length).toBe(1);
		expect(ariaLabelEls[0]?.getAttribute("role")).toBe("img");
		expect(ariaLabelEls[0]?.getAttribute("aria-label")).toBe(MANIFESTO_0);
		expect(container.querySelector(".hero-cursor")).toBeNull();
	});

	// HR-06 ----------------------------------------------------------------
	it("HR-06: animated — exactly one [aria-label] element; it is the role='img' container; aria-label equals MANIFESTO_0 at initial dwell", async () => {
		originalMatchMedia = stubMatchMedia(false);
		const { container } = render(<HeroSubtitle />);
		await act(() => {});

		const ariaLabelEls = Array.from(container.querySelectorAll("[aria-label]"));
		expect(ariaLabelEls.length).toBe(1);
		expect(ariaLabelEls[0]?.getAttribute("role")).toBe("img");

		// The aria-label must always be the full settled manifesto (never a partial
		// typed fragment), even in animated mode at initial dwell (indices all 0).
		expect(ariaLabelEls[0]?.getAttribute("aria-label")).toBe(MANIFESTO_0);
	});

	// HR-07 ----------------------------------------------------------------
	it("HR-07: every inner <span> has aria-hidden='true'; only the role='img' container carries aria-label", async () => {
		originalMatchMedia = stubMatchMedia(false);
		const { container } = render(<HeroSubtitle />);
		await act(() => {});

		const allSpans = Array.from(container.querySelectorAll("span"));
		expect(allSpans.length).toBeGreaterThan(0);
		for (const span of allSpans) {
			expect(span.getAttribute("aria-hidden")).toBe("true");
		}

		const ariaLabelEls = Array.from(container.querySelectorAll("[aria-label]"));
		expect(ariaLabelEls.length).toBe(1);
		expect(ariaLabelEls[0]?.getAttribute("role")).toBe("img");
	});

	// HR-08 ----------------------------------------------------------------
	it("HR-08: exactly two visible rows — querySelectorAll('[data-line]').length === 2", () => {
		originalMatchMedia = stubMatchMedia(false);
		const { container } = render(<HeroSubtitle />);
		const blockRows = container.querySelectorAll("[data-line]");
		expect(blockRows.length).toBe(2);
	});

	// HR-09 ----------------------------------------------------------------
	it("HR-09: animated — after a typing slot finishes and enters dwell, .hero-cursor is gone", async () => {
		originalMatchMedia = stubMatchMedia(false);
		vi.useFakeTimers();

		try {
			const { container } = render(<HeroSubtitle />);
			await act(() => {});

			// First: advance until cursor appears (a typewriter slot is editing)
			let cursorSeen = false;
			for (let i = 0; i < 150; i++) {
				await act(async () => {
					await vi.advanceTimersToNextTimerAsync();
				});
				if (container.querySelector(".hero-cursor")) {
					cursorSeen = true;
					break;
				}
			}
			expect(cursorSeen).toBe(true);

			// Then: continue advancing until cursor disappears (slot returns to dwell)
			let cursorGone = false;
			for (let i = 0; i < 300; i++) {
				await act(async () => {
					await vi.advanceTimersToNextTimerAsync();
				});
				if (!container.querySelector(".hero-cursor")) {
					cursorGone = true;
					break;
				}
			}

			expect(cursorGone).toBe(true);
			expect(container.querySelector(".hero-cursor")).toBeNull();
		} finally {
			vi.useRealTimers();
		}
	});

	// HR-10 ----------------------------------------------------------------
	it("HR-10: animated — during STRICT-PARTIAL curious typing frame, aria-label matches MANIFESTO_RE; parsed curious word is a COMPLETE HERO_CURIOUS member; parsed ariaCurious !== visible partial curious text", async () => {
		originalMatchMedia = stubMatchMedia(false);
		vi.useFakeTimers();

		try {
			const { container } = render(<HeroSubtitle />);

			// Visible text of [data-slot="curious"] excluding the .hero-cursor span.
			// The chip holds a live-word span whose children are the typed text node
			// plus (optionally) the cursor element; read the text nodes only.
			function getVisibleCurious(): string {
				const slot = container.querySelector('[data-slot="curious"]');
				if (!slot) return "";
				const live = slot.querySelector("span") ?? slot;
				let text = "";
				for (const node of Array.from(live.childNodes)) {
					if (node.nodeType === Node.TEXT_NODE) {
						text += node.textContent ?? "";
					} else if (
						node.nodeType === Node.ELEMENT_NODE &&
						!(node as Element).classList.contains("hero-cursor")
					) {
						text += (node as Element).textContent ?? "";
					}
				}
				return text;
			}
			await act(() => {});

			// Phase 1 — advance until a typing cursor first appears.
			let cursorFound = false;
			for (let i = 0; i < 150; i++) {
				await act(async () => {
					await vi.advanceTimersToNextTimerAsync();
				});
				if (container.querySelector(".hero-cursor")) {
					cursorFound = true;
					break;
				}
			}
			expect(cursorFound).toBe(true);

			// Phase 2 — advance until the VISIBLE curious text is a strict partial:
			// cursor present AND visible text is non-empty AND is NOT a complete
			// HERO_CURIOUS member (e.g. "the we" during backspacing, "go" during typing).
			let strictPartialFound = false;
			let visibleCurious = "";
			for (let i = 0; i < 300; i++) {
				await act(async () => {
					await vi.advanceTimersToNextTimerAsync();
				});
				if (!container.querySelector(".hero-cursor")) continue;
				// Only consider frames where the curious slot is the one editing.
				const curiousSlot = container.querySelector('[data-slot="curious"]');
				if (!curiousSlot?.querySelector(".hero-cursor")) continue;
				const candidate = getVisibleCurious();
				if (candidate.length > 0 && !HERO_CURIOUS.includes(candidate)) {
					visibleCurious = candidate;
					strictPartialFound = true;
					break;
				}
			}

			expect(strictPartialFound).toBe(true);

			// At this strict-partial frame, validate the aria-label.
			const ariaEl = container.querySelector("[aria-label]");
			expect(ariaEl).not.toBeNull();
			const label = ariaEl?.getAttribute("aria-label") ?? "";

			// (a) Full sentence shape — never a truncated fragment.
			expect(label).toMatch(MANIFESTO_RE);

			// (b) The curious word embedded in aria-label must be a COMPLETE pool word.
			// Pool entries contain spaces ("the web", "good design", "how things work"),
			// so anchor the capture on the fixed prose on BOTH sides.
			const curiousMatch = label.match(
				/endlessly curious about (.+?), building side projects/,
			);
			expect(curiousMatch).not.toBeNull();
			const ariaCurious = curiousMatch?.[1] ?? "";
			expect(HERO_CURIOUS).toContain(ariaCurious);

			// (c) KILL ASSERTION — settled announced word must differ from the
			// partially-typed visible text. A leak implementation makes ariaCurious ===
			// visibleCurious === the partial. A correct implementation holds the settled
			// pool word in state and only updates visible text tick-by-tick.
			expect(ariaCurious).not.toBe(visibleCurious);
		} finally {
			vi.useRealTimers();
		}
	});

	// HR-11 ----------------------------------------------------------------
	it("HR-11: softened chip + serif second accent — both chips are the faint ink tint bg-[#0a0a0a]/[0.09], rounded-lg, dark ink (not white); curious is font-black; outcome is Instrument Serif italic; neither uppercase nor per-slot color", () => {
		originalMatchMedia = stubMatchMedia(false);
		const { container } = render(<HeroSubtitle />);

		for (const slot of ["curious", "outcome"]) {
			const chip = container.querySelector(`[data-slot="${slot}"]`);
			expect(chip, `chip for ${slot}`).not.toBeNull();
			expect(chip?.className).toContain("bg-[#0a0a0a]/[0.09]");
			expect(chip?.className).toContain("rounded-lg");
			expect(chip?.className).toContain("text-[#0a0a0a]");
			expect(chip?.className).not.toContain("text-white");
			expect(chip?.className).not.toContain("uppercase");
			expect(chip?.className).not.toContain("bg-[#e8552d]");
			expect(chip?.className).not.toContain("bg-[#1e3a8a]");
		}

		const curiousChip = container.querySelector('[data-slot="curious"]');
		expect(curiousChip?.className).toContain("font-black");

		const outcomeChip = container.querySelector('[data-slot="outcome"]');
		expect(outcomeChip?.className).toContain("italic");
		expect(outcomeChip?.className).toContain("font-['Instrument_Serif']");
		expect(outcomeChip?.className).not.toContain("font-black");
	});

	// HR-12 ----------------------------------------------------------------
	it("HR-12: lead line renders and does NOT pollute the typewriter aria-label", () => {
		originalMatchMedia = stubMatchMedia(false);
		const { container } = render(<HeroSubtitle />);

		expect(container.textContent).toContain(
			"I work with teams to unlock their full potential.",
		);

		// The role=img aria-label must still be exactly MANIFESTO_0 — the lead is a sibling, not inside it.
		const ariaEl = container.querySelector("[aria-label]");
		expect(ariaEl).not.toBeNull();
		expect(ariaEl?.getAttribute("aria-label")).toBe(MANIFESTO_0);
	});

	// HR-13 ----------------------------------------------------------------
	it("HR-13: scroll cue renders correctly — anchor, text, animated chevron; no extra aria-label", () => {
		originalMatchMedia = stubMatchMedia(false);
		const { container } = render(<HeroSubtitle />);

		const cta = container.querySelector('a[href="#find-me"]');
		expect(cta).not.toBeNull();
		expect(cta?.textContent).toContain("Find out more about my work");
		expect(cta?.querySelector("svg.hero-scroll-arrow")).not.toBeNull();

		// Still exactly one [aria-label] overall and it is the role=img block.
		const ariaLabelEls = Array.from(container.querySelectorAll("[aria-label]"));
		expect(ariaLabelEls.length).toBe(1);
		expect(ariaLabelEls[0]?.getAttribute("role")).toBe("img");
	});
});
