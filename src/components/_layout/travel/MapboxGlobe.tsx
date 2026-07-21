import { geoCentroid } from "d3-geo";
import type { Feature, FeatureCollection, Point } from "geojson";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { useEffect, useRef } from "react";
import { NEXT_NAME, TRAVEL_ACCENT, VISITED_NAMES } from "../../../data/travel";
import type { CountryFeature, CountryProps, WorldData } from "./worldData";

/*
 * MapboxGlobe (#travel-globe-subpage) - the primary renderer, a Mapbox GL JS v3
 * globe with live satellite imagery. Replaces the old globe.gl/three.js night-
 * texture sphere: a real, zoomable, daylight Earth (satellite-streets), NO auto-
 * rotation (user drives it), with the stylized scratch-map identity riding ON
 * TOP of the tiles - crimson visited-country fills, a cream border stroke,
 * crimson dots for tiny visited countries (Grenada), and a pulsing beacon over
 * the next leg (Japan). A React.lazy target so the ~1.5 MB mapbox chunk never
 * touches the SVG/SSR path.
 *
 * Not unit-tested by design: jsdom has no WebGL and mapbox-gl never loads there,
 * so TravelGlobe's jsdom tests always resolve to the SVG fallback. The mount is
 * client-only (ClientOnly + lazy import in the orchestrator), so SSR/jsdom is
 * already handled upstream. Lifecycle is create-in-effect / map.remove() in
 * cleanup (the effect body is the once - no once-ref).
 *
 * Layer/paint setup (tune here): satellite-streets-v12 base + globe projection;
 * a `visited-fill` fill layer (crimson, Japan brighter/higher-opacity via match
 * expressions), a `visited-line` cream stroke, a `tiny-visited` crimson circle
 * layer for dot-scale countries, and a DOM Marker carrying `.travel-beacon` at
 * Japan's centroid (reuses the CSS pulse, which already honors reduced-motion).
 */

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN as string | undefined;
mapboxgl.accessToken = MAPBOX_TOKEN ?? "";

// Layer ids - referenced by the click/hover handlers below.
const FILL_LAYER = "travel-visited-fill";
const LINE_LAYER = "travel-visited-line";
const DOT_LAYER = "travel-tiny-visited";

const VISITED_SOURCE = "travel-visited";
const DOT_SOURCE = "travel-tiny";

// Japan brighter/raised; other visited countries a soft crimson - tuned so the
// satellite imagery still reads through.
const JAPAN_FILL = "#ff4d64";
const JAPAN_OPACITY = 0.5;
const VISITED_OPACITY = 0.38;

export default function MapboxGlobe({
	world,
	onSelect,
}: {
	world: WorldData;
	onSelect: (name: string) => void;
	active: boolean;
}) {
	const mountRef = useRef<HTMLDivElement | null>(null);

	// Keep the latest onSelect without re-creating the map on every render.
	const onSelectRef = useRef(onSelect);
	useEffect(() => {
		onSelectRef.current = onSelect;
	});

	useEffect(() => {
		const mount = mountRef.current;
		if (!mount) return;

		// Visited countries (+ Japan) as a polygon FeatureCollection on top of
		// the tiles. Each keeps `properties.name` for the paint match + click.
		const visitedNames = [...VISITED_NAMES, NEXT_NAME];
		const visitedFeatures: CountryFeature[] = [];
		for (const name of visitedNames) {
			const f = world.byName.get(name);
			if (f) visitedFeatures.push(f);
		}
		const visitedCollection: FeatureCollection<
			CountryFeature["geometry"],
			CountryProps
		> = { type: "FeatureCollection", features: visitedFeatures };

		// Tiny visited countries (Grenada) as centroid points -> a crimson dot
		// layer, so they stay visible/clickable at globe scale.
		const dotFeatures: Feature<Point, CountryProps>[] = world.tinyVisited.map(
			(f) => {
				const [lng, lat] = geoCentroid(f);
				return {
					type: "Feature",
					properties: { name: f.properties.name },
					geometry: { type: "Point", coordinates: [lng, lat] },
				};
			},
		);
		const dotCollection: FeatureCollection<Point, CountryProps> = {
			type: "FeatureCollection",
			features: dotFeatures,
		};

		const map = new mapboxgl.Map({
			container: mount,
			style: "mapbox://styles/mapbox/satellite-streets-v12",
			projection: "globe",
			center: [10, 25],
			zoom: 1.6,
			attributionControl: true,
		});

		const onClick = (e: mapboxgl.MapMouseEvent) => {
			const name = e.features?.[0]?.properties?.name;
			if (typeof name === "string") onSelectRef.current(name);
		};
		const onEnter = () => {
			map.getCanvas().style.cursor = "pointer";
		};
		const onLeave = () => {
			map.getCanvas().style.cursor = "";
		};

		let beacon: mapboxgl.Marker | null = null;

		map.on("load", () => {
			// Globe atmosphere.
			map.setFog({});

			map.addSource(VISITED_SOURCE, {
				type: "geojson",
				data: visitedCollection,
			});
			map.addSource(DOT_SOURCE, { type: "geojson", data: dotCollection });

			map.addLayer({
				id: FILL_LAYER,
				type: "fill",
				source: VISITED_SOURCE,
				paint: {
					"fill-color": [
						"match",
						["get", "name"],
						NEXT_NAME,
						JAPAN_FILL,
						TRAVEL_ACCENT,
					],
					"fill-opacity": [
						"match",
						["get", "name"],
						NEXT_NAME,
						JAPAN_OPACITY,
						VISITED_OPACITY,
					],
				},
			});

			map.addLayer({
				id: LINE_LAYER,
				type: "line",
				source: VISITED_SOURCE,
				paint: {
					"line-color": "rgba(245,239,227,0.5)",
					"line-width": 0.8,
				},
			});

			map.addLayer({
				id: DOT_LAYER,
				type: "circle",
				source: DOT_SOURCE,
				paint: {
					"circle-radius": 5,
					"circle-color": TRAVEL_ACCENT,
					"circle-opacity": 0.9,
					"circle-stroke-color": "#faf6ec",
					"circle-stroke-width": 1.2,
				},
			});

			// Click + hover affordance on both the fills and the tiny dots.
			for (const layer of [FILL_LAYER, DOT_LAYER]) {
				map.on("click", layer, onClick);
				map.on("mouseenter", layer, onEnter);
				map.on("mouseleave", layer, onLeave);
			}

			// Japan next-leg beacon - a DOM marker reusing the .travel-beacon CSS
			// pulse (which already honors prefers-reduced-motion).
			const japan = world.byName.get(NEXT_NAME);
			if (japan) {
				const [jLng, jLat] = geoCentroid(japan);
				const el = document.createElement("div");
				el.className = "travel-beacon-marker";
				const ring = document.createElement("div");
				ring.className = "travel-beacon";
				el.appendChild(ring);
				beacon = new mapboxgl.Marker({ element: el })
					.setLngLat([jLng, jLat])
					.addTo(map);
			}
		});

		// Mapbox tracks its own container size, but resize defensively if the
		// stage can change size (panel open/close, viewport changes).
		const observer = new ResizeObserver(() => map.resize());
		observer.observe(mount);

		return () => {
			observer.disconnect();
			beacon?.remove();
			// map.remove() tears down all listeners + the WebGL context.
			map.remove();
		};
	}, [world]);

	return (
		<div
			ref={mountRef}
			className="travel-globe-mapbox"
			role="img"
			aria-label="Interactive satellite globe of visited countries"
		/>
	);
}
