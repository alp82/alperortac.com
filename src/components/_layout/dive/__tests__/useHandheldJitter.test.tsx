// @vitest-environment jsdom
import { cleanup, render } from "@testing-library/react";
import { useRef } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useHandheldJitter } from "../useHandheldJitter";

function Harness({ active }: { active: boolean }) {
	const sceneRef = useRef<HTMLDivElement>(null);
	useHandheldJitter({ sceneRef, active });
	return <div ref={sceneRef} data-testid="scene" />;
}

function setReducedMotion(matches: boolean) {
	window.matchMedia = vi.fn().mockImplementation((query: string) => ({
		matches: query === "(prefers-reduced-motion: reduce)" ? matches : false,
		media: query,
		onchange: null,
		addEventListener: vi.fn(),
		removeEventListener: vi.fn(),
		addListener: vi.fn(),
		removeListener: vi.fn(),
		dispatchEvent: vi.fn(),
	})) as unknown as typeof window.matchMedia;
}

describe("useHandheldJitter", () => {
	// rAF stub that mirrors real browser semantics: a cancelled frame never
	// fires. Frames are keyed by id so cancelAnimationFrame removes them from
	// the pending queue rather than only recording the id.
	let pendingFrames: Map<number, FrameRequestCallback>;
	let rafCancelled: number[];
	let nextRafId: number;
	const originalRaf = globalThis.requestAnimationFrame;
	const originalCancel = globalThis.cancelAnimationFrame;
	const originalMatchMedia = window.matchMedia;
	let now: number;

	beforeEach(() => {
		pendingFrames = new Map();
		rafCancelled = [];
		nextRafId = 1;
		now = 1000;
		globalThis.requestAnimationFrame = ((cb: FrameRequestCallback) => {
			const id = nextRafId++;
			pendingFrames.set(id, cb);
			return id;
		}) as typeof requestAnimationFrame;
		globalThis.cancelAnimationFrame = ((id: number) => {
			rafCancelled.push(id);
			pendingFrames.delete(id);
		}) as typeof cancelAnimationFrame;
		vi.spyOn(performance, "now").mockImplementation(() => now);
	});

	afterEach(() => {
		cleanup();
		globalThis.requestAnimationFrame = originalRaf;
		globalThis.cancelAnimationFrame = originalCancel;
		window.matchMedia = originalMatchMedia;
		vi.restoreAllMocks();
	});

	// Drive every pending (non-cancelled) frame at the given time. Each frame's
	// callback may queue the next, which fires on the NEXT advanceFrame call.
	function advanceFrame(atMs: number) {
		now = atMs;
		const pending = [...pendingFrames.values()];
		pendingFrames.clear();
		for (const cb of pending) cb(atMs);
	}

	// Count of frames still queued to run.
	function pendingFrameCount(): number {
		return pendingFrames.size;
	}

	it("active && not reduced -> advancing frames sets non-zero jitter vars", () => {
		setReducedMotion(false);
		const { getByTestId } = render(<Harness active={true} />);
		const scene = getByTestId("scene");

		// pick a time where sin(t*13) and cos(t*11) are clearly non-zero
		advanceFrame(1234.5);

		const x = scene.style.getPropertyValue("--dive-jitter-x");
		const y = scene.style.getPropertyValue("--dive-jitter-y");
		expect(x).not.toBe("");
		expect(x).not.toBe("0px");
		expect(y).not.toBe("0px");
		expect(Number.parseFloat(x)).not.toBe(0);
	});

	it("reduced-motion -> no sustained rAF loop, vars stay 0px", () => {
		// useReducedMotion settles from false->true in an effect, so the first
		// commit may queue one frame before the reduced-motion branch re-runs.
		// Drain any queued frame: the reduced-motion branch must NOT re-queue,
		// and the vars must end at 0px.
		setReducedMotion(true);
		const { getByTestId } = render(<Harness active={true} />);
		const scene = getByTestId("scene");

		// Flush any frame queued by the initial (pre-settle) commit. Once
		// reduced-motion settles, the effect cleanup cancels that frame, so the
		// loop never sustains.
		advanceFrame(1234.5);

		// No sustained loop: the reduced-motion branch never schedules a frame.
		expect(pendingFrameCount()).toBe(0);
		expect(scene.style.getPropertyValue("--dive-jitter-x")).toBe("0px");
		expect(scene.style.getPropertyValue("--dive-jitter-y")).toBe("0px");
	});

	it("rAF cancelled and vars cleared when active flips false", () => {
		setReducedMotion(false);
		const { getByTestId, rerender } = render(<Harness active={true} />);
		const scene = getByTestId("scene");

		advanceFrame(1234.5);
		expect(rafCancelled.length).toBe(0);

		rerender(<Harness active={false} />);

		expect(rafCancelled.length).toBeGreaterThan(0);
		expect(scene.style.getPropertyValue("--dive-jitter-x")).toBe("0px");
		expect(scene.style.getPropertyValue("--dive-jitter-y")).toBe("0px");
	});

	it("rAF cancelled on unmount", () => {
		setReducedMotion(false);
		const { unmount } = render(<Harness active={true} />);

		advanceFrame(1234.5);
		expect(rafCancelled.length).toBe(0);

		unmount();
		expect(rafCancelled.length).toBeGreaterThan(0);
	});
});
