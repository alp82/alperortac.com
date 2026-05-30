import { describe, expect, it } from "vitest";
import { TOPIC_CONTENTS } from "../../components/_layout/topics/registry";
import { MINIMAP_BOUNDARIES, PANEL_SIDES, SECTION_IDS } from "../sections";
import { TOPICS } from "../topics";

describe("sections topology", () => {
	it("MINIMAP_BOUNDARIES match SECTION_IDS for {find-me, craft, cta}", () => {
		expect(MINIMAP_BOUNDARIES.map((b) => b.id)).toEqual([
			SECTION_IDS.findMe,
			SECTION_IDS.craft,
			SECTION_IDS.cta,
		]);
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
});
