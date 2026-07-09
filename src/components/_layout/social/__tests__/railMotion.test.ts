import { describe, expect, it } from "vitest";
import {
	atEnd,
	clampDt,
	clampOffset,
	isSettled,
	nearestIndex,
	offsetForIndex,
	offsetFromBarX,
	projectRelease,
	SHORTS_SPRING,
	type SpringState,
	stepSpring,
	thumbGeometry,
	wrapIndex,
} from "../railMotion";

// Simulate the spring at a fixed 16ms tick until settled (or the cap runs
// out). Returns the final state plus the simulated time it took to settle.
function settle(
	start: SpringState,
	target: number,
	maxMs = 5000,
): { state: SpringState; ms: number } {
	let state = start;
	let ms = 0;
	while (ms < maxMs && !isSettled(state, target)) {
		state = stepSpring(state, target, 0.016);
		ms += 16;
	}
	return { state, ms };
}

describe("stepSpring", () => {
	it("converges to within 0.5px of the target in under 1.5s of simulated time", () => {
		const { state, ms } = settle({ pos: 0, vel: 0 }, 212);
		expect(Math.abs(state.pos - 212)).toBeLessThan(0.5);
		expect(ms).toBeLessThan(1500);
	});

	it("the locked spec never overshoots the target by more than the settle epsilon", () => {
		let state: SpringState = { pos: 0, vel: 0 };
		const target = 212;
		for (let ms = 0; ms < 5000; ms += 16) {
			state = stepSpring(state, target, 0.016);
			expect(state.pos).toBeLessThan(target + 0.3);
		}
	});

	it("converges from a negative direction (moving back to 0)", () => {
		const { state } = settle({ pos: 424, vel: 0 }, 0);
		expect(Math.abs(state.pos)).toBeLessThan(0.5);
	});

	it("a seeded release velocity still settles on the target", () => {
		const { state } = settle({ pos: 100, vel: 800 }, 212);
		expect(Math.abs(state.pos - 212)).toBeLessThan(0.5);
	});

	it("uses the locked constants by default", () => {
		expect(SHORTS_SPRING).toEqual({ stiffness: 245, damping: 37, mass: 1 });
	});
});

describe("clampDt", () => {
	it("caps at 0.032", () => {
		expect(clampDt(0.1)).toBe(0.032);
	});

	it("floors at 0", () => {
		expect(clampDt(-0.5)).toBe(0);
	});

	it("passes through in-range values", () => {
		expect(clampDt(0.016)).toBe(0.016);
	});
});

describe("isSettled", () => {
	it("true when both position error and velocity are inside the epsilons", () => {
		expect(isSettled({ pos: 100.2, vel: 4 }, 100)).toBe(true);
	});

	it("false when position error is at or above 0.3", () => {
		expect(isSettled({ pos: 0.3, vel: 0 }, 0)).toBe(false);
	});

	it("false when velocity is at or above 5", () => {
		expect(isSettled({ pos: 100, vel: 5 }, 100)).toBe(false);
	});
});

describe("clampOffset", () => {
	it("passes through values inside range", () => {
		expect(clampOffset(500, 1000)).toBe(500);
	});

	it("clamps below at 0", () => {
		expect(clampOffset(-50, 1000)).toBe(0);
	});

	it("clamps above at maxOffset", () => {
		expect(clampOffset(1500, 1000)).toBe(1000);
	});
});

describe("wrapIndex", () => {
	it("wraps a negative index to the end", () => {
		expect(wrapIndex(-1, 8)).toBe(7);
	});

	it("wraps an over-count index to the start", () => {
		expect(wrapIndex(8, 8)).toBe(0);
		expect(wrapIndex(9, 8)).toBe(1);
	});

	it("returns in-range indices unchanged", () => {
		expect(wrapIndex(3, 8)).toBe(3);
	});

	it("returns 0 for zero or negative count", () => {
		expect(wrapIndex(5, 0)).toBe(0);
		expect(wrapIndex(5, -2)).toBe(0);
	});
});

describe("offsetForIndex", () => {
	it("multiplies index by step", () => {
		expect(offsetForIndex(3, 212, 2000)).toBe(636);
	});

	it("clamps to maxOffset", () => {
		expect(offsetForIndex(7, 212, 1000)).toBe(1000);
	});

	it("clamps below at 0", () => {
		expect(offsetForIndex(-2, 212, 1000)).toBe(0);
	});

	it("guards zero and non-finite step (jsdom pre-layout)", () => {
		expect(offsetForIndex(3, 0, 1000)).toBe(0);
		expect(offsetForIndex(3, Number.NaN, 1000)).toBe(0);
	});
});

describe("nearestIndex", () => {
	it("rounds to the nearest step multiple", () => {
		expect(nearestIndex(300, 212, 8)).toBe(1);
		expect(nearestIndex(330, 212, 8)).toBe(2);
	});

	it("clamps to [0, count - 1]", () => {
		expect(nearestIndex(-50, 212, 8)).toBe(0);
		expect(nearestIndex(9999, 212, 8)).toBe(7);
	});

	it("returns 0 for zero or negative step", () => {
		expect(nearestIndex(300, 0, 8)).toBe(0);
		expect(nearestIndex(300, -5, 8)).toBe(0);
	});
});

describe("atEnd", () => {
	it("true at maxOffset", () => {
		expect(atEnd(1000, 1000)).toBe(true);
	});

	it("true within the 1px hairline of maxOffset", () => {
		expect(atEnd(999, 1000)).toBe(true);
	});

	it("false just under the hairline", () => {
		expect(atEnd(998.9, 1000)).toBe(false);
	});
});

describe("projectRelease", () => {
	it("projects forward with positive velocity", () => {
		expect(projectRelease(100, 500, 0.12)).toBe(160);
	});

	it("projects backward with negative velocity", () => {
		expect(projectRelease(100, -500, 0.12)).toBe(40);
	});

	it("returns the offset unchanged at zero velocity", () => {
		expect(projectRelease(100, 0, 0.12)).toBe(100);
	});
});

describe("offsetFromBarX", () => {
	// Shared fixture matching the hook tests: bar spans [50, 350], thumb is
	// 100px wide, so the thumb's travel range (usable) is 200px over a 600px
	// maxOffset. grabX 50 is a center grab.
	const barLeft = 50;
	const barW = 300;
	const thumbW = 100;
	const maxOffset = 600;

	it("center grab at the left endpoint yields 0", () => {
		expect(
			offsetFromBarX(
				barLeft + thumbW / 2,
				barLeft,
				barW,
				thumbW,
				50,
				maxOffset,
			),
		).toBe(0);
	});

	it("center grab at the right endpoint yields maxOffset", () => {
		expect(
			offsetFromBarX(
				barLeft + barW - thumbW / 2,
				barLeft,
				barW,
				thumbW,
				50,
				maxOffset,
			),
		).toBe(maxOffset);
	});

	it("center grab at the bar midpoint yields maxOffset / 2", () => {
		expect(
			offsetFromBarX(barLeft + barW / 2, barLeft, barW, thumbW, 50, maxOffset),
		).toBe(maxOffset / 2);
	});

	it("clamps past both ends", () => {
		expect(offsetFromBarX(-9999, barLeft, barW, thumbW, 50, maxOffset)).toBe(0);
		expect(offsetFromBarX(9999, barLeft, barW, thumbW, 50, maxOffset)).toBe(
			maxOffset,
		);
	});

	it("honors where on the thumb the grab landed", () => {
		// Grabbing the thumb's left edge (grabX 0) at pointerX 150 puts the
		// thumb's left edge at bar-x 100, halfway through its 200px travel.
		expect(offsetFromBarX(150, barLeft, barW, thumbW, 0, maxOffset)).toBe(300);
		// The same pointerX with a full-width grab (grabX 100) puts the left
		// edge at bar-x 0: offset 0.
		expect(offsetFromBarX(150, barLeft, barW, thumbW, 100, maxOffset)).toBe(0);
	});

	it("degenerate geometry pins to 0 and never yields NaN", () => {
		expect(offsetFromBarX(200, barLeft, barW, barW, 50, maxOffset)).toBe(0);
		expect(offsetFromBarX(200, barLeft, barW, barW + 50, 50, maxOffset)).toBe(
			0,
		);
		expect(offsetFromBarX(200, barLeft, barW, thumbW, 50, 0)).toBe(0);
		expect(offsetFromBarX(200, barLeft, barW, thumbW, 50, -10)).toBe(0);
		expect(offsetFromBarX(200, barLeft, 0, 0, 0, maxOffset)).toBe(0);
		expect(Number.isNaN(offsetFromBarX(200, barLeft, 0, 0, 0, maxOffset))).toBe(
			false,
		);
	});

	it("round-trips thumbGeometry's placement for sample offsets", () => {
		const viewportW = 300;
		const contentW = 900;
		for (const offset of [0, 90, 300, 450, 600]) {
			const { widthFrac, posFrac } = thumbGeometry(viewportW, contentW, offset);
			const thumbPx = widthFrac * barW;
			for (const grabX of [0, thumbPx / 2, thumbPx]) {
				const pointerX = barLeft + posFrac * barW + grabX;
				expect(
					offsetFromBarX(pointerX, barLeft, barW, thumbPx, grabX, maxOffset),
				).toBeCloseTo(offset);
			}
		}
	});
});

describe("thumbGeometry", () => {
	it("content that fits yields widthFrac 1 (hide) and posFrac 0", () => {
		expect(thumbGeometry(800, 600, 0)).toEqual({ widthFrac: 1, posFrac: 0 });
	});

	it("non-positive content width yields widthFrac 1", () => {
		expect(thumbGeometry(800, 0, 0)).toEqual({ widthFrac: 1, posFrac: 0 });
	});

	it("offset 0 puts the thumb at posFrac 0", () => {
		const { posFrac } = thumbGeometry(400, 1600, 0);
		expect(posFrac).toBe(0);
	});

	it("offset at maxOffset puts the thumb at 1 - widthFrac", () => {
		const { widthFrac, posFrac } = thumbGeometry(400, 1600, 1200);
		expect(widthFrac).toBeCloseTo(0.25);
		expect(posFrac).toBeCloseTo(1 - widthFrac);
	});

	it("posFrac is monotone in offset and clamped past maxOffset", () => {
		const a = thumbGeometry(400, 1600, 200).posFrac;
		const b = thumbGeometry(400, 1600, 600).posFrac;
		const c = thumbGeometry(400, 1600, 1200).posFrac;
		const over = thumbGeometry(400, 1600, 9999).posFrac;
		expect(a).toBeLessThan(b);
		expect(b).toBeLessThan(c);
		expect(over).toBe(c);
	});
});
