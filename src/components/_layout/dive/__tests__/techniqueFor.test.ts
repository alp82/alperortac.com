import { describe, expect, it } from "vitest";
import { BASE_DIVE_BLUR } from "../diveConstants";
import { blurStrengthFor, techniqueFor } from "../techniqueFor";

describe("techniqueFor adaptive mapping", () => {
	it("true-night + any side -> handheld", () => {
		expect(techniqueFor({ isTrueNight: true, side: "left" })).toBe("handheld");
		expect(techniqueFor({ isTrueNight: true, side: "right" })).toBe("handheld");
		expect(techniqueFor({ isTrueNight: true, side: null })).toBe("handheld");
	});

	it("day + left -> swoop", () => {
		expect(techniqueFor({ isTrueNight: false, side: "left" })).toBe("swoop");
	});

	it("day + right -> bank-hold", () => {
		expect(techniqueFor({ isTrueNight: false, side: "right" })).toBe(
			"bank-hold",
		);
	});

	it("day + null -> glide", () => {
		expect(techniqueFor({ isTrueNight: false, side: null })).toBe("glide");
	});

	it("never auto-selects lens-warp", () => {
		const combos: Array<{
			isTrueNight: boolean;
			side: "left" | "right" | null;
		}> = [
			{ isTrueNight: true, side: "left" },
			{ isTrueNight: true, side: "right" },
			{ isTrueNight: true, side: null },
			{ isTrueNight: false, side: "left" },
			{ isTrueNight: false, side: "right" },
			{ isTrueNight: false, side: null },
		];
		for (const c of combos) {
			expect(techniqueFor(c)).not.toBe("lens-warp");
		}
	});
});

describe("blurStrengthFor", () => {
	it("true-night blur exceeds day blur", () => {
		expect(blurStrengthFor(true, BASE_DIVE_BLUR)).toBeGreaterThan(
			blurStrengthFor(false, BASE_DIVE_BLUR),
		);
	});

	it("day blur is the base unchanged", () => {
		expect(blurStrengthFor(false, BASE_DIVE_BLUR)).toBe(BASE_DIVE_BLUR);
	});
});
