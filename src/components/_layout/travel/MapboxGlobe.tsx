import { geoCentroid } from "d3-geo";
import type { Feature, FeatureCollection, Point } from "geojson";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { useEffect, useRef } from "react";
import {
	NEXT_NAME,
	TRAVEL_ACCENT,
	TRAVEL_STOPS,
	type TravelStop,
	VISITED_NAMES,
} from "../../../data/travel";
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
 *
 * #37 (manifest split, prototype variant C): a `travel-stop-*` dot + label
 * symbol pair renders every TRAVEL_STOPS city, always visible; clicking a stop
 * reports up via onSelectStop (the manifest column owns flyTo through the map
 * handle exposed by onMapReady).
 */

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN as string | undefined;
mapboxgl.accessToken = MAPBOX_TOKEN ?? "";

// Layer ids - referenced by the click/hover handlers below.
const FILL_LAYER = "travel-visited-fill";
const LINE_LAYER = "travel-visited-line";
const DOT_LAYER = "travel-tiny-visited";
const STOP_DOT_LAYER = "travel-stop-dot";
const STOP_LABEL_LAYER = "travel-stop-label";

const VISITED_SOURCE = "travel-visited";
const DOT_SOURCE = "travel-tiny";
const STOP_SOURCE = "travel-stops";

// Japan brighter/raised; other visited countries a soft crimson - tuned so the
// satellite imagery still reads through.
const JAPAN_FILL = "#ff4d64";
const JAPAN_OPACITY = 0.5;
const VISITED_OPACITY = 0.38;

export default function MapboxGlobe({
	world,
	onSelect,
	onSelectStop,
	onMapReady,
}: {
	world: WorldData;
	onSelect: (name: string) => void;
	/** A city pin was clicked (#37). */
	onSelectStop: (stop: TravelStop) => void;
	/** Hands the live map up for manifest flyTo (#37). */
	onMapReady?: (map: mapboxgl.Map) => void;
	active: boolean;
}) {
	const mountRef = useRef<HTMLDivElement | null>(null);

	// Keep the latest callbacks without re-creating the map on every render.
	const onSelectRef = useRef(onSelect);
	const onSelectStopRef = useRef(onSelectStop);
	const onMapReadyRef = useRef(onMapReady);
	useEffect(() => {
		onSelectRef.current = onSelect;
		onSelectStopRef.current = onSelectStop;
		onMapReadyRef.current = onMapReady;
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

		// City stops (#37) - a dot + always-on label per TRAVEL_STOPS entry.
		const stopCollection: FeatureCollection<
			Point,
			{ idx: number; city: string; next: number }
		> = {
			type: "FeatureCollection",
			features: TRAVEL_STOPS.map((stop, idx) => ({
				type: "Feature",
				properties: { idx, city: stop.city, next: stop.next ? 1 : 0 },
				geometry: { type: "Point", coordinates: [stop.lng, stop.lat] },
			})),
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
			// Stop pins sit above the fills - if one was hit, it owns the click.
			const pinHit = map.queryRenderedFeatures(e.point, {
				layers: [STOP_DOT_LAYER, STOP_LABEL_LAYER],
			});
			if (pinHit.length > 0) return;
			const name = e.features?.[0]?.properties?.name;
			if (typeof name === "string") onSelectRef.current(name);
		};
		const onStopClick = (e: mapboxgl.MapMouseEvent) => {
			const idx = e.features?.[0]?.properties?.idx;
			const stop = typeof idx === "number" ? TRAVEL_STOPS[idx] : undefined;
			if (stop) onSelectStopRef.current(stop);
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
			map.addSource(STOP_SOURCE, { type: "geojson", data: stopCollection });

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

			// City stop pins (#37): cream dot with a crimson ring (next leg sky-
			// tinted) + an always-visible city label, cream with an ink halo so it
			// reads on both ocean and terrain tiles.
			map.addLayer({
				id: STOP_DOT_LAYER,
				type: "circle",
				source: STOP_SOURCE,
				paint: {
					"circle-radius": ["interpolate", ["linear"], ["zoom"], 1.5, 3, 6, 6],
					"circle-color": ["match", ["get", "next"], 1, "#7dd3fc", "#faf6ec"],
					"circle-stroke-color": TRAVEL_ACCENT,
					"circle-stroke-width": 2,
				},
			});
			map.addLayer({
				id: STOP_LABEL_LAYER,
				type: "symbol",
				source: STOP_SOURCE,
				layout: {
					"text-field": ["get", "city"],
					"text-size": 12,
					"text-offset": [0, 1.1],
					"text-anchor": "top",
					"text-font": ["DIN Pro Medium", "Arial Unicode MS Regular"],
				},
				paint: {
					"text-color": "#faf6ec",
					"text-halo-color": "rgba(15,23,42,0.85)",
					"text-halo-width": 1.2,
				},
			});

			// Click + hover affordance on the fills, tiny dots, and stop pins.
			for (const layer of [FILL_LAYER, DOT_LAYER]) {
				map.on("click", layer, onClick);
				map.on("mouseenter", layer, onEnter);
				map.on("mouseleave", layer, onLeave);
			}
			for (const layer of [STOP_DOT_LAYER, STOP_LABEL_LAYER]) {
				map.on("click", layer, onStopClick);
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

			onMapReadyRef.current?.(map);
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
