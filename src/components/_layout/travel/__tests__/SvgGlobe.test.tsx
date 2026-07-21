// @vitest-environment jsdom

/*
 * SvgGlobe direct-render tests (#travel-globe-subpage) - covers drag-rotate
 * latitude clamping, non-passive wheel-zoom bounds, and stamp-dot horizon
 * culling. Renders SvgGlobe directly (not through TravelGlobe) against a
 * small synthetic WorldData so the pointer/wheel math is exercised without
 * depending on the real world-atlas topology.
 *
 * The matchMedia stub is installed BEFORE every mount, mirroring
 * TravelGlobe.test.tsx (SvgGlobe reads useReducedMotion via matchMedia).
 */

import { cleanup, fireEvent, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { stubMatchMedia } from "../../../../test/stubMatchMedia";
import { SvgGlobe } from "../SvgGlobe";
import type { CountryFeature, WorldData } from "../worldData";

function makeFeature(name: string, coordinates: number[][][]): CountryFeature {
	return {
		type: "Feature",
		properties: { name },
		geometry: { type: "Polygon", coordinates },
	};
}

// A real visited name (so it's interactive/clickable) with an arbitrary
// small polygon - not used for its shape, just to populate `features`.
const france = makeFeature("France", [
	[
		[1, 45],
		[3, 45],
		[3, 47],
		[1, 47],
		[1, 45],
	],
]);

// A real visited (tiny-country) name centered exactly on the geographic
// origin (0, 0) - its centroid is a known, predictable point for the
// horizon-culling math below. Wound so the ring encloses the small (not the
// complementary, near-hemisphere-sized) polygon, per GeoJSON's right-hand
// rule - verified against d3-geo's geoCentroid, which otherwise returns the
// antipodal point [180, 0] for the opposite winding.
const grenada = makeFeature("Grenada", [
	[
		[-1, -1],
		[-1, 1],
		[1, 1],
		[1, -1],
		[-1, -1],
	],
]);

function buildWorld(): WorldData {
	return {
		features: [france],
		byName: new Map([["France", france]]),
		tinyVisited: [grenada],
	};
}

function noop() {}

describe("SvgGlobe (#travel-globe-subpage)", () => {
	beforeEach(() => {
		stubMatchMedia(false);
	});

	afterEach(() => {
		cleanup();
		vi.unstubAllGlobals();
		vi.restoreAllMocks();
	});

	// tests-missing:svg-drag-rotate-clamp
	it("drag rotation moves the projection, and latitude clamps at +-80 (no further change past the bound)", () => {
		const { container } = render(
			<SvgGlobe world={buildWorld()} onSelect={noop} active={true} />,
		);
		const svg = container.querySelector("svg") as SVGSVGElement;
		expect(svg).not.toBeNull();
		const graticule = container.querySelector(
			"svg > path:nth-of-type(2)",
		) as SVGPathElement;
		expect(graticule).not.toBeNull();
		const d0 = graticule.getAttribute("d");

		fireEvent.pointerDown(svg, { clientX: 0, clientY: 0, pointerId: 1 });
		// A large upward drag (negative dy) pushes latitude toward its +80
		// bound - far beyond what an unclamped drag of this magnitude would
		// reach on a real device.
		fireEvent.pointerMove(svg, { clientX: 0, clientY: -100000, pointerId: 1 });
		const d1 = graticule.getAttribute("d");
		expect(d1).not.toBe(d0); // rotation actually changed

		// A further identical drag, still at the bound: since latitude is
		// already clamped to 80 and longitude is unchanged (dx stays 0), the
		// projection must be unchanged too.
		fireEvent.pointerMove(svg, { clientX: 0, clientY: -200000, pointerId: 1 });
		const d2 = graticule.getAttribute("d");
		expect(d2).toBe(d1);
	});

	// tests-missing:svg-wheel-zoom-bounds
	it("non-passive wheel zoom clamps k to [0.7, 4], reflected in the perforation-ring radius", () => {
		const { container } = render(
			<SvgGlobe world={buildWorld()} onSelect={noop} active={true} />,
		);
		const svg = container.querySelector("svg") as SVGSVGElement;
		const ring = container.querySelector("svg > circle") as SVGCircleElement;
		expect(ring).not.toBeNull();

		const R0 = Math.min(640, 560) / 2 - 24; // 256, mirrors the module constant
		expect(ring.getAttribute("r")).toBe(String(R0 * 1 + 10));

		// Zoom in well past the k=4 ceiling (each event multiplies k by 1.12).
		for (let i = 0; i < 20; i++) {
			fireEvent.wheel(svg, { deltaY: -100 });
		}
		expect(ring.getAttribute("r")).toBe(String(R0 * 4 + 10));

		// Zoom out well past the k=0.7 floor (each event multiplies k by 0.89).
		for (let i = 0; i < 30; i++) {
			fireEvent.wheel(svg, { deltaY: 100 });
		}
		expect(ring.getAttribute("r")).toBe(String(R0 * 0.7 + 10));
	});

	// tests-missing:svg-stampdot-visibility-culling
	it("the Grenada stamp dot's display flips to none once rotated past the horizon, and is visible while facing", () => {
		const { container } = render(
			<SvgGlobe world={buildWorld()} onSelect={noop} active={true} />,
		);
		const svg = container.querySelector("svg") as SVGSVGElement;
		const dot = container.querySelector(
			'[data-name="Grenada"]',
		) as SVGCircleElement;
		expect(dot).not.toBeNull();

		// Facing: the default rotation ([-15, -30]) puts the origin (Grenada's
		// synthetic centroid) well within the visible hemisphere.
		expect(dot.getAttribute("display")).not.toBe("none");

		// Rotate the globe ~180 degrees in longitude only (dy stays 0) - this
		// flips the origin onto the far side of the globe.
		fireEvent.pointerDown(svg, { clientX: 0, clientY: 0, pointerId: 1 });
		fireEvent.pointerMove(svg, { clientX: 615, clientY: 0, pointerId: 1 });

		expect(dot.getAttribute("display")).toBe("none");
	});
});
