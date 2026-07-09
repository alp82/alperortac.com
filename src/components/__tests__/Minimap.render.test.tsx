// @vitest-environment jsdom
import { cleanup, fireEvent, render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { DEFAULT_CELESTIAL } from "../../data/celestial";
import { Minimap } from "../Minimap";

// Render tests for the minimap's drag-cursor affordance: grab at rest,
// grabbing while a scrub is held. jsdom implements neither pointer capture
// nor window.scrollTo, so both are stubbed - the drag/scroll mapping itself
// is out of scope here.

afterEach(() => {
	cleanup();
	vi.restoreAllMocks();
});

function renderMinimap(): HTMLElement {
	vi.spyOn(window, "scrollTo").mockImplementation(() => {});
	const { container } = render(
		<Minimap scrollProgress={0} celestial={DEFAULT_CELESTIAL} />,
	);
	const el = container.firstElementChild as HTMLElement;
	el.setPointerCapture = vi.fn();
	el.hasPointerCapture = vi.fn().mockReturnValue(false);
	el.releasePointerCapture = vi.fn();
	return el;
}

describe("Minimap cursor affordance", () => {
	it("shows the grab cursor at rest and no cursor-pointer", () => {
		const el = renderMinimap();
		expect(el.classList.contains("cursor-grab")).toBe(true);
		expect(el.classList.contains("cursor-grabbing")).toBe(false);
		expect(el.classList.contains("cursor-pointer")).toBe(false);
	});

	it("swaps to the grabbing cursor while the pointer is held", () => {
		const el = renderMinimap();
		fireEvent.pointerDown(el, { pointerId: 1, clientY: 10 });
		expect(el.classList.contains("cursor-grabbing")).toBe(true);
		expect(el.classList.contains("cursor-grab")).toBe(false);
	});

	it("returns to the grab cursor on release", () => {
		const el = renderMinimap();
		fireEvent.pointerDown(el, { pointerId: 1, clientY: 10 });
		fireEvent.pointerUp(el, { pointerId: 1 });
		expect(el.classList.contains("cursor-grab")).toBe(true);
		expect(el.classList.contains("cursor-grabbing")).toBe(false);
	});
});
