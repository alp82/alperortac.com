// Single source of truth for the Travel subpage content (#travel-globe-subpage).
// Hand-editable, the Travel analogue of ALBUMS/FAVORITES in personal.ts /
// favorites.ts. Consumed by:
//   - src/components/_layout/travel/TravelGlobe.tsx (SVG + WebGL globes) - the
//     visited fills, Japan next-leg accent, and the click-to-open memory cards.
//   - src/components/_layout/travel/worldData.ts - matches each `name` against
//     the world-atlas countries-50m polygon `properties.name`.
//   - src/components/_layout/composer/inner/ticket-stub.tsx - the boarding-pass
//     route strip reads ROUTE_STOPS/ROUTE_NEXT from here (deduped, single copy).
//   - src/components/_layout/topics/TravelContent.tsx - the prose country list
//     is mirrored BY HAND from VISITED_PLACES (authentic voice stays verbatim).
//
// `name` MUST match the world-atlas `properties.name` exactly, or the polygon
// won't resolve. `label` is a display override for the card title. `memory` is
// the card line - left UNSET here (a placeholder shows) until Alper fills each
// one in his own words later (data-is-source-of-truth; no fabricated copy).

export type TravelPlace = {
	/** Must match world-atlas countries-50m `properties.name`. */
	name: string;
	/** Card-title display override (falls back to `name`). */
	label?: string;
	/** ISO alpha-3 code. */
	code: string;
	/** Card memory line - hand-filled later, placeholder shown until then. */
	memory?: string;
};

/** The 21 visited polygons, in the locked prose order. */
export const VISITED_PLACES: TravelPlace[] = [
	{ name: "Thailand", code: "THA" },
	{ name: "Israel", code: "ISR" },
	{ name: "Mexico", code: "MEX" },
	{ name: "Grenada", code: "GRD" },
	{ name: "Germany", code: "DEU" },
	{ name: "France", code: "FRA" },
	{ name: "Italy", code: "ITA" },
	{ name: "Spain", code: "ESP" },
	{ name: "Portugal", code: "PRT" },
	// Scotland renders via the United Kingdom polygon; both named on the card.
	{ name: "United Kingdom", label: "United Kingdom & Scotland", code: "GBR" },
	{ name: "Croatia", code: "HRV" },
	{ name: "Greece", code: "GRC" },
	{ name: "Netherlands", code: "NLD" },
	{ name: "Austria", code: "AUT" },
	{ name: "Denmark", code: "DNK" },
	{ name: "Finland", code: "FIN" },
	{ name: "Sweden", code: "SWE" },
	{ name: "Norway", code: "NOR" },
	{ name: "Lithuania", code: "LTU" },
	{ name: "Bulgaria", code: "BGR" },
	{ name: "Turkey", code: "TUR" },
];

/** The next leg - rendered brighter/raised with a pulse beacon over its polygon. */
export const NEXT_DESTINATION: TravelPlace = { name: "Japan", code: "JPN" };

export type TravelStop = {
	/** City / region display label. */
	city: string;
	/** Country name - MUST match a `name` in VISITED_PLACES/NEXT_DESTINATION. */
	country: string;
	lng: number;
	lat: number;
	/** Next-leg accent (Japan). */
	next?: boolean;
};

/**
 * City/region stops (#37) - the manifest list and the labeled pins on the
 * fullscreen globe. PLACEHOLDER LIST: plausible cities in the visited
 * countries so the treatment ships; Alper edits this by hand into the real
 * itinerary (data-is-source-of-truth; same contract as `memory` above).
 */
export const TRAVEL_STOPS: TravelStop[] = [
	{ city: "Bangkok", country: "Thailand", lng: 100.5018, lat: 13.7563 },
	{ city: "Tel Aviv", country: "Israel", lng: 34.7818, lat: 32.0853 },
	{ city: "Jerusalem", country: "Israel", lng: 35.2137, lat: 31.7683 },
	{ city: "Cancún", country: "Mexico", lng: -86.8515, lat: 21.1619 },
	{ city: "St. George's", country: "Grenada", lng: -61.7486, lat: 12.0564 },
	{ city: "Berlin", country: "Germany", lng: 13.405, lat: 52.52 },
	{ city: "Paris", country: "France", lng: 2.3522, lat: 48.8566 },
	{ city: "Rome", country: "Italy", lng: 12.4964, lat: 41.9028 },
	{ city: "Barcelona", country: "Spain", lng: 2.1734, lat: 41.3851 },
	{ city: "Lisbon", country: "Portugal", lng: -9.1393, lat: 38.7223 },
	{ city: "Edinburgh", country: "United Kingdom", lng: -3.1883, lat: 55.9533 },
	{ city: "Dubrovnik", country: "Croatia", lng: 18.0944, lat: 42.6507 },
	{ city: "Athens", country: "Greece", lng: 23.7275, lat: 37.9838 },
	{ city: "Amsterdam", country: "Netherlands", lng: 4.9041, lat: 52.3676 },
	{ city: "Vienna", country: "Austria", lng: 16.3738, lat: 48.2082 },
	{ city: "Copenhagen", country: "Denmark", lng: 12.5683, lat: 55.6761 },
	{ city: "Helsinki", country: "Finland", lng: 24.9384, lat: 60.1699 },
	{ city: "Stockholm", country: "Sweden", lng: 18.0686, lat: 59.3293 },
	{ city: "Oslo", country: "Norway", lng: 10.7522, lat: 59.9139 },
	{ city: "Vilnius", country: "Lithuania", lng: 25.2797, lat: 54.6872 },
	{ city: "Sofia", country: "Bulgaria", lng: 23.3219, lat: 42.6977 },
	{ city: "Istanbul", country: "Turkey", lng: 28.9784, lat: 41.0082 },
	{ city: "Tokyo", country: "Japan", lng: 139.6917, lat: 35.6895, next: true },
];

/** Visited stops for the ticket-stub boarding-pass route strip, in prose order. */
export const ROUTE_STOPS = ["THA", "ISR", "MEX", "GRD", "EUR"] as const;
/** The route strip's next leg - accent-colored, plane in flight. */
export const ROUTE_NEXT = "JPN '27";

/** Name -> place lookup across both lists (21 visited + Japan = 22 keys). */
export const PLACE_BY_NAME: Record<string, TravelPlace> = Object.fromEntries(
	[...VISITED_PLACES, NEXT_DESTINATION].map((place) => [place.name, place]),
);

/**
 * Single source of the visited-name derivation - hoisted here so worldData.ts
 * and both globe renderers (SvgGlobe/MapboxGlobe) share one Set instead of
 * each recomputing it from VISITED_PLACES.
 */
export const VISITED_NAMES = new Set(VISITED_PLACES.map((p) => p.name));

/** The globe renderers' shared crimson accent (visited fill / Japan stroke). */
export const TRAVEL_ACCENT = "#e23b54";

/** The next-leg polygon name (Japan), shared by both globe renderers. */
export const NEXT_NAME = NEXT_DESTINATION.name;
