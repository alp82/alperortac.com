import { describe, expect, it } from "vitest";
import { TOPIC_CONTENTS } from "../../components/_layout/topics/registry";
import { MINIMAP_BOUNDARIES, PANEL_SIDES, SECTION_IDS } from "../sections";
import { PANEL_KEY_TO_TOPIC_ID, TOPICS } from "../topics";

describe("sections topology", () => {
	it("MINIMAP_BOUNDARIES match SECTION_IDS for {socials, craft, contact}", () => {
		expect(MINIMAP_BOUNDARIES.map((b) => b.id)).toEqual([
			SECTION_IDS.findMe,
			SECTION_IDS.craft,
			SECTION_IDS.contact,
		]);
	});

	// Pin: the find-me section's id value is being renamed to "socials" (the
	// anchor rename). RED until sections.ts's SECTION_IDS.findMe and
	// MINIMAP_BOUNDARIES[0].id both switch to the new string.
	it('SECTION_IDS.findMe and MINIMAP_BOUNDARIES[0].id are "socials"', () => {
		expect(SECTION_IDS.findMe).toBe("socials");
		expect(MINIMAP_BOUNDARIES[0].id).toBe("socials");
	});

	// Regression guard: the rename only touches the ID VALUE, not the JS key —
	// callers keep writing SECTION_IDS.findMe. This passes already and must
	// keep passing after the rename.
	it('SECTION_IDS keeps the "findMe" key (only the value renames, not the key)', () => {
		const keys = Object.keys(SECTION_IDS);
		expect(keys).toContain("findMe");
		expect(keys).not.toContain("socials");
	});

	it("PANEL_SIDES covers every TOPICS slug (drift guard)", () => {
		const used = new Set<string>();
		for (const t of TOPICS) {
			for (const tr of t.triggers) {
				if (tr.kind !== "career") used.add(tr.slug);
			}
		}
		for (const slug of used) expect(PANEL_SIDES).toHaveProperty(slug);
	});

	it("TOPICS preserves the locked 10-topic order", () => {
		expect(TOPICS.map((t) => t.id)).toEqual([
			"career",
			"coding",
			"tech-stack",
			"ai",
			"finance",
			"family",
			"travel",
			"movies-tv",
			"games",
			"music",
		]);
	});

	it("TOPIC_CONTENTS has an entry for every topic id (registry exhaustiveness)", () => {
		for (const t of TOPICS) {
			expect(
				TOPIC_CONTENTS,
				`Missing TOPIC_CONTENTS entry for topic "${t.id}"`,
			).toHaveProperty(t.id);
		}
	});

	// Pin: the manaschmiede trigger moved Games -> Family, and the derived
	// reverse lookup must repark direct /projects/manaschmiede loads at Family.
	it('PANEL_KEY_TO_TOPIC_ID parks manaschmiede at "family"', () => {
		expect(PANEL_KEY_TO_TOPIC_ID.manaschmiede).toBe("family");
	});

	// TC-11 — SECTION_IDS must not carry a "footer" key after the footer refactor
	it('SECTION_IDS does not carry a "footer" key', () => {
		expect("footer" in SECTION_IDS).toBe(false);
	});
});
