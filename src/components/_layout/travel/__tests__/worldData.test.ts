import { geoArea, geoCentroid } from "d3-geo";
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

	// TC-WD-09 (memoization is PER DETAIL - 110m is its own chunk + cache)
	it("keeps separate memo entries for 50m and 110m", () => {
		expect(loadWorld("110m")).toBe(loadWorld("110m"));
		expect(loadWorld("110m")).not.toBe(loadWorld("50m"));
	});

	// TC-WD-10 (the 110m atlas drops Grenada; the synthesized stand-in must
	// be present for every visited name at BOTH detail levels)
	it.each(
		VISITED_PLACES.map((p) => [p.name] as const),
	)("resolves %s via byName at 110m too", async (name) => {
		const world = await loadWorld("110m");
		expect(world.byName.get(name), `Missing country: ${name}`).toBeDefined();
	});

	// TC-WD-11 (the red-globe regression, pinned): the synthesized square's
	// ring must enclose the SQUARE, not its spherical complement. The reverse
	// winding had geoArea ~4pi (the whole planet) and painted every pixel of
	// the fallback globe crimson - and the antipodal centroid is the same bug
	// geoCentroid exposes, so both are asserted.
	it("synthesizes 110m Grenada as a TINY feature centered on St. George's", async () => {
		const world = await loadWorld("110m");
		const grenada = world.byName.get("Grenada");
		expect(grenada).toBeDefined();
		if (!grenada) return;
		expect(geoArea(grenada)).toBeLessThan(0.0004);
		const [lng, lat] = geoCentroid(grenada);
		expect(lng).toBeCloseTo(-61.7486, 1);
		expect(lat).toBeCloseTo(12.0564, 1);
		expect(
			world.tinyVisited.map((f) => f.properties?.name),
		).toContain("Grenada");
	});
});
