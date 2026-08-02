// Every scroll-linked value in the journey, as a pure function of scroll
// offset. No DOM, no React - so the whole day/night curve, the celestial arcs,
// the minimap indicator and the watermark drift are unit-testable in one place.
//
// Why this module exists: the journey used to be computed inside three
// components' render passes, driven by React state that changed on every scroll
// event. That cost a full-tree re-render per event. Now the maths lives here,
// the driver (useScrollJourney) samples it once per frame, and `applyJourney`
// writes the results straight onto the elements that consume them.

import type { CelestialState } from "../../../data/celestial";
import {
	BIRD_SPECIES_KEYS,
	BIRDS,
	birdFillAt,
	CLOUD_TYPE_KEYS,
	CLOUDSCAPE,
	cloudFillAt,
	LAND_DEFAULT,
	presenceAt,
	RIDGES,
	ridgeFillsAt,
	SCENE,
	trackAt,
	windowedOver,
} from "../../../data/scene";
import {
	type RGB,
	rgbToCss,
	type SkyAnchors,
	skyRgbAt,
} from "../../../data/skyCurve";
import {
	celestialPosition,
	MOON_WINDOW,
	moonOpacityAt,
	SUN_WINDOW,
	sunOpacityAt,
	windowedProgress,
} from "../../minimap/helpers";
import {
	driftOffset,
	letterSizePx,
	revealFactor,
	WM,
	WORDS,
	zoneOpacity,
} from "../../narrativeWatermark";

// ---------------------------------------------------------------------------
// Viewport / document metrics
//
// Cached and re-read only on resize or a document-height change - NEVER inside
// the scroll handler. Reading documentElement.scrollHeight there forced a
// synchronous layout on every scroll event, immediately after styles had been
// written: textbook layout thrash.
// ---------------------------------------------------------------------------

export type Metrics = {
	docH: number;
	winH: number;
	winW: number;
	/** max scrollable distance; 0 when the page does not scroll */
	max: number;
	/** winH / docH - drives the minimap's viewport-indicator height */
	viewportRatio: number;
};

export function readMetrics(): Metrics {
	const docH = document.documentElement.scrollHeight;
	const winH = window.innerHeight;
	const winW = window.innerWidth;
	return {
		docH,
		winH,
		winW,
		max: Math.max(0, docH - winH),
		viewportRatio: docH > 0 ? winH / docH : 0,
	};
}

export function sameMetrics(a: Metrics | null, b: Metrics): boolean {
	return !!a && a.docH === b.docH && a.winH === b.winH && a.winW === b.winW;
}

export function progressFor(scrollY: number, m: Metrics): number {
	return m.max > 0 ? Math.min(1, Math.max(0, scrollY / m.max)) : 0;
}

// ---------------------------------------------------------------------------
// Scheduled cast (wayfinder #65): the driver's per-member values, computed
// from the authored tables in src/data/scene.ts. Drift itself runs on the CSS
// clock; the driver only gates presence, count, fill and the day-end sink.
// ---------------------------------------------------------------------------

export type CloudTypeValues = {
	/** layer opacity: presence x the type's design alpha */
	o: number;
	/** active elements (prefix activation into the rendered pool) */
	count: number;
	/** css colour derived from the sky at the type's depth and time */
	fill: string;
	/** day-end sink, px, depth-scaled (#78 daySink) */
	sinkY: number;
};

export function cloudValuesAt(
	skyProgress: number,
	sky: { r: number; g: number; b: number },
): CloudTypeValues[] {
	return CLOUD_TYPE_KEYS.map((key) => {
		const t = CLOUDSCAPE.types[key];
		const pres = presenceAt(skyProgress, t.window);
		return {
			o: pres * t.alpha,
			count:
				pres > 0
					? Math.round(trackAt(t.count, windowedOver(skyProgress, t.window)))
					: 0,
			fill: rgbToCss(cloudFillAt(sky, t.depth)),
			sinkY: CLOUDSCAPE.daySink * skyProgress * t.depth,
		};
	});
}

export type BirdSpeciesValues = {
	/** layer opacity: presence (outer-third ramps, #80) x the species' alpha */
	o: number;
	/** live flights (prefix activation into the rendered flight pool) */
	count: number;
	/** css colour derived from the sky at the species' depth and time */
	fill: string;
};

export function birdValuesAt(
	skyProgress: number,
	sky: { r: number; g: number; b: number },
): BirdSpeciesValues[] {
	return BIRD_SPECIES_KEYS.map((key) => {
		const sp = BIRDS[key];
		const pres = presenceAt(skyProgress, sp.window);
		return {
			o: pres * sp.alpha,
			// At least one flight stays live through the ramps: count alone steps
			// in whole flights and reads sudden, so the layer fade carries the ramp.
			count: pres > 0 ? Math.max(1, Math.round(sp.flights * pres)) : 0,
			fill: rgbToCss(birdFillAt(sky, sp.depth)),
		};
	});
}

// ---------------------------------------------------------------------------
// Minimap masks
//
// The dim/band masks used to be rebuilt as two fresh gradient strings on every
// scroll tick. Their SHAPE only depends on the viewport ratio (i.e. resize);
// only their POSITION moves. So: build each once against a 300%-tall layer with
// the viewport window parked at 1/3 of its height, then translate that layer by
// `mm.topPx`. The gradient never re-rasterizes, it just moves.
//
// A 300% layer translated by topPx (which spans 0..H*(1-ratio)) always covers
// the container: its span is [topPx - H, topPx + 2H].
// ---------------------------------------------------------------------------

/** Fade distance at each edge of the viewport window, in % of the container. */
export const MASK_FADE_PCT = 20;
/** Where the window sits inside the 300%-tall mover, in % of the mover. */
export const MOVER_WINDOW_TOP_PCT = 100 / 3;
const MOVER_SCALE = 3;

function fadeStops(
	startPct: number,
	endPct: number,
	fadingToTransparent: boolean,
): string {
	const D = endPct - startPct;
	if (D <= 0) return "";
	const a1 = fadingToTransparent ? 0.8 : 0.2;
	const a2 = fadingToTransparent ? 0.2 : 0.8;
	return `rgba(0,0,0,${a1}) ${(startPct + D * 0.3).toFixed(2)}%, rgba(0,0,0,${a2}) ${(startPct + D * 0.7).toFixed(2)}%`;
}

function mask(
	vpTopPct: number,
	vpHeightPct: number,
	fade: number,
	inverted: boolean,
): string {
	const A1 = Math.max(0, vpTopPct - fade);
	const B1 = vpTopPct;
	const A2 = vpTopPct + vpHeightPct;
	const B2 = Math.min(100, vpTopPct + vpHeightPct + fade);
	const outside = inverted ? "transparent" : "black";
	const inside = inverted ? "black" : "transparent";
	const topInner = fadeStops(A1, B1, !inverted);
	const botInner = fadeStops(A2, B2, inverted);
	return `linear-gradient(to bottom, ${[
		`${outside} 0%`,
		`${outside} ${A1.toFixed(2)}%`,
		...(topInner ? [topInner] : []),
		`${inside} ${B1.toFixed(2)}%`,
		`${inside} ${A2.toFixed(2)}%`,
		...(botInner ? [botInner] : []),
		`${outside} ${B2.toFixed(2)}%`,
		`${outside} 100%`,
	].join(", ")})`;
}

/** Dim everything outside the viewport window. */
export function buildDimMask(vpTopPct: number, vpHeightPct: number): string {
	return mask(vpTopPct, vpHeightPct, MASK_FADE_PCT, false);
}

/** Show the live sky colour only inside the viewport window. */
export function buildBandMask(vpTopPct: number, vpHeightPct: number): string {
	return mask(vpTopPct, vpHeightPct, MASK_FADE_PCT, true);
}

/** The two static masks for the translated 300%-tall mover layers. */
export function moverMasks(viewportHeightPct: number): {
	dim: string;
	band: string;
} {
	const h = viewportHeightPct / MOVER_SCALE;
	const fade = MASK_FADE_PCT / MOVER_SCALE;
	return {
		dim: mask(MOVER_WINDOW_TOP_PCT, h, fade, false),
		band: mask(MOVER_WINDOW_TOP_PCT, h, fade, true),
	};
}

export function viewportHeightPctFor(m: Metrics | null): number {
	return Math.max((m?.viewportRatio ?? 0) * 100, 4);
}

// ---------------------------------------------------------------------------
// The frame
// ---------------------------------------------------------------------------

export type JourneyValues = {
	/** css colour for the sky, the body void and the minimap band */
	sky: string;
	sun: { x: number; y: number; o: number };
	moon: { x: number; y: number; o: number };
	starsO: number;
	/** active star count: thickens from phase2's start to the page bottom */
	starCount: number;
	shootO: number;
	/** one entry per CLOUD_TYPE_KEYS, in order */
	clouds: CloudTypeValues[];
	/** one entry per BIRD_SPECIES_KEYS, in order */
	birds: BirdSpeciesValues[];
	/** one opaque css fill per ridge, farthest first (accumulated composite) */
	ridgeFills: string[];
	/**
	 * Vertical parallax rise at depth 1, px (locked #59: vertical only, 160px
	 * against a 1440px reference, scaled by viewport width). A ridge at depth d
	 * translates by -rise x d; 0 under reduced motion.
	 */
	ridgeRise: number;
	mm: {
		topPct: number;
		hPct: number;
		topPx: number;
		sunY: number;
		moonY: number;
	};
	/** one entry per watermark word, in WORDS order */
	words: Array<{ ty: number; o: number }>;
	fontPx: number;
};

export type JourneyInput = {
	/**
	 * Sky-facing progress: raw scroll progress after the atmosphere toy's
	 * time-slice override. Drives the sky, the celestial bodies, the clouds, the
	 * landscape fade and the whole minimap - matching what these components were
	 * passed before (`scrollProgress={skyProgress}`).
	 */
	skyProgress: number;
	/** Raw scroll progress. The watermark is the only consumer. */
	rawProgress: number;
	scrollY: number;
	metrics: Metrics;
	celestial: CelestialState;
	anchors: SkyAnchors;
	/** the ridge base colour; the atmosphere toy's palettes override it */
	landscape?: RGB;
	/** prefers-reduced-motion: pins watermark drift + ridge parallax to 0 */
	reduceMotion: boolean;
};

export function computeJourney({
	skyProgress,
	rawProgress,
	scrollY,
	metrics: m,
	celestial,
	anchors,
	landscape = LAND_DEFAULT,
	reduceMotion,
}: JourneyInput): JourneyValues {
	const sunPos = celestialPosition(
		windowedProgress(skyProgress, SUN_WINDOW),
		celestial.sun,
	);
	const moonPos = celestialPosition(
		windowedProgress(skyProgress, MOON_WINDOW),
		celestial.moon,
	);
	const [phase2Start, phase2End] = celestial.curve.phase2;
	const skyRgb = skyRgbAt(skyProgress, celestial.curve, anchors);
	const starsO = clamp01(
		(skyProgress - phase2Start) / Math.max(phase2End - phase2Start, 0.001),
	);

	const topPct = skyProgress * (1 - m.viewportRatio) * 100;
	const hPct = viewportHeightPctFor(m);

	const fontPx = letterSizePx(m.winH, m.winW);
	const isMobile = m.winW <= WM.mobileMaxWidthPx;
	const travelPx = reduceMotion ? 0 : (WM.travelVh / 100) * m.winH;
	const scrolledVh = m.winH > 0 ? scrollY / m.winH : 0;

	return {
		sky: rgbToCss(skyRgb),
		sun: { x: sunPos.x, y: sunPos.y, o: sunOpacityAt(skyProgress) },
		moon: { x: moonPos.x, y: moonPos.y, o: moonOpacityAt(skyProgress) },
		starsO,
		// "More stars the more we go to the bottom": the count rides progress
		// from phase2's start to 1.0. Presence 0 empties the pool outright, so
		// the whole star field leaves the style budget for the entire day.
		starCount:
			starsO > 0
				? Math.round(
						trackAt(
							SCENE.stars.count,
							clamp01(
								(skyProgress - phase2Start) / Math.max(1 - phase2Start, 0.001),
							),
						),
					)
				: 0,
		shootO: clamp01((skyProgress - phase2End) / Math.max(1 - phase2End, 0.001)),
		clouds: cloudValuesAt(skyProgress, skyRgb),
		birds: birdValuesAt(skyProgress, skyRgb),
		ridgeFills: ridgeFillsAt(skyRgb, landscape).map(rgbToCss),
		// (p - 0.5) * 2 spans -1..1 so the ladder sits at rest mid-scroll,
		// pushed down at the hero and fully risen at the page bottom (#59).
		ridgeRise: reduceMotion
			? 0
			: (skyProgress - 0.5) *
				2 *
				RIDGES.riseAtDepth1 *
				Math.min(1, m.winW / RIDGES.referenceWidth),
		mm: {
			topPct,
			hPct,
			topPx: (topPct / 100) * m.winH,
			sunY: topPct + (sunPos.y / 100) * hPct,
			moonY: topPct + (moonPos.y / 100) * hPct,
		},
		// On mobile only the first word shows, at a knocked-down opacity.
		words: WORDS.map((word, i) => {
			if (isMobile && i > 0) return { ty: 0, o: 0 };
			const wordH = word.text.length * fontPx * WM.lineHeight;
			return {
				ty: driftOffset(rawProgress, word.zone, m.winH, wordH, travelPx),
				o:
					zoneOpacity(rawProgress, word.zone) *
					(isMobile ? WM.mobileOpacityScale : 1) *
					revealFactor(scrolledVh, word.revealAfterVh),
			};
		}),
		fontPx,
	};
}

function clamp01(x: number) {
	return Math.min(1, Math.max(0, x));
}
