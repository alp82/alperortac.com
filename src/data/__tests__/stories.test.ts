import { describe, expect, it } from "vitest";
import { STORIES, STORY_BY_SLUG } from "../stories";

describe("stories - early-days eras", () => {
	// TC-SD-01
	it('STORY_BY_SLUG["early-days"] has exactly 4 eras', () => {
		expect(STORY_BY_SLUG["early-days"].eras.length).toBe(4);
	});

	// TC-SD-02
	it("orders era ages 12, 16, 19, 20", () => {
		expect(STORY_BY_SLUG["early-days"].eras.map((e) => e.age)).toEqual([
			"12",
			"16",
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
			"s",
		]);
	});

	// TC-SD-04
	it("renders the verbatim era captions", () => {
		expect(STORY_BY_SLUG["early-days"].eras.map((e) => e.caption)).toEqual([
			"QBasic · Turbo Pascal · Delphi",
			"SELFHTML · floppies · FastTracker",
			"56k · the whole world",
			"IRC · ICQ · LAN parties",
		]);
	});

	// TC-SD-05
	it("has beat counts [2, 4, 1, 1]", () => {
		expect(STORY_BY_SLUG["early-days"].eras.map((e) => e.beats.length)).toEqual(
			[2, 4, 1, 1],
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

		const era1Beats = eras[1]!.beats;
		expect(era1Beats[0]).toContain(" - ");
		expect(era1Beats[0]).not.toMatch(dashRegex);
		expect(era1Beats[2]).toContain(" - ");
		expect(era1Beats[2]).not.toMatch(dashRegex);
		expect(era1Beats[3]).toContain(" - ");
		expect(era1Beats[3]).not.toMatch(dashRegex);

		const era3Beats = eras[3]!.beats;
		expect(era3Beats[0]).toContain("LAN-parties");
		expect(era3Beats[0]).not.toMatch(dashRegex);
	});
});
