import { describe, expect, it } from "vitest";
import {
	HERO_CTA,
	HERO_CURIOUS,
	HERO_LEAD,
	HERO_OUTCOME,
	HERO_TIMING,
} from "../hero";

// ---------------------------------------------------------------------------
// Data-contract tests for hero.ts (two-row typewriter model).
// HERO_CURIOUS and HERO_OUTCOME are the two typewriter pools (line 1 + line 2).
// These assert SHAPE, not exact contents — the pool words are editable content
// and must not require a test edit (or risk being reverted) every time they change.
// HERO_FUEL / HERO_MAKE / HERO_ENEMY / HERO_PHRASES / HERO_ROLES are deleted.
// ---------------------------------------------------------------------------
describe("hero data contract", () => {
	function expectWordPool(pool: readonly string[]) {
		expect(Array.isArray(pool)).toBe(true);
		expect(pool.length).toBeGreaterThan(0);
		for (const word of pool) {
			expect(typeof word).toBe("string");
			expect(word.trim().length).toBeGreaterThan(0);
		}
		// No duplicates — a repeated word would stall visibly mid-cycle.
		expect(new Set(pool).size).toBe(pool.length);
	}

	it("HERO_CURIOUS is a non-empty pool of unique non-empty strings", () => {
		expectWordPool(HERO_CURIOUS);
	});

	it("HERO_OUTCOME is a non-empty pool of unique non-empty strings", () => {
		expectWordPool(HERO_OUTCOME);
	});

	it("HERO_TIMING exposes type/backspace/dwell/push as positive numbers", () => {
		for (const key of ["type", "backspace", "dwell", "push"] as const) {
			const value = HERO_TIMING[key];
			expect(typeof value).toBe("number");
			expect(Number.isFinite(value)).toBe(true);
			expect(value).toBeGreaterThan(0);
		}
	});

	it("HERO_LEAD and HERO_CTA are non-empty strings", () => {
		expect(typeof HERO_LEAD).toBe("string");
		expect(HERO_LEAD.trim().length).toBeGreaterThan(0);
		expect(typeof HERO_CTA).toBe("string");
		expect(HERO_CTA.trim().length).toBeGreaterThan(0);
	});

	// Guards for cleanup: the old roll-model pools must not be exported.
	it("HERO_FUEL is no longer exported from hero.ts", async () => {
		const mod = await import("../hero");
		expect((mod as Record<string, unknown>).HERO_FUEL).toBeUndefined();
	});

	it("HERO_MAKE is no longer exported from hero.ts", async () => {
		const mod = await import("../hero");
		expect((mod as Record<string, unknown>).HERO_MAKE).toBeUndefined();
	});

	it("HERO_ENEMY is no longer exported from hero.ts", async () => {
		const mod = await import("../hero");
		expect((mod as Record<string, unknown>).HERO_ENEMY).toBeUndefined();
	});

	// Guards for older models that must also stay removed.
	it("HERO_PHRASES is no longer exported from hero.ts", async () => {
		const mod = await import("../hero");
		expect((mod as Record<string, unknown>).HERO_PHRASES).toBeUndefined();
	});

	it("HERO_ROLES is no longer exported from hero.ts", async () => {
		const mod = await import("../hero");
		expect((mod as Record<string, unknown>).HERO_ROLES).toBeUndefined();
	});

	it("HERO_QUALITY is no longer exported from hero.ts", async () => {
		const mod = await import("../hero");
		expect((mod as Record<string, unknown>).HERO_QUALITY).toBeUndefined();
	});
});
