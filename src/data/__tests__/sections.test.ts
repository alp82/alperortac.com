import { describe, expect, it } from "vitest";
import { MINIMAP_BOUNDARIES, PANEL_SIDES, SECTION_IDS } from "../sections";
import { TOPICS } from "../topics";

describe("sections topology", () => {
	it("MINIMAP_BOUNDARIES match SECTION_IDS for {linktree, craft, cta}", () => {
		expect(MINIMAP_BOUNDARIES.map((b) => b.id)).toEqual([
			SECTION_IDS.linktree,
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

	it("TOPICS preserves the locked 8-topic order", () => {
		expect(TOPICS.map((t) => t.id)).toEqual([
			"craft",
			"ai",
			"learning",
			"teaching",
			"movies-tv",
			"family",
			"music",
			"games",
		]);
	});
});
