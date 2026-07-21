import { describe, expect, it } from "vitest";
import { NEXT_DESTINATION, VISITED_PLACES } from "../../../../data/travel";
import { loadWorld } from "../worldData";

/*
 * worldData.ts loader contract (#travel-globe-subpage, M1) - loadWorld()
 * lazily imports world-atlas's countries-50m topology, converts it via
 * topojson-client, and classifies "tiny" countries (geoArea < 0.0004
 * steradians) for the stamp-dot treatment. This suite guards the
 * name<->polygon contract (every VISITED_PLACES name + Japan resolves) and
 * the tiny-country threshold (Grenada in, France out), plus memoization.
 */
describe("worldData loader (#travel-globe-subpage)", () => {
	// TC-WD-01
	it("resolves to an object with features, byName, tinyVisited", async () => {
		const world = await loadWorld();
		expect(world).toHaveProperty("features");
		expect(world).toHaveProperty("byName");
		expect(world).toHaveProperty("tinyVisited");
	});

	// TC-WD-02
	it("has a non-empty features array where every element has a string properties.name", async () => {
		const world = await loadWorld();
		expect(world.features.length).toBeGreaterThan(0);
		for (const feature of world.features) {
			expect(typeof feature.properties?.name).toBe("string");
		}
	});

	// TC-WD-03 (table-driven; failure message names the missing country)
	it.each(
		VISITED_PLACES.map((p) => [p.name] as const),
	)("resolves %s via byName", async (name) => {
		const world = await loadWorld();
		expect(world.byName.get(name), `Missing country: ${name}`).toBeDefined();
	});

	// TC-WD-04
	it("resolves Japan via byName", async () => {
		const world = await loadWorld();
		expect(world.byName.get(NEXT_DESTINATION.name)).toBeDefined();
	});

	// TC-WD-05
	it("resolves United Kingdom via byName", async () => {
		const world = await loadWorld();
		expect(world.byName.get("United Kingdom")).toBeDefined();
	});

	// TC-WD-06
	it("resolves Grenada via byName AND includes it in tinyVisited", async () => {
		const world = await loadWorld();
		expect(world.byName.get("Grenada")).toBeDefined();
		const tinyNames = world.tinyVisited.map((f) => f.properties?.name);
		expect(tinyNames).toContain("Grenada");
	});

	// TC-WD-07 (proves the geoArea<0.0004 threshold filters large countries out)
	it("does NOT classify a large visited country (France) as tiny", async () => {
		const world = await loadWorld();
		const tinyNames = world.tinyVisited.map((f) => f.properties?.name);
		expect(tinyNames).not.toContain("France");
	});

	// TC-WD-08 (memoization)
	it("memoizes: two loadWorld() calls return the same Promise reference", () => {
		const first = loadWorld();
		const second = loadWorld();
		expect(first).toBe(second);
	});
});
