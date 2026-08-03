import { describe, expect, it } from "vitest";
import { CAREER_TIMELINE } from "../career";
import {
	ageInYear,
	CODING_RAILS,
	CODING_STOP_YEARS,
	CODING_STOPS,
	CODING_UNITS,
	CODING_Y0,
	CODING_Y1,
	CODING_YEARS,
	stopIndexAt,
	TOOL_GROUP,
	TOOL_GROUP_ORDER,
	unitCountsAt,
	unitStateAt,
	unitYears,
	yearOfAge,
} from "../coding";
import { STORY_BY_SLUG } from "../stories";
import { CODING_TEASER } from "../topics";

const eras = STORY_BY_SLUG["early-days"].eras;

function unitNamed(name: string) {
	const unit = CODING_UNITS.find((u) => u.name === name);
	if (!unit) throw new Error(`no unit named ${name}`);
	return unit;
}

describe("coding - the year ladder", () => {
	// TC-CD-01
	it("runs 1995 to 2026, one year per rung", () => {
		expect(CODING_Y0).toBe(1995);
		expect(CODING_Y1).toBe(2026);
		expect(CODING_YEARS[0]).toBe(1995);
		expect(CODING_YEARS.at(-1)).toBe(2026);
		expect(CODING_YEARS.length).toBe(32);
	});

	// TC-CD-02
	it("orders the stops by year, one tick per year", () => {
		const years = CODING_STOPS.map((s) => s.year);
		expect([...years].sort((a, b) => a - b)).toEqual(years);
		expect(new Set(years).size).toBe(years.length);
	});

	// TC-CD-03
	it("keeps every stop inside the ladder", () => {
		for (const stop of CODING_STOPS) {
			expect(stop.year).toBeGreaterThanOrEqual(CODING_Y0);
			expect(stop.year).toBeLessThanOrEqual(CODING_Y1);
		}
	});

	// TC-CD-04
	it("gives every stop a caption - a caption IS the entry for its year", () => {
		for (const stop of CODING_STOPS) {
			expect(stop.cap.length).toBeGreaterThan(0);
		}
	});

	// TC-CD-05
	it("CODING_STOP_YEARS holds exactly the stop years", () => {
		expect([...CODING_STOP_YEARS].sort((a, b) => a - b)).toEqual(
			CODING_STOPS.map((s) => s.year),
		);
	});

	// TC-CD-06
	it("stopIndexAt returns the last stop at or before the year", () => {
		expect(stopIndexAt(1995)).toBe(0);
		expect(stopIndexAt(1998)).toBe(0);
		expect(stopIndexAt(1999)).toBe(1);
		expect(stopIndexAt(CODING_Y1)).toBe(CODING_STOPS.length - 1);
	});
});

describe("coding - the age line", () => {
	// TC-CD-07
	it("reads (year - 1983), the age for almost all of a calendar year", () => {
		expect(ageInYear(1995)).toBe(12);
		expect(ageInYear(2026)).toBe(43);
		expect(yearOfAge(12)).toBe(1995);
	});

	// TC-CD-08
	it("puts every early stop on the year matching the age its prose states", () => {
		eras.forEach((era, i) => {
			const stop = CODING_STOPS[i];
			expect(stop).toBeDefined();
			expect(ageInYear(stop?.year ?? 0)).toBe(Number.parseInt(era.age, 10));
		});
	});
});

describe("coding - prose sources", () => {
	// TC-CD-09
	it("takes the five early stops verbatim from the early-days eras", () => {
		expect(eras.length).toBe(5);
		eras.forEach((era, i) => {
			const stop = CODING_STOPS[i];
			expect(stop?.cap).toBe(era.caption);
			expect(stop?.beats).toEqual(era.beats);
		});
	});

	// TC-CD-10
	it.each([
		["miobambino", 2005],
		["Acama", 2007],
		["Joulex", 2012],
		["Cisco", 2013],
		["enercast", 2019],
	])("takes the %s stop's beats off its career entry", (company, year) => {
		const entry = CAREER_TIMELINE.find((e) => e.company.startsWith(company));
		const stop = CODING_STOPS.find((s) => s.year === year);
		expect(entry).toBeDefined();
		expect(stop).toBeDefined();
		const expected = entry?.highlight
			? [entry.desc, entry.highlight.story]
			: [entry?.desc];
		expect(stop?.beats).toEqual(expected);
	});

	// TC-CD-11
	it("merges both 2021 career entries onto the one 2021 tick", () => {
		const stop = CODING_STOPS.find((s) => s.year === 2021);
		const spirable = CAREER_TIMELINE.find((e) =>
			e.company.startsWith("Spirable"),
		);
		const genius = CAREER_TIMELINE.find((e) => e.company.startsWith("Genius"));
		expect(stop?.beats).toEqual([
			spirable?.desc,
			genius?.desc,
			genius?.highlight?.story,
		]);
	});

	// TC-CD-12
	it("quotes the coding teaser verbatim on the closing stop", () => {
		const stop = CODING_STOPS.at(-1);
		expect(stop?.year).toBe(2026);
		for (const line of [...(stop?.beats ?? []), stop?.op ?? ""]) {
			expect(CODING_TEASER).toContain(line);
		}
	});

	// TC-CD-13
	it("never writes prose for the page - a stop with no source stays bare", () => {
		const bare = CODING_STOPS.filter((s) => s.beats.length === 0);
		expect(bare.map((s) => s.year)).toEqual([2009, 2016, 2024]);
		for (const stop of bare) expect(stop.op).toBeUndefined();
	});

	// TC-CD-14
	it("never uses an em dash or en dash in any caption, beat or opinion", () => {
		for (const stop of CODING_STOPS) {
			for (const text of [stop.cap, ...stop.beats, stop.op ?? ""]) {
				expect(text).not.toContain("—");
				expect(text).not.toContain("–");
			}
		}
	});
});

describe("coding - the rack", () => {
	// TC-CD-15
	it("racks a tool exactly once", () => {
		const racked = CODING_STOPS.flatMap((s) => s.rack);
		expect(new Set(racked).size).toBe(racked.length);
		expect(CODING_UNITS.length).toBe(racked.length);
	});

	// TC-CD-16
	it("never turns a tool dark before it was racked", () => {
		const rackedBy = new Map<string, number>();
		for (const stop of CODING_STOPS) {
			for (const name of stop.dark) {
				const from = rackedBy.get(name);
				expect(from).toBeDefined();
				expect(from).toBeLessThan(stop.year);
			}
			for (const name of stop.rack) rackedBy.set(name, stop.year);
		}
	});

	// TC-CD-17
	it("never turns the same tool dark twice", () => {
		const gone = CODING_STOPS.flatMap((s) => s.dark);
		expect(new Set(gone).size).toBe(gone.length);
	});

	// TC-CD-18
	it("gives every unit a known rail", () => {
		for (const unit of CODING_UNITS) {
			expect(TOOL_GROUP[unit.name]).toBe(unit.group);
			expect(TOOL_GROUP_ORDER).toContain(unit.group);
		}
	});

	// TC-CD-19
	it("keeps the rails in group order and covers every unit once", () => {
		const order = CODING_RAILS.map((r) => r.group);
		expect(order).toEqual(TOOL_GROUP_ORDER.filter((g) => order.includes(g)));
		expect(CODING_RAILS.flatMap((r) => r.units).length).toBe(
			CODING_UNITS.length,
		);
	});

	// TC-CD-20
	it("reads empty before the from year, live inside the span, dark after", () => {
		const qbasic = unitNamed("QBasic");
		expect(qbasic.from).toBe(1995);
		expect(qbasic.to).toBe(2001);
		expect(unitStateAt(qbasic, 1994)).toBe("empty");
		expect(unitStateAt(qbasic, 1995)).toBe("live");
		expect(unitStateAt(qbasic, 2000)).toBe("live");
		expect(unitStateAt(qbasic, 2001)).toBe("dark");
		expect(unitStateAt(qbasic, 2026)).toBe("dark");
	});

	// TC-CD-21
	it("leaves an open span's label with a trailing dash", () => {
		const typescript = unitNamed("TypeScript");
		expect(typescript.to).toBeNull();
		expect(unitYears(typescript)).toBe("2019-");
		expect(unitYears(unitNamed("QBasic"))).toBe("1995-2001");
	});

	// TC-CD-22
	it("counts nothing before the first stop and everything racked at the end", () => {
		expect(unitCountsAt(1994)).toEqual({ live: 0, dark: 0 });
		const first = unitCountsAt(1995);
		expect(first).toEqual({ live: 3, dark: 0 });
		const last = unitCountsAt(CODING_Y1);
		expect(last.live + last.dark).toBe(CODING_UNITS.length);
	});

	// TC-CD-23
	it("never lets the running count fall to zero after the first stop", () => {
		for (const year of CODING_YEARS) {
			expect(unitCountsAt(year).live).toBeGreaterThan(0);
		}
	});
});
