import { describe, expect, it } from "vitest";
import {
	driftOffset,
	LONGEST,
	letterSizePx,
	revealFactor,
	type WatermarkWord,
	WM,
	WORDS,
	wordHeightPx,
	type Zone,
	zoneOpacity,
} from "./narrativeWatermark";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Linearly sweep `n` values from `a` to `b` inclusive. */
function sweep(a: number, b: number, n: number): number[] {
	return Array.from({ length: n }, (_, i) => a + ((b - a) * i) / (n - 1));
}

/** Floating-point tolerance assertion (6 decimal places). */
function approxEq(actual: number, expected: number, places = 6) {
	expect(actual).toBeCloseTo(expected, places);
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

describe("Constants", () => {
	it("TC-C-01: LONGEST equals max word length and is 5", () => {
		expect(LONGEST).toBe(Math.max(...WORDS.map((w) => w.text.length)));
		expect(LONGEST).toBe(5);
	});

	it("TC-C-02: edges — BUILD=left, LIFE=right; two words; every word has an edge", () => {
		const byText = (t: string): WatermarkWord => {
			const found = WORDS.find((w) => w.text === t);
			if (!found) throw new Error(`Word "${t}" not in WORDS`);
			return found;
		};
		expect(byText("BUILD").zone.edge).toBe("left");
		expect(byText("LIFE").zone.edge).toBe("right");
		expect(WORDS.length).toBe(2);
		for (const w of WORDS) {
			expect(["left", "right"]).toContain(w.zone.edge);
		}
	});

	it("TC-C-03: WM constant fields match the locked spec", () => {
		expect(WM.opacity).toBe(0.2);
		expect(WM.padTopVh).toBe(8);
		expect(WM.padBottomVh).toBe(8);
		expect(WM.travelVh).toBe(14);
		expect(WM.insetVw).toBe(4);
		expect(WM.lineHeight).toBe(0.92);
	});

	it("TC-C-04: per-word colors — BUILD dark, LIFE light", () => {
		const byText = (t: string): WatermarkWord => {
			const found = WORDS.find((w) => w.text === t);
			if (!found) throw new Error(`Word "${t}" not in WORDS`);
			return found;
		};
		expect(byText("BUILD").color).toBe("#0f172a");
		expect(byText("LIFE").color).toBe("#fff");
	});
});

// ---------------------------------------------------------------------------
// letterSizePx
// ---------------------------------------------------------------------------

describe("letterSizePx", () => {
	it("TC-L-01: desktop 800×1024 → avail=560, size=560/(5*0.92)", () => {
		approxEq(letterSizePx(800, 1024), 560 / (5 * 0.92));
	});

	it("TC-L-02: floor engages — tiny winH clamps avail to 40", () => {
		// padPx=(8+8)/100*50=8; travelPx=14/100*50=7; avail=50-8-7=35 → clamped to 40
		approxEq(letterSizePx(50, 1024), 40 / (5 * 0.92));
	});

	it("TC-L-03: floor inactive — winH=600, avail=600-96-84=420", () => {
		// padPx=(8+8)/100*600=96; travelPx=14/100*600=84; avail=600-96-84=420
		approxEq(letterSizePx(600, 1024), 420 / (5 * 0.92));
	});

	it("TC-L-04: mobile boundary inclusive (winW=560) applies 0.78 scale", () => {
		approxEq(letterSizePx(800, 560), letterSizePx(800, 1024) * 0.78);
	});

	it("TC-L-05: mobile below boundary (winW=559) applies 0.78 scale", () => {
		approxEq(letterSizePx(800, 559), letterSizePx(800, 1024) * 0.78);
	});

	it("TC-L-06: desktop above boundary (winW=561) does NOT apply 0.78 scale", () => {
		expect(letterSizePx(800, 561)).toBe(letterSizePx(800, 1024));
	});

	it("TC-L-07: travel inequality holds for desktop (winH=800, winW=1024)", () => {
		const padPx = ((8 + 8) / 100) * 800; // 128
		const travelPx = (14 / 100) * 800; // 112
		expect(LONGEST * letterSizePx(800, 1024) * 0.92).toBeLessThanOrEqual(
			800 - padPx - travelPx,
		);
	});

	it("TC-L-08: travel inequality holds for mobile (winH=800, winW=400)", () => {
		const padPx = ((8 + 8) / 100) * 800;
		const travelPx = (14 / 100) * 800;
		expect(LONGEST * letterSizePx(800, 400) * 0.92).toBeLessThanOrEqual(
			800 - padPx - travelPx,
		);
	});

	it("TC-L-09: custom lh=1.0 → size=560/(5*1.0)=112", () => {
		expect(letterSizePx(800, 1024, 1.0)).toBe(560 / (5 * 1.0));
	});
});

// ---------------------------------------------------------------------------
// wordHeightPx
// ---------------------------------------------------------------------------

describe("wordHeightPx", () => {
	it("TC-W-01: proportional — ratio of 5-letter to 3-letter word ≈ 5/3", () => {
		approxEq(wordHeightPx(5, 800, 1024) / wordHeightPx(3, 800, 1024), 5 / 3);
	});

	it("TC-W-02: composition — wordHeightPx(4,800,1024,0.92) === 4*letterSizePx*lh", () => {
		expect(wordHeightPx(4, 800, 1024, 0.92)).toBe(
			4 * letterSizePx(800, 1024, 0.92) * 0.92,
		);
	});

	it("TC-W-03: mobile passthrough — ratio of mobile to desktop ≈ 0.78", () => {
		approxEq(wordHeightPx(4, 800, 400) / wordHeightPx(4, 800, 1024), 0.78);
	});
});

// ---------------------------------------------------------------------------
// zoneOpacity — synthetic zone {c:0.5, w:0.2, edge:"left"}
// ---------------------------------------------------------------------------

describe("zoneOpacity", () => {
	const zone: Zone = { c: 0.5, w: 0.2, edge: "left" };

	it("TC-Z-01: peak at center → maxOpacity (default 0.20)", () => {
		expect(zoneOpacity(0.5, zone)).toBe(0.2);
	});

	it("TC-Z-02: right edge (p=0.7) → 0", () => {
		expect(zoneOpacity(0.7, zone)).toBe(0);
	});

	it("TC-Z-03: left edge (p=0.3) → 0", () => {
		expect(zoneOpacity(0.3, zone)).toBe(0);
	});

	it("TC-Z-04: beyond-right (p=0.9) → 0 (not negative)", () => {
		expect(zoneOpacity(0.9, zone)).toBe(0);
	});

	it("TC-Z-05: beyond-left (p=0.1) → 0 (not negative)", () => {
		expect(zoneOpacity(0.1, zone)).toBe(0);
	});

	it("TC-Z-06: mid-slope right (p=0.6) → 0.10", () => {
		approxEq(zoneOpacity(0.6, zone), 0.1);
	});

	it("TC-Z-07: mid-slope left (p=0.4) → 0.10", () => {
		approxEq(zoneOpacity(0.4, zone), 0.1);
	});

	it("TC-Z-08: symmetry sweep — zoneOpacity(c+d) === zoneOpacity(c-d)", () => {
		const offsets = [0, 0.05, 0.1, 0.15, 0.2, 0.25];
		const c = zone.c;
		for (const d of offsets) {
			approxEq(zoneOpacity(c + d, zone), zoneOpacity(c - d, zone));
		}
	});

	it("TC-Z-09: custom maxOpacity=0.15 → peak=0.15", () => {
		expect(zoneOpacity(0.5, zone, 0.15)).toBe(0.15);
	});

	it("TC-Z-10: degenerate w=0 — at center returns maxOpacity; off-center returns 0, no NaN", () => {
		const degen: Zone = { c: 0.5, w: 0, edge: "left" };
		expect(zoneOpacity(0.5, degen)).toBe(0.2);
		const offCenter = zoneOpacity(0.5001, degen);
		expect(Number.isNaN(offCenter)).toBe(false);
		expect(offCenter).toBe(0);
	});
});

// ---------------------------------------------------------------------------
// driftOffset — compute wordH explicitly before calling
// ---------------------------------------------------------------------------

describe("driftOffset", () => {
	/** Derive yMin, yMax, center for a given config (matches spec formula). */
	function bounds(winH: number, wordH: number) {
		const padTopPx = (WM.padTopVh / 100) * winH;
		const padBottomPx = (WM.padBottomVh / 100) * winH;
		let yMax = winH - wordH - padBottomPx;
		const yMin = padTopPx;
		if (yMax < yMin) yMax = yMin;
		return { yMin, yMax, center: (yMin + yMax) / 2 };
	}

	it("TC-D-01: static when travelPx=0 — result equals center for all p", () => {
		const zone: Zone = { c: 0.5, w: 0.25, edge: "left" };
		const winH = 800;
		const wordH = wordHeightPx(5, winH, 1024);
		const { center } = bounds(winH, wordH);
		for (const p of [0, 0.25, 0.5, 0.75, 1.0]) {
			approxEq(driftOffset(p, zone, winH, wordH, 0), center);
		}
	});

	it("TC-D-02: at entry (p=c-w) → center+half", () => {
		const zone: Zone = { c: 0.5, w: 0.25, edge: "left" };
		const winH = 800;
		const travelPx = 80;
		const wordH = wordHeightPx(4, winH, 1024);
		const { yMin, yMax, center } = bounds(winH, wordH);
		const half = Math.min(travelPx, yMax - yMin) / 2;
		approxEq(
			driftOffset(zone.c - zone.w, zone, winH, wordH, travelPx),
			center + half,
		);
	});

	it("TC-D-03: at exit (p=c+w) → center-half", () => {
		const zone: Zone = { c: 0.5, w: 0.25, edge: "left" };
		const winH = 800;
		const travelPx = 80;
		const wordH = wordHeightPx(4, winH, 1024);
		const { yMin, yMax, center } = bounds(winH, wordH);
		const half = Math.min(travelPx, yMax - yMin) / 2;
		approxEq(
			driftOffset(zone.c + zone.w, zone, winH, wordH, travelPx),
			center - half,
		);
	});

	it("TC-D-04: monotonic non-increasing inside zone — sweep 200 p values", () => {
		const zone: Zone = { c: 0.5, w: 0.25, edge: "left" };
		const winH = 800;
		const travelPx = 80;
		const wordH = wordHeightPx(4, winH, 1024);
		const ps = sweep(zone.c - zone.w, zone.c + zone.w, 200);
		const first = ps[0];
		if (first === undefined) throw new Error("empty sweep");
		let prev = driftOffset(first, zone, winH, wordH, travelPx);
		for (let i = 1; i < ps.length; i++) {
			const p = ps[i];
			if (p === undefined) break;
			const cur = driftOffset(p, zone, winH, wordH, travelPx);
			expect(cur).toBeLessThanOrEqual(prev + 1e-9); // allow floating-point slop
			prev = cur;
		}
	});

	it("TC-D-05: output in [yMin, yMax] for all p∈[0,1] — winH=800 len=4 travelPx=80", () => {
		const zone: Zone = { c: 0.5, w: 0.25, edge: "left" };
		const winH = 800;
		const travelPx = 80;
		const wordH = wordHeightPx(4, winH, 1024);
		const { yMin, yMax } = bounds(winH, wordH);
		for (const p of sweep(0, 1, 200)) {
			const y = driftOffset(p, zone, winH, wordH, travelPx);
			expect(y).toBeGreaterThanOrEqual(yMin - 1e-9);
			expect(y).toBeLessThanOrEqual(yMax + 1e-9);
		}
	});

	it("TC-D-06: output in bounds — short viewport winH=500 len=4 travelPx=40", () => {
		const zone: Zone = { c: 0.5, w: 0.25, edge: "left" };
		const winH = 500;
		const travelPx = 40;
		const wordH = wordHeightPx(4, winH, 1024);
		const { yMin, yMax } = bounds(winH, wordH);
		for (const p of sweep(0, 1, 200)) {
			const y = driftOffset(p, zone, winH, wordH, travelPx);
			expect(y).toBeGreaterThanOrEqual(yMin - 1e-9);
			expect(y).toBeLessThanOrEqual(yMax + 1e-9);
		}
	});

	it("TC-D-07: output in bounds — tall viewport winH=1200 len=5 travelPx=100", () => {
		const zone: Zone = { c: 0.5, w: 0.25, edge: "left" };
		const winH = 1200;
		const travelPx = 100;
		const wordH = wordHeightPx(5, winH, 1024);
		const { yMin, yMax } = bounds(winH, wordH);
		for (const p of sweep(0, 1, 200)) {
			const y = driftOffset(p, zone, winH, wordH, travelPx);
			expect(y).toBeGreaterThanOrEqual(yMin - 1e-9);
			expect(y).toBeLessThanOrEqual(yMax + 1e-9);
		}
	});

	it("TC-D-08: yMax<yMin guard — oversized word → result finite, equals yMin for all p", () => {
		const zone: Zone = { c: 0.5, w: 0.25, edge: "left" };
		const winH = 100;
		const travelPx = 5;
		// wordH massively larger than winH so yMax < yMin before the guard
		const wordH = wordHeightPx(50, winH, 1024);
		const { yMin } = bounds(winH, wordH);
		for (const p of sweep(0, 1, 20)) {
			const y = driftOffset(p, zone, winH, wordH, travelPx);
			expect(Number.isFinite(y)).toBe(true);
			approxEq(y, yMin);
		}
	});

	it("TC-D-09: at zone center (p=c) → result equals (yMin+yMax)/2", () => {
		const zone: Zone = { c: 0.5, w: 0.25, edge: "left" };
		const winH = 800;
		const travelPx = 80;
		const wordH = wordHeightPx(4, winH, 1024);
		const { center } = bounds(winH, wordH);
		approxEq(driftOffset(zone.c, zone, winH, wordH, travelPx), center);
	});

	it("TC-D-10: travelPx cap — huge travelPx, output still in [yMin, yMax]", () => {
		const zone: Zone = { c: 0.5, w: 0.25, edge: "left" };
		const winH = 200;
		const travelPx = 9999;
		const wordH = wordHeightPx(3, winH, 1024);
		const { yMin, yMax, center } = bounds(winH, wordH);
		const half = Math.min(travelPx, yMax - yMin) / 2;
		// top of travel must be ≤ yMax
		expect(center + half).toBeLessThanOrEqual(yMax + 1e-9);
		// bottom of travel must be ≥ yMin
		expect(center - half).toBeGreaterThanOrEqual(yMin - 1e-9);
		// also verify actual outputs stay in bounds
		for (const p of sweep(0, 1, 50)) {
			const y = driftOffset(p, zone, winH, wordH, travelPx);
			expect(y).toBeGreaterThanOrEqual(yMin - 1e-9);
			expect(y).toBeLessThanOrEqual(yMax + 1e-9);
		}
	});

	it("TC-D-11: p below entry (p=-0.5) → pZone clamped 0 → result === center+half", () => {
		const zone: Zone = { c: 0.5, w: 0.25, edge: "left" };
		const winH = 800;
		const travelPx = 80;
		const wordH = wordHeightPx(4, winH, 1024);
		const { yMin, yMax, center } = bounds(winH, wordH);
		const half = Math.min(travelPx, yMax - yMin) / 2;
		approxEq(driftOffset(-0.5, zone, winH, wordH, travelPx), center + half);
	});

	it("TC-D-12: p above exit (p=1.5) → pZone clamped 1 → result === center-half", () => {
		const zone: Zone = { c: 0.5, w: 0.25, edge: "left" };
		const winH = 800;
		const travelPx = 80;
		const wordH = wordHeightPx(4, winH, 1024);
		const { yMin, yMax, center } = bounds(winH, wordH);
		const half = Math.min(travelPx, yMax - yMin) / 2;
		approxEq(driftOffset(1.5, zone, winH, wordH, travelPx), center - half);
	});
});

// ---------------------------------------------------------------------------
// revealFactor
// ---------------------------------------------------------------------------

describe("revealFactor", () => {
	it("TC-R-01: ungated word is always fully revealed", () => {
		expect(revealFactor(0.5, undefined)).toBe(1);
	});

	it("TC-R-02: gated word is hidden exactly at the reveal point", () => {
		expect(revealFactor(1, 1)).toBe(0);
	});

	it("TC-R-03: gated word is hidden (clamped, not negative) below the reveal point", () => {
		expect(revealFactor(0.5, 1)).toBe(0);
	});

	it("TC-R-04: ramp midpoint ≈ 0.5", () => {
		approxEq(revealFactor(1 + WM.revealRampVh / 2, 1), 0.5);
	});

	it("TC-R-05: ramp end is fully revealed", () => {
		expect(revealFactor(1 + WM.revealRampVh, 1)).toBe(1);
	});

	it("TC-R-06: beyond the ramp stays clamped at 1", () => {
		expect(revealFactor(1 + WM.revealRampVh * 3, 1)).toBe(1);
	});

	it("TC-R-07: explicit rampVh arg honored — midpoint ≈ 0.5", () => {
		approxEq(revealFactor(1.25, 1, 0.5), 0.5);
	});
});
