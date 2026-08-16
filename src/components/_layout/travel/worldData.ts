import { geoArea } from "d3-geo";
import type { Feature, FeatureCollection, Geometry } from "geojson";
import { feature } from "topojson-client";
import type { GeometryCollection, Topology } from "topojson-specification";
import { TRAVEL_STOPS, VISITED_NAMES } from "../../../data/travel";

/*
 * worldData.ts (#travel-globe-subpage) - lazy, module-memoized loader for the
 * world-atlas countries topology. Dynamically imports the JSON (so Vite splits
 * it into its own lazy chunk and nothing heavy touches SSR or the landing-page
 * paint), converts it to GeoJSON via topojson-client, indexes the features by
 * `properties.name`, and classifies "tiny" visited countries (geoArea < 0.0004
 * steradians, e.g. Grenada) for the stamp-dot treatment.
 *
 * TWO DETAIL LEVELS, chosen by the renderer. Mapbox draws the ~800 kB 50m
 * topology once into GPU buffers, so detail is free there and the visited
 * fills hug the satellite coastlines at flyTo zoom. The SVG fallback
 * re-projects EVERY vertex through d3 into fresh path strings on every drag
 * frame - on 50m that is ~100k vertices and read 10fps on a real drag - so it
 * loads the ~10x smaller 110m topology instead, visually near-identical at
 * globe scale. Each detail level memoizes independently.
 */

export type CountryProps = { name: string };
export type CountryFeature = Feature<Geometry, CountryProps>;

export type WorldData = {
	features: CountryFeature[];
	byName: Map<string, CountryFeature>;
	tinyVisited: CountryFeature[];
};

// Tiny-country threshold (steradians) - catches Grenada, keeps France out.
const TINY_AREA = 0.0004;

export type WorldDetail = "50m" | "110m";

const cached = new Map<WorldDetail, Promise<WorldData>>();

async function build(detail: WorldDetail): Promise<WorldData> {
	// Vite 5+ `json.stringify` auto mode emits ONLY a default export for large
	// JSON - read `mod.default` explicitly; the ambient declaration types it
	// `unknown`, so cast to the topojson Topology type here. Both branches are
	// literal specifiers so Vite splits each into its own lazy chunk.
	const mod =
		detail === "110m"
			? await import("world-atlas/countries-110m.json")
			: await import("world-atlas/countries-50m.json");
	const topology = mod.default as unknown as Topology;
	const collection = feature(
		topology,
		topology.objects.countries as GeometryCollection,
	) as FeatureCollection<Geometry, CountryProps>;

	const features = collection.features;
	const byName = new Map<string, CountryFeature>(
		features.map((f) => [f.properties.name, f]),
	);

	/* The 110m atlas DROPS dot-scale countries outright - Grenada has no
	   feature there at all, which would silently lose its stamp dot and its
	   click target on the SVG fallback. Synthesize a small square for any
	   visited country the atlas dropped, anchored on its TRAVEL_STOPS city
	   (for an island nation that IS the country's location). The square is
	   far under TINY_AREA, so it classifies as tiny and renders as the stamp
	   dot - the polygon itself is never visibly drawn at dot scale. WINDING
	   MATTERS on the sphere: d3-geo treats the region to the LEFT of the ring
	   as the inside, so the reverse order enclosed everything EXCEPT the
	   square (geoArea 4pi, antipodal centroid) and painted the whole globe
	   crimson. This order is verified small: geoArea 2.7e-5, centroid on the
	   stop (pinned in worldData.test.ts). */
	for (const name of VISITED_NAMES) {
		if (byName.has(name)) continue;
		const stop = TRAVEL_STOPS.find((s) => s.country === name);
		if (!stop) continue;
		const d = 0.15;
		const synthesized: CountryFeature = {
			type: "Feature",
			properties: { name },
			geometry: {
				type: "Polygon",
				coordinates: [
					[
						[stop.lng - d, stop.lat - d],
						[stop.lng - d, stop.lat + d],
						[stop.lng + d, stop.lat + d],
						[stop.lng + d, stop.lat - d],
						[stop.lng - d, stop.lat - d],
					],
				],
			},
		};
		features.push(synthesized);
		byName.set(name, synthesized);
	}

	const tinyVisited = features.filter(
		(f) => VISITED_NAMES.has(f.properties.name) && geoArea(f) < TINY_AREA,
	);

	return { features, byName, tinyVisited };
}

/** Loads (once per detail level) the converted world data; repeat calls share
    the same Promise. Default stays 50m - the Mapbox path and every pre-detail
    caller keep their exact behavior. */
export function loadWorld(detail: WorldDetail = "50m"): Promise<WorldData> {
	let promise = cached.get(detail);
	if (!promise) {
		promise = build(detail).catch((err) => {
			cached.delete(detail);
			throw err;
		});
		cached.set(detail, promise);
	}
	return promise;
}
