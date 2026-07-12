import { describe, expect, it } from "vitest";
import {
	type Ceiling,
	type FitTextSpec,
	fitFontSize,
	resolveCeiling,
} from "../fitText";

const SPEC: FitTextSpec = { ceilingPx: 60, fixedPx: 14, allowancePx: 8 };

describe("fitFontSize", () => {
	it("TC1 - fits at ceiling for a wide container and short ghost width", () => {
		// raw scale would be ~237, clamped down to the ceiling.
		expect(fitFontSize(1152, 300, SPEC)).toBe(60);
	});

	it("TC2 - boundary: clamps to ceiling exactly at the boundary, just under it does not clamp", () => {
		expect(fitFontSize(300, 286, SPEC)).toBe(60);
		expect(fitFontSize(286, 286, SPEC)).toBeCloseTo(58.24, 1);
	});

	it("TC3 - proportional overflow (canonical case)", () => {
		expect(fitFontSize(327, 1200, SPEC)).toBeCloseTo(15.4, 1);
	});

	it("TC4 - sub-floor result is NOT clamped up to 24px (one line is sacred: shrink, never wrap)", () => {
		const result = fitFontSize(327, 1200, SPEC);
		expect(result).toBeLessThan(24);
		expect(result).toBeGreaterThanOrEqual(1);
	});

	it("TC5 - extreme narrow container clamps down to the 1px floor and stays finite", () => {
		const result = fitFontSize(20, 5000, SPEC);
		expect(result).toBe(1);
		expect(Number.isFinite(result)).toBe(true);
	});

	it("TC6 - containerW=0 falls back to the ceiling and stays finite", () => {
		const result = fitFontSize(0, 1200, SPEC);
		expect(result).toBe(60);
		expect(Number.isFinite(result)).toBe(true);
	});

	it("TC7 - ghostW=0 falls back to the ceiling", () => {
		expect(fitFontSize(1152, 0, SPEC)).toBe(60);
	});

	it("TC8 - ghostW at or below fixedPx falls back to the ceiling", () => {
		expect(fitFontSize(1152, 14, SPEC)).toBe(60);
		expect(fitFontSize(1152, 10, SPEC)).toBe(60);
	});

	it("TC9 - both containerW and ghostW zero falls back to the ceiling", () => {
		expect(fitFontSize(0, 0, SPEC)).toBe(60);
	});

	it("TC10 - sweep: every combination stays finite and within [1, ceiling]", () => {
		const cases: Array<[number, number]> = [
			[0, 0],
			[0, 1200],
			[1152, 0],
			[327, 1200],
			[20, 5000],
			[1152, 300],
		];
		for (const [containerW, ghostW] of cases) {
			const result = fitFontSize(containerW, ghostW, SPEC);
			expect(Number.isFinite(result)).toBe(true);
			expect(result).toBeGreaterThanOrEqual(1);
			expect(result).toBeLessThanOrEqual(60);
		}
	});
});

const CEILINGS: Ceiling[] = [
	{ minWidth: 1024, px: 60 },
	{ minWidth: 768, px: 48 },
	{ minWidth: 0, px: 30 },
];

describe("resolveCeiling", () => {
	it("TC-RC1 - desktop: above and at the 1024 breakpoint resolves to 60, inclusive lower boundary", () => {
		expect(resolveCeiling(1440, CEILINGS)).toBe(60);
		expect(resolveCeiling(1024, CEILINGS)).toBe(60);
	});

	it("TC-RC2 - just under the desktop breakpoint falls to the tablet tier", () => {
		expect(resolveCeiling(1023, CEILINGS)).toBe(48);
	});

	it("TC-RC3 - tablet: above and at the 768 breakpoint resolves to 48, inclusive lower boundary", () => {
		expect(resolveCeiling(800, CEILINGS)).toBe(48);
		expect(resolveCeiling(768, CEILINGS)).toBe(48);
	});

	it("TC-RC4 - just under the tablet breakpoint falls to the mobile tier", () => {
		expect(resolveCeiling(767, CEILINGS)).toBe(30);
	});

	it("TC-RC5 - mobile: typical width, the 0 boundary, and negative widths all resolve to 30", () => {
		expect(resolveCeiling(375, CEILINGS)).toBe(30);
		expect(resolveCeiling(0, CEILINGS)).toBe(30);
		expect(resolveCeiling(-100, CEILINGS)).toBe(30);
	});

	it("TC-RC6 - empty ceilings list falls back to Infinity, making the outer min a no-op", () => {
		const result = resolveCeiling(500, []);
		expect(result).toBe(Number.POSITIVE_INFINITY);
		expect(Number.isNaN(result)).toBe(false);
	});

	it("TC-RC7 - single-entry list resolves to that entry's px for any width", () => {
		const single: Ceiling[] = [{ minWidth: 0, px: 42 }];
		expect(resolveCeiling(2000, single)).toBe(42);
		expect(resolveCeiling(0, single)).toBe(42);
		expect(resolveCeiling(-50, single)).toBe(42);
	});
});
