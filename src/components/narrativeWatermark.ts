import type { PanelKey } from "../data/sections";
import { clamp01 } from "../data/skyCurve";

// Pure geometry for the narrative vertical-words watermark - a line-for-line
// port of the browser-verified prototype `.prototypes/narrative-vertical-words.html`
// (letterSizePx 447-455, wordHeightPx 457, zoneOpacity 603-605, driftOffset 580-595).
// No React here: the <NarrativeWatermark> component is a thin layer over these.

export type Edge = "left" | "right";
export type Zone = { c: number; w: number; edge: Edge };
export type WatermarkWord = {
	text: string;
	color: string;
	zone: Zone;
	revealAfterVh?: number;
};

// Two data-driven words tiled across the page. Color is fixed per word
// (independent of scroll - no night flip): BUILD dark on the left, EXPLORE light
// on the right. Zones are re-aimed so the triangular falloff tails overlap
// across the page center; the crossover lands at p=0.5 so there's no dead gap
// at the seam. Positional placeholders pending the deferred content restructure.
export const WORDS: readonly WatermarkWord[] = [
	{
		text: "BUILD",
		color: "#0f172a",
		zone: { c: 0.3, w: 0.36, edge: "left" },
		revealAfterVh: 0,
	},
	{ text: "EXPLORE", color: "#fff", zone: { c: 0.7, w: 0.36, edge: "right" } },
];

// While a detail subpage is open, the BUILD / EXPLORE pair is replaced by the
// open subpage's own two words (left anchored toward the top, right toward the
// bottom, behind the frosted column). Every entry is a real left+right pair;
// short titles take a complementary second word (music -> Music / Audio).
// Keyed by PanelKey; `sky` (the dev tuning panel) has no entry.
export const SUBPAGE_WORDS: Partial<
	Record<PanelKey, readonly [string, string]>
> = {
	career: ["WORK", "HISTORY"],
	"early-days": ["EARLY", "DAYS"],
	goodwatch: ["GOOD", "WATCH"],
	aistack: ["AI", "STACK"],
	forge: ["FORGE", "PIPELINE"],
	manaschmiede: ["MANA", "SCHMIEDE"],
	music: ["MUSIC", "AUDIO"],
};

// Longest word drives the auto-fit so the full column always fits the viewport.
export const LONGEST = WORDS.reduce((m, w) => Math.max(m, w.text.length), 0); // 7

export const WM = {
	opacity: 0.07,
	padTopVh: 8,
	padBottomVh: 8,
	travelVh: 14,
	insetVw: 4,
	lineHeight: 0.92,
	mobileScale: 0.78,
	mobileMaxWidthPx: 560,
	mobileOpacityScale: 0.7,
	revealRampVh: 0.5,
} as const;

// Auto-fit letter size (px) shared by all words: LONGEST * size * lh fits inside
// the viewport minus the top/bottom pads and the reserved drift travel.
export function letterSizePx(
	winH: number,
	winW: number,
	lh: number = WM.lineHeight,
): number {
	const padPx = ((WM.padTopVh + WM.padBottomVh) / 100) * winH;
	const travelPx = (WM.travelVh / 100) * winH;
	const avail = Math.max(winH - padPx - travelPx, 40);
	let size = avail / (LONGEST * lh);
	if (winW <= WM.mobileMaxWidthPx) size *= WM.mobileScale;
	return size;
}

// Rendered height (px) of a column of `len` letters at the current letter size.
export function wordHeightPx(
	len: number,
	winH: number,
	winW: number,
	lh: number = WM.lineHeight,
): number {
	return len * letterSizePx(winH, winW, lh) * lh;
}

// Triangular falloff: peak maxOpacity at the zone center, 0 at the zone edges.
// The prototype reads `Math.max(0, 1 - |p-c|/w) * maxOpacity`; two boundary
// reconciliations the spec (test) pins down without changing the falloff shape:
//   - exact 0 at/beyond the edge (binary float leaves |0.7-0.5| a hair under
//     0.2, so the raw form leaks a ~4e-17 residue there - snap it to 0),
//   - a degenerate w=0 zone is a hard spike: maxOpacity at the center, 0 off it
//     (raw 0/0 would be NaN). Inside the zone the value matches the prototype.
export function zoneOpacity(
	p: number,
	zone: Zone,
	maxOpacity: number = WM.opacity,
): number {
	const dist = Math.abs(p - zone.c);
	if (dist === 0) return maxOpacity;
	const a = 1 - dist / zone.w;
	if (a <= 1e-9) return 0;
	return a * maxOpacity;
}

// Bounded in-zone drift: both bounds live inside the viewport, so the full word
// is always visible while it still drifts with scroll. Entry sits low, exit high
// (the column drifts up as the user scrolls down - a slow upward parallax).
export function driftOffset(
	p: number,
	zone: Zone,
	winH: number,
	wordH: number,
	travelPx: number,
): number {
	const padTopPx = (WM.padTopVh / 100) * winH;
	const padBottomPx = (WM.padBottomVh / 100) * winH;
	const yMin = padTopPx;
	let yMax = winH - wordH - padBottomPx;
	if (yMax < yMin) yMax = yMin;
	const center = (yMin + yMax) / 2;
	const half = Math.min(travelPx, yMax - yMin) / 2;
	const entry = zone.c - zone.w;
	const exit = zone.c + zone.w;
	const span = exit - entry || 1;
	const pZone = clamp01((p - entry) / span);
	return center + half * (1 - 2 * pZone);
}

// Reveal gate: a word with no `revealAfterVh` is always fully revealed (factor 1).
// A gated word stays hidden (0) until the user has scrolled `revealAfterVh` viewport
// heights, then ramps linearly to full over the next `rampVh`. Multiplied onto the
// word's zone opacity in <NarrativeWatermark> so BUILD fades in past the first screen.
export function revealFactor(
	scrolledVh: number,
	revealAfterVh: number | undefined,
	rampVh: number = WM.revealRampVh,
): number {
	return revealAfterVh == null
		? 1
		: clamp01((scrolledVh - revealAfterVh) / rampVh);
}
