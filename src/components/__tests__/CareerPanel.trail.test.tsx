// @vitest-environment jsdom

/*
 * CareerPanel trail-drawing tests.
 *
 * jsdom has no layout engine, so the trail effect can never run against it as
 * shipped - the sibling CareerPanel.test.tsx covers the static contract only.
 * These tests install the minimum measurable surface the effect actually
 * touches (clientWidth/clientHeight, offsetLeft/offsetWidth, the path length
 * API, ResizeObserver, a synchronous rAF) so the drawing path itself runs.
 *
 * They pin the regression where the trail never appeared: CareerPanel is
 * mounted inside a <dialog> that stays in the tree while closed, and a closed
 * dialog is display:none. The mount-time pass therefore measured a zero-width
 * box, bailed, and nothing ever retried it, so opening the panel showed the
 * axis and the cards but no trail.
 */

import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { CAREER_TIMELINE } from "../../data/career";
import { CareerPanel } from "../CareerPanel";

const HOST_W = 1060;
const HOST_H = 2042;
/* Mirrors the CSS: left column at 86px wide calc(50% - 96px), right at 50% + 96px. */
const CARD_W = 434;
const RIGHT_CARD_LEFT = 626;

const restores: Array<() => void> = [];
let hostWidth = HOST_W;
let fireResize: Array<() => void> = [];

function patch(target: object, key: string, desc: PropertyDescriptor) {
	const prev = Object.getOwnPropertyDescriptor(target, key);
	Object.defineProperty(target, key, { configurable: true, ...desc });
	restores.push(() => {
		if (prev) Object.defineProperty(target, key, prev);
		else Reflect.deleteProperty(target, key);
	});
}

// The host is the only element that holds the trail stops.
const isHost = (el: HTMLElement) =>
	el.querySelector("[data-trail-stop]") !== null;

function installLayout() {
	patch(HTMLElement.prototype, "clientWidth", {
		get(this: HTMLElement) {
			return isHost(this) ? hostWidth : 0;
		},
	});
	patch(HTMLElement.prototype, "clientHeight", {
		get(this: HTMLElement) {
			return isHost(this) ? HOST_H : 0;
		},
	});
	patch(HTMLElement.prototype, "offsetLeft", {
		get(this: HTMLElement) {
			return this.dataset.card === "1" ? RIGHT_CARD_LEFT : 86;
		},
	});
	patch(HTMLElement.prototype, "offsetWidth", {
		get(this: HTMLElement) {
			return this.hasAttribute("data-card") ? CARD_W : 0;
		},
	});
	// jsdom ships no geometry for SVG paths.
	patch(SVGElement.prototype, "getTotalLength", { value: () => 400 });
	patch(SVGElement.prototype, "getPointAtLength", {
		value: (l: number) => ({ x: 573, y: l }),
	});
	/* Registers on observe(), not on construction, so a component that builds
	   an observer but never attaches it to the host still fails the test. */
	patch(globalThis, "ResizeObserver", {
		value: class {
			cb: () => void;
			constructor(cb: () => void) {
				this.cb = cb;
			}
			observe() {
				fireResize.push(this.cb);
			}
			unobserve() {}
			disconnect() {
				fireResize = fireResize.filter((f) => f !== this.cb);
			}
		},
	});
	// Run scheduled work inline so a test does not have to wait a frame.
	patch(globalThis, "requestAnimationFrame", {
		value: (cb: (t: number) => void) => {
			cb(0);
			return 1;
		},
	});
	patch(globalThis, "cancelAnimationFrame", { value: () => {} });
}

/* SubpageClose renders a lucide icon, so the first <svg> in the container is
   not the trail. The trail is the direct <svg> child of the lanes host. */
function trailSvg(container: HTMLElement): SVGSVGElement {
	const ol = container.querySelector("ol");
	if (!ol?.parentElement) throw new Error("lanes host not found");
	const svg = ol.parentElement.querySelector(":scope > svg");
	if (!svg) throw new Error("trail svg not found");
	return svg as SVGSVGElement;
}

const countTag = (svg: SVGSVGElement, tag: string) =>
	svg.querySelectorAll(tag).length;

describe("CareerPanel trail", () => {
	afterEach(() => {
		cleanup();
		while (restores.length) restores.pop()?.();
		fireResize = [];
		hostWidth = HOST_W;
	});

	// TC-CPT-01 - with a measurable host, the trail renders dots and one
	// waypoint diamond per timeline entry
	it("draws the trail when the host has a width", () => {
		installLayout();
		const { container } = render(<CareerPanel onClose={vi.fn()} />);
		const svg = trailSvg(container);

		expect(countTag(svg, "circle")).toBeGreaterThan(0);
		expect(countTag(svg, "rect")).toBe(CAREER_TIMELINE.length);
	});

	// TC-CPT-02 - the regression: mounting inside a closed dialog measures zero
	// width, and the trail has to appear once the dialog opens
	it("draws the trail after a zero-width mount reports a width", () => {
		hostWidth = 0;
		installLayout();
		const { container } = render(<CareerPanel onClose={vi.fn()} />);
		const svg = trailSvg(container);
		expect(countTag(svg, "circle")).toBe(0);

		// the dialog opens: the host stops being display:none
		hostWidth = HOST_W;
		expect(fireResize.length).toBeGreaterThan(0);
		for (const fire of fireResize) fire();

		expect(countTag(svg, "circle")).toBeGreaterThan(0);
		expect(countTag(svg, "rect")).toBe(CAREER_TIMELINE.length);
	});

	// TC-CPT-03 - the trail lane sits strictly between the axis and the cards,
	// which is the whole point of the center-spine layout
	it("keeps every waypoint inside the channel between the two card columns", () => {
		installLayout();
		const { container } = render(<CareerPanel onClose={vi.fn()} />);
		const svg = trailSvg(container);

		const leftEdge = 86 + CARD_W; // right edge of the left column
		const xs = Array.from(svg.querySelectorAll("rect")).map((r) =>
			Number(r.getAttribute("x")),
		);
		expect(xs.length).toBe(CAREER_TIMELINE.length);
		for (const x of xs) {
			expect(x).toBeGreaterThanOrEqual(leftEdge);
			expect(x).toBeLessThanOrEqual(RIGHT_CARD_LEFT);
		}
	});
});
