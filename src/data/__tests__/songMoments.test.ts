import { describe, expect, it } from "vitest";
import { ALBUMS } from "../personal";
import { SONG_MOMENT_CONFIG, SONG_MOMENTS } from "../songMoments";

describe("SONG_MOMENTS data (music snippet player)", () => {
	// TC-SM-01
	it("filters nothing: every config row survives validation", () => {
		expect(SONG_MOMENTS.length).toBe(SONG_MOMENT_CONFIG.length);
	});

	// TC-SM-02
	it("is an exact artist bijection with ALBUMS (one song per shelf album, no strays)", () => {
		const albumArtists = ALBUMS.map((a) => a.artist);
		const songArtists = SONG_MOMENTS.map((s) => s.artist);

		expect(songArtists.length).toBe(albumArtists.length);
		expect(new Set(songArtists).size).toBe(songArtists.length);

		for (const artist of albumArtists) {
			expect(
				songArtists.includes(artist),
				`No SONG_MOMENTS entry for ALBUMS artist: ${artist}`,
			).toBe(true);
		}
		for (const artist of songArtists) {
			expect(
				albumArtists.includes(artist),
				`SONG_MOMENTS artist has no matching ALBUMS entry: ${artist}`,
			).toBe(true);
		}
	});

	// TC-SM-03
	it("has an 11-char youtube id on every entry", () => {
		for (const song of SONG_MOMENTS) {
			expect(song.youtubeId, `bad youtubeId for ${song.artist}`).toMatch(
				/^[\w-]{11}$/,
			);
		}
	});

	// TC-SM-04
	it("has 0 <= start < end on every entry", () => {
		for (const song of SONG_MOMENTS) {
			expect(
				song.start,
				`start out of range for ${song.artist}`,
			).toBeGreaterThanOrEqual(0);
			expect(
				song.end,
				`end must be after start for ${song.artist}`,
			).toBeGreaterThan(song.start);
		}
	});

	// TC-SM-05
	it("has non-empty title and moment strings on every entry", () => {
		for (const song of SONG_MOMENTS) {
			expect(typeof song.title).toBe("string");
			expect(
				song.title.length,
				`empty title for ${song.artist}`,
			).toBeGreaterThan(0);
			expect(typeof song.moment).toBe("string");
			expect(
				song.moment.length,
				`empty moment for ${song.artist}`,
			).toBeGreaterThan(0);
		}
	});

	// TC-SM-06
	it("never uses an em dash in any string field (project copy rule)", () => {
		for (const song of SONG_MOMENTS) {
			expect(song.artist, `em dash in artist`).not.toContain("—");
			expect(song.title, `em dash in title: ${song.title}`).not.toContain("—");
			expect(song.moment, `em dash in moment: ${song.moment}`).not.toContain(
				"—",
			);
		}
	});
});
