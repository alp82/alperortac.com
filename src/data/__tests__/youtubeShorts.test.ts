import { describe, expect, it } from "vitest";
import { YOUTUBE_SHORTS } from "../youtubeShorts";

// ---------------------------------------------------------------------------
// Data-contract tests for the generated youtubeShorts.ts (build-time output
// of scripts/generate-shorts-data.ts). This asserts SHAPE, not exact
// contents — the entries are machine-written and refresh on every build, so
// pinning literal id/title/view values would break on every regeneration.
// Mirrors src/data/__tests__/hero.test.ts's shape-not-values style.
// ---------------------------------------------------------------------------

describe("youtubeShorts data contract", () => {
	it("YOUTUBE_SHORTS is a non-empty array of at most 10 entries", () => {
		expect(Array.isArray(YOUTUBE_SHORTS)).toBe(true);
		expect(YOUTUBE_SHORTS.length).toBeGreaterThan(0);
		expect(YOUTUBE_SHORTS.length).toBeLessThanOrEqual(10);
	});

	it("every entry has a well-formed 11-char YouTube video id", () => {
		for (const short of YOUTUBE_SHORTS) {
			expect(short.id).toMatch(/^[A-Za-z0-9_-]{11}$/);
		}
	});

	it("every entry has a non-empty title", () => {
		for (const short of YOUTUBE_SHORTS) {
			expect(typeof short.title).toBe("string");
			expect(short.title.trim().length).toBeGreaterThan(0);
		}
	});

	it("every entry has a non-negative integer view count", () => {
		for (const short of YOUTUBE_SHORTS) {
			expect(Number.isInteger(short.views)).toBe(true);
			expect(short.views).toBeGreaterThanOrEqual(0);
		}
	});

	it("every entry has a parseable publishedAt date", () => {
		for (const short of YOUTUBE_SHORTS) {
			expect(Number.isNaN(Date.parse(short.publishedAt))).toBe(false);
		}
	});
});
