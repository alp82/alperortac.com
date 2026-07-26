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
import { cloudTransform } from "./journeyValues";

export type JourneyTargets = {
	sky: HTMLElement | null;
	stars: HTMLElement | null;
	shoot: HTMLElement | null;
	sun: HTMLElement | null;
	moon: HTMLElement | null;
	/** the atmosphere toy's optional companion moon */
	moon2: HTMLElement | null;
	/** one per CLOUDS entry, in order */
	clouds: Array<SVGElement | null>;
	land: HTMLElement | null;
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
		shoot: null,
		sun: null,
		moon: null,
		moon2: null,
		clouds: [],
		land: null,
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
	if (t.shoot) t.shoot.style.opacity = `${v.shootO}`;

	placeBody(t.sun, v.sun);
	placeBody(t.moon, v.moon);
	placeBody(t.moon2, v.moon);

	t.clouds.forEach((el, i) => {
		if (el) el.style.transform = cloudTransform(i, v.cloudPos);
	});
	if (t.land) t.land.style.opacity = `${v.landO}`;

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
