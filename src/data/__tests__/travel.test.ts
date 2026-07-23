import { describe, expect, it } from "vitest";
import {
	NEXT_DESTINATION,
	PLACE_BY_NAME,
	ROUTE_NEXT,
	ROUTE_STOPS,
	TRAVEL_STOPS,
	VISITED_PLACES,
} from "../travel";

/*
 * travel.ts dataset contract (#travel-globe-subpage, M1) - the single source
 * of truth for the visited-country list, Japan (the next destination), and
 * the ticket-stub route strip (dedup: ticket-stub.tsx now imports
 * ROUTE_STOPS/ROUTE_NEXT from here instead of holding its own copy). Mirrors
 * the favorites.test.ts dataset-contract idiom.
 */
describe("travel data (#travel-globe-subpage)", () => {
	// TC-TRAV-01
	it("has exactly 21 visited places", () => {
		expect(VISITED_PLACES.length).toBe(21);
	});

	// TC-TRAV-02
	it("lists the visited places in the locked prose order", () => {
		const expectedNames = [
			"Thailand",
			"Israel",
			"Mexico",
			"Grenada",
			"Germany",
			"France",
			"Italy",
			"Spain",
			"Portugal",
			"United Kingdom",
			"Croatia",
			"Greece",
			"Netherlands",
			"Austria",
			"Denmark",
			"Finland",
			"Sweden",
			"Norway",
			"Lithuania",
			"Bulgaria",
			"Turkey",
		];
		expect(VISITED_PLACES.map((p) => p.name)).toEqual(expectedNames);
	});

	// TC-TRAV-03
	it('gives the United Kingdom entry label "United Kingdom & Scotland"', () => {
		const uk = VISITED_PLACES.find((p) => p.name === "United Kingdom");
		expect(uk).toBeDefined();
		expect(uk?.label).toBe("United Kingdom & Scotland");
	});

	// TC-TRAV-04
	it("has NEXT_DESTINATION as Japan / JPN", () => {
		expect(NEXT_DESTINATION.name).toBe("Japan");
		expect(NEXT_DESTINATION.code).toBe("JPN");
	});

	// TC-TRAV-05
	it("gives every place (21 visited + Japan) a non-empty name and code string", () => {
		for (const place of [...VISITED_PLACES, NEXT_DESTINATION]) {
			expect(typeof place.name).toBe("string");
			expect(place.name.length).toBeGreaterThan(0);
			expect(typeof place.code).toBe("string");
			expect(place.code.length).toBeGreaterThan(0);
		}
	});

	// TC-TRAV-06
	it('has ROUTE_STOPS === ["THA","ISR","MEX","GRD","EUR"]', () => {
		expect(ROUTE_STOPS).toEqual(["THA", "ISR", "MEX", "GRD", "EUR"]);
	});

	// TC-TRAV-07
	it('has ROUTE_NEXT === "JPN \'27"', () => {
		expect(ROUTE_NEXT).toBe("JPN '27");
	});

	// TC-TRAV-08
	it("resolves every visited name + Japan to the same TravelPlace reference via PLACE_BY_NAME", () => {
		for (const place of VISITED_PLACES) {
			expect(PLACE_BY_NAME[place.name]).toBe(place);
		}
		expect(PLACE_BY_NAME[NEXT_DESTINATION.name]).toBe(NEXT_DESTINATION);
	});

	// TC-TRAV-09
	it("has exactly 22 keys in PLACE_BY_NAME (21 visited + Japan)", () => {
		expect(Object.keys(PLACE_BY_NAME).length).toBe(22);
	});

	// TC-TRAV-10
	it("has no two VISITED_PLACES sharing a name", () => {
		const names = new Set(VISITED_PLACES.map((p) => p.name));
		expect(names.size).toBe(VISITED_PLACES.length);
	});

	// TC-TRAV-11
	it("leaves memory undefined on every entry - data-is-source-of-truth guard, no fabricated copy shipped", () => {
		for (const place of [...VISITED_PLACES, NEXT_DESTINATION]) {
			expect(place.memory).toBeUndefined();
		}
	});
});

/*
 * TRAVEL_STOPS contract (#37) - the manifest/pin city list is hand-editable
 * (Alper curates the real itinerary over the shipped placeholders), so these
 * trap edits that would silently break the globe: a stop pointing at a country
 * the map can't resolve, or coordinates outside the valid lng/lat range.
 */
describe("TRAVEL_STOPS (#37)", () => {
	it("every stop's country resolves in PLACE_BY_NAME (visited + next leg)", () => {
		for (const stop of TRAVEL_STOPS) {
			expect(
				PLACE_BY_NAME[stop.country],
				`Stop "${stop.city}" points at unknown country "${stop.country}"`,
			).toBeDefined();
		}
	});

	it("every stop carries valid coordinates", () => {
		for (const stop of TRAVEL_STOPS) {
			expect(stop.lng, `${stop.city} lng`).toBeGreaterThanOrEqual(-180);
			expect(stop.lng, `${stop.city} lng`).toBeLessThanOrEqual(180);
			expect(stop.lat, `${stop.city} lat`).toBeGreaterThanOrEqual(-85);
			expect(stop.lat, `${stop.city} lat`).toBeLessThanOrEqual(85);
		}
	});

	it("exactly the next-leg country's stops carry the next flag", () => {
		for (const stop of TRAVEL_STOPS) {
			expect(
				Boolean(stop.next),
				`${stop.city}: next flag must mirror country === ${NEXT_DESTINATION.name}`,
			).toBe(stop.country === NEXT_DESTINATION.name);
		}
	});

	it("has no duplicate city entries within a country", () => {
		const keys = TRAVEL_STOPS.map((s) => `${s.city}|${s.country}`);
		expect(new Set(keys).size).toBe(keys.length);
	});
});
