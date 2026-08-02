import { describe, expect, it } from "vitest";
import {
	celestialPosition,
	MOON_WINDOW,
	moonOpacityAt,
	SUN_WINDOW,
	sunOpacityAt,
	windowedProgress,
} from "../../components/minimap/helpers";
import { DEFAULT_CELESTIAL } from "../celestial";
import {
	BIRD_SPECIES_KEYS,
	BIRDS,
	CLOUD_TYPE_KEYS,
	CLOUDSCAPE,
	LAND_DEFAULT,
	presenceAt,
	ridgeFillsAt,
} from "../scene";
import {
	coldEntryFor,
	PATHNAME_TO_TOPIC_ID,
	skyBootRidgeJs,
	skyBootSceneJs,
	skyBootScript,
	skyBootSkyAtJs,
} from "../skyBoot";
import { DEFAULT_SKY_CURVE, rgbToCss, skyAt, skyRgbAt } from "../skyCurve";
import { PANEL_KEY_TO_TOPIC_ID } from "../topics";

// The boot script ships a vanilla port of skyAt so it can run before hydration.
// It must stay bit-for-bit identical to the real skyAt for the default curve, or
// a cold deep-link would boot one colour and then visibly shift to another once
// React takes over. This pins the two implementations together.
describe("skyBoot vanilla skyAt port", () => {
	// biome-ignore lint/security/noGlobalEval: evaluating our own generated source to pin it against the real skyAt
	const bootSkyAt = eval(`(function(){${skyBootSkyAtJs()}
return skyAt;})()`) as (p: number) => string;

	it("matches the real skyAt across the whole progress range", () => {
		for (let i = 0; i <= 100; i++) {
			const p = i / 100;
			expect(bootSkyAt(p)).toBe(skyAt(p, DEFAULT_SKY_CURVE));
		}
	});

	it("matches at and just around the phase boundaries", () => {
		const { phase1, phase2 } = DEFAULT_SKY_CURVE;
		for (const edge of [...phase1, ...phase2]) {
			for (const p of [edge - 0.001, edge, edge + 0.001]) {
				expect(bootSkyAt(p)).toBe(skyAt(p, DEFAULT_SKY_CURVE));
			}
		}
	});
});

// The boot ships a vanilla port of scene.ts ridgeFillsAt (#62) so a cold
// night deep-link paints night mountains before hydration. It must stay
// bit-for-bit identical to the real formula against the default landscape.
describe("skyBoot vanilla ridge-fill port", () => {
	// biome-ignore lint/security/noGlobalEval: evaluating our own generated source to pin it against the real ridgeFillsAt
	const boot = eval(`(function(){${skyBootSkyAtJs()}${skyBootRidgeJs()}
return function(p){return ridgeFills(skyArr(p));};})()`) as (
		p: number,
	) => string[];

	it("matches the real ridgeFillsAt across the whole progress range", () => {
		for (let i = 0; i <= 100; i++) {
			const p = i / 100;
			const sky = skyRgbAt(p, DEFAULT_SKY_CURVE);
			expect(boot(p)).toEqual(ridgeFillsAt(sky, LAND_DEFAULT).map(rgbToCss));
		}
	});
});

describe("PATHNAME_TO_TOPIC_ID", () => {
	it("maps each known subpage pathname to its band topic id", () => {
		// music/movies/travel are personal panels at /<slug>; movies parks at the
		// movies-tv band. Guards the derivation from the registry.
		expect(PATHNAME_TO_TOPIC_ID["/music"]).toBe("music");
		expect(PATHNAME_TO_TOPIC_ID["/travel"]).toBe("travel");
		expect(PATHNAME_TO_TOPIC_ID["/movies"]).toBe("movies-tv");
	});

	it("routes project panels under /projects/<slug>", () => {
		// Every project key that has a parked topic gets a /projects/ path, never a
		// bare /<slug>.
		for (const key of Object.keys(PATHNAME_TO_TOPIC_ID)) {
			expect(key.startsWith("/")).toBe(true);
		}
		expect(PATHNAME_TO_TOPIC_ID["/projects/goodwatch"]).toBe(
			PANEL_KEY_TO_TOPIC_ID.goodwatch,
		);
	});

	it("only includes panels that actually park at a topic", () => {
		const values = Object.values(PATHNAME_TO_TOPIC_ID);
		expect(values.every(Boolean)).toBe(true);
	});

	// Pin: the three new stub projects have no Craft topic, so the derived
	// supplement in PANEL_KEY_TO_TOPIC_ID parks their cold-entry pathnames at
	// the Projects band ("projects") instead of leaving them undefined
	// (which would otherwise boot at scroll 0 in daylight).
	it("parks the three stub project pathnames at the Projects band topic id", () => {
		expect(PATHNAME_TO_TOPIC_ID["/projects/curia"]).toBe("projects");
		expect(PATHNAME_TO_TOPIC_ID["/projects/claude-statusline"]).toBe(
			"projects",
		);
		expect(PATHNAME_TO_TOPIC_ID["/projects/alperortac-com"]).toBe("projects");
	});
});

// The boot ships a vanilla port of the celestial-scene math (celestialPosition
// / windowedProgress / opacities). It must match the real helpers for the
// default params, or a cold deep-link would boot the sun/moon at one spot and
// shift them once React takes over.
describe("skyBoot scene port", () => {
	// biome-ignore lint/security/noGlobalEval: evaluating our own generated source to pin it against the real helpers
	const scene = eval(`(function(){${skyBootSceneJs()}
return scene;})()`) as (
		p: number,
		vt: number,
		vh: number,
	) => Record<string, string | number>;

	it("matches the real sun/moon position + opacity across the range", () => {
		for (let i = 0; i <= 100; i++) {
			const p = i / 100;
			const s = scene(p, 0, 100);
			const sunPos = celestialPosition(
				windowedProgress(p, SUN_WINDOW),
				DEFAULT_CELESTIAL.sun,
			);
			const moonPos = celestialPosition(
				windowedProgress(p, MOON_WINDOW),
				DEFAULT_CELESTIAL.moon,
			);
			expect(s["--sun-x"]).toBe(`${sunPos.x}%`);
			expect(s["--sun-y"]).toBe(`${sunPos.y}%`);
			expect(s["--sun-o"]).toBe(sunOpacityAt(p));
			expect(s["--moon-x"]).toBe(`${moonPos.x}%`);
			expect(s["--moon-y"]).toBe(`${moonPos.y}%`);
			expect(s["--moon-o"]).toBe(moonOpacityAt(p));
		}
	});

	it("matches scene.ts presence x alpha for every cloud type", () => {
		for (let i = 0; i <= 100; i++) {
			const p = i / 100;
			const s = scene(p, 0, 100);
			for (const key of CLOUD_TYPE_KEYS) {
				const t = CLOUDSCAPE.types[key];
				expect(s[`--cloud-${key}-o`] as number).toBeCloseTo(
					presenceAt(p, t.window) * t.alpha,
					10,
				);
			}
		}
	});

	it("matches scene.ts presence x alpha for every bird species", () => {
		for (let i = 0; i <= 100; i++) {
			const p = i / 100;
			const s = scene(p, 0, 100);
			for (const key of BIRD_SPECIES_KEYS) {
				expect(s[`--bird-${key}-o`] as number).toBeCloseTo(
					presenceAt(p, BIRDS[key].window) * BIRDS[key].alpha,
					10,
				);
			}
		}
	});

	it("remaps the minimap dot y into the viewport band", () => {
		const s = scene(0.8, 60, 5);
		const sunPos = celestialPosition(
			windowedProgress(0.8, SUN_WINDOW),
			DEFAULT_CELESTIAL.sun,
		);
		expect(s["--mm-sun-y"]).toBe(`${60 + (sunPos.y / 100) * 5}%`);
	});
});

describe("coldEntryFor", () => {
	it("treats a hash as an anchor landing (with or without the leading #)", () => {
		expect(coldEntryFor("/", "#games")).toEqual({
			mode: "anchor",
			id: "games",
		});
		expect(coldEntryFor("/", "games")).toEqual({ mode: "anchor", id: "games" });
	});

	it("a hash wins even on a subpage path", () => {
		expect(coldEntryFor("/movies", "#craft")).toEqual({
			mode: "anchor",
			id: "craft",
		});
	});

	it("maps a subpage pathname to its parked topic", () => {
		expect(coldEntryFor("/movies", "")).toEqual({
			mode: "subpage",
			topicId: "movies-tv",
		});
		expect(coldEntryFor("/music", "")).toEqual({
			mode: "subpage",
			topicId: "music",
		});
	});

	it("falls back to plain for the index and unknown paths", () => {
		expect(coldEntryFor("/", "")).toEqual({ mode: "plain" });
		expect(coldEntryFor("/not-a-route", "")).toEqual({ mode: "plain" });
	});

	// Pin: a cold load of a stub project's subpage must park at the Projects
	// band, not fall back to "plain" (which would boot at scroll 0 daylight
	// and strand the user at the hero when the panel closes).
	it("parks a cold /projects/curia load at the Projects band", () => {
		expect(coldEntryFor("/projects/curia", "")).toEqual({
			mode: "subpage",
			topicId: "projects",
		});
	});
});

describe("skyBootScript", () => {
	it("is a self-contained IIFE that sets --sky-now and body background", () => {
		const s = skyBootScript();
		expect(s.startsWith("(function(){")).toBe(true);
		expect(s).toContain('setProperty("--sky-now"');
		expect(s).toContain("backgroundColor");
		// Wrapped in try/catch so a boot failure can never blank the page.
		expect(s).toContain("try{");
		expect(s).toContain("}catch(e){}");
	});

	it("touches no storage - celestial.ts is the only source of the gap", () => {
		const s = skyBootScript();
		// The boot script used to read a persisted gapVh and apply it as --gap-vh
		// before the scrollIntoView, to stop a stored gap reflowing the page at
		// hydration. Nothing is persisted now: SSR renders the default gap, so the
		// scroll the boot lands is already measured against the final height.
		expect(s).not.toContain("localStorage");
		expect(s).not.toContain("--gap-vh");
	});
});
