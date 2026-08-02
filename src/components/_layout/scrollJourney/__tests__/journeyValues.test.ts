import { describe, expect, it } from "vitest";
import { DEFAULT_CELESTIAL } from "../../../../data/celestial";
import {
	BIRD_SPECIES_KEYS,
	BIRDS,
	birdFillAt,
	CLOUD_TYPE_KEYS,
	CLOUDSCAPE,
	cloudFillAt,
	presenceAt,
	SCENE,
	trackAt,
	windowedOver,
} from "../../../../data/scene";
import {
	DEFAULT_SKY_ANCHORS,
	rgbToCss,
	skyAt,
	skyRgbAt,
} from "../../../../data/skyCurve";
import {
	celestialPosition,
	MOON_WINDOW,
	moonOpacityAt,
	SUN_WINDOW,
	sunOpacityAt,
	windowedProgress,
} from "../../../minimap/helpers";
import {
	driftOffset,
	WM,
	WORDS,
	zoneOpacity,
} from "../../../narrativeWatermark";
import {
	computeJourney,
	type JourneyInput,
	type Metrics,
	MOVER_WINDOW_TOP_PCT,
	moverMasks,
	progressFor,
	sameMetrics,
	viewportHeightPctFor,
} from "../journeyValues";

// journeyValues is the single source of every scroll-linked value in the
// journey. These tests pin it against the formulas it replaced - the maths used
// to live inline inside PixelBackground, Minimap and NarrativeWatermark, so the
// point of the refactor is that the numbers did NOT change, only who computes
// them and when.

const M: Metrics = {
	docH: 20000,
	winH: 1000,
	winW: 1440,
	max: 19000,
	viewportRatio: 1000 / 20000,
};

function input(overrides: Partial<JourneyInput> = {}): JourneyInput {
	const rawProgress = overrides.rawProgress ?? 0.5;
	return {
		skyProgress: overrides.skyProgress ?? rawProgress,
		rawProgress,
		scrollY: overrides.scrollY ?? rawProgress * M.max,
		metrics: overrides.metrics ?? M,
		celestial: overrides.celestial ?? DEFAULT_CELESTIAL,
		anchors: overrides.anchors ?? DEFAULT_SKY_ANCHORS,
		reduceMotion: overrides.reduceMotion ?? false,
	};
}

describe("progressFor", () => {
	it("maps scroll offset onto 0..1 against the cached max", () => {
		expect(progressFor(0, M)).toBe(0);
		expect(progressFor(M.max, M)).toBe(1);
		expect(progressFor(M.max / 2, M)).toBeCloseTo(0.5, 10);
	});

	it("clamps outside the range (overscroll / bounce)", () => {
		expect(progressFor(-500, M)).toBe(0);
		expect(progressFor(M.max + 500, M)).toBe(1);
	});

	it("is 0 for a document that does not scroll", () => {
		expect(progressFor(0, { ...M, max: 0 })).toBe(0);
		expect(progressFor(100, { ...M, max: 0 })).toBe(0);
	});
});

describe("sameMetrics", () => {
	it("is false against null, so the first measurement always lands", () => {
		expect(sameMetrics(null, M)).toBe(false);
	});

	it("ignores derived fields and compares the measured ones", () => {
		expect(sameMetrics(M, { ...M })).toBe(true);
		expect(sameMetrics(M, { ...M, docH: M.docH + 1 })).toBe(false);
		expect(sameMetrics(M, { ...M, winH: M.winH + 1 })).toBe(false);
		expect(sameMetrics(M, { ...M, winW: M.winW + 1 })).toBe(false);
	});
});

describe("celestial + sky values", () => {
	it("matches skyAt / celestialPosition / the opacity ramps", () => {
		for (const p of [0, 0.2, 0.45, 0.5, 0.62, 0.8, 1]) {
			const v = computeJourney(input({ rawProgress: p }));
			expect(v.sky).toBe(
				skyAt(p, DEFAULT_CELESTIAL.curve, DEFAULT_SKY_ANCHORS),
			);

			const sun = celestialPosition(
				windowedProgress(p, SUN_WINDOW),
				DEFAULT_CELESTIAL.sun,
			);
			expect(v.sun).toEqual({ x: sun.x, y: sun.y, o: sunOpacityAt(p) });

			const moon = celestialPosition(
				windowedProgress(p, MOON_WINDOW),
				DEFAULT_CELESTIAL.moon,
			);
			expect(v.moon).toEqual({ x: moon.x, y: moon.y, o: moonOpacityAt(p) });
		}
	});

	it("ramps the star field across curve phase 2 and clamps outside it", () => {
		const [s2, e2] = DEFAULT_CELESTIAL.curve.phase2;
		expect(computeJourney(input({ rawProgress: s2 })).starsO).toBeCloseTo(
			0,
			10,
		);
		expect(computeJourney(input({ rawProgress: e2 })).starsO).toBeCloseTo(
			1,
			10,
		);
		expect(computeJourney(input({ rawProgress: 0 })).starsO).toBe(0);
		expect(computeJourney(input({ rawProgress: 1 })).starsO).toBe(1);
	});

	it("holds shooting stars back until phase 2 ends", () => {
		const [, e2] = DEFAULT_CELESTIAL.curve.phase2;
		expect(computeJourney(input({ rawProgress: e2 })).shootO).toBeCloseTo(
			0,
			10,
		);
		expect(computeJourney(input({ rawProgress: 1 })).shootO).toBeCloseTo(1, 10);
	});

	it("fades the landscape from 0.4 to a 0.1 floor", () => {
		expect(computeJourney(input({ rawProgress: 0 })).landO).toBeCloseTo(
			0.4,
			10,
		);
		expect(computeJourney(input({ rawProgress: 1 })).landO).toBeCloseTo(
			0.2,
			10,
		);
		// The floor holds even if the curve is pushed past it.
		expect(computeJourney(input({ rawProgress: 5 })).landO).toBe(0.1);
	});

	it("drives the sky-facing values from skyProgress, not raw scroll", () => {
		// The atmosphere toy's time-slice override moves the sky without moving the
		// page; the watermark must stay on raw scroll while the sky follows the slice.
		const v = computeJourney(input({ rawProgress: 0.1, skyProgress: 0.9 }));
		expect(v.sky).toBe(
			skyAt(0.9, DEFAULT_CELESTIAL.curve, DEFAULT_SKY_ANCHORS),
		);
		const build = WORDS[0];
		if (!build) throw new Error("WORDS[0] missing");
		expect(v.words[0]?.o).toBeCloseTo(zoneOpacity(0.1, build.zone), 10);
	});
});

describe("minimap indicator", () => {
	it("spans the track so the window bottom lands at the track bottom", () => {
		const top = computeJourney(input({ rawProgress: 0 })).mm;
		const bottom = computeJourney(input({ rawProgress: 1 })).mm;
		expect(top.topPct).toBeCloseTo(0, 10);
		expect(bottom.topPct + bottom.hPct).toBeCloseTo(100, 10);
	});

	it("keeps topPx and topPct in step against the viewport height", () => {
		const v = computeJourney(input({ rawProgress: 0.37 })).mm;
		expect(v.topPx).toBeCloseTo((v.topPct / 100) * M.winH, 10);
	});

	it("floors the indicator height so it stays visible on a very long page", () => {
		expect(viewportHeightPctFor({ ...M, viewportRatio: 0.001 })).toBe(4);
		expect(viewportHeightPctFor(null)).toBe(4);
		expect(viewportHeightPctFor({ ...M, viewportRatio: 0.25 })).toBe(25);
	});

	it("remaps the celestial dots into the viewport band", () => {
		const v = computeJourney(input({ rawProgress: 0.62 }));
		const sun = celestialPosition(
			windowedProgress(0.62, SUN_WINDOW),
			DEFAULT_CELESTIAL.sun,
		);
		expect(v.mm.sunY).toBeCloseTo(v.mm.topPct + (sun.y / 100) * v.mm.hPct, 10);
	});
});

describe("moverMasks", () => {
	// The masks are built ONCE against a 300%-tall layer and then translated, so
	// the gradient never has to be rebuilt or re-rasterized while scrolling.
	it("parks the window at one third of the mover", () => {
		const { band } = moverMasks(20);
		expect(band).toContain(`black ${MOVER_WINDOW_TOP_PCT.toFixed(2)}%`);
	});

	it("scales the window height into mover space", () => {
		const { band } = moverMasks(30);
		// window: 30% of the container -> 10% of a 3x-taller mover
		expect(band).toContain(`black ${(MOVER_WINDOW_TOP_PCT + 10).toFixed(2)}%`);
	});

	it("inverts dim against band: opaque outside vs opaque inside", () => {
		const { dim, band } = moverMasks(20);
		expect(dim.startsWith("linear-gradient(to bottom, black 0%")).toBe(true);
		expect(band.startsWith("linear-gradient(to bottom, transparent 0%")).toBe(
			true,
		);
	});

	it("only changes when the viewport ratio changes", () => {
		expect(moverMasks(20)).toEqual(moverMasks(20));
		expect(moverMasks(20)).not.toEqual(moverMasks(21));
	});
});

describe("scheduled clouds (#65)", () => {
	it("gates every type on its own window: presence x alpha at the layer", () => {
		CLOUD_TYPE_KEYS.forEach((key, i) => {
			const t = CLOUDSCAPE.types[key];
			for (const p of [0, 0.2, 0.45, 0.62, 0.8, 1]) {
				const c = computeJourney(input({ rawProgress: p })).clouds[i];
				expect(c?.o).toBeCloseTo(presenceAt(p, t.window) * t.alpha, 10);
			}
		});
	});

	it("empties every pool once the day is over", () => {
		const night = computeJourney(input({ rawProgress: 0.8 }));
		night.clouds.forEach((c) => {
			expect(c.o).toBe(0);
			expect(c.count).toBe(0);
		});
	});

	it("rides the count track over the type's windowed progress", () => {
		CLOUD_TYPE_KEYS.forEach((key, i) => {
			const t = CLOUDSCAPE.types[key];
			const p = (t.window.start + t.window.end) / 2;
			const c = computeJourney(input({ rawProgress: p })).clouds[i];
			expect(c?.count).toBe(
				Math.round(trackAt(t.count, windowedOver(p, t.window))),
			);
		});
	});

	it("derives the fill from the sky at the type's depth and time", () => {
		const p = 0.5;
		const sky = skyRgbAt(p, DEFAULT_CELESTIAL.curve, DEFAULT_SKY_ANCHORS);
		const v = computeJourney(input({ rawProgress: p }));
		CLOUD_TYPE_KEYS.forEach((key, i) => {
			expect(v.clouds[i]?.fill).toBe(
				rgbToCss(cloudFillAt(sky, CLOUDSCAPE.types[key].depth)),
			);
		});
	});

	it("sinks with the day, scaled by depth (#78 daySink)", () => {
		const v = computeJourney(input({ rawProgress: 0.5 }));
		CLOUD_TYPE_KEYS.forEach((key, i) => {
			expect(v.clouds[i]?.sinkY).toBeCloseTo(
				CLOUDSCAPE.daySink * 0.5 * CLOUDSCAPE.types[key].depth,
				10,
			);
		});
	});
});

describe("scheduled birds (#64)", () => {
	it("gates every species on its own window: presence x alpha at the layer", () => {
		BIRD_SPECIES_KEYS.forEach((key, i) => {
			const sp = BIRDS[key];
			for (const p of [0, 0.05, 0.2, 0.32, 0.45, 0.6, 1]) {
				const b = computeJourney(input({ rawProgress: p })).birds[i];
				expect(b?.o).toBeCloseTo(presenceAt(p, sp.window) * sp.alpha, 10);
			}
		});
	});

	it("the hero (progress 0) gets the far speck line and nothing nearer", () => {
		const v = computeJourney(input({ rawProgress: 0 }));
		expect(v.birds[0]?.o).toBe(1);
		expect(v.birds[0]?.count).toBe(BIRDS.speck.flights);
		expect(v.birds[1]?.count).toBe(0);
		expect(v.birds[2]?.count).toBe(0);
	});

	it("keeps at least one flight live through a ramp, fading via the layer", () => {
		// Mid ramp-out the count would round to 0 flights while presence is
		// still visible - the layer fade carries the ramp, not the count (#80).
		const sp = BIRDS.speck;
		const p = sp.window.end - sp.window.rampOut * 0.2;
		const b = computeJourney(input({ rawProgress: p })).birds[0];
		expect(b?.o).toBeGreaterThan(0);
		expect(b?.o).toBeLessThan(0.5);
		expect(b?.count).toBeGreaterThanOrEqual(1);
	});

	it("empties every pool once the relay is over (by 0.52)", () => {
		const evening = computeJourney(input({ rawProgress: 0.6 }));
		evening.birds.forEach((b) => {
			expect(b.o).toBe(0);
			expect(b.count).toBe(0);
		});
	});

	it("derives the fill from the sky at the species' depth and time", () => {
		const p = 0.3;
		const sky = skyRgbAt(p, DEFAULT_CELESTIAL.curve, DEFAULT_SKY_ANCHORS);
		const v = computeJourney(input({ rawProgress: p }));
		BIRD_SPECIES_KEYS.forEach((key, i) => {
			expect(v.birds[i]?.fill).toBe(
				rgbToCss(birdFillAt(sky, BIRDS[key].depth)),
			);
		});
	});
});

describe("star thickening (#65)", () => {
	const [p2s] = DEFAULT_CELESTIAL.curve.phase2;

	it("runs zero stars while the sky owns the day", () => {
		expect(computeJourney(input({ rawProgress: 0 })).starCount).toBe(0);
		expect(computeJourney(input({ rawProgress: p2s - 0.01 })).starCount).toBe(
			0,
		);
	});

	it("thickens from the shipped 150 toward 340 at the page bottom", () => {
		const track = SCENE.stars.count as number[];
		expect(
			computeJourney(input({ rawProgress: p2s + 0.001 })).starCount,
		).toBeGreaterThanOrEqual(track[0] ?? 0);
		expect(computeJourney(input({ rawProgress: 1 })).starCount).toBe(
			track[track.length - 1],
		);
	});

	it("grows monotonically on the way down", () => {
		let prev = 0;
		for (let p = p2s; p <= 1.0001; p += 0.05) {
			const n = computeJourney(
				input({ rawProgress: Math.min(p, 1) }),
			).starCount;
			expect(n).toBeGreaterThanOrEqual(prev);
			prev = n;
		}
	});
});

describe("watermark words", () => {
	it("matches driftOffset / zoneOpacity for every word", () => {
		const p = 0.4;
		const v = computeJourney(input({ rawProgress: p, scrollY: p * M.max }));
		const travelPx = (WM.travelVh / 100) * M.winH;
		WORDS.forEach((word, i) => {
			const wordH = word.text.length * v.fontPx * WM.lineHeight;
			expect(v.words[i]?.ty).toBeCloseTo(
				driftOffset(p, word.zone, M.winH, wordH, travelPx),
				10,
			);
		});
	});

	it("pins drift to the mid-point under prefers-reduced-motion", () => {
		// travelPx 0 means the same offset at every progress: no drift at all.
		const a = computeJourney(input({ rawProgress: 0.1, reduceMotion: true }));
		const b = computeJourney(input({ rawProgress: 0.9, reduceMotion: true }));
		expect(a.words[0]?.ty).toBeCloseTo(b.words[0]?.ty ?? -1, 10);

		const moving = computeJourney(input({ rawProgress: 0.1 }));
		expect(moving.words[0]?.ty).not.toBeCloseTo(a.words[0]?.ty ?? -1, 6);
	});

	it("gates BUILD behind its reveal ramp so it fades in past the first screen", () => {
		// revealAfterVh 0 with a 0.5vh ramp: hidden at the very top, up by 0.5vh.
		const atTop = computeJourney(input({ rawProgress: 0.3, scrollY: 0 }));
		expect(atTop.words[0]?.o).toBe(0);
		const past = computeJourney(
			input({ rawProgress: 0.3, scrollY: M.winH * 0.5 }),
		);
		expect(past.words[0]?.o).toBeGreaterThan(0);
	});

	it("renders only the first word on a narrow viewport", () => {
		const narrow: Metrics = { ...M, winW: WM.mobileMaxWidthPx - 1 };
		// 0.7 is EXPLORE's zone centre, where it would be at peak opacity on a wide
		// viewport - so a narrow viewport zeroing it is the mobile rule, not falloff.
		const v = computeJourney(
			input({ rawProgress: 0.7, metrics: narrow, scrollY: 5000 }),
		);
		expect(
			computeJourney(input({ rawProgress: 0.7, scrollY: 5000 })).words[1]?.o,
		).toBeGreaterThan(0);
		expect(v.words[1]?.o).toBe(0);
		// The surviving first word peaks at its own zone centre.
		expect(
			computeJourney(
				input({ rawProgress: 0.3, metrics: narrow, scrollY: 5000 }),
			).words[0]?.o,
		).toBeGreaterThan(0);
	});

	it("knocks the mobile word's opacity down by the mobile scale", () => {
		const narrow: Metrics = { ...M, winW: WM.mobileMaxWidthPx - 1 };
		const wide = computeJourney(input({ rawProgress: 0.3, scrollY: 5000 }));
		const thin = computeJourney(
			input({ rawProgress: 0.3, metrics: narrow, scrollY: 5000 }),
		);
		// Same zone opacity and reveal, scaled by the mobile factor - but the font
		// (and so the drift) differs, hence comparing the ratio only.
		expect((thin.words[0]?.o ?? 0) / (wide.words[0]?.o ?? 1)).toBeCloseTo(
			WM.mobileOpacityScale,
			10,
		);
	});
});
