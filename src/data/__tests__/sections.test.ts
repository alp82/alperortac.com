import { describe, expect, it } from "vitest";
import { TOPIC_CONTENTS } from "../../components/_layout/topics/registry";
import { MINIMAP_BOUNDARIES, PANEL_SIDES, SECTION_IDS } from "../sections";
import { PANEL_KEY_TO_TOPIC_ID, TOPICS } from "../topics";

describe("sections topology", () => {
	it("MINIMAP_BOUNDARIES match SECTION_IDS for {socials, projects, craft, contact}", () => {
		expect(MINIMAP_BOUNDARIES.map((b) => b.id)).toEqual([
			SECTION_IDS.findMe,
			SECTION_IDS.projects,
			SECTION_IDS.craft,
			SECTION_IDS.contact,
		]);
	});

	// Pin: ticket #47 inserts the Projects band between Socials and Craft.
	// RED until sections.ts adds SECTION_IDS.projects and the matching
	// MINIMAP_BOUNDARIES entry.
	it('SECTION_IDS.projects and MINIMAP_BOUNDARIES[1].id are "projects"', () => {
		expect(SECTION_IDS.projects).toBe("projects");
		expect(MINIMAP_BOUNDARIES[1].id).toBe("projects");
	});

	// Pin: the find-me section's id value is being renamed to "socials" (the
	// anchor rename). RED until sections.ts's SECTION_IDS.findMe and
	// MINIMAP_BOUNDARIES[0].id both switch to the new string.
	it('SECTION_IDS.findMe and MINIMAP_BOUNDARIES[0].id are "socials"', () => {
		expect(SECTION_IDS.findMe).toBe("socials");
		expect(MINIMAP_BOUNDARIES[0].id).toBe("socials");
	});

	// Regression guard: the rename only touches the ID VALUE, not the JS key -
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

	it("TOPICS preserves the locked 9-topic order", () => {
		expect(TOPICS.map((t) => t.id)).toEqual([
			"career",
			"coding",
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

	// Pin (#22): the movies-tv topic gains a second trigger,
	// { kind: "personal", slug: "movies" }, so a direct /movies load parks the
	// scroll journey at the movies-tv band (same mechanism as the music pin).
	it('PANEL_KEY_TO_TOPIC_ID parks movies at "movies-tv"', () => {
		expect(PANEL_KEY_TO_TOPIC_ID.movies).toBe("movies-tv");
	});

	// TC-11 - SECTION_IDS must not carry a "footer" key after the footer refactor
	it('SECTION_IDS does not carry a "footer" key', () => {
		expect("footer" in SECTION_IDS).toBe(false);
	});

	// Drift guard (ticket #47 follow-up): extends the existing PANEL_SIDES /
	// SUBPAGE_WORDS pattern to the reverse-lookup map so a new PanelKey can't
	// ship half-wired - PANEL_KEY_TO_TOPIC_ID is Partial, invisible to the
	// compiler and to TC-S-03, so this is the missing runtime leg.
	it("PANEL_KEY_TO_TOPIC_ID covers every PANEL_SIDES key (drift guard)", () => {
		const parkMap = PANEL_KEY_TO_TOPIC_ID as unknown as Record<
			string,
			string | undefined
		>;
		for (const key of Object.keys(PANEL_SIDES)) {
			expect(
				parkMap[key],
				`Missing PANEL_KEY_TO_TOPIC_ID entry for "${key}"`,
			).toBeDefined();
		}
	});

	// Pin: the four band-only projects (curia, claude-statusline,
	// alperortac-com, and alfredo - the eighth, #76) have no Craft topic, so the
	// literal supplement parks them at the Projects band itself. Without an
	// entry, a direct /projects/alfredo load would color the sky from the page
	// top instead of from the band.
	it("curia, claude-statusline, alperortac-com, and alfredo park at SECTION_IDS.projects", () => {
		const parkMap = PANEL_KEY_TO_TOPIC_ID as unknown as Record<
			string,
			string | undefined
		>;
		for (const key of [
			"curia",
			"claude-statusline",
			"alperortac-com",
			"alfredo",
		]) {
			expect(
				parkMap[key],
				`Expected PANEL_KEY_TO_TOPIC_ID["${key}"] to park at SECTION_IDS.projects`,
			).toBe(SECTION_IDS.projects);
		}
	});
});
