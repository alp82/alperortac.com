// The elements the journey writes to, and the write itself.
//
// Why direct property writes rather than CSS custom properties on :root -
// measured on the landing page (3437 nodes, 1512x945, Chrome 150):
//
//   20 scroll-driven vars on <html>          3437 nodes invalidated   17.4ms/frame
//   same vars on the .dive-scene subtree      180 nodes invalidated    1.8ms/frame
//   real properties on these ~18 elements      ~18 nodes invalidated   0.2ms/frame
//
// Custom properties inherit, so a write on the root invalidates computed style
// for the whole document. At 17.4ms that is the entire 60fps budget spent on
// style recalculation before anything is drawn - it was 57% of all main-thread
// work during a scroll. Registering the properties with `inherits: false` does
// not help; Chrome invalidates the subtree regardless.
//
// The markup still carries `var(--sky-now, ...)` style references. Those are the
// pre-hydration seed: the boot script (skyBoot.ts) sets those vars before the
// first paint on a cold deep-link, and this driver takes over afterwards. Any
// re-render restores the var reference, so every consumer re-asserts the current
// frame from a layout effect (see `useJourneyRepaint`).

import type { JourneyValues } from "./journeyValues";

// A scheduled pool: the max count is rendered once, element i is active when
// i < count (prefix activation, wayfinder #61). `applied` caches the last
// count written, so the class flips touch only the elements that changed; a
// remount re-registers the pool and resets it. An inactive element carries
// .scene-off - paused and hidden - so it leaves the style budget for real.
export type ScenePool = {
	els: HTMLElement[];
	applied: number;
};

export type CloudTypeTargets = ScenePool & {
	layer: HTMLElement;
	paths: SVGPathElement[];
	appliedFill: string;
};

// A bird species layer: the pool elements are the flight wrappers, and the
// fill lands once on the layer's `color` (pose paths use currentColor), so a
// fill change touches one element instead of every path.
export type BirdSpeciesTargets = ScenePool & {
	layer: HTMLElement;
	appliedFill: string;
};

// A mist group layer (#84): like a cloud type, plus the group's gap depth -
// a veil hangs in a ridge-ladder valley, so its layer rides the SAME vertical
// parallax as the ridges (on the `translate` longhand, the scroll channel) or
// the veil would detach from its gap during the rise. Fill lands on every
// stacked-bar path; per-path fill-opacity is markup and never written here.
export type MistGroupTargets = ScenePool & {
	layer: HTMLElement;
	paths: SVGPathElement[];
	depth: number;
	appliedFill: string;
};

// A firefly group layer (#85): a gap dweller like the mist, so it rides the
// SAME vertical parallax as the ridges at its gap depth. No fill target - the
// warm colour is fixed markup (the emitter exemption). The driver instead
// writes one `--ff-night` per group: the halo-strength dusk factor.
export type FireflyGroupTargets = ScenePool & {
	layer: HTMLElement;
	depth: number;
	appliedNight: string;
};

// A ridge layer (#62): the driver writes the parallax offset on the layer's
// `translate` longhand (the scroll channel, #59 - it composes with the dive's
// `transform`) and one opaque fill on the silhouette path + the base strip
// below it. Depth is captured at registration so applyJourney needs no data
// import. Fills override the markup's pre-hydration `var(--ridge<i>-f)` seed,
// exactly like the sky's backgroundColor write.
export type RidgeTargets = {
	layer: HTMLElement;
	path: SVGPathElement;
	base: HTMLElement;
	depth: number;
	appliedFill: string;
};

function activate(pool: ScenePool, count: number): void {
	if (pool.applied === count) return;
	const lo = Math.min(pool.applied < 0 ? 0 : pool.applied, count);
	const hi = pool.applied < 0 ? pool.els.length : Math.max(pool.applied, count);
	for (let i = lo; i < hi; i++) {
		pool.els[i]?.classList.toggle("scene-off", i >= count);
	}
	pool.applied = count;
}

export type JourneyTargets = {
	sky: HTMLElement | null;
	stars: HTMLElement | null;
	/** the star pool inside the stars layer (prefix activation) */
	starPool: ScenePool | null;
	shoot: HTMLElement | null;
	sun: HTMLElement | null;
	moon: HTMLElement | null;
	/** the atmosphere toy's optional companion moon */
	moon2: HTMLElement | null;
	/** one per CLOUD_TYPE_KEYS entry, in order */
	cloudTypes: Array<CloudTypeTargets | null>;
	/** one per BIRD_SPECIES_KEYS entry, in order */
	birdSpecies: Array<BirdSpeciesTargets | null>;
	/** one per MIST_GROUP_KEYS entry, in order */
	mistGroups: Array<MistGroupTargets | null>;
	/** one per FIREFLY_GROUP_KEYS entry, in order */
	fireflyGroups: Array<FireflyGroupTargets | null>;
	/** one per ridge, farthest first (#62) */
	ridges: Array<RidgeTargets | null>;
	mmBand: HTMLElement | null;
	mmDim: HTMLElement | null;
	mmInd: HTMLElement | null;
	mmSun: HTMLElement | null;
	mmMoon: HTMLElement | null;
	/** one per WORDS entry, in order */
	words: Array<HTMLElement | null>;
};

export function createJourneyTargets(): JourneyTargets {
	return {
		sky: null,
		stars: null,
		starPool: null,
		shoot: null,
		sun: null,
		moon: null,
		moon2: null,
		cloudTypes: [],
		birdSpecies: [],
		mistGroups: [],
		fireflyGroups: [],
		ridges: [],
		mmBand: null,
		mmDim: null,
		mmInd: null,
		mmSun: null,
		mmMoon: null,
		words: [],
	};
}

/** Position a celestial body: left/top + fade. Its centring transform is CSS. */
function placeBody(
	el: HTMLElement | null,
	p: { x: number; y: number; o: number },
) {
	if (!el) return;
	el.style.left = `${p.x}%`;
	el.style.top = `${p.y}%`;
	el.style.opacity = `${p.o}`;
}

export function applyJourney(v: JourneyValues, t: JourneyTargets): void {
	if (t.sky) t.sky.style.backgroundColor = v.sky;
	// The void the dive's 3D transform can expose at the landscape edges.
	document.body.style.backgroundColor = v.sky;

	if (t.stars) t.stars.style.opacity = `${v.starsO}`;
	if (t.starPool) activate(t.starPool, v.starCount);
	if (t.shoot) t.shoot.style.opacity = `${v.shootO}`;

	placeBody(t.sun, v.sun);
	placeBody(t.moon, v.moon);
	placeBody(t.moon2, v.moon);

	// Per cloud type: presence x alpha on the layer, count activation into the
	// pool, one derived fill, and the day-end sink on the `translate` longhand
	// (the scroll channel from #59 - it composes with the dive's `transform`).
	// Drift itself is a CSS keyframe on each element and is never written here.
	t.cloudTypes.forEach((ct, i) => {
		const c = v.clouds[i];
		if (!ct || !c) return;
		ct.layer.style.opacity = `${c.o}`;
		ct.layer.style.translate =
			c.sinkY === 0 ? "" : `0px ${c.sinkY.toFixed(2)}px`;
		activate(ct, c.count);
		if (ct.appliedFill !== c.fill) {
			for (const p of ct.paths) p.setAttribute("fill", c.fill);
			ct.appliedFill = c.fill;
		}
	});
	// Per bird species: presence on the layer, live-flight activation into the
	// pool, one derived fill on the layer's color. Crossing, vertical path and
	// wingbeat are CSS keyframes and are never written here (#60).
	t.birdSpecies.forEach((bs, i) => {
		const b = v.birds[i];
		if (!bs || !b) return;
		bs.layer.style.opacity = `${b.o}`;
		activate(bs, b.count);
		if (bs.appliedFill !== b.fill) {
			bs.layer.style.color = b.fill;
			bs.appliedFill = b.fill;
		}
	});
	// Per mist group: presence x alpha on the layer, activation into the veil
	// pool, one derived fill, and the ridge parallax at the group's gap depth
	// (a veil must rise with the valley it hangs in). Sway and breathe are CSS
	// keyframes and are never written here (#60).
	t.mistGroups.forEach((mg, i) => {
		const m = v.mist[i];
		if (!mg || !m) return;
		mg.layer.style.opacity = `${m.o}`;
		const py = -v.ridgeRise * mg.depth;
		mg.layer.style.translate = py === 0 ? "" : `0px ${py.toFixed(2)}px`;
		activate(mg, m.count);
		if (mg.appliedFill !== m.fill) {
			for (const p of mg.paths) p.setAttribute("fill", m.fill);
			mg.appliedFill = m.fill;
		}
	});
	// Per firefly group: presence on the layer, activation into the fly pool,
	// the ridge parallax at the group's gap depth (a gap dweller must ride the
	// valley it hangs in, #84's rule), and the `--ff-night` halo strength. The
	// warm colour is fixed markup; wander and blink are CSS keyframes and are
	// never written here (#60).
	t.fireflyGroups.forEach((fg, i) => {
		const f = v.fireflies[i];
		if (!fg || !f) return;
		fg.layer.style.opacity = `${f.o}`;
		const py = -v.ridgeRise * fg.depth;
		fg.layer.style.translate = py === 0 ? "" : `0px ${py.toFixed(2)}px`;
		activate(fg, f.count);
		const night = v.fireflyNight.toFixed(3);
		if (fg.appliedNight !== night) {
			fg.layer.style.setProperty("--ff-night", night);
			fg.appliedNight = night;
		}
	});
	// Per ridge: the vertical parallax offset on the `translate` longhand and
	// the accumulated aerial-perspective fill (#62). Fills only change with the
	// sky, so the write is cached like the cloud fills.
	t.ridges.forEach((r, i) => {
		if (!r) return;
		const py = -v.ridgeRise * r.depth;
		r.layer.style.translate = py === 0 ? "" : `0px ${py.toFixed(2)}px`;
		const fill = v.ridgeFills[i];
		if (fill && r.appliedFill !== fill) {
			r.path.style.fill = fill;
			r.base.style.backgroundColor = fill;
			r.appliedFill = fill;
		}
	});

	// One transform shared by the three minimap layers that track the viewport.
	const mmT = `translateY(${v.mm.topPx}px)`;
	if (t.mmBand) {
		t.mmBand.style.transform = mmT;
		t.mmBand.style.backgroundColor = v.sky;
	}
	if (t.mmDim) t.mmDim.style.transform = mmT;
	if (t.mmInd) {
		t.mmInd.style.transform = mmT;
		t.mmInd.style.height = `${v.mm.hPct}%`;
	}
	placeBody(t.mmSun, { x: v.sun.x, y: v.mm.sunY, o: v.sun.o });
	placeBody(t.mmMoon, { x: v.moon.x, y: v.mm.moonY, o: v.moon.o });

	t.words.forEach((el, i) => {
		const w = v.words[i];
		if (!el || !w) return;
		el.style.fontSize = `${v.fontPx}px`;
		el.style.transform = `translate3d(0, ${w.ty}px, 0)`;
		el.style.opacity = `${w.o}`;
	});
}
