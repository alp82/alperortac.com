import { describe, expect, it } from "vitest";
import { HERO_CTA, HERO_SUMMARY } from "../hero";

// ---------------------------------------------------------------------------
// Data-contract tests for hero.ts (static two-line summary model).
// HERO_SUMMARY holds the two static plain-text subtitle lines. This asserts
// SHAPE, not exact contents - the lines are editable content and must not
// require a test edit (or risk being reverted) every time they change.
// The animated typewriter pools (HERO_CURIOUS / HERO_OUTCOME / HERO_TIMING /
// HERO_LEAD) and older models are deleted and guarded below.
// ---------------------------------------------------------------------------
describe("hero data contract", () => {
	it("HERO_SUMMARY is a non-empty list of non-empty strings", () => {
		expect(Array.isArray(HERO_SUMMARY)).toBe(true);
		expect(HERO_SUMMARY.length).toBeGreaterThan(0);
		for (const line of HERO_SUMMARY) {
			expect(typeof line).toBe("string");
			expect(line.trim().length).toBeGreaterThan(0);
		}
	});

	it("HERO_CTA is a non-empty string", () => {
		expect(typeof HERO_CTA).toBe("string");
		expect(HERO_CTA.trim().length).toBeGreaterThan(0);
	});

	// Guards for cleanup: the old animated-model symbols must not be exported.
	it("old typewriter symbols are no longer exported", async () => {
		const mod = (await import("../hero")) as Record<string, unknown>;
		for (const key of [
			"HERO_CURIOUS",
			"HERO_OUTCOME",
			"HERO_TIMING",
			"HERO_LEAD",
		])
			expect(mod[key]).toBeUndefined();
	});

	// Guards for the older roll-model pools that must also stay removed.
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
