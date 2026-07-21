import { geoArea } from "d3-geo";
import type { Feature, FeatureCollection, Geometry } from "geojson";
import { feature } from "topojson-client";
import type { GeometryCollection, Topology } from "topojson-specification";
import { VISITED_NAMES } from "../../../data/travel";

/*
 * worldData.ts (#travel-globe-subpage) - lazy, module-memoized loader for the
 * world-atlas countries-50m topology. Dynamically imports the ~800 kB JSON (so
 * Vite splits it into its own lazy chunk and nothing heavy touches SSR or the
 * landing-page paint), converts it to GeoJSON via topojson-client, indexes the
 * features by `properties.name`, and classifies "tiny" visited countries
 * (geoArea < 0.0004 steradians, e.g. Grenada) for the stamp-dot treatment.
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

let cached: Promise<WorldData> | null = null;

async function build(): Promise<WorldData> {
	// Vite 5+ `json.stringify` auto mode emits ONLY a default export for large
	// JSON - read `mod.default` explicitly; the ambient declaration types it
	// `unknown`, so cast to the topojson Topology type here.
	const mod = await import("world-atlas/countries-50m.json");
	const topology = mod.default as unknown as Topology;
	const collection = feature(
		topology,
		topology.objects.countries as GeometryCollection,
	) as FeatureCollection<Geometry, CountryProps>;

	const features = collection.features;
	const byName = new Map<string, CountryFeature>(
		features.map((f) => [f.properties.name, f]),
	);

	const tinyVisited = features.filter(
		(f) => VISITED_NAMES.has(f.properties.name) && geoArea(f) < TINY_AREA,
	);

	return { features, byName, tinyVisited };
}

/** Loads (once) the converted world data; repeat calls share the same Promise. */
export function loadWorld(): Promise<WorldData> {
	if (!cached)
		cached = build().catch((err) => {
			cached = null;
			throw err;
		});
	return cached;
}
