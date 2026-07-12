import { describe, expect, it } from "vitest";
import {
	applyMonotonicClamp,
	boostSat,
	type ClampField,
	DEFAULT_SKY_CURVE,
	rgbToHsl,
	type SkyCurve,
	scrollProgressAt,
	sectionProgressAt,
	skyAt,
} from "../skyCurve";

// Inlined legacy 3-stop sRGB lerp (copied verbatim from
// _layout.tsx PixelBackground.getInterpolatedColor before deletion).
function legacyGetInterpolatedColor(p: number): string {
	const noon = { r: 135, g: 206, b: 235 };
	const dusk = { r: 244, g: 164, b: 96 };
	const night = { r: 20, g: 10, b: 50 };

	let r: number;
	let g: number;
	let b: number;

	if (p < 0.5) {
		const localP = p * 2;
		r = Math.round(noon.r + (dusk.r - noon.r) * localP);
		g = Math.round(noon.g + (dusk.g - noon.g) * localP);
		b = Math.round(noon.b + (dusk.b - noon.b) * localP);
	} else {
		const localP = (p - 0.5) * 2;
		r = Math.round(dusk.r + (night.r - dusk.r) * localP);
		g = Math.round(dusk.g + (night.g - dusk.g) * localP);
		b = Math.round(dusk.b + (night.b - dusk.b) * localP);
	}

	return `rgb(${r}, ${g}, ${b})`;
}

function parseRgb(css: string): { r: number; g: number; b: number } {
	const m = css.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
	if (!m) throw new Error(`Unparseable rgb: ${css}`);
	return { r: Number(m[1]), g: Number(m[2]), b: Number(m[3]) };
}

describe("skyCurve", () => {
	describe("OFF-mode parity with legacy gradient", () => {
		const offCurve: SkyCurve = {
			enabled: false,
			phase1: [0.162, 0.436],
			phase2: [0.466, 0.787],
			boost: 0.8,
		};

		it("matches legacy 3-stop gradient across 21 samples within 1 per channel", () => {
			for (let i = 0; i <= 20; i++) {
				const p = i / 20;
				const expected = parseRgb(legacyGetInterpolatedColor(p));
				const actual = parseRgb(skyAt(p, offCurve));
				expect(
					Math.abs(actual.r - expected.r),
					`r mismatch at p=${p}`,
				).toBeLessThanOrEqual(1);
				expect(
					Math.abs(actual.g - expected.g),
					`g mismatch at p=${p}`,
				).toBeLessThanOrEqual(1);
				expect(
					Math.abs(actual.b - expected.b),
					`b mismatch at p=${p}`,
				).toBeLessThanOrEqual(1);
			}
		});
	});

	describe("Boost saturation behavior", () => {
		it("with boost=0, HSL saturation is unchanged", () => {
			const input = { r: 200, g: 100, b: 50 };
			const original = rgbToHsl(input);
			const boosted = boostSat(input, 0, 1);
			const boostedHsl = rgbToHsl(boosted);
			expect(Math.abs(boostedHsl.s - original.s)).toBeLessThan(0.01);
		});

		it("with boost=0.5 at bell(t)=1, HSL saturation is multiplied by ~1.5", () => {
			// Use a moderately saturated color so 1.5x stays well under clamp.
			const input = { r: 180, g: 130, b: 90 };
			const original = rgbToHsl(input);
			const expected = original.s * 1.5;
			const boosted = boostSat(input, 0.5, 1);
			const boostedHsl = rgbToHsl(boosted);
			expect(Math.abs(boostedHsl.s - expected)).toBeLessThan(0.01);
		});
	});

	describe("Saturation clamp", () => {
		it("with boost=1.5 on a highly saturated input, output saturation is clamped to 1", () => {
			// Pure red is fully saturated; multiplying by (1 + 1.5) clamps to 1.
			const input = { r: 240, g: 30, b: 30 };
			const boosted = boostSat(input, 1.5, 1);
			const boostedHsl = rgbToHsl(boosted);
			expect(boostedHsl.s).toBe(1);
		});
	});

	describe("Anchor holds", () => {
		it("returns NOON at p=0", () => {
			expect(skyAt(0, DEFAULT_SKY_CURVE)).toBe("rgb(135, 206, 235)");
		});

		it("returns DUSK between phases at p=0.45", () => {
			// 0.45 is between phase1.end (0.436) and phase2.start (0.466)
			expect(skyAt(0.45, DEFAULT_SKY_CURVE)).toBe("rgb(244, 164, 96)");
		});

		it("returns NIGHT at p=1", () => {
			expect(skyAt(1, DEFAULT_SKY_CURVE)).toBe("rgb(20, 10, 50)");
		});
	});

	describe("applyMonotonicClamp truth table", () => {
		const base: SkyCurve = {
			enabled: true,
			phase1: [0.2, 0.4],
			phase2: [0.6, 0.8],
			boost: 0.5,
		};
		const fields: ClampField[] = ["p1s", "p1e", "p2s", "p2e"];

		// Scenario 1: move within range (no neighbor collision)
		describe("move within range", () => {
			it("p1s: 0.2 -> 0.15 leaves others untouched", () => {
				const out = applyMonotonicClamp("p1s", 0.15, base);
				expect(out.phase1).toEqual([0.15, 0.4]);
				expect(out.phase2).toEqual([0.6, 0.8]);
			});
			it("p1e: 0.4 -> 0.45 leaves others untouched", () => {
				const out = applyMonotonicClamp("p1e", 0.45, base);
				expect(out.phase1).toEqual([0.2, 0.45]);
				expect(out.phase2).toEqual([0.6, 0.8]);
			});
			it("p2s: 0.6 -> 0.55 leaves others untouched", () => {
				const out = applyMonotonicClamp("p2s", 0.55, base);
				expect(out.phase1).toEqual([0.2, 0.4]);
				expect(out.phase2).toEqual([0.55, 0.8]);
			});
			it("p2e: 0.8 -> 0.85 leaves others untouched", () => {
				const out = applyMonotonicClamp("p2e", 0.85, base);
				expect(out.phase1).toEqual([0.2, 0.4]);
				expect(out.phase2).toEqual([0.6, 0.85]);
			});
		});

		// Scenario 2: move past neighbor - push it
		describe("move past neighbor", () => {
			it("p1e: pushed past p2s -> p2s and p2e push forward", () => {
				const out = applyMonotonicClamp("p1e", 0.7, base);
				expect(out.phase1[1]).toBe(0.7);
				expect(out.phase2[0]).toBeCloseTo(0.701, 6);
				expect(out.phase2[1]).toBeCloseTo(0.8, 6);
			});
			it("p2s: pushed before p1e -> p1e (and p1s) push backward", () => {
				const out = applyMonotonicClamp("p2s", 0.3, base);
				expect(out.phase2[0]).toBe(0.3);
				expect(out.phase1[1]).toBeCloseTo(0.299, 6);
				expect(out.phase1[0]).toBeCloseTo(0.2, 6);
			});
			it("p1s: pushed past p1e -> p1e and beyond push forward", () => {
				const out = applyMonotonicClamp("p1s", 0.5, base);
				expect(out.phase1[0]).toBe(0.5);
				expect(out.phase1[1]).toBeCloseTo(0.501, 6);
				expect(out.phase2[0]).toBeCloseTo(0.6, 6);
			});
			it("p2e: pushed before p2s -> p2s (and p1e) push backward", () => {
				const out = applyMonotonicClamp("p2e", 0.1, base);
				expect(out.phase2[1]).toBe(0.1);
				expect(out.phase2[0]).toBeCloseTo(0.099, 6);
				expect(out.phase1[1]).toBeCloseTo(0.098, 6);
				expect(out.phase1[0]).toBeCloseTo(0.097, 6);
			});
		});

		// Scenario 3: clamp to [0,1]
		describe("clamp to [0, 1]", () => {
			it("p1s: below 0 clamps to 0", () => {
				const out = applyMonotonicClamp("p1s", -0.5, base);
				expect(out.phase1[0]).toBe(0);
			});
			it("p1e: below 0 forces backward clamp on p1s", () => {
				const out = applyMonotonicClamp("p1e", -0.5, base);
				expect(out.phase1[1]).toBe(0);
				expect(out.phase1[0]).toBe(0);
			});
			it("p2s: above 1 clamps to 1, forward neighbors get clamped at 1", () => {
				const out = applyMonotonicClamp("p2s", 1.5, base);
				expect(out.phase2[0]).toBe(1);
				expect(out.phase2[1]).toBe(1);
			});
			it("p2e: above 1 clamps to 1", () => {
				const out = applyMonotonicClamp("p2e", 1.5, base);
				expect(out.phase2[1]).toBe(1);
			});
		});

		// Scenario 4: no-op identity
		describe("no-op identity", () => {
			for (const field of fields) {
				it(`${field}: setting to current value preserves all fields`, () => {
					const arr: [number, number, number, number] = [
						base.phase1[0],
						base.phase1[1],
						base.phase2[0],
						base.phase2[1],
					];
					const idx =
						field === "p1s" ? 0 : field === "p1e" ? 1 : field === "p2s" ? 2 : 3;
					const out = applyMonotonicClamp(field, arr[idx], base);
					expect(out.phase1).toEqual(base.phase1);
					expect(out.phase2).toEqual(base.phase2);
					expect(out.boost).toBe(base.boost);
					expect(out.enabled).toBe(base.enabled);
				});
			}
		});
	});

	// Migrated from SectionTitle.render.test.tsx TC-24..31: sectionProgressAt
	// now lives in skyCurve.ts (the whole-section day/night freeze reads it
	// from here instead of a SectionTitle-local copy), same inputs/expected.
	describe("sectionProgressAt (pure)", () => {
		// TC-24
		it("returns 0.55 at the boundary", () => {
			expect(sectionProgressAt(950, 1800, 800)).toBeCloseTo(0.55, 5);
		});

		// TC-25
		it("returns ~0.549 just under the boundary", () => {
			expect(sectionProgressAt(949, 1800, 800)).toBeCloseTo(0.549, 3);
		});

		// TC-26
		it("clamps to 0 for a far-negative centerY", () => {
			expect(sectionProgressAt(-1000, 1800, 800)).toBe(0);
		});

		// TC-27
		it("clamps to 1 for a far-past centerY", () => {
			expect(sectionProgressAt(5000, 1800, 800)).toBe(1);
		});

		// TC-28
		it("ignores centerY when total <= 0 (short page)", () => {
			expect(sectionProgressAt(0, 500, 800)).toBe(0);
			expect(sectionProgressAt(10000, 500, 800)).toBe(0);
		});

		// TC-29
		it("returns 0 when total === 0", () => {
			expect(sectionProgressAt(123, 800, 800)).toBe(0);
		});

		// TC-30
		it("computes an arbitrary mid-scroll progress", () => {
			expect(sectionProgressAt(6000, 10000, 800)).toBeCloseTo(0.6087, 3);
		});

		// TC-31
		it("computes an arbitrary early-scroll progress", () => {
			expect(sectionProgressAt(500, 10000, 800)).toBeCloseTo(0.0109, 3);
		});
	});

	describe("scrollProgressAt (pure)", () => {
		it("returns 0 at scrollY 0", () => {
			expect(scrollProgressAt(0, 1800, 800)).toBe(0);
		});

		it("clamps to 0 for a negative scrollY", () => {
			expect(scrollProgressAt(-500, 1800, 800)).toBe(0);
		});

		it("computes an arbitrary mid-scroll progress", () => {
			expect(scrollProgressAt(500, 1800, 800)).toBeCloseTo(0.5, 5);
		});

		it("clamps to 1 for a scrollY past the max", () => {
			expect(scrollProgressAt(2000, 1800, 800)).toBe(1);
		});

		it("ignores scrollY when total <= 0 (short page)", () => {
			expect(scrollProgressAt(0, 500, 800)).toBe(0);
			expect(scrollProgressAt(10000, 500, 800)).toBe(0);
		});
	});

	describe("sectionProgressAt delegates to scrollProgressAt(centerY - innerHeight/2, ...)", () => {
		it.each([
			[950, 1800, 800],
			[949, 1800, 800],
			[6000, 10000, 800],
			[500, 10000, 800],
			[-1000, 1800, 800],
			[5000, 1800, 800],
		])("sectionProgressAt(%i, %i, %i) === scrollProgressAt(centerY - innerHeight/2, ...)", (centerY, scrollHeight, innerHeight) => {
			expect(sectionProgressAt(centerY, scrollHeight, innerHeight)).toBe(
				scrollProgressAt(centerY - innerHeight / 2, scrollHeight, innerHeight),
			);
		});
	});
});
