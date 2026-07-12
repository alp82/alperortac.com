import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { ALBUMS } from "../personal";

describe("ALBUMS data", () => {
	// TC-ALB-01
	it("has exactly 17 entries", () => {
		expect(ALBUMS.length).toBe(17);
	});

	// TC-ALB-02
	it("has non-empty artist and album string fields on every entry", () => {
		for (const entry of ALBUMS) {
			expect(typeof entry.artist).toBe("string");
			expect(entry.artist.length).toBeGreaterThan(0);
			expect(typeof entry.album).toBe("string");
			expect(entry.album.length).toBeGreaterThan(0);
		}
	});

	// TC-ALB-03
	it("has every cover path matching /albums/*.jpg", () => {
		for (const entry of ALBUMS) {
			expect(entry.cover).toMatch(/^\/albums\/[^/]+\.jpg$/);
		}
	});

	// TC-ALB-04
	it("has 17 unique cover paths", () => {
		const covers = new Set(ALBUMS.map((entry) => entry.cover));
		expect(covers.size).toBe(17);
	});

	// TC-ALB-05
	it("has every referenced cover file existing on disk under public/albums/", () => {
		const albumsDir = path.resolve(process.cwd(), "public/albums");
		for (const entry of ALBUMS) {
			const filename = entry.cover.replace(/^\/albums\//, "");
			const filePath = path.join(albumsDir, filename);
			expect(fs.existsSync(filePath), `Missing cover file: ${filePath}`).toBe(
				true,
			);
		}
	});

	// TC-ALB-06b — spot-check the two tricky titles explicitly
	it('includes "Split The Atom" as entry #2 and "VOID" as entry #11', () => {
		expect(ALBUMS[1]?.album).toBe("Split The Atom");
		expect(ALBUMS[10]?.album).toBe("VOID");
	});

	// TC-ALB-07
	it("has blurb undefined on all 17 entries", () => {
		for (const entry of ALBUMS) {
			expect(entry.blurb).toBeUndefined();
		}
	});

	// TC-ALB-08
	it("has exactly the Album shape on each entry (no stray keys)", () => {
		const allowedKeys = new Set(["artist", "album", "cover", "blurb"]);
		for (const entry of ALBUMS) {
			for (const key of Object.keys(entry)) {
				expect(allowedKeys.has(key), `Unexpected key: ${key}`).toBe(true);
			}
		}
	});
});
