// @vitest-environment jsdom
import { cleanup, fireEvent, render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { stubMatchMedia } from "../../../../test/stubMatchMedia";
import { useShortsRail } from "../useShortsRail";

function Harness() {
	const {
		railRef,
		trackRef,
		barRef,
		thumbRef,
		railProps,
		barProps,
		barGrabbing,
	} = useShortsRail();
	return (
		<div>
			<div ref={railRef} data-testid="rail" {...railProps}>
				<div ref={trackRef} data-testid="track">
					<div data-testid="card-0" />
					<div data-testid="card-1" />
					<div data-testid="card-2" />
				</div>
			</div>
			<div
				ref={barRef}
				data-testid="bar"
				{...barProps}
				className={barGrabbing ? "shorts-scrollbar--grabbing" : ""}
			>
				<div ref={thumbRef} data-testid="thumb" />
			</div>
		</div>
	);
}

// jsdom never lays elements out, so measure()'s reads (clientWidth,
// scrollWidth, offsetLeft, offsetWidth) all default to 0. Stub them to a
// realistic 3-card rail (step 300px, room to scroll) so a drag actually
// produces a non-zero, non-clamped offset worth asserting on. When `bar` is
// passed it becomes a 300px bar starting at viewport x 50, so with the
// 300/900 geometry the thumb is 100px wide, its travel (usable) is 200px,
// and at rest it spans [50, 150].
function mockLayout(
	rail: HTMLElement,
	track: HTMLElement,
	card0: HTMLElement,
	card1: HTMLElement,
	bar?: HTMLElement,
) {
	Object.defineProperty(rail, "clientWidth", {
		value: 300,
		configurable: true,
	});
	Object.defineProperty(track, "scrollWidth", {
		value: 900,
		configurable: true,
	});
	Object.defineProperty(card0, "offsetLeft", {
		value: 0,
		configurable: true,
	});
	Object.defineProperty(card1, "offsetLeft", {
		value: 300,
		configurable: true,
	});
	Object.defineProperty(card0, "offsetWidth", {
		value: 300,
		configurable: true,
	});
	if (bar) {
		Object.defineProperty(bar, "clientWidth", {
			value: 300,
			configurable: true,
		});
		bar.getBoundingClientRect = () =>
			({
				left: 50,
				top: 0,
				right: 350,
				bottom: 20,
				width: 300,
				height: 20,
				x: 50,
				y: 0,
				toJSON: () => ({}),
			}) as DOMRect;
	}
}

function trackOffsetPx(track: HTMLElement): number {
	// render() writes `translate3d(${-offset}px,0,0)`; recover offset from it.
	const match = track.style.transform.match(/translate3d\((-?[\d.]+)px/);
	return match?.[1] ? -Number.parseFloat(match[1]) : 0;
}

describe("useShortsRail pointer drag", () => {
	afterEach(() => cleanup());

	it("a rail pointerdown is ignored while a bar scrub session is active", () => {
		const { getByTestId } = render(<Harness />);
		const rail = getByTestId("rail");
		const track = getByTestId("track");
		const bar = getByTestId("bar");
		mockLayout(rail, track, getByTestId("card-0"), getByTestId("card-1"), bar);
		fireEvent(window, new Event("resize"));

		// Start a bar scrub (thumb press) with pointer 1.
		fireEvent.pointerDown(bar, {
			pointerId: 1,
			isPrimary: true,
			button: 0,
			clientX: 100,
		});
		expect(bar.className).toContain("shorts-scrollbar--grabbing");

		// A second pointer presses the rail while the bar session is active; it
		// must not hijack the drag session or clear the bar's grabbing state.
		fireEvent.pointerDown(rail, {
			pointerId: 2,
			isPrimary: true,
			button: 0,
			clientX: 200,
		});
		expect(bar.className).toContain("shorts-scrollbar--grabbing");

		// The bar scrub (still pointer 1) keeps working: move + release settle
		// as normal, unaffected by the rejected rail pointerdown.
		fireEvent.pointerMove(bar, { pointerId: 1, clientX: 130 });
		expect(trackOffsetPx(track)).toBe(90);
		fireEvent.pointerUp(bar, { pointerId: 1 });
		expect(bar.className).not.toContain("shorts-scrollbar--grabbing");
	});

	it("a second pointer's pointermove during an active drag does not move the rail", () => {
		const { getByTestId } = render(<Harness />);
		const rail = getByTestId("rail");
		const track = getByTestId("track");
		const card0 = getByTestId("card-0");
		const card1 = getByTestId("card-1");
		mockLayout(rail, track, card0, card1);
		fireEvent(window, new Event("resize"));

		fireEvent.pointerDown(rail, {
			pointerId: 1,
			isPrimary: true,
			button: 0,
			clientX: 200,
		});
		fireEvent.pointerMove(rail, {
			pointerId: 1,
			isPrimary: true,
			clientX: 150,
		});
		const offsetAfterPrimaryMove = trackOffsetPx(track);
		expect(offsetAfterPrimaryMove).toBeGreaterThan(0);

		// A second, non-primary pointer touches down elsewhere and moves. It
		// must not be able to recompute the rail's offset from its own
		// coordinates while pointer 1's drag is still in progress.
		fireEvent.pointerMove(rail, {
			pointerId: 2,
			isPrimary: false,
			clientX: -400,
		});
		expect(trackOffsetPx(track)).toBe(offsetAfterPrimaryMove);

		// Nor should the second pointer's release end pointer 1's drag: a
		// subsequent move from pointer 1 should still update the offset.
		fireEvent.pointerUp(rail, { pointerId: 2, isPrimary: false });
		fireEvent.pointerMove(rail, {
			pointerId: 1,
			isPrimary: true,
			clientX: 100,
		});
		expect(trackOffsetPx(track)).toBeGreaterThan(offsetAfterPrimaryMove);
	});
});

// Geometry (see mockLayout): maxOffset 600, thumb 100px wide on a 300px bar
// at viewport x 50, usable travel 200px, thumb rest span [50, 150].
describe("useShortsRail scrollbar interaction", () => {
	afterEach(() => {
		cleanup();
		vi.unstubAllGlobals();
	});

	function setup() {
		const utils = render(<Harness />);
		const rail = utils.getByTestId("rail");
		const track = utils.getByTestId("track");
		const bar = utils.getByTestId("bar");
		mockLayout(
			rail,
			track,
			utils.getByTestId("card-0"),
			utils.getByTestId("card-1"),
			bar,
		);
		fireEvent(window, new Event("resize"));
		return { track, bar };
	}

	it("a press on the track glides toward the nearest card rather than instantly warping", () => {
		const { track, bar } = setup();
		const transformBefore = track.style.transform;
		fireEvent.pointerDown(bar, {
			pointerId: 1,
			isPrimary: true,
			button: 0,
			clientX: 250,
		});
		// offsetFromBarX(250, 50, 300, 100, 50, 600) = 450 -> nearestIndex(450,
		// 300, 3) = 2 -> target offset 600. The retarget only schedules a spring
		// frame via requestAnimationFrame; synchronously after the press the
		// track has not been warped anywhere (neither to the click offset 450
		// nor straight to the target 600).
		expect(track.style.transform).toBe(transformBefore);
	});

	it("release without moving after a track press settles on the nearest card under reduced motion", () => {
		stubMatchMedia(true);
		const { track, bar } = setup();
		fireEvent.pointerDown(bar, {
			pointerId: 1,
			isPrimary: true,
			button: 0,
			clientX: 250,
		});
		// Reduced motion collapses the track-press glide into an instant jump
		// straight to the nearest card (600), not the raw clicked offset (450).
		expect(trackOffsetPx(track)).toBe(600);
		fireEvent.pointerUp(bar, { pointerId: 1 });
		// No scrub happened, so release must not re-snap from the (unmoved)
		// spring position - it stays on the same nearest card.
		expect(trackOffsetPx(track)).toBe(600);
	});

	it("a press on the thumb moves nothing; the following move scrubs grab-point-preserving", () => {
		const { track, bar } = setup();
		fireEvent.pointerDown(bar, {
			pointerId: 1,
			isPrimary: true,
			button: 0,
			clientX: 100,
		});
		// toBeCloseTo: recovering 0 from "translate3d(0px,...)" yields -0.
		expect(trackOffsetPx(track)).toBeCloseTo(0);
		fireEvent.pointerMove(bar, { pointerId: 1, clientX: 130 });
		// grabX 50 preserved: (130 - 50 - 50) / 200 * 600
		expect(trackOffsetPx(track)).toBe(90);
	});

	it("a scrub past the right end clamps at maxOffset", () => {
		const { track, bar } = setup();
		fireEvent.pointerDown(bar, {
			pointerId: 1,
			isPrimary: true,
			button: 0,
			clientX: 100,
		});
		fireEvent.pointerMove(bar, { pointerId: 1, clientX: 9999 });
		expect(trackOffsetPx(track)).toBe(600);
	});

	it("release after a real thumb scrub under reduced motion snaps instantly to the nearest card", async () => {
		stubMatchMedia(true);
		const { track, bar } = setup();
		fireEvent.pointerDown(bar, {
			pointerId: 1,
			isPrimary: true,
			button: 0,
			clientX: 100,
		});
		fireEvent.pointerMove(bar, { pointerId: 1, clientX: 220 });
		// grabX 50 preserved: (220 - 50 - 50) / 200 * 600 = 360
		expect(trackOffsetPx(track)).toBe(360);
		// Let the pointer go still past settleRelease()'s 90ms staleness window
		// so the stale move velocity is zeroed and the snap target is
		// deterministic (a real device's finger stops before lifting off too).
		await new Promise((resolve) => setTimeout(resolve, 100));
		fireEvent.pointerUp(bar, { pointerId: 1 });
		// A real scrub happened, so release re-snaps via settleRelease():
		// nearestIndex(360, 300, 3) = round(1.2) = 1 -> offset 300
		expect(trackOffsetPx(track)).toBe(300);
	});

	it("a no-move thumb-press-release mid-glide resumes the loop instead of freezing it", () => {
		const { bar } = setup();
		// Stub rAF/cAF so the scheduled loop frame never actually runs (keeping
		// springRef.current.pos at its initial value for a deterministic thumb
		// hit-test below) while still letting us assert on scheduling calls.
		const rafSpy = vi.fn(() => 1);
		vi.stubGlobal("requestAnimationFrame", rafSpy);
		vi.stubGlobal("cancelAnimationFrame", vi.fn());

		// A track press starts a glide toward the nearest card: goTo()
		// schedules one loop frame via ensureLoop().
		fireEvent.pointerDown(bar, {
			pointerId: 1,
			isPrimary: true,
			button: 0,
			clientX: 250,
		});
		expect(rafSpy).toHaveBeenCalledTimes(1);
		fireEvent.pointerUp(bar, { pointerId: 1 });
		// The no-move release's ensureLoop() call is a no-op: the loop from the
		// track press is still scheduled.
		expect(rafSpy).toHaveBeenCalledTimes(1);

		// A separate thumb press lands mid-glide (the frame above never ran,
		// so the thumb is still at its resting position) and calls stopLoop()
		// on down, halting the scheduled frame without clearing targetRef.
		fireEvent.pointerDown(bar, {
			pointerId: 2,
			isPrimary: true,
			button: 0,
			clientX: 50,
		});
		fireEvent.pointerUp(bar, { pointerId: 2 });

		// Without the fix, releasing with no scrub would leave the loop
		// stopped and the rail frozen short of targetRef. The fix re-arms it.
		expect(rafSpy).toHaveBeenCalledTimes(2);
	});

	it("toggles the grabbing class on press and clears it on release", () => {
		const { bar } = setup();
		expect(bar.className).not.toContain("shorts-scrollbar--grabbing");
		fireEvent.pointerDown(bar, {
			pointerId: 1,
			isPrimary: true,
			button: 0,
			clientX: 100,
		});
		expect(bar.className).toContain("shorts-scrollbar--grabbing");
		fireEvent.pointerUp(bar, { pointerId: 1 });
		expect(bar.className).not.toContain("shorts-scrollbar--grabbing");
	});

	it("a second pointer's move during an active bar scrub is ignored", () => {
		const { track, bar } = setup();
		fireEvent.pointerDown(bar, {
			pointerId: 1,
			isPrimary: true,
			button: 0,
			clientX: 100,
		});
		fireEvent.pointerMove(bar, { pointerId: 2, clientX: 250 });
		expect(trackOffsetPx(track)).toBeCloseTo(0);
	});

	it("a press while the content fits does nothing", () => {
		const { getByTestId } = render(<Harness />);
		const rail = getByTestId("rail");
		const track = getByTestId("track");
		const bar = getByTestId("bar");
		mockLayout(rail, track, getByTestId("card-0"), getByTestId("card-1"), bar);
		Object.defineProperty(track, "scrollWidth", {
			value: 300,
			configurable: true,
		});
		fireEvent(window, new Event("resize"));
		const transformBefore = track.style.transform;
		fireEvent.pointerDown(bar, {
			pointerId: 1,
			isPrimary: true,
			button: 0,
			clientX: 250,
		});
		expect(bar.className).not.toContain("shorts-scrollbar--grabbing");
		expect(track.style.transform).toBe(transformBefore);
	});
});
