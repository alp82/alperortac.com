// @vitest-environment jsdom
import { act, cleanup, render } from "@testing-library/react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { stubSectionGeometry } from "../../../test/stubSectionGeometry";
import { AccentUnderline, SectionTitle } from "../SectionTitle";

// ---------------------------------------------------------------------------
// Render tests for SectionTitle: the shared, brutalist-drop-shadow section
// heading + optional accent underline used across the composer's ported
// inners and top-level sections. The night/day color is frozen at mount from
// the section's scroll position (no listeners, no timers) - Group F/G/H stub
// getBoundingClientRect + window.scrollY/innerHeight + document scrollHeight
// before render, using the shared stubSectionGeometry helper (extended from
// this file's former local stubGeometry to support per-element rects for the
// whole-section day/night freeze).
// ---------------------------------------------------------------------------

afterEach(() => {
	cleanup();
	vi.unstubAllGlobals();
	vi.useRealTimers();
});

describe("SectionTitle h2 canonical classes", () => {
	// TC-1
	it("h2 className contains the canonical brutalist chrome classes", () => {
		const { container } = render(<SectionTitle>Hi</SectionTitle>);
		const h2 = container.querySelector("h2");
		expect(h2?.className).toContain(
			"text-6xl md:text-8xl font-black uppercase tracking-tighter leading-[0.9] drop-shadow-[4px_4px_0px_rgba(255,255,255,0.5)]",
		);
	});

	// TC-2
	it("h2 className does not contain transition-colors", () => {
		const { container } = render(<SectionTitle>Hi</SectionTitle>);
		const h2 = container.querySelector("h2");
		expect(h2?.className).not.toContain("transition-colors");
	});
});

describe("SectionTitle children", () => {
	// TC-3
	it("renders plain text children in the h2", () => {
		const { container } = render(<SectionTitle>Plain Text</SectionTitle>);
		const h2 = container.querySelector("h2");
		expect(h2?.textContent).toBe("Plain Text");
	});

	// TC-4
	it("renders mixed element children inside the h2", () => {
		const { container } = render(
			<SectionTitle>
				<span>A</span> and <em>B</em>
			</SectionTitle>,
		);
		const h2 = container.querySelector("h2") as HTMLElement;
		expect(h2.textContent).toBe("A and B");
		expect(h2.querySelector("span")).not.toBeNull();
		expect(h2.querySelector("em")).not.toBeNull();
	});
});

describe("SectionTitle className on root wrapper", () => {
	// TC-5
	it("className lands on the root div, not the h2", () => {
		const { container } = render(
			<SectionTitle className="my-wrapper-class">Title</SectionTitle>,
		);
		const root = container.firstElementChild as HTMLElement;
		expect(root.className).toContain("my-wrapper-class");
		const h2 = container.querySelector("h2");
		expect(h2?.className).not.toContain("my-wrapper-class");
	});
});

describe("AccentUnderline", () => {
	// TC-6
	it("renders an aria-hidden span with the accent as background and base classes", () => {
		const { container } = render(<AccentUnderline accent="#ff0000" />);
		const span = container.querySelector("span") as HTMLSpanElement;
		expect(span.getAttribute("aria-hidden")).toBe("true");
		expect(span.className).toContain("h-1.5");
		expect(span.className).toContain("w-20");
		expect(span.className).toContain("rounded-full");
		expect(span.className).toContain("mt-4");
		expect(span.className).toContain("block");
		// jsdom/CSSOM serializes an assigned hex background to rgb() form, so
		// "#ff0000" as input reads back as "rgb(255, 0, 0)" - never the hex.
		expect(span.style.background).toBe("rgb(255, 0, 0)");
	});

	// TC-7
	it("align='center' includes mx-auto", () => {
		const { container } = render(
			<AccentUnderline accent="#00ff00" align="center" />,
		);
		const span = container.querySelector("span");
		expect(span?.className).toContain("mx-auto");
	});

	// TC-8
	it("default align includes mx-auto", () => {
		const { container } = render(<AccentUnderline accent="#00ff00" />);
		const span = container.querySelector("span");
		expect(span?.className).toContain("mx-auto");
	});

	// TC-9
	it("align='left' includes ml-0 and not mx-auto", () => {
		const { container } = render(
			<AccentUnderline accent="#00ff00" align="left" />,
		);
		const span = container.querySelector("span");
		expect(span?.className).toContain("ml-0");
		expect(span?.className).not.toContain("mx-auto");
	});
});

describe("SectionTitle accent wiring", () => {
	// TC-10
	it("passing accent renders the underline span with that background", () => {
		const { container } = render(
			<SectionTitle accent="#123456">Title</SectionTitle>,
		);
		const span = container.querySelector('span[aria-hidden="true"]');
		expect(span).not.toBeNull();
		// rgb serialization of #123456 - jsdom never returns the hex form.
		expect((span as HTMLSpanElement).style.background).toBe("rgb(18, 52, 86)");
	});

	// TC-11
	it("no accent renders no underline span", () => {
		const { container } = render(<SectionTitle>Title</SectionTitle>);
		expect(container.querySelector('span[aria-hidden="true"]')).toBeNull();
	});
});

describe("SectionTitle size override", () => {
	// TC-12
	it("default size is text-6xl md:text-8xl", () => {
		const { container } = render(<SectionTitle>Title</SectionTitle>);
		const h2 = container.querySelector("h2");
		expect(h2?.className).toContain("text-6xl md:text-8xl");
	});

	// TC-13
	it("size override replaces the default size but keeps the rest of the chrome", () => {
		const { container } = render(
			<SectionTitle size="text-2xl md:text-4xl">Title</SectionTitle>,
		);
		const h2 = container.querySelector("h2");
		expect(h2?.className).toContain("text-2xl md:text-4xl");
		expect(h2?.className).not.toContain("text-6xl");
		expect(h2?.className).not.toContain("text-8xl");
		expect(h2?.className).toContain("font-black");
		expect(h2?.className).toContain("uppercase");
		expect(h2?.className).toContain("tracking-tighter");
		expect(h2?.className).toContain("leading-[0.9]");
		expect(h2?.className).toContain(
			"drop-shadow-[4px_4px_0px_rgba(255,255,255,0.5)]",
		);
	});
});

// SectionTitle's own underline-alignment prop is `underlineAlign` (renamed
// from the old `align`, which collided in name with AccentUnderline's own
// `align` prop even though they could diverge once SectionTitle grew a
// `night` override). AccentUnderline's OWN `align` prop (exercised in TC-6..9
// above) is UNCHANGED.
describe("SectionTitle underlineAlign wiring", () => {
	// TC-13b
	it("underlineAlign='left' forwards ml-0 to the underline span", () => {
		const { container } = render(
			<SectionTitle accent="#00ff00" underlineAlign="left">
				Title
			</SectionTitle>,
		);
		const span = container.querySelector('span[aria-hidden="true"]');
		expect(span?.className).toContain("ml-0");
		expect(span?.className).not.toContain("mx-auto");
	});
});

describe("SectionTitle color frozen by section position at mount", () => {
	// TC-14: progress === 0.55 exactly (boundary, inclusive → night).
	it("progress exactly 0.55 (boundary) renders night (text-white)", () => {
		const restore = stubSectionGeometry({
			scrollHeight: 1800,
			innerHeight: 800,
			rect: { top: 550, height: 800 },
		});
		const { container } = render(<SectionTitle>Title</SectionTitle>);
		const h2 = container.querySelector("h2");
		expect(h2?.className).toContain("text-white");
		expect(h2?.className).not.toContain("text-slate-900");
		restore();
	});

	// TC-15: progress 0.549, just under the boundary → day.
	it("progress just under 0.55 renders day (text-slate-900)", () => {
		const restore = stubSectionGeometry({
			scrollHeight: 1800,
			innerHeight: 800,
			rect: { top: 549, height: 800 },
		});
		const { container } = render(<SectionTitle>Title</SectionTitle>);
		const h2 = container.querySelector("h2");
		expect(h2?.className).toContain("text-slate-900");
		expect(h2?.className).not.toContain("text-white");
		restore();
	});

	// TC-16: progress ~0.9, well past → night.
	it("progress well past the threshold renders night (text-white)", () => {
		const restore = stubSectionGeometry({
			scrollHeight: 1800,
			innerHeight: 800,
			rect: { top: 900, height: 800 },
		});
		const { container } = render(<SectionTitle>Title</SectionTitle>);
		const h2 = container.querySelector("h2");
		expect(h2?.className).toContain("text-white");
		restore();
	});

	// TC-17: progress ~0.05, well before → day.
	it("progress well before the threshold renders day (text-slate-900)", () => {
		const restore = stubSectionGeometry({
			scrollHeight: 1800,
			innerHeight: 800,
			rect: { top: 50, height: 800 },
		});
		const { container } = render(<SectionTitle>Title</SectionTitle>);
		const h2 = container.querySelector("h2");
		expect(h2?.className).toContain("text-slate-900");
		restore();
	});

	// TC-18: bare jsdom (no stubs) - all-zero geometry → total<=0 guard → day.
	it("bare jsdom with zero geometry defaults to day (text-slate-900)", () => {
		const { container } = render(<SectionTitle>Title</SectionTitle>);
		const h2 = container.querySelector("h2");
		expect(h2?.className).toContain("text-slate-900");
	});
});

describe("SectionTitle color frozen after mount (scroll does not re-derive it)", () => {
	// TC-19
	it("night color does not flip back on a later scroll event", () => {
		const restore = stubSectionGeometry({
			scrollHeight: 1800,
			innerHeight: 800,
			rect: { top: 900, height: 800 },
		});
		const { container } = render(<SectionTitle>Title</SectionTitle>);
		const h2 = container.querySelector("h2");
		expect(h2?.className).toContain("text-white");

		Object.defineProperty(window, "scrollY", {
			value: 999999,
			configurable: true,
		});
		act(() => {
			window.dispatchEvent(new Event("scroll"));
		});
		expect(h2?.className).toContain("text-white");
		restore();
	});

	// TC-20
	it("day color does not flip to night on a later scroll event", () => {
		const restore = stubSectionGeometry({
			scrollHeight: 1800,
			innerHeight: 800,
			rect: { top: 50, height: 800 },
		});
		const { container } = render(<SectionTitle>Title</SectionTitle>);
		const h2 = container.querySelector("h2");
		expect(h2?.className).toContain("text-slate-900");

		Object.defineProperty(window, "scrollY", {
			value: 999999,
			configurable: true,
		});
		act(() => {
			window.dispatchEvent(new Event("scroll"));
		});
		expect(h2?.className).toContain("text-slate-900");
		restore();
	});
});

describe("SectionTitle registers no listeners or timers", () => {
	// TC-21
	it("never registers a scroll or resize listener", () => {
		const addEventListenerSpy = vi.spyOn(window, "addEventListener");
		render(<SectionTitle>Title</SectionTitle>);
		const registeredTypes = addEventListenerSpy.mock.calls.map(
			(call) => call[0],
		);
		expect(registeredTypes).not.toContain("scroll");
		expect(registeredTypes).not.toContain("resize");
	});

	// TC-22
	it("leaves zero pending timers after mount", () => {
		vi.useFakeTimers();
		act(() => {
			render(<SectionTitle>Title</SectionTitle>);
		});
		expect(vi.getTimerCount()).toBe(0);
	});
});

describe("SectionTitle SSR-safe default (useState(false) before the effect flushes)", () => {
	// TC-23: renderToStaticMarkup never runs effects (there is no DOM, no
	// commit phase, no mount), so it renders exactly the useState(false)
	// initial value. Geometry is stubbed to unambiguous night values (matching
	// TC-16) to prove the day markup isn't merely a side effect of the
	// geometry read never happening server-side - the component must default
	// to day regardless of what the geometry effect would later compute.
	it("renderToStaticMarkup shows day (text-slate-900) even when geometry is stubbed to night", () => {
		const restore = stubSectionGeometry({
			scrollHeight: 1800,
			innerHeight: 800,
			rect: { top: 900, height: 800 },
		});
		const html = renderToStaticMarkup(
			<SectionTitle accent="rgb(1,2,3)">T</SectionTitle>,
		);
		expect(html).toContain("text-slate-900");
		expect(html).not.toContain("text-white");
		restore();
	});
});

// SectionTitle gains a `night?: boolean` override prop. When provided (either
// true or false), the internal measurement hook is disabled entirely
// (`useSectionNightPhase(ref, enabled = night === undefined)`) and the
// caller's explicit value wins via `??` (not `||`, so `night={false}` isn't
// swallowed by a falsy short-circuit).
describe("SectionTitle night prop override", () => {
	afterEach(() => {
		document.body.classList.remove("panel-open");
	});

	// ST-N1
	it("night={true} under all-DAY stub geometry renders text-white", () => {
		const restore = stubSectionGeometry({
			scrollHeight: 1800,
			innerHeight: 800,
			rect: { top: 50, height: 800 },
		});
		const { container } = render(
			<SectionTitle night={true}>Title</SectionTitle>,
		);
		const h2 = container.querySelector("h2");
		expect(h2?.className).toContain("text-white");
		restore();
	});

	// ST-N2
	it("night={false} under all-NIGHT stub geometry renders text-slate-900 (explicit false respected)", () => {
		const restore = stubSectionGeometry({
			scrollHeight: 1800,
			innerHeight: 800,
			rect: { top: 900, height: 800 },
		});
		const { container } = render(
			<SectionTitle night={false}>Title</SectionTitle>,
		);
		const h2 = container.querySelector("h2");
		expect(h2?.className).toContain("text-slate-900");
		expect(h2?.className).not.toContain("text-white");
		restore();
	});

	// ST-N3: with `night` provided, the measurement path (getBoundingClientRect)
	// is never invoked at all - the enabled=false gate skips it entirely.
	it("with night provided, getBoundingClientRect is never called (measurement gated off)", () => {
		const spy = vi.spyOn(HTMLElement.prototype, "getBoundingClientRect");
		render(<SectionTitle night={true}>Title</SectionTitle>);
		expect(spy).not.toHaveBeenCalled();
	});
});

describe("SectionTitle fonts.ready re-seed", () => {
	afterEach(() => {
		document.body.classList.remove("panel-open");
		// biome-ignore lint/suspicious/noExplicitAny: restoring a test-only stub property
		delete (document as any).fonts;
	});

	function stubFontsReady(): { resolve: () => void } {
		let resolveFn: () => void = () => {};
		const promise = new Promise<void>((res) => {
			resolveFn = res;
		});
		Object.defineProperty(document, "fonts", {
			value: { ready: promise },
			configurable: true,
		});
		return { resolve: resolveFn };
	}

	// ST-N4: mounting under DAY geometry seeds day; once fonts.ready resolves
	// under freshly re-stubbed NIGHT geometry, the color re-seeds to night.
	it("re-seeds from day to night once fonts.ready resolves under new geometry", async () => {
		const { resolve } = stubFontsReady();
		let restore = stubSectionGeometry({
			scrollHeight: 1800,
			innerHeight: 800,
			rect: { top: 50, height: 800 },
		});
		const { container } = render(<SectionTitle>Title</SectionTitle>);
		const h2 = container.querySelector("h2");
		expect(h2?.className).toContain("text-slate-900");

		restore();
		restore = stubSectionGeometry({
			scrollHeight: 1800,
			innerHeight: 800,
			rect: { top: 900, height: 800 },
		});

		await act(async () => {
			resolve();
		});

		expect(h2?.className).toContain("text-white");
		restore();
	});

	// ST-N5: same setup, but with `panel-open` set on <body> before the
	// promise resolves - the re-seed is skipped under the transform guard, so
	// the color stays day.
	it("skips the re-seed when document.body has panel-open at resolution time", async () => {
		const { resolve } = stubFontsReady();
		let restore = stubSectionGeometry({
			scrollHeight: 1800,
			innerHeight: 800,
			rect: { top: 50, height: 800 },
		});
		const { container } = render(<SectionTitle>Title</SectionTitle>);
		const h2 = container.querySelector("h2");
		expect(h2?.className).toContain("text-slate-900");

		restore();
		restore = stubSectionGeometry({
			scrollHeight: 1800,
			innerHeight: 800,
			rect: { top: 900, height: 800 },
		});
		document.body.classList.add("panel-open");

		await act(async () => {
			resolve();
		});

		expect(h2?.className).toContain("text-slate-900");
		restore();
	});
});
