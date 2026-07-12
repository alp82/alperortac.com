// @vitest-environment jsdom
import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { HERO_CTA, HERO_SUMMARY } from "../../../data/hero";
import { SECTION_IDS } from "../../../data/sections";
import { stubMatchMedia } from "../../../test/stubMatchMedia";
import { HeroSubtitle } from "../HeroSubtitle";

// ---------------------------------------------------------------------------
// Render-contract tests for HeroSubtitle (static two-line summary model).
// The subtitle renders one [data-line] paragraph per HERO_SUMMARY entry plus a
// static CTA anchor. No typewriter, no cursor. Tests track HERO_SUMMARY content
// edits instead of pinning a stale copy.
// ---------------------------------------------------------------------------

function getPassionSpan(container: HTMLElement): HTMLElement {
	const lineTwo = container.querySelector('[data-line="2"]')!;
	return Array.from(lineTwo.querySelectorAll("span")).find((s) =>
		s.textContent?.includes("passion"),
	)!;
}

function getPassionSvgPath(container: HTMLElement): SVGPathElement {
	return getPassionSpan(container).querySelector<SVGPathElement>("svg path")!;
}

// Text content of `el`, excluding any aria-hidden="true" descendant subtrees.
// Used so assertions against HERO_SUMMARY copy remain stable once decorative
// aria-hidden overlays (e.g. the dusk crossfade span) duplicate visible text
// for presentational purposes only.
function visibleText(el: Element): string {
	const clone = el.cloneNode(true) as Element;
	for (const hidden of clone.querySelectorAll('[aria-hidden="true"]')) {
		hidden.remove();
	}
	return clone.textContent ?? "";
}

describe("HeroSubtitle render (static summary model)", () => {
	afterEach(() => {
		cleanup();
		vi.unstubAllGlobals();
	});

	it("renders one [data-line] paragraph per HERO_SUMMARY entry, in order", () => {
		const { container } = render(<HeroSubtitle />);
		const lines = Array.from(container.querySelectorAll("[data-line]"));
		expect(lines.length).toBe(HERO_SUMMARY.length);
		lines.forEach((line, i) => {
			expect(visibleText(line)).toBe(HERO_SUMMARY[i]);
		});
	});

	it("renders no .hero-cursor element", () => {
		const { container } = render(<HeroSubtitle />);
		expect(container.querySelector(".hero-cursor")).toBeNull();
	});

	it('wraps "passion" on line 2 in a serif-italic span without altering the line text', () => {
		const { container } = render(<HeroSubtitle />);
		const lineTwo = container.querySelector('[data-line="2"]')!;
		const span = getPassionSpan(container);
		expect(span).not.toBeUndefined();
		expect(span.className).toContain("italic");
		expect(span.className).toContain("Instrument_Serif");
		expect(visibleText(lineTwo)).toBe(HERO_SUMMARY[1]);

		// AC1 - base classes retained, size bumps 1.1em -> 1.25em
		expect(span.className).toContain("font-['Instrument_Serif']");
		expect(span.className).toContain("font-extrabold");
		expect(span.className).toContain("tracking-[0.08em]");
		expect(span.className).toContain("inline-block");
		expect(span.className).toContain("bg-clip-text");
		expect(span.className).toContain("text-transparent");
		expect(span.className).toContain("text-[1.25em]");
		expect(span.className).not.toContain("text-[1.1em]");
		expect(span.className).toContain("relative");
		expect(span.className).toContain("pb-[0.08em]");

		// AC2 - word fill is the exact sunset micro-ramp
		expect(span.className).toContain(
			"bg-[linear-gradient(100deg,#D9530E,#C2410C,#A8380A)]",
		);
		expect(span.className).not.toContain(
			"bg-[linear-gradient(100deg,#dc2626,#ea580c,#d97706,#16a34a,#2563eb,#7c3aed)]",
		);
	});

	it("renders the CTA anchor with text and animated chevron", () => {
		const { container } = render(<HeroSubtitle />);
		const cta = container.querySelector(`a[href="#${SECTION_IDS.findMe}"]`);
		expect(cta).not.toBeNull();
		expect(cta?.textContent).toContain(HERO_CTA);
		expect(cta?.querySelector("svg.hero-scroll-arrow")).not.toBeNull();
	});

	it("passion underline SVG - structure, geometry, positioning, a11y", () => {
		const { container } = render(<HeroSubtitle />);
		const lineTwo = container.querySelector('[data-line="2"]')!;
		const span = getPassionSpan(container);

		const svgs = span.querySelectorAll("svg");
		expect(svgs.length).toBe(1);

		const svg = svgs[0]!;
		expect(svg.getAttribute("viewBox")).toBe("0 0 200 12");
		expect(svg.getAttribute("preserveAspectRatio")).toBe("none");
		expect(svg.getAttribute("aria-hidden")).toBe("true");
		expect(svg.querySelector("title")).toBeNull();
		expect(visibleText(lineTwo)).toBe(HERO_SUMMARY[1]);

		const svgClass = svg.getAttribute("class") ?? "";
		expect(svgClass).toContain("pointer-events-none");
		expect(svgClass).toContain("absolute");
		expect(svgClass).toContain("bottom-[-0.14em]");
		expect(svgClass).toContain("left-[-2%]");
		expect(svgClass).toContain("h-[0.3em]");
		expect(svgClass).toContain("w-[104%]");
		expect(svgClass).toContain("overflow-visible");

		const path = svg.querySelector("path")!;
		expect(path.getAttribute("d")).toBe(
			"M3,7 C40,2 75,11 110,5 C140,0.5 170,10 197,6",
		);
		expect(path.getAttribute("stroke")).toBe("#C2410C");
		expect(path.getAttribute("stroke-width")).toBe("5");
		expect(path.getAttribute("stroke-linecap")).toBe("round");
		expect(path.getAttribute("pathLength")).toBe("1");
	});

	describe("dusk crossfade overlay - layered fill behind the sunset word", () => {
		it("renders exactly one aria-hidden overlay span inside the passion span", () => {
			const { container } = render(<HeroSubtitle />);
			const span = getPassionSpan(container);
			const overlay = span.querySelector('span[aria-hidden="true"]');
			expect(overlay).not.toBeNull();
		});

		it("overlay span carries the dusk crossfade + layering classes", () => {
			const { container } = render(<HeroSubtitle />);
			const span = getPassionSpan(container);
			const overlay = span.querySelector('span[aria-hidden="true"]')!;
			expect(overlay.className).toContain("hero-passion-dusk");
			expect(overlay.className).toContain("pointer-events-none");
			expect(overlay.className).toContain("select-none");
			expect(overlay.className).toContain("absolute");
			expect(overlay.className).toContain("inset-0");
			expect(overlay.className).toContain("bg-clip-text");
			expect(overlay.className).toContain("text-transparent");
			expect(overlay.className).toContain(
				"bg-[linear-gradient(100deg,#B4441C,#8B2E12,#5C1607)]",
			);
		});

		it("overlay span's textContent is exactly the serif word", () => {
			const { container } = render(<HeroSubtitle />);
			const span = getPassionSpan(container);
			const overlay = span.querySelector('span[aria-hidden="true"]')!;
			expect(overlay.textContent).toBe("passion");
		});

		it("outer passion span keeps its own sunset gradient and does not itself carry the dusk class", () => {
			const { container } = render(<HeroSubtitle />);
			const span = getPassionSpan(container);
			expect(span.className).toContain(
				"bg-[linear-gradient(100deg,#D9530E,#C2410C,#A8380A)]",
			);
			expect(span.className).not.toContain("hero-passion-dusk");
		});

		it("DOM order inside the passion span is: text, overlay span, then the underline svg (last child)", () => {
			const { container } = render(<HeroSubtitle />);
			const span = getPassionSpan(container);
			const children = Array.from(span.childNodes);
			const textNode = children.find(
				(n) =>
					n.nodeType === Node.TEXT_NODE && n.textContent?.includes("passion"),
			);
			const overlayIndex = children.findIndex(
				(n) =>
					n.nodeType === Node.ELEMENT_NODE &&
					(n as Element).getAttribute("aria-hidden") === "true" &&
					(n as Element).tagName.toLowerCase() === "span",
			);
			const svgIndex = children.findIndex(
				(n) =>
					n.nodeType === Node.ELEMENT_NODE &&
					(n as Element).tagName.toLowerCase() === "svg",
			);
			expect(textNode).not.toBeUndefined();
			const textIndex = children.indexOf(textNode!);
			expect(overlayIndex).toBeGreaterThan(textIndex);
			expect(svgIndex).toBeGreaterThan(overlayIndex);
			expect(svgIndex).toBe(children.length - 1);

			const svgs = span.querySelectorAll("svg");
			expect(svgs.length).toBe(1);
		});

		it("getPassionSpan still resolves to the outer span, not the inner overlay span", () => {
			const { container } = render(<HeroSubtitle />);
			const span = getPassionSpan(container);
			expect(span.getAttribute("aria-hidden")).not.toBe("true");
			expect(span.querySelector('span[aria-hidden="true"]')).not.toBeNull();
		});
	});

	describe("breathing underline - animation class coexists with static geometry attributes", () => {
		it("underline path carries the hero-underline-breathe class", () => {
			const { container } = render(<HeroSubtitle />);
			const path = getPassionSvgPath(container);
			expect(path.getAttribute("class")).toContain("hero-underline-breathe");
		});

		it("underline path keeps its static stroke-width alongside the animation class", () => {
			const { container } = render(<HeroSubtitle />);
			const path = getPassionSvgPath(container);
			expect(path.getAttribute("stroke-width")).toBe("5");
		});
	});

	describe("reduced motion - dusk overlay and breathing underline are CSS-only gated", () => {
		it("overlay is still present and still carries hero-passion-dusk under prefers-reduced-motion", () => {
			stubMatchMedia(true);
			const { container } = render(<HeroSubtitle />);
			const span = getPassionSpan(container);
			const overlay = span.querySelector('span[aria-hidden="true"]');
			expect(overlay).not.toBeNull();
			expect(overlay?.className).toContain("hero-passion-dusk");
		});

		it("underline path still carries hero-underline-breathe under prefers-reduced-motion", () => {
			stubMatchMedia(true);
			const { container } = render(<HeroSubtitle />);
			const path = getPassionSvgPath(container);
			expect(path.getAttribute("class")).toContain("hero-underline-breathe");
		});

		it("overlay className and path class are identical regardless of the reduced-motion stub (no JSX branching)", () => {
			stubMatchMedia(true);
			const reduced = render(<HeroSubtitle />);
			const reducedOverlay = getPassionSpan(reduced.container).querySelector(
				'span[aria-hidden="true"]',
			)!;
			const reducedOverlayClass = reducedOverlay.className;
			const reducedPathClass = getPassionSvgPath(
				reduced.container,
			).getAttribute("class");
			reduced.unmount();
			vi.unstubAllGlobals();

			stubMatchMedia(false);
			const allowed = render(<HeroSubtitle />);
			const allowedOverlay = getPassionSpan(allowed.container).querySelector(
				'span[aria-hidden="true"]',
			)!;
			const allowedOverlayClass = allowedOverlay.className;
			const allowedPathClass = getPassionSvgPath(
				allowed.container,
			).getAttribute("class");

			expect(reducedOverlayClass).toBe(allowedOverlayClass);
			expect(reducedPathClass).toBe(allowedPathClass);
		});

		it("no matchMedia stub - does not throw, and overlay + breathe classes are still present", () => {
			let result: ReturnType<typeof render>;
			expect(() => {
				result = render(<HeroSubtitle />);
			}).not.toThrow();
			const { container } = result!;
			const span = getPassionSpan(container);
			const overlay = span.querySelector('span[aria-hidden="true"]');
			expect(overlay?.className).toContain("hero-passion-dusk");
			const path = getPassionSvgPath(container);
			expect(path.getAttribute("class")).toContain("hero-underline-breathe");
		});
	});

	describe("subtitle paragraphs capped at 760px (line 1) / 815px (line 2)", () => {
		it('[data-line="1"] className contains max-w-[760px]', () => {
			const { container } = render(<HeroSubtitle />);
			const lineOne = container.querySelector('[data-line="1"]')!;
			expect(lineOne.className).toContain("max-w-[760px]");
		});

		it('[data-line="2"] className contains max-w-[815px]', () => {
			const { container } = render(<HeroSubtitle />);
			const lineTwo = container.querySelector('[data-line="2"]')!;
			expect(lineTwo.className).toContain("max-w-[815px]");
		});

		it('[data-line="1"] retains its pre-existing font-bold/text-size classes', () => {
			const { container } = render(<HeroSubtitle />);
			const lineOne = container.querySelector('[data-line="1"]')!;
			expect(lineOne.className).toContain("font-bold");
			expect(lineOne.className).toContain("text-2xl");
			expect(lineOne.className).toContain("sm:text-3xl");
			expect(lineOne.className).toContain("md:text-4xl");
		});

		it("outer .hero-type container retains its untouched layout and responsive font classes", () => {
			const { container } = render(<HeroSubtitle />);
			const outer = container.querySelector("div.hero-type")!;
			expect(outer.className).toContain("mx-auto");
			expect(outer.className).toContain("text-center");
			expect(outer.className).toContain("flex-col");
			expect(outer.className).toContain("text-xl");
			expect(outer.className).toContain("sm:text-2xl");
			expect(outer.className).toContain("md:text-3xl");
		});
	});

	describe("underline draw-in animation - 600ms ease-out, reduced-motion short-circuit", () => {
		it("reduced-motion - strokeDashoffset is 0 (fully drawn) and no transition is set", () => {
			stubMatchMedia(true);
			const { container } = render(<HeroSubtitle />);
			const path = getPassionSvgPath(container);
			expect(path.style.strokeDashoffset).toBe("0");
			expect(path.style.transition || "").toBe("");
		});

		it("motion-allowed - transition contains the stroke-dashoffset 600ms ease-out spec", () => {
			stubMatchMedia(false);
			const { container } = render(<HeroSubtitle />);
			const path = getPassionSvgPath(container);
			expect(path.style.transition).toContain(
				"stroke-dashoffset 600ms ease-out",
			);
		});

		it("no matchMedia stub - does not throw and settles to a valid strokeDashoffset", () => {
			let result: ReturnType<typeof render>;
			expect(() => {
				result = render(<HeroSubtitle />);
			}).not.toThrow();
			const { container } = result!;
			const path = getPassionSvgPath(container);
			expect(["0", "1"]).toContain(path.style.strokeDashoffset);
		});
	});
});
