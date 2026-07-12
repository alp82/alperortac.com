// @vitest-environment jsdom
import { cleanup, fireEvent, render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { stubMatchMedia } from "../../../../test/stubMatchMedia";
import { useShortsRail } from "../useShortsRail";

function Harness({ cardCount = 3 }: { cardCount?: number } = {}) {
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
					{Array.from({ length: cardCount }, (_, i) => (
						// biome-ignore lint/suspicious/noArrayIndexKey: fixed-count static test fixture, never reordered
						<div key={`card-${i}`} data-testid={`card-${i}`} />
					))}
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

// Minimal getBoundingClientRect stub, mirroring the shape jsdom itself
// returns (all-zero) but with a real `left` - used for both the bar (unrelated
// to this rect-left convention historically) and, once measure() switches the
// card step to a rect-delta read, the two step-defining cards too.
function stubRect(el: HTMLElement, left: number, width = 0) {
	el.getBoundingClientRect = () =>
		({
			left,
			top: 0,
			right: left + width,
			bottom: 20,
			width,
			height: 20,
			x: left,
			y: 0,
			toJSON: () => ({}),
		}) as DOMRect;
}

// jsdom never lays elements out, so measure()'s reads (clientWidth,
// scrollWidth, offsetLeft, offsetWidth) all default to 0. Stub them to a
// realistic 3-card rail (step 300px, room to scroll) so a drag actually
// produces a non-zero, non-clamped offset worth asserting on. When `bar` is
// passed it becomes a 300px bar starting at viewport x 50, so with the
// 300/900 geometry the thumb is 100px wide, its travel (usable) is 200px,
// and at rest it spans [50, 150].
//
// card0/card1 also get a getBoundingClientRect stub (left: 0 / left: 300,
// delta 300) mirroring their offsetLeft values: measure()'s card step reads
// switch from offsetLeft deltas to rect-left deltas (the v2 fractional-step
// fix), and without this stub jsdom's default all-zero rect would zero the
// step and break every test below post-fix.
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
	stubRect(card0, 0, 300);
	stubRect(card1, 300, 300);
	if (bar) {
		Object.defineProperty(bar, "clientWidth", {
			value: 300,
			configurable: true,
		});
		stubRect(bar, 50, 300);
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

// v2 fractional-step fix: measure()'s card-step read switches from integer
// offsetLeft deltas to fractional getBoundingClientRect deltas, mirroring the
// real 768px-viewport 9-card rail where 772px of usable width doesn't divide
// evenly by 3 cards per screen. Geometry: rail clientWidth 768, track
// scrollWidth 2312 (9 cards), maxOffset = 2312 - 768 = 1544. The two cards
// that define the step get BOTH an offsetLeft pair (6, 263 - delta 257,
// integer, what the old code reads) AND a getBoundingClientRect pair
// (6, 6 + 772/3 - delta 257.333..., fractional, what the new code reads).
// 257.333...  * 6 = 1544 exactly, so 6 ArrowRight presses land exactly on
// maxOffset only when the fractional rect delta drives the step; the old
// integer-delta step (257 * 6 = 1542) falls one card-step short and never
// reaches the flush end.
describe("useShortsRail fractional-step flush (v2)", () => {
	afterEach(() => {
		cleanup();
		vi.unstubAllGlobals();
	});

	it("6 ArrowRight presses flush exactly to maxOffset (1544), and a 7th loops back to ~0", () => {
		stubMatchMedia(true); // instant, synchronous jumps
		const { getByTestId } = render(<Harness cardCount={9} />);
		const rail = getByTestId("rail");
		const track = getByTestId("track");
		const card0 = getByTestId("card-0");
		const card1 = getByTestId("card-1");

		Object.defineProperty(rail, "clientWidth", {
			value: 768,
			configurable: true,
		});
		Object.defineProperty(track, "scrollWidth", {
			value: 2312,
			configurable: true,
		});
		// Integer offsetLeft pair (what the pre-fix code reads): delta 257.
		Object.defineProperty(card0, "offsetLeft", {
			value: 6,
			configurable: true,
		});
		Object.defineProperty(card1, "offsetLeft", {
			value: 263,
			configurable: true,
		});
		Object.defineProperty(card0, "offsetWidth", {
			value: 257,
			configurable: true,
		});
		// Fractional rect pair (what the fixed code reads): delta 772/3.
		stubRect(card0, 6);
		stubRect(card1, 6 + 772 / 3);

		fireEvent(window, new Event("resize"));

		for (let i = 0; i < 6; i++) {
			fireEvent.keyDown(rail, { key: "ArrowRight" });
		}
		expect(trackOffsetPx(track)).toBe(1544);

		fireEvent.keyDown(rail, { key: "ArrowRight" });
		expect(trackOffsetPx(track)).toBeCloseTo(0);
	});

	it("3 ArrowRight presses land on the fractional rect-delta step, not the integer offsetLeft step", () => {
		// Same geometry as the flush test above, but pinned mid-rail (index 3,
		// well short of the maxOffset clamp) so the fractional vs. integer step
		// actually produces different numbers: fractional 3*257.333 = 772.0,
		// integer (pre-fix) 3*257 = 771. The flush test's clamped endpoint
		// (1544) passes for either step once it's >= 257.33, so it alone can't
		// catch a regression back to the integer step - this one can.
		stubMatchMedia(true);
		const { getByTestId } = render(<Harness cardCount={9} />);
		const rail = getByTestId("rail");
		const track = getByTestId("track");
		const card0 = getByTestId("card-0");
		const card1 = getByTestId("card-1");

		Object.defineProperty(rail, "clientWidth", {
			value: 768,
			configurable: true,
		});
		Object.defineProperty(track, "scrollWidth", {
			value: 2312,
			configurable: true,
		});
		Object.defineProperty(card0, "offsetLeft", {
			value: 6,
			configurable: true,
		});
		Object.defineProperty(card1, "offsetLeft", {
			value: 263,
			configurable: true,
		});
		Object.defineProperty(card0, "offsetWidth", {
			value: 257,
			configurable: true,
		});
		stubRect(card0, 6);
		stubRect(card1, 6 + 772 / 3);

		fireEvent(window, new Event("resize"));

		for (let i = 0; i < 3; i++) {
			fireEvent.keyDown(rail, { key: "ArrowRight" });
		}
		// 3 * 257.333... = 772.0, comfortably under maxOffset (1544), so the
		// clamp can't hide a regression to the integer step (which would give
		// 771 here).
		expect(trackOffsetPx(track)).toBeCloseTo(772, 1);
	});
});

// measure()'s step read has a fallback branch for a single-card rail (no
// second child to diff a rect/offsetLeft delta against): rawStep falls back
// to `first?.offsetWidth ?? 0`. A lone card also means the rail's content
// never exceeds its own viewport, so maxOffset is 0 and there's nothing to
// scroll to - this exercises both the fallback step read and the resulting
// no-op navigation.
describe("useShortsRail single-card fallback (v2)", () => {
	afterEach(() => cleanup());

	it("a single card falls back to offsetWidth for its step and ArrowRight is a no-op", () => {
		const { getByTestId } = render(<Harness cardCount={1} />);
		const rail = getByTestId("rail");
		const track = getByTestId("track");
		const bar = getByTestId("bar");
		const card0 = getByTestId("card-0");

		// One card exactly filling the rail: no second child for measure() to
		// diff, so it must fall back to offsetWidth; content equals viewport,
		// so maxOffset is 0.
		Object.defineProperty(rail, "clientWidth", {
			value: 300,
			configurable: true,
		});
		Object.defineProperty(track, "scrollWidth", {
			value: 300,
			configurable: true,
		});
		Object.defineProperty(card0, "offsetWidth", {
			value: 300,
			configurable: true,
		});
		fireEvent(window, new Event("resize"));

		expect(trackOffsetPx(track)).toBeCloseTo(0);
		// Content fits exactly, so the scrollbar has nothing to show.
		expect(bar.hidden).toBe(true);

		fireEvent.keyDown(rail, { key: "ArrowRight" });
		// next() sees atEnd(0, 0) === true and loops back to goTo(0) rather
		// than advancing past the single card - offset stays at 0.
		expect(trackOffsetPx(track)).toBeCloseTo(0);

		fireEvent.keyDown(rail, { key: "ArrowLeft" });
		// prev() likewise wraps a single-card index back to itself.
		expect(trackOffsetPx(track)).toBeCloseTo(0);
	});
});
