import { describe, expect, it } from "vitest";
import {
	BIRD_SPECIES_KEYS,
	BIRDS,
	birdFillAt,
	birdFlapCss,
	birdPool,
	CLOUD_TYPE_KEYS,
	CLOUDSCAPE,
	cloudFillAt,
	cloudPool,
	gridPath,
	LAND_DEFAULT,
	poolSize,
	presenceAt,
	RIDGES,
	ridgeFillsAt,
	ridgeSpecs,
	SCENE,
	trackAt,
	windowedOver,
} from "../scene";
import { SKY_NIGHT, SKY_NOON } from "../skyCurve";

// The schedule maths from wayfinder #61/#63: presence ramps live INSIDE the
// window, a track is 2+ evenly spaced stops riding windowed progress, and a
// count track's ceiling sizes the rendered pool (prefix activation).

describe("presenceAt", () => {
	const w = { start: 0.2, rampIn: 0.1, end: 0.8, rampOut: 0.2 };

	it("is 0 outside the window", () => {
		expect(presenceAt(0.19, w)).toBe(0);
		expect(presenceAt(0.81, w)).toBe(0);
	});

	it("ramps inside the window edges, asymmetrically", () => {
		expect(presenceAt(0.2, w)).toBe(0);
		expect(presenceAt(0.25, w)).toBeCloseTo(0.5, 10);
		expect(presenceAt(0.3, w)).toBeCloseTo(1, 10);
		expect(presenceAt(0.7, w)).toBeCloseTo(0.5, 10);
		expect(presenceAt(0.8, w)).toBe(0);
	});

	it("holds 1 through the plateau", () => {
		expect(presenceAt(0.5, w)).toBe(1);
	});

	it("a zero ramp is a hard edge", () => {
		const hard = { start: 0.4, rampIn: 0.12, end: 1, rampOut: 0 };
		expect(presenceAt(1, hard)).toBe(1);
		expect(presenceAt(0.4, hard)).toBe(0);
	});
});

describe("trackAt", () => {
	it("a plain number is fixed", () => {
		expect(trackAt(4, 0)).toBe(4);
		expect(trackAt(4, 1)).toBe(4);
	});

	it("two stops interpolate linearly, descending included", () => {
		expect(trackAt([150, 340], 0)).toBe(150);
		expect(trackAt([150, 340], 0.5)).toBe(245);
		expect(trackAt([150, 340], 1)).toBe(340);
		expect(trackAt([0.3, 0.15], 1)).toBeCloseTo(0.15, 10);
	});

	it("multi-stop tracks are piecewise linear over even segments", () => {
		expect(trackAt([2, 5, 3], 0)).toBe(2);
		expect(trackAt([2, 5, 3], 0.5)).toBe(5);
		expect(trackAt([2, 5, 3], 0.75)).toBe(4);
		expect(trackAt([2, 5, 3], 1)).toBe(3);
	});

	it("clamps t outside 0..1", () => {
		expect(trackAt([2, 5, 3], -1)).toBe(2);
		expect(trackAt([2, 5, 3], 2)).toBe(3);
	});
});

describe("windowedOver", () => {
	it("maps the window span onto 0..1", () => {
		const w = { start: 0.2, rampIn: 0, end: 0.7, rampOut: 0 };
		expect(windowedOver(0.2, w)).toBe(0);
		expect(windowedOver(0.45, w)).toBeCloseTo(0.5, 10);
		expect(windowedOver(0.7, w)).toBe(1);
	});
});

describe("poolSize", () => {
	it("is the ceiling of a count track", () => {
		expect(poolSize([2, 3, 2])).toBe(3);
		expect(poolSize([150, 340])).toBe(340);
		expect(poolSize(4)).toBe(4);
	});
});

describe("cloudPool", () => {
	it("is deterministic - SSR and client markup must match (#418)", () => {
		for (const key of CLOUD_TYPE_KEYS) {
			expect(cloudPool(key)).toEqual(cloudPool(key));
		}
	});

	it("renders each type's count ceiling once", () => {
		for (const key of CLOUD_TYPE_KEYS) {
			expect(cloudPool(key)).toHaveLength(
				poolSize(CLOUDSCAPE.types[key].count),
			);
		}
	});

	it("homes every element inside its type's band", () => {
		for (const key of CLOUD_TYPE_KEYS) {
			const [top, bottom] = CLOUDSCAPE.types[key].band;
			for (const el of cloudPool(key)) {
				expect(el.topPct).toBeGreaterThanOrEqual(top);
				expect(el.topPct).toBeLessThanOrEqual(Math.max(bottom, top + 1));
			}
		}
	});

	it("spreads phase across the whole crossing via negative delay", () => {
		for (const key of CLOUD_TYPE_KEYS) {
			for (const el of cloudPool(key)) {
				expect(el.delayS).toBeLessThanOrEqual(0);
				expect(Math.abs(el.delayS)).toBeLessThanOrEqual(el.durS);
			}
		}
	});
});

describe("cloudFillAt", () => {
	it("washes far clouds toward the sky harder than near clouds", () => {
		const far = cloudFillAt(SKY_NOON, 0.14);
		const near = cloudFillAt(SKY_NOON, 0.62);
		// Nearer = brighter (closer to the white base) at noon.
		expect(near.r + near.g + near.b).toBeGreaterThan(far.r + far.g + far.b);
	});

	it("pulls every depth toward silhouette at night", () => {
		for (const key of CLOUD_TYPE_KEYS) {
			const d = CLOUDSCAPE.types[key].depth;
			const noon = cloudFillAt(SKY_NOON, d);
			const night = cloudFillAt(SKY_NIGHT, d);
			expect(night.r + night.g + night.b).toBeLessThan(
				noon.r + noon.g + noon.b,
			);
		}
	});
});

describe("the schedule table", () => {
	it("every cloud window ends before the stars own the sky (#78 amendment)", () => {
		// Translucent clouds are safe because none survive into full night.
		for (const key of CLOUD_TYPE_KEYS) {
			expect(CLOUDSCAPE.types[key].window.end).toBeLessThanOrEqual(0.65);
		}
	});

	it("ramps fit inside their windows", () => {
		const windows = [
			...Object.values(SCENE).flatMap((m) => m.windows),
			...CLOUD_TYPE_KEYS.map((k) => CLOUDSCAPE.types[k].window),
			...BIRD_SPECIES_KEYS.map((k) => BIRDS[k].window),
		];
		for (const w of windows) {
			expect(w.end).toBeGreaterThan(w.start);
			expect(w.rampIn + w.rampOut).toBeLessThanOrEqual(w.end - w.start);
		}
	});
});

// The bird cast (#80/#64): sprite compilation, seeded flight pools, the
// sky-derived silhouette fill, and the generated wingbeat keyframes.

describe("gridPath", () => {
	it("compiles a run of filled cells into one unit-rect subpath", () => {
		expect(gridPath(["###"])).toBe("M0 0h3v1h-3z");
	});

	it("splits runs and rows into separate subpaths", () => {
		expect(gridPath(["#.#", ".#."])).toBe(
			"M0 0h1v1h-1zM2 0h1v1h-1zM1 1h1v1h-1z",
		);
	});

	it("compiles every pose of every species without an empty path", () => {
		for (const key of BIRD_SPECIES_KEYS) {
			for (const pose of BIRDS[key].sprite.poses) {
				expect(gridPath(pose).length).toBeGreaterThan(0);
			}
		}
	});
});

describe("birdPool", () => {
	it("is deterministic - SSR and client markup must match (#418)", () => {
		for (const key of BIRD_SPECIES_KEYS) {
			expect(birdPool(key)).toEqual(birdPool(key));
		}
	});

	it("renders each species' flight pool at its ceiling", () => {
		for (const key of BIRD_SPECIES_KEYS) {
			expect(birdPool(key)).toHaveLength(BIRDS[key].flights);
		}
	});

	it("carries the full formation in every flight", () => {
		for (const key of BIRD_SPECIES_KEYS) {
			for (const flight of birdPool(key)) {
				expect(flight.birds).toHaveLength(BIRDS[key].formation.length);
			}
		}
	});

	it("spreads phase across the whole crossing via negative delay", () => {
		for (const key of BIRD_SPECIES_KEYS) {
			for (const flight of birdPool(key)) {
				expect(flight.delayS).toBeLessThanOrEqual(0);
				expect(Math.abs(flight.delayS)).toBeLessThanOrEqual(BIRDS[key].crossS);
			}
		}
	});

	it("scatters flights inside the species' altitude band", () => {
		for (const key of BIRD_SPECIES_KEYS) {
			const sp = BIRDS[key];
			for (const flight of birdPool(key)) {
				for (const bird of flight.birds) {
					// Home y ± half the scatter, ± the formation's vertical reach.
					const reach = sp.spreadVh / 2 + sp.size * 1.5 * 0.5;
					expect(bird.bottomVh).toBeGreaterThanOrEqual(sp.yVh - reach - 1);
					expect(bird.bottomVh).toBeLessThanOrEqual(sp.yVh + reach + 1);
				}
			}
		}
	});
});

describe("birdFillAt", () => {
	it("is darker than the sky it derives from (a silhouette)", () => {
		for (const key of BIRD_SPECIES_KEYS) {
			const d = BIRDS[key].depth;
			const noon = birdFillAt(SKY_NOON, d);
			expect(noon.r + noon.g + noon.b).toBeLessThan(
				SKY_NOON.r + SKY_NOON.g + SKY_NOON.b,
			);
		}
	});

	it("washes a farther bird back toward the sky (aerial perspective)", () => {
		const far = birdFillAt(SKY_NOON, 0.18);
		const near = birdFillAt(SKY_NOON, 0.3);
		expect(far.r + far.g + far.b).toBeGreaterThan(near.r + near.g + near.b);
	});
});

describe("birdFlapCss", () => {
	it("emits keyframes and a pose rule for every pose of every species", () => {
		const css = birdFlapCss();
		for (const key of BIRD_SPECIES_KEYS) {
			BIRDS[key].sprite.poses.forEach((_, p) => {
				expect(css).toContain(`@keyframes bird-flap-${key}-p${p}`);
				expect(css).toContain(
					`.bird-el--${key} .bird-pose:nth-child(${p + 1})`,
				);
			});
		}
	});

	it("cuts poses with step-end on the wall clock (#60: survives a subpage)", () => {
		const css = birdFlapCss();
		expect(css).toContain("step-end infinite");
		expect(css).not.toContain("ease");
	});

	it("runs every pose track over the same cycle length per species", () => {
		const css = birdFlapCss();
		for (const key of BIRD_SPECIES_KEYS) {
			const sp = BIRDS[key];
			const total = sp.beat * sp.flapBeats + sp.beat * sp.glideBeats;
			const durations = [
				...css.matchAll(
					new RegExp(`bird-flap-${key}-p\\d+ (\\d+\\.\\d+)s step-end`, "g"),
				),
			].map((m) => Number(m[1]));
			expect(durations.length).toBe(sp.sprite.poses.length);
			for (const d of durations) expect(d).toBeCloseTo(total, 3);
		}
	});
});

describe("the bird relay (#80)", () => {
	it("the far speck line is already open at hero (progress 0)", () => {
		expect(presenceAt(0, BIRDS.speck.window)).toBe(1);
	});

	it("ramps span the outer third of each window", () => {
		for (const key of BIRD_SPECIES_KEYS) {
			const w = BIRDS[key].window;
			const third = (w.end - w.start) / 3;
			if (w.start > 0) expect(w.rampIn).toBeCloseTo(third, 2);
			expect(w.rampOut).toBeCloseTo(third, 2);
		}
	});

	it("every window closes by 0.56 - mist owns the sunset band", () => {
		// Walk round 2 stretched the relay (birds were gone too early); 0.56
		// still clears the sunset band for the mist and dusk for the fireflies.
		for (const key of BIRD_SPECIES_KEYS) {
			expect(BIRDS[key].window.end).toBeLessThanOrEqual(0.56);
		}
	});

	it("most species fly with the wind - the clouds' drift direction", () => {
		const withWind = BIRD_SPECIES_KEYS.filter((k) => BIRDS[k].rightward);
		expect(withWind.length).toBeGreaterThan(BIRD_SPECIES_KEYS.length / 2);
	});
});

describe("the ridge ladder (#62)", () => {
	it("spans the locked depth ladder: ten ridges, 0.21 to 0.93 (#59)", () => {
		const specs = ridgeSpecs();
		expect(specs).toHaveLength(RIDGES.count);
		expect(specs[0]?.depth).toBeCloseTo(0.21, 10);
		expect(specs[specs.length - 1]?.depth).toBeCloseTo(0.93, 10);
		// Strictly increasing: paint order = depth order needs no ties here.
		for (let i = 1; i < specs.length; i++) {
			const prev = specs[i - 1];
			const cur = specs[i];
			if (!prev || !cur) throw new Error("spec missing");
			expect(cur.depth).toBeGreaterThan(prev.depth);
		}
	});

	it("is deterministic: SSR and client must generate identical art (#418)", () => {
		expect(ridgeSpecs()).toEqual(ridgeSpecs());
	});

	it("far ridges sit tall, near ridges low - the tops stagger", () => {
		const specs = ridgeSpecs();
		expect(specs[0]?.heightVh).toBeCloseTo(44, 10);
		expect(specs[specs.length - 1]?.heightVh).toBeCloseTo(14, 10);
	});

	it("every silhouette is a closed bottom-anchored path in the house vocabulary", () => {
		for (const r of ridgeSpecs()) {
			expect(r.d.startsWith("M0 400V")).toBe(true);
			expect(r.d.endsWith("V400H0Z")).toBe(true);
		}
	});

	it("exposes the crest polyline for members planted on a ridge (#82)", () => {
		for (const r of ridgeSpecs()) {
			expect(r.crest.length).toBeGreaterThan(2);
			expect(r.crest[0]?.x).toBe(0);
			expect(r.crest[r.crest.length - 1]?.x).toBe(1000);
			// Crest y stays inside the generator's band (silhouette, never the base).
			for (const p of r.crest) {
				expect(p.y).toBeGreaterThanOrEqual(50);
				expect(p.y).toBeLessThanOrEqual(370);
			}
		}
	});

	it("fills accumulate from the horizon forward and darken toward the viewer", () => {
		const fills = ridgeFillsAt(SKY_NOON, LAND_DEFAULT);
		expect(fills).toHaveLength(RIDGES.count);
		const lum = (c: { r: number; g: number; b: number }) =>
			0.2126 * c.r + 0.7152 * c.g + 0.0722 * c.b;
		for (let i = 1; i < fills.length; i++) {
			const prev = fills[i - 1];
			const cur = fills[i];
			if (!prev || !cur) throw new Error("fill missing");
			expect(lum(cur)).toBeLessThan(lum(prev));
		}
	});

	it("the horizon ridge hugs the sky - delicacy is colour, not alpha (#59)", () => {
		const fills = ridgeFillsAt(SKY_NIGHT, LAND_DEFAULT);
		const far = fills[0];
		if (!far) throw new Error("fill missing");
		// Coverage at t=0 is coverBase x weight = ~0.14: the far ridge sits within
		// a few candela of the night sky, yet is fully opaque (occludes stars).
		expect(Math.abs(far.r - SKY_NIGHT.r)).toBeLessThanOrEqual(16);
		expect(Math.abs(far.g - SKY_NIGHT.g)).toBeLessThanOrEqual(16);
		expect(Math.abs(far.b - SKY_NIGHT.b)).toBeLessThanOrEqual(16);
	});

	it("gap depths hold the seeds the mist and firefly builds assume (#79/#81)", () => {
		const specs = ridgeSpecs();
		const mid = (a: number, b: number) =>
			((specs[a]?.depth ?? 0) + (specs[b]?.depth ?? 0)) / 2;
		expect(mid(5, 6)).toBeCloseTo(0.65, 10);
		expect(mid(7, 8)).toBeCloseTo(0.81, 10);
		expect(mid(8, 9)).toBeCloseTo(0.89, 10);
	});
});
