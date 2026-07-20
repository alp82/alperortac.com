// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
	armSmoothScroll,
	scrollToTop,
	shouldArmSmoothForClick,
} from "../sections";

// The opt-in smooth-scroll model (wayfinder #36): scroll-behavior is auto by
// default so cold entry / hash-on-load / back-forward restoration land
// instantly; only a genuine in-app user gesture arms `html.smooth-scroll`,
// which is dropped once the scroll settles so no later cold scroll inherits it.

const SMOOTH_CLASS = "smooth-scroll";

function makeAnchorClick(
	href: string | null,
	init: MouseEventInit = {},
): MouseEvent {
	const anchor = document.createElement("a");
	if (href !== null) anchor.setAttribute("href", href);
	document.body.appendChild(anchor);
	const e = new MouseEvent("click", {
		bubbles: true,
		cancelable: true,
		button: 0,
		...init,
	});
	// Dispatch on the anchor so e.target is set and closest("a") resolves.
	anchor.dispatchEvent(e);
	return e;
}

describe("armSmoothScroll", () => {
	beforeEach(() => {
		vi.useFakeTimers();
		document.documentElement.classList.remove(SMOOTH_CLASS);
	});
	afterEach(() => {
		vi.clearAllTimers();
		vi.useRealTimers();
		document.documentElement.classList.remove(SMOOTH_CLASS);
	});

	it("arms the smooth-scroll class immediately", () => {
		armSmoothScroll();
		expect(document.documentElement.classList.contains(SMOOTH_CLASS)).toBe(
			true,
		);
	});

	it("disarms when the scroll settles (scrollend)", () => {
		armSmoothScroll();
		window.dispatchEvent(new Event("scrollend"));
		expect(document.documentElement.classList.contains(SMOOTH_CLASS)).toBe(
			false,
		);
	});

	it("disarms via the timeout fallback when scrollend never fires", () => {
		armSmoothScroll();
		expect(document.documentElement.classList.contains(SMOOTH_CLASS)).toBe(
			true,
		);
		vi.advanceTimersByTime(1200);
		expect(document.documentElement.classList.contains(SMOOTH_CLASS)).toBe(
			false,
		);
	});
});

describe("scrollToTop", () => {
	beforeEach(() => {
		vi.useFakeTimers();
		window.scrollTo = vi.fn();
		document.documentElement.classList.remove(SMOOTH_CLASS);
		history.replaceState(null, "", "/#craft");
	});
	afterEach(() => {
		vi.clearAllTimers();
		vi.useRealTimers();
		document.documentElement.classList.remove(SMOOTH_CLASS);
	});

	it("arms smooth, scrolls to the top, and clears the hash", () => {
		scrollToTop();
		expect(document.documentElement.classList.contains(SMOOTH_CLASS)).toBe(
			true,
		);
		expect(window.scrollTo).toHaveBeenCalledWith({ top: 0 });
		expect(window.location.hash).toBe("");
	});
});

describe("shouldArmSmoothForClick", () => {
	afterEach(() => {
		document.body.innerHTML = "";
	});

	it("arms for a plain left-click on a same-page hash anchor", () => {
		expect(shouldArmSmoothForClick(makeAnchorClick("#craft"))).toBe(true);
	});

	it("arms when the click target is a child inside the anchor", () => {
		const anchor = document.createElement("a");
		anchor.setAttribute("href", "#games");
		const child = document.createElement("span");
		anchor.appendChild(child);
		document.body.appendChild(anchor);
		const e = new MouseEvent("click", {
			bubbles: true,
			cancelable: true,
			button: 0,
		});
		child.dispatchEvent(e);
		expect(shouldArmSmoothForClick(e)).toBe(true);
	});

	it.each([
		["metaKey (open in new tab)", { metaKey: true }],
		["ctrlKey", { ctrlKey: true }],
		["shiftKey", { shiftKey: true }],
		["altKey", { altKey: true }],
		["middle/aux button", { button: 1 }],
	])("does not arm for a modified click: %s", (_label, init) => {
		expect(shouldArmSmoothForClick(makeAnchorClick("#craft", init))).toBe(
			false,
		);
	});

	it("does not arm for a route link (non-hash href)", () => {
		expect(shouldArmSmoothForClick(makeAnchorClick("/career"))).toBe(false);
	});

	it("does not arm for a bare '#' or missing href", () => {
		expect(shouldArmSmoothForClick(makeAnchorClick("#"))).toBe(false);
		expect(shouldArmSmoothForClick(makeAnchorClick(null))).toBe(false);
	});

	it("does not arm for a click with no anchor ancestor", () => {
		const div = document.createElement("div");
		document.body.appendChild(div);
		const e = new MouseEvent("click", {
			bubbles: true,
			cancelable: true,
			button: 0,
		});
		div.dispatchEvent(e);
		expect(shouldArmSmoothForClick(e)).toBe(false);
	});

	it("does not arm when the event was already handled (defaultPrevented)", () => {
		const anchor = document.createElement("a");
		anchor.setAttribute("href", "#craft");
		document.body.appendChild(anchor);
		const e = new MouseEvent("click", {
			bubbles: true,
			cancelable: true,
			button: 0,
		});
		e.preventDefault();
		anchor.dispatchEvent(e);
		expect(shouldArmSmoothForClick(e)).toBe(false);
	});
});
