import { describe, expect, it } from "vitest";
import { STORIES, STORY_BY_SLUG } from "../stories";

describe("stories - early-days eras", () => {
	// TC-SD-01
	it('STORY_BY_SLUG["early-days"] has exactly 5 eras', () => {
		expect(STORY_BY_SLUG["early-days"].eras.length).toBe(5);
	});

	// TC-SD-02
	it("orders era ages 12, 16, 18, 19, 20", () => {
		expect(STORY_BY_SLUG["early-days"].eras.map((e) => e.age)).toEqual([
			"12",
			"16",
			"18",
			"19",
			"20",
		]);
	});

	// TC-SD-03
	it("only the last era carries an ageSuffix (20s)", () => {
		expect(STORY_BY_SLUG["early-days"].eras.map((e) => e.ageSuffix)).toEqual([
			"",
			"",
			"",
			"",
			"s",
		]);
	});

	// TC-SD-04
	it("renders the verbatim era captions", () => {
		expect(STORY_BY_SLUG["early-days"].eras.map((e) => e.caption)).toEqual([
			"QBasic · Turbo Pascal · Delphi",
			"SELFHTML · floppies · CSS",
			"PC-room keys · CS · StarCraft · FastTracker",
			"56k · the whole world",
			"IRC · ICQ · LAN parties",
		]);
	});

	// TC-SD-05
	it("has beat counts [1, 2, 2, 1, 1]", () => {
		expect(STORY_BY_SLUG["early-days"].eras.map((e) => e.beats.length)).toEqual(
			[1, 2, 2, 1, 1],
		);
	});

	// TC-SD-06
	it("gives every era exactly the {age, ageSuffix, caption, beats} shape", () => {
		for (const era of STORY_BY_SLUG["early-days"].eras) {
			expect(new Set(Object.keys(era))).toEqual(
				new Set(["age", "ageSuffix", "caption", "beats"]),
			);
		}
	});

	// TC-SD-07
	it("never uses an em dash or en dash in any caption or beat", () => {
		for (const story of STORIES) {
			for (const era of story.eras ?? []) {
				expect(era.caption).not.toMatch(/[–—]/);
				for (const beat of era.beats) {
					expect(beat).not.toMatch(/[–—]/);
				}
			}
		}
	});

	// TC-SD-08
	it("does not false-positive on the ASCII hyphen-minus in real beats", () => {
		const eras = STORY_BY_SLUG["early-days"].eras;
		const dashRegex = /[–—]/;

		// The spaced " - " aside appears across several eras as ASCII hyphen-minus.
		const era0Beat0 = eras[0]!.beats[0]!;
		expect(era0Beat0).toContain(" - ");
		expect(era0Beat0).not.toMatch(dashRegex);

		const era1Beat0 = eras[1]!.beats[0]!;
		expect(era1Beat0).toContain(" - ");
		expect(era1Beat0).not.toMatch(dashRegex);

		const era2Beats = eras[2]!.beats;
		expect(era2Beats[0]).toContain(" - ");
		expect(era2Beats[0]).not.toMatch(dashRegex);
		expect(era2Beats[1]).toContain(" - ");
		expect(era2Beats[1]).not.toMatch(dashRegex);

		// "LAN parties" is now a plain space, and the last beat keeps a " - " aside.
		const era4Beat0 = eras[4]!.beats[0]!;
		expect(era4Beat0).toContain("LAN parties");
		expect(era4Beat0).toContain(" - ");
		expect(era4Beat0).not.toMatch(dashRegex);
	});
});
