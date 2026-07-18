import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { FAVORITES } from "../favorites";

describe("FAVORITES data (#22)", () => {
	// TC-FAV-01
	it("has exactly 24 entries", () => {
		expect(FAVORITES.length).toBe(24);
	});

	// TC-FAV-02
	it("splits 12 films / 12 series", () => {
		const films = FAVORITES.filter((f) => f.kind === "film");
		const series = FAVORITES.filter((f) => f.kind === "series");
		expect(films.length).toBe(12);
		expect(series.length).toBe(12);
	});

	// TC-FAV-03
	it("has non-empty title, year, and slug string fields on every entry", () => {
		for (const entry of FAVORITES) {
			expect(typeof entry.slug).toBe("string");
			expect(entry.slug.length).toBeGreaterThan(0);
			expect(typeof entry.title).toBe("string");
			expect(entry.title.length).toBeGreaterThan(0);
			expect(typeof entry.year).toBe("string");
			expect(entry.year.length).toBeGreaterThan(0);
		}
	});

	// TC-FAV-04
	it("has every year matching a 4-digit string", () => {
		for (const entry of FAVORITES) {
			expect(entry.year).toMatch(/^\d{4}$/);
		}
	});

	// TC-FAV-05
	it("has every poster path matching /posters/*.jpg", () => {
		for (const entry of FAVORITES) {
			expect(entry.poster).toMatch(/^\/posters\/[^/]+\.jpg$/);
		}
	});

	// TC-FAV-06
	it("has 24 unique slugs", () => {
		const slugs = new Set(FAVORITES.map((entry) => entry.slug));
		expect(slugs.size).toBe(24);
	});

	// TC-FAV-07
	it("has 24 unique poster paths", () => {
		const posters = new Set(FAVORITES.map((entry) => entry.poster));
		expect(posters.size).toBe(24);
	});

	// TC-FAV-08
	it("has every referenced poster file existing on disk under public/posters/", () => {
		const postersDir = path.resolve(process.cwd(), "public/posters");
		for (const entry of FAVORITES) {
			const filename = entry.poster.replace(/^\/posters\//, "");
			const filePath = path.join(postersDir, filename);
			expect(fs.existsSync(filePath), `Missing poster file: ${filePath}`).toBe(
				true,
			);
		}
	});

	// TC-FAV-09
	it("lists all 12 films before all 12 series, in the request.md order", () => {
		const expectedFilmTitles = [
			"The Matrix",
			"Fight Club",
			"Inception",
			"Memento",
			"The Prestige",
			"Pulp Fiction",
			"Snatch",
			"Interstellar",
			"Blade Runner 2049",
			"Oldboy",
			"The Truman Show",
			"Everything Everywhere All at Once",
		];
		const expectedSeriesTitles = [
			"Breaking Bad",
			"Dark",
			"Mr. Robot",
			"Severance",
			"True Detective",
			"Arcane",
			"Better Call Saul",
			"Black Mirror",
			"Game of Thrones",
			"Rick and Morty",
			"The Expanse",
			"Westworld",
		];
		expect(FAVORITES.slice(0, 12).map((f) => f.title)).toEqual(
			expectedFilmTitles,
		);
		expect(FAVORITES.slice(12, 24).map((f) => f.title)).toEqual(
			expectedSeriesTitles,
		);
	});

	// TC-FAV-10
	it("has blurb undefined on all 24 entries (deferred to #33)", () => {
		for (const entry of FAVORITES) {
			expect(entry.blurb).toBeUndefined();
		}
	});

	// TC-FAV-11
	it("has exactly the Favorite shape on each entry (no stray keys)", () => {
		const allowedKeys = new Set([
			"slug",
			"title",
			"year",
			"kind",
			"poster",
			"blurb",
		]);
		for (const entry of FAVORITES) {
			for (const key of Object.keys(entry)) {
				expect(allowedKeys.has(key), `Unexpected key: ${key}`).toBe(true);
			}
		}
	});

	// TC-FAV-12
	it("has every entry's kind as either film or series", () => {
		for (const entry of FAVORITES) {
			expect(["film", "series"]).toContain(entry.kind);
		}
	});
});
