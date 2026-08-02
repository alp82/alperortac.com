import {
	clamp01,
	hslToRgb,
	lerpRgb,
	type RGB,
	rgbToHsl,
	SKY_NOON,
} from "./skyCurve";

// The ambient scene schedule: one authored table owns every cast member's day
// (wayfinder #61, amended by #63). This file is the single source of truth on
// the celestial.ts contract: the scene-authoring panel edits session state,
// and a reload always returns to these values.
//
// Vocabulary (closed - a new property must amend AGENTS.md first): presence,
// count, intensity, position, size. A plain number is fixed. A track is an
// array of 2+ evenly spaced stops riding the member's windowed progress
// piecewise-linearly - [from, to] is the two-stop case, [2, 5, 3] rises then
// falls. No member-to-member references.

export type SceneWindow = {
	/** global scroll progress where the window opens */
	start: number;
	/** presence ramps 0→1 over this span after `start` (inside the window) */
	rampIn: number;
	/** global scroll progress where the window closes */
	end: number;
	/** presence ramps 1→0 over this span before `end` (inside the window) */
	rampOut: number;
};

/** A schedulable scalar: a plain number is fixed, an array is a stop track. */
export type Track = number | number[];

export type MemberSchedule = {
	windows: SceneWindow[];
	count: Track;
	intensity: Track;
	position: Track;
	size: Track;
};

export type SceneSchedule = Record<
	"stars" | "fireflies" | "conifers" | "water",
	MemberSchedule
>;

// Seed values from the authoring-panel session (wayfinder #63). Stars are
// consumed since #65; fireflies/conifers/water rows are the seeds for their
// build tickets (#85-#87) and drive nothing yet. Clouds, birds and mist are
// NOT in this table: their signed-off designs (#78, #80, #79) fan out into
// typed pools, each with its own windows - see CLOUDSCAPE, BIRDS and MIST
// below (the #64 pattern: a member whose design fans into types gets its own
// structure).
export const SCENE: SceneSchedule = {
	// Stars predate the roster and keep their sky-curve coupling: presence stays
	// the driver's `starsO` ramp across phase2 (the curve is tunable at runtime,
	// so the window derives from celestial.curve instead of being authored
	// here), and `count` rides progress from phase2's start to the page bottom.
	// 150 is the shipped star field, 340 the atmosphere toy's dense mode.
	stars: {
		windows: [],
		count: [150, 340],
		intensity: 1,
		position: 0,
		size: 1,
	},
	fireflies: {
		windows: [{ start: 0.45, rampIn: 0.05, end: 0.8, rampOut: 0.06 }],
		count: [6, 24],
		intensity: [0.5, 1],
		position: 0.75,
		size: 1,
	},
	conifers: {
		windows: [{ start: 0, rampIn: 0, end: 1, rampOut: 0 }],
		count: 12,
		intensity: 1,
		position: 0.85,
		size: 1,
	},
	water: {
		windows: [{ start: 0.4, rampIn: 0.12, end: 1, rampOut: 0 }],
		count: 1,
		intensity: 1,
		position: 0.9,
		size: [0.2, 1],
	},
};

// ---------------------------------------------------------------------------
// Clouds: the layered ladder locked on wayfinder #78 (preset D). The types
// coexist as a depth + transparency stack, back to front; height bands stagger
// with depth (farther = higher), which is what makes the stack read. Clouds
// are translucent by design - per-type alpha is the layering instrument, an
// explicit amendment of the opaque-silhouette brief (#77 rule 4). Safe because
// every cloud window ends before the stars own the sky.
//
// Drift is wrap: full crossings at constant per-element speed on the CSS
// clock, so cloud motion survives an open subpage (#60). The driver only
// gates presence, count, fill and the day-end sink on scroll.
// ---------------------------------------------------------------------------

export type CloudType = {
	window: SceneWindow;
	/** stop track over the window (see Track); pool size is its ceiling */
	count: number[];
	/** --layer-depth for parallax + the dive */
	depth: number;
	/** per-type translucency - the #78 layering instrument */
	alpha: number;
	/** nominal element width in px (randomized ±25% per element) */
	size: number;
	/** vertical home band, [top%, bottom%] of the viewport */
	band: [number, number];
	/** 0..1 drift speed; higher = faster crossings */
	speed: number;
	/** pixel-crisp path, viewBox 0 0 100 60 (scene-cast-sketchbook-2) */
	d: string;
};

export const CLOUD_TYPE_KEYS = [
	"cirrus",
	"mass",
	"cumulus",
	"twin",
	"puff",
] as const;
export type CloudTypeKey = (typeof CLOUD_TYPE_KEYS)[number];

export const CLOUDSCAPE: {
	types: Record<CloudTypeKey, CloudType>;
	/** px of downward drift at day end, scaled by depth, driver-written */
	daySink: number;
	/** how far a far cloud's fill washes toward the sky colour */
	skyWash: number;
	/** how hard dusk pulls every cloud toward silhouette */
	duskShade: number;
} = {
	types: {
		cirrus: {
			window: { start: 0.15, rampIn: 0.1, end: 0.65, rampOut: 0.12 },
			count: [2],
			depth: 0.14,
			alpha: 0.35,
			size: 220,
			band: [3, 10],
			speed: 0.15,
			d: "M4 26h22v5H4zM14 34h40v5H14zM40 24h44v5H40zM56 34h34v5H56z",
		},
		mass: {
			window: { start: 0, rampIn: 0, end: 0.62, rampOut: 0.14 },
			count: [1, 2, 1],
			depth: 0.2,
			alpha: 0.3,
			size: 500,
			band: [5, 16],
			speed: 0.2,
			d: "M6 50V34h10V24h14V16h26v8h16v6h14v6h10v10z",
		},
		cumulus: {
			window: { start: 0, rampIn: 0, end: 0.55, rampOut: 0.1 },
			count: [2],
			depth: 0.34,
			alpha: 0.5,
			size: 200,
			band: [13, 25],
			speed: 0.3,
			d: "M18 44h10V32h8V22h12V14h16v8h10v10h8v12h10v10H8V44z",
		},
		twin: {
			window: { start: 0, rampIn: 0, end: 0.5, rampOut: 0.08 },
			count: [2, 3, 2],
			depth: 0.48,
			alpha: 0.7,
			size: 120,
			band: [21, 33],
			speed: 0.35,
			d: "M8 36h8v8H8zM16 28h20v8H16zM36 36h8v8h-8zM4 44h44v8H4zM56 40h6v6h-6zM62 34h16v6H62zM78 40h6v6h-6zM54 46h34v6H54z",
		},
		puff: {
			window: { start: 0, rampIn: 0, end: 0.6, rampOut: 0.12 },
			count: [2, 3, 2],
			depth: 0.62,
			alpha: 0.95,
			size: 140,
			band: [27, 42],
			speed: 0.4,
			d: "M20 30h10v10H20zM30 20h40v10H30zM70 30h10v10H70zM10 40h80v10H10z",
		},
	},
	daySink: 30,
	skyWash: 0.55,
	duskShade: 0.45,
};

// ---------------------------------------------------------------------------
// The ridge ladder: the landscape as ten depth layers (wayfinder #59, built on
// #62). The ladder replaces the single translucent silhouette. Each ridge is a
// seeded pixel-crisp diagonal silhouette in the shipped path vocabulary; the
// seeds are the exact ones Alper locked in .prototypes/scene-depth-parallax.html
// so the shipped art IS the walked art.
//
// A ridge is OPAQUE (#59): delicacy comes from a fill near the sky colour, not
// from alpha - a translucent ridge let the star field read through the
// mountains. Each ridge's fill is the accumulated composite of every ridge
// behind it over the sky, which keeps the stacked wash low alpha used to give.
//
// Scroll parallax is vertical only, on the `translate` longhand (the scroll
// channel - it composes with the dive's `transform`, never touches it). Travel
// is riseAtDepth1 px at depth 1 against a 1440px reference, scaled down by
// viewport width; every bottom-anchored layer overscans by the full travel.
// ---------------------------------------------------------------------------

/** The default landscape base colour; the atmosphere toy's palettes override. */
export const LAND_DEFAULT: RGB = { r: 74, g: 122, b: 140 };

export const RIDGES = {
	count: 10,
	/** the horizon ridge's --layer-depth */
	farDepth: 0.21,
	/** the frontmost ridge's --layer-depth */
	nearDepth: 0.93,
	/** how far a far ridge's fill washes toward the sky colour */
	haze: 0.8,
	/** contrast against the sky - maps 1:1 onto the alpha ramp it replaced */
	weight: 0.25,
	/** px of vertical rise at depth 1, at the reference width (locked #59) */
	riseAtDepth1: 160,
	/** viewport width the travel is authored against; narrower scales down */
	referenceWidth: 1440,
	/** darkening toward the viewer: shadeBase + t * shadeGain toward black */
	shadeBase: 0.1,
	shadeGain: 0.3,
	/** composite coverage per ridge: (coverBase + t * coverGain) * weight */
	coverBase: 0.55,
	coverGain: 0.35,
};

export type RidgeSpec = {
	index: number;
	/** 0 at the horizon ridge, 1 at the frontmost */
	t: number;
	/** --layer-depth: parallax rate, dive zoom, paint order */
	depth: number;
	/** silhouette box height, vh (far ridges tall, near ridges low) */
	heightVh: number;
	/** pixel-crisp silhouette path, viewBox 0 0 1000 400 */
	d: string;
	/** the crest polyline (top edge), for members planted on the ridge (#82) */
	crest: { x: number; y: number }[];
};

// Diagonal slopes with flat runs between them - the vocabulary of the shipped
// landscape path. Far ridges sit high and jagged (they read as the horizon),
// near ridges low and gentle. Deterministic: SSR and client markup must match.
function ridgeGeometry(
	seed: number,
	roughness: number,
): { d: string; crest: { x: number; y: number }[] } {
	const rand = mulberry32(seed);
	const parts: string[] = [];
	const crest: { x: number; y: number }[] = [];
	let x = 0;
	let y = 150 + rand() * 90;
	parts.push(`M0 400V${y.toFixed(0)}`);
	crest.push({ x: 0, y: Math.round(y) });
	while (x < 1000) {
		const run = 40 + rand() * 120;
		const slope = 50 + rand() * 130;
		const dy = (rand() - 0.5) * 2 * roughness;
		const ny = Math.max(50, Math.min(370, y + dy));
		const sx = Math.min(1000 - x, slope);
		parts.push(`l${sx.toFixed(0)} ${(ny - y).toFixed(0)}`);
		x += sx;
		y = ny;
		crest.push({ x: Math.round(x), y: Math.round(y) });
		if (x >= 1000) break;
		const rx = Math.min(1000 - x, run);
		parts.push(`h${rx.toFixed(0)}`);
		x += rx;
		crest.push({ x: Math.round(x), y: Math.round(y) });
	}
	parts.push("V400", "H0", "Z");
	return { d: parts.join(""), crest };
}

/** The ten ridges, farthest (index 0) to nearest. Module-level constant data. */
export function ridgeSpecs(): RidgeSpec[] {
	const n = RIDGES.count;
	return Array.from({ length: n }, (_, i) => {
		const t = n === 1 ? 0 : i / (n - 1);
		const depth = RIDGES.farDepth + (RIDGES.nearDepth - RIDGES.farDepth) * t;
		const geo = ridgeGeometry(0xa1e + i * 977, 140 - t * 110);
		return {
			index: i,
			t,
			depth,
			heightVh: 44 - t * 30,
			d: geo.d,
			crest: geo.crest,
		};
	});
}

/**
 * One opaque fill per ridge, farthest first: aerial perspective against the
 * live sky, accumulated from the horizon forward. Where ridge i is the
 * frontmost one covering a pixel, ridges 0..i sit under it, so its fill is
 * the composite of all of them over the sky.
 */
export function ridgeFillsAt(sky: RGB, land: RGB): RGB[] {
	const n = RIDGES.count;
	let acc = sky;
	return Array.from({ length: n }, (_, i) => {
		const t = n === 1 ? 0 : i / (n - 1);
		const wash = RIDGES.haze * (1 - t);
		const tone = lerpRgb(land, sky, wash);
		const dark = lerpRgb(
			tone,
			{ r: 0, g: 0, b: 0 },
			RIDGES.shadeBase + t * RIDGES.shadeGain,
		);
		acc = lerpRgb(
			acc,
			dark,
			clamp01((RIDGES.coverBase + t * RIDGES.coverGain) * RIDGES.weight),
		);
		return acc;
	});
}

// ---------------------------------------------------------------------------
// Mist: the veils locked on wayfinder #79, built on #84. Mist is interleaved,
// not overlaid: each veil group is slotted into a GAP of the ridge ladder and
// painted at the gap's midpoint depth, so the front ridge's peaks cut across
// it and the veil reads as hanging in that valley (the fix for the pass-2
// floating stripes).
//
// Shape language is stacked bars: the same flattened body three times with
// falling fill-opacity - softness from the stacking, edges pixel-crisp (the
// brief-#77 vapor exception is used for alpha only, never soft edges). Sway
// and the breathe oscillation both run on the CSS clock, so mist motion
// survives an open subpage (#60). The driver only gates presence x alpha,
// activation and one sky-derived fill per group.
//
// Day plan C: far and mid gaps carry a thin valley haze from the noon hero,
// then all three groups own the sunset-to-dusk band; every window closes by
// 0.72, before the stars own the sky.
// ---------------------------------------------------------------------------

export type MistGroup = {
	/** ridge-ladder gap index: the veil paints between ridge gap and gap+1 */
	gap: number;
	/** the #61 windows[] shape - presence is the max over them */
	windows: SceneWindow[];
	/** rendered veils; all active while any window is open */
	count: number;
	/** layer opacity ceiling: presence x alpha, inside the brief's ~0.5 cap */
	alpha: number;
	/** nominal veil height, vh (randomized ±20% per element) */
	height: number;
	/** veil bottom as a fraction of the front ridge's height (0.5 = half-buried) */
	lift: number;
	/** nominal veil width, vw (randomized ±25% per element) */
	width: number;
	/** 0..1 sway speed; higher = wider and quicker sway */
	speed: number;
};

export const MIST_GROUP_KEYS = ["far", "mid", "near"] as const;
export type MistGroupKey = (typeof MIST_GROUP_KEYS)[number];

// The #79 settings seed (.prototypes/scene-mist-veils.html, preset C).
export const MIST: {
	/** the slow opacity oscillation on top of the sway */
	breathe: boolean;
	groups: Record<MistGroupKey, MistGroup>;
} = {
	breathe: true,
	groups: {
		far: {
			gap: 2,
			windows: [
				{ start: 0, rampIn: 0, end: 0.14, rampOut: 0.06 },
				{ start: 0.44, rampIn: 0.07, end: 0.72, rampOut: 0.07 },
			],
			count: 2,
			alpha: 0.4,
			height: 9,
			lift: 0.5,
			width: 62,
			speed: 0.12,
		},
		mid: {
			gap: 4,
			windows: [
				{ start: 0, rampIn: 0, end: 0.1, rampOut: 0.05 },
				{ start: 0.46, rampIn: 0.07, end: 0.7, rampOut: 0.07 },
			],
			count: 2,
			alpha: 0.3,
			height: 7,
			lift: 0.55,
			width: 48,
			speed: 0.16,
		},
		near: {
			gap: 6,
			windows: [{ start: 0.5, rampIn: 0.06, end: 0.68, rampOut: 0.06 }],
			count: 1,
			alpha: 0.32,
			height: 6,
			lift: 0.6,
			width: 44,
			speed: 0.2,
		},
	},
};

// Veil bodies, viewBox 0 0 200 40, preserveAspectRatio none - the flattened
// cloud family from the #79 walk. Three bodies give per-element variety.
export const VEIL_BODIES = [
	"M0 10h200v9H0zM24 26h140v7H24z",
	"M0 6h200v7H0zM0 19h150v7H0zM56 32h144v6H56z",
	"M0 12h56v9H0zM68 12h44v9H68zM124 8h76v9h-76zM40 27h96v8H40z",
] as const;

// The stacked-bar offsets: the same body three times, back to front, with
// falling fill-opacity (#79's signed-off shape language).
export const VEIL_STACK = [
	{ transform: "translate(0 -6) scale(1.06 1)", fillOpacity: 0.3 },
	{ transform: "translate(-6 0)", fillOpacity: 0.55 },
	{ transform: "translate(4 5) scale(0.96 1)", fillOpacity: 1 },
] as const;

/** A veil group's --layer-depth: the midpoint of its ridge gap (#79). */
export function mistGroupDepth(key: MistGroupKey): number {
	const specs = ridgeSpecs();
	const gap = MIST.groups[key].gap;
	return ((specs[gap]?.depth ?? 0) + (specs[gap + 1]?.depth ?? 0)) / 2;
}

export type MistElementSeed = {
	leftVw: number;
	bottomVh: number;
	widthVw: number;
	heightVh: number;
	/** which VEIL_BODIES entry this veil draws */
	body: number;
	/** sway amplitude, px */
	ampPx: number;
	/** sway half-period, seconds, wall clock (alternate direction) */
	swayDurS: number;
	/** negative delay so the group sways out of phase from frame one */
	delayS: number;
};

/**
 * The per-element geometry of one veil group. Seeded per group (the exact
 * prototype seeds, so the shipped art IS the walked art) - SSR and client
 * markup must match (#418). `lift` places the veil's bottom against the front
 * ridge's height, so the veil hangs half-buried behind that crest.
 */
export function mistPool(key: MistGroupKey): MistElementSeed[] {
	const g = MIST.groups[key];
	const frontHeightVh = ridgeSpecs()[g.gap + 1]?.heightVh ?? 30;
	const rnd = mulberry32(0x0f06 + key.length * 5099 + g.gap * 131);
	return Array.from({ length: g.count }, (_, i) => {
		const widthVw = g.width * (0.75 + rnd() * 0.5);
		const heightVh = g.height * (0.8 + rnd() * 0.4);
		const leftVw = rnd() * Math.max(4, 100 - widthVw);
		const bottomVh = frontHeightVh * g.lift + (rnd() - 0.5) * 2;
		const ampPx = 12 + g.speed * 90 * (0.75 + rnd() * 0.5);
		const swayDurS = (70 - g.speed * 40) * (0.8 + rnd() * 0.5);
		return {
			leftVw,
			bottomVh,
			widthVw,
			heightVh,
			body: (i + g.gap) % VEIL_BODIES.length,
			ampPx,
			swayDurS,
			delayS: -(rnd() * swayDurS),
		};
	});
}

// Mist tone is the cloud formula pulled slightly toward the dusk silhouette,
// so a veil sits AMONG the mountains instead of reading as a fallen cloud
// (#79; brief #77 rule 3: no hand-picked colour).
const MIST_WHITE: RGB = { r: 252, g: 252, b: 254 };

export function mistFillAt(sky: RGB, depth: number): RGB {
	const washT = clamp01(0.7 * (1 - depth * 0.6));
	const tone = lerpRgb(MIST_WHITE, sky, washT);
	const duskT = clamp01(1 - lum(sky) / lum(SKY_NOON));
	return lerpRgb(tone, lerpRgb(sky, CLOUD_DUSK_TINT, 0.4), duskT * 0.35);
}

// ---------------------------------------------------------------------------
// Schedule maths. Pure, unit-tested, shared by the driver, the markup, and
// (later) the authoring panel.
// ---------------------------------------------------------------------------

/** Presence with the edge ramps INSIDE the window - the #63 semantics. */
export function presenceAt(p: number, w: SceneWindow): number {
	if (p < w.start || p > w.end) return 0;
	let v = 1;
	if (w.rampIn > 0) v = Math.min(v, (p - w.start) / w.rampIn);
	if (w.rampOut > 0) v = Math.min(v, (w.end - p) / w.rampOut);
	return clamp01(v);
}

/** A member's windows[] presence: the max over them (#61, first used by mist). */
export function presenceOver(p: number, windows: SceneWindow[]): number {
	let v = 0;
	for (const w of windows) v = Math.max(v, presenceAt(p, w));
	return v;
}

/** Progress within a window, 0 at its start and 1 at its end. */
export function windowedOver(p: number, w: SceneWindow): number {
	const span = w.end - w.start;
	return span > 0 ? clamp01((p - w.start) / span) : 0;
}

/** Evaluate a track (2+ evenly spaced stops) at t in 0..1. */
export function trackAt(track: Track, t: number): number {
	if (typeof track === "number") return track;
	const first = track[0] ?? 0;
	if (track.length === 1) return first;
	const seg = (track.length - 1) * clamp01(t);
	const i = Math.min(track.length - 2, Math.floor(seg));
	const a = track[i] ?? first;
	const b = track[i + 1] ?? a;
	return a + (b - a) * (seg - i);
}

/** Max pool size a count track ever asks for (prefix activation, #61). */
export function poolSize(track: Track): number {
	if (typeof track === "number") return Math.max(1, Math.round(track));
	return Math.max(1, ...track.map((v) => Math.round(v)));
}

// Deterministic PRNG (mulberry32): pools are generated identically on the
// server and the client so SSR HTML and the first client render match (the
// same reason the star field is seeded - see PixelBackground).
export function mulberry32(seed: number): () => number {
	let a = seed;
	return () => {
		a |= 0;
		a = (a + 0x6d2b79f5) | 0;
		let t = Math.imul(a ^ (a >>> 15), 1 | a);
		t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
	};
}

export type CloudElementSeed = {
	leftPct: number;
	topPct: number;
	widthPx: number;
	heightPx: number;
	/** wrap-crossing duration, seconds, wall clock */
	durS: number;
	/** negative delay distributing phase uniformly across the crossing */
	delayS: number;
};

/**
 * The per-element geometry of one cloud type's pool. Seeded per type so the
 * markup (which renders the pool once) and any later consumer agree. Duration
 * scales with depth - nearer types cross faster - and the negative delay
 * spreads the pool across the whole crossing from frame one.
 */
export function cloudPool(key: CloudTypeKey): CloudElementSeed[] {
	const t = CLOUDSCAPE.types[key];
	const rnd = mulberry32(
		0xc10d + key.length * 7919 + Math.round(t.depth * 997),
	);
	return Array.from({ length: poolSize(t.count) }, () => {
		const widthPx = t.size * (0.75 + rnd() * 0.5);
		const leftPct = rnd() * 88;
		const topPct = t.band[0] + rnd() * Math.max(1, t.band[1] - t.band[0]);
		const durMul = (1.6 - t.depth) * (0.8 + rnd() * 0.5);
		// Base 190 (was 150 pre-#64): with birds crossing in 30-90s, the near
		// clouds paced them and the sky raced. Clouds sit a step slower.
		const durS = (190 - t.speed * 110) * durMul;
		return {
			leftPct,
			topPct,
			widthPx,
			heightPx: widthPx * 0.6,
			durS,
			delayS: -(rnd() * durS),
		};
	});
}

// Cloud fill is always derived from the sky at the type's depth and time
// (brief #77): far clouds wash toward the sky, near clouds stay bright, dusk
// pulls all of them toward silhouette.
const CLOUD_WHITE: RGB = { r: 250, g: 250, b: 252 };
const CLOUD_DUSK_TINT: RGB = { r: 10, g: 8, b: 24 };
const lum = (c: RGB) => (0.2126 * c.r + 0.7152 * c.g + 0.0722 * c.b) / 255;

export function cloudFillAt(sky: RGB, depth: number): RGB {
	const washT = clamp01(CLOUDSCAPE.skyWash * (1 - depth * 0.85));
	const tone = lerpRgb(CLOUD_WHITE, sky, washT);
	const duskT = clamp01(1 - lum(sky) / lum(SKY_NOON));
	return lerpRgb(
		tone,
		lerpRgb(sky, CLOUD_DUSK_TINT, 0.55),
		duskT * CLOUDSCAPE.duskShade * (0.4 + depth * 0.6),
	);
}

// ---------------------------------------------------------------------------
// Birds: the three-species relay locked on wayfinder #80, built on #64. Like
// clouds, birds fan out of the member table into typed pools with their own
// windows: the far speck line opens at hero and stays through most of the day,
// the swift blends in over it for the middle stretch, the songbird arrives
// last - small and washed far back. Every window's ramps span the outer third
// of the window (#80: the default fifth read as sudden); the layer opacity
// follows presence, so arrivals ease in.
//
// A flight is a full-viewport wrapper crossing the sky on the CSS clock (the
// #60 rule), carrying a formation of birds. Each bird is a stack of pose paths
// hard-cut by generated step-end keyframes: N flap beats, then a glide hold
// (see birdFlapCss). Sprites are ASCII pixel grids compiled to unit-rect runs
// (gridPath), so shape-rendering stays crisp and redrawing a pose is editing
// text. The driver only gates presence, count and one derived fill per
// species; motion never touches it.
// ---------------------------------------------------------------------------

export type BirdSprite = {
	w: number;
	h: number;
	/** pose grids: wings up / level / wings down / glide (glide optional) */
	poses: string[][];
};

export type BirdSpecies = {
	window: SceneWindow;
	/** rendered flight pool; live count scales with presence */
	flights: number;
	/** formation offsets per flight: [x, y, scale] in multiples of bird size */
	formation: [number, number, number][];
	/** seconds per wing cycle (four step-end sub-frames) */
	beat: number;
	/** wing cycles before the glide hold */
	flapBeats: number;
	/** beats the glide pose holds */
	glideBeats: number;
	/** nominal sky-crossing duration, seconds, wall clock */
	crossS: number;
	/**
	 * One direction per species (the walk: mixed directions inside a type read
	 * as chaos). true = with the wind, the clouds' left-to-right drift.
	 */
	rightward: boolean;
	/** layer opacity ceiling: presence x alpha, the subtlety instrument */
	alpha: number;
	/** vertical travel composed inside the crossing */
	path: "straight" | "bob" | "swoop";
	/** nominal bird width in vmin (formation scales apply on top) */
	size: number;
	/** --layer-depth for parallax + the dive */
	depth: number;
	/** home altitude, vh from the viewport bottom */
	yVh: number;
	/** per-flight altitude scatter, vh */
	spreadVh: number;
	sprite: BirdSprite;
};

export const BIRD_SPECIES_KEYS = ["speck", "swift", "songbird"] as const;
export type BirdSpeciesKey = (typeof BIRD_SPECIES_KEYS)[number];

// The #80 settings seed, tuned on the in-app walks (2026-08-02): fewer
// flights and smaller formations (the seed read as too much happening), one
// direction per species, a per-species alpha so the further species stay
// subtle, and the relay stretched by ~0.04 (birds left the sky too early on
// scroll). Gull and raptor were cut on the #80 walk; their sprites stay in
// .prototypes/scene-birds.html if a later pass wants them.
export const BIRDS: Record<BirdSpeciesKey, BirdSpecies> = {
	speck: {
		// Opens at 0 with no ramp-in: the hero's occasional bird is already there.
		window: { start: 0, rampIn: 0, end: 0.46, rampOut: 0.153 },
		flights: 2,
		formation: [
			[0, 0, 1],
			[1.6, 0.2, 0.92],
			[-1.6, 0.25, 0.92],
		],
		beat: 1.0,
		flapBeats: 4,
		glideBeats: 2,
		crossS: 90,
		rightward: true,
		alpha: 1,
		path: "straight",
		size: 2.4,
		depth: 0.18,
		yVh: 78,
		spreadVh: 8,
		sprite: {
			w: 7,
			h: 5,
			poses: [
				["#.....#", ".#...#.", "..#.#..", "...#...", "......."],
				[".......", "#.....#", ".##.##.", "...#...", "......."],
				[".......", "...#...", "..#.#..", ".#...#.", "#.....#"],
			],
		},
	},
	swift: {
		window: { start: 0.1, rampIn: 0.1, end: 0.4, rampOut: 0.1 },
		flights: 2,
		formation: [
			[0, 0, 1],
			[1.8, -0.9, 0.8],
			[-1.5, 0.8, 0.88],
		],
		beat: 0.38,
		flapBeats: 6,
		glideBeats: 2,
		crossS: 30,
		// The one species against the wind: the darting silhouette carries it,
		// and "mostly with the wind" keeps the cast from reading monotone.
		rightward: false,
		alpha: 0.85,
		path: "swoop",
		size: 3.8,
		depth: 0.28,
		yVh: 68,
		spreadVh: 10,
		sprite: {
			w: 18,
			h: 10,
			poses: [
				[
					"....##............",
					".....##...........",
					".....###..........",
					"......###.........",
					".......###........",
					"..##..###########.",
					"....##########....",
					"..................",
					"..................",
					"..................",
				],
				[
					"..................",
					"..................",
					"..................",
					".#####............",
					"..########........",
					"..##..###########.",
					"....##########....",
					"..................",
					"..................",
					"..................",
				],
				[
					"..................",
					"..................",
					"..................",
					"..................",
					"..................",
					"..##..###########.",
					"....##########....",
					".......####.......",
					"......###.........",
					".....##...........",
				],
				[
					"..................",
					"..................",
					"..................",
					"..................",
					".####........####.",
					"...##############.",
					".....#########....",
					"..................",
					"..................",
					"..................",
				],
			],
		},
	},
	songbird: {
		window: { start: 0.28, rampIn: 0.093, end: 0.56, rampOut: 0.093 },
		flights: 2,
		formation: [
			[0, 0, 1],
			[-1.5, 0.8, 0.88],
		],
		beat: 0.26,
		flapBeats: 5,
		glideBeats: 3,
		crossS: 34,
		rightward: true,
		alpha: 0.7,
		path: "bob",
		size: 2.6,
		depth: 0.3,
		yVh: 55,
		spreadVh: 12,
		sprite: {
			w: 13,
			h: 10,
			poses: [
				[
					".....##......",
					".....###.....",
					"......##.....",
					"....######...",
					".##########..",
					"###########.#",
					".#########...",
					"...######....",
					".............",
					".............",
				],
				[
					".............",
					".............",
					".............",
					"..########...",
					".##########..",
					"###########.#",
					".#########...",
					"...######....",
					".............",
					".............",
				],
				[
					".............",
					".............",
					".............",
					"....######...",
					".##########..",
					"###########.#",
					".#########...",
					"...######....",
					"......###....",
					".......##....",
				],
				[
					".............",
					".............",
					".............",
					"....#####....",
					"..#########..",
					"###########.#",
					"..########...",
					"....#####....",
					".............",
					".............",
				],
			],
		},
	},
};

/**
 * Compile an ASCII pose grid into one path of unit-rect runs ('#' is a filled
 * cell), so a pixel sprite stays a single crisp path.
 */
export function gridPath(rows: string[]): string {
	const parts: string[] = [];
	rows.forEach((row, y) => {
		let x = 0;
		while (x < row.length) {
			if (row[x] === "#") {
				let len = 0;
				while (row[x + len] === "#") len++;
				parts.push(`M${x} ${y}h${len}v1h${-len}z`);
				x += len;
			} else x++;
		}
	});
	return parts.join("");
}

// The bird silhouette: the sky pushed dark with its hue kept, then washed back
// toward the sky by distance - aerial perspective on a dark object (brief #77
// rule 3: no hand-picked bird colour).
export function birdFillAt(sky: RGB, depth: number): RGB {
	const hsl = rgbToHsl(sky);
	hsl.l = Math.min(hsl.l, 0.2);
	hsl.s = hsl.s * 0.55;
	const dark = hslToRgb(hsl);
	return lerpRgb(sky, dark, clamp01(0.3 + depth * 0.62));
}

export type BirdInFlightSeed = {
	/** offset from the flight origin, % of the viewport width */
	leftPct: number;
	/** altitude, vh from the viewport bottom */
	bottomVh: number;
	widthVmin: number;
	heightVmin: number;
	/** negative flap-phase delay so a flock beats together, offset a touch */
	flapDelayS: number;
};

export type BirdFlightSeed = {
	/** crossing duration, seconds, wall clock (nominal crossS ±15%) */
	durS: number;
	/** negative delay distributing phase uniformly across the crossing */
	delayS: number;
	/** vertical-path cycle, seconds (bob/swoop only) */
	pathDurS: number;
	pathDelayS: number;
	/** vertical-path amplitude, vh (bob/swoop only) */
	pathAmpVh: number;
	birds: BirdInFlightSeed[];
};

/**
 * The per-flight geometry of one species' pool. Seeded per species so SSR and
 * client markup match (#418), like cloudPool. The negative crossing delay
 * spreads flights across the whole sky from frame one.
 */
export function birdPool(key: BirdSpeciesKey): BirdFlightSeed[] {
	const sp = BIRDS[key];
	const rnd = mulberry32(0xb12d + key.length * 131);
	return Array.from({ length: sp.flights }, () => {
		const flightY = sp.yVh + (rnd() - 0.5) * sp.spreadVh;
		const delayS = -(rnd() * sp.crossS);
		const pathDurS = 3 + rnd() * 3;
		const pathDelayS = -(rnd() * pathDurS);
		const pathAmpVh = 1.2 + rnd() * 1.6;
		const durS = sp.crossS * (0.85 + rnd() * 0.3);
		const ar = sp.sprite.h / sp.sprite.w;
		return {
			durS,
			delayS,
			pathDurS,
			pathDelayS,
			pathAmpVh,
			birds: sp.formation.map(([ox, oy, scale]) => {
				const widthVmin = sp.size * scale;
				return {
					leftPct: ox * widthVmin * 0.9,
					bottomVh: flightY - oy * widthVmin * 0.5,
					widthVmin,
					heightVmin: widthVmin * ar,
					flapDelayS: -(rnd() * sp.beat),
				};
			}),
		};
	});
}

/**
 * The generated wingbeat CSS for every species: per pose, step-end keyframes
 * that hard-cut through flapBeats wing cycles (up, level, down, level) and
 * then hold the glide pose for glideBeats. Deterministic, so the same <style>
 * text renders on the server and the client.
 */
export function birdFlapCss(): string {
	let out = "";
	for (const key of BIRD_SPECIES_KEYS) {
		const sp = BIRDS[key];
		const poseCount = sp.sprite.poses.length;
		const glidePose = poseCount > 3 ? 3 : 1;
		const seq: number[] = [];
		for (let b = 0; b < sp.flapBeats; b++) seq.push(0, 1, 2, 1);
		const sub = sp.beat / 4;
		const flapDur = seq.length * sub;
		const total = flapDur + sp.glideBeats * sp.beat;
		const segs = seq.map((pose, i) => ({ start: i * sub, pose }));
		if (sp.glideBeats > 0) segs.push({ start: flapDur, pose: glidePose });
		const last = segs[segs.length - 1];
		for (let p = 0; p < poseCount; p++) {
			const stops: { at: number; vis: number }[] = [];
			for (let i = 0; i < segs.length; i++) {
				const seg = segs[i];
				const prevSeg = segs[i - 1];
				if (!seg) continue;
				const vis = seg.pose === p ? 1 : 0;
				const prev =
					i === 0 ? (last?.pose === p ? 1 : 0) : prevSeg?.pose === p ? 1 : 0;
				if (i === 0 || vis !== prev) stops.push({ at: seg.start / total, vis });
			}
			const first = stops[0];
			if (!first || first.at > 0)
				stops.unshift({ at: 0, vis: last?.pose === p ? 1 : 0 });
			const frames = stops
				.map((s) => `${(s.at * 100).toFixed(3)}% { opacity: ${s.vis}; }`)
				.join(" ");
			out += `@keyframes bird-flap-${key}-p${p} { ${frames} 100% { opacity: ${stops[0]?.vis ?? 0}; } }\n`;
			out += `.bird-el--${key} .bird-pose:nth-child(${p + 1}) { animation: bird-flap-${key}-p${p} ${total.toFixed(3)}s step-end infinite; animation-delay: var(--fdel, 0s); }\n`;
		}
	}
	return out;
}
