import {
	geoCentroid,
	geoDistance,
	geoGraticule10,
	geoOrthographic,
	geoPath,
} from "d3-geo";
import { useEffect, useRef, useState } from "react";
import { NEXT_NAME, TRAVEL_ACCENT, VISITED_NAMES } from "../../../data/travel";
import type { CountryFeature, WorldData } from "./worldData";

/*
 * SvgGlobe (#travel-globe-subpage) - the d3-geo orthographic fallback, ported
 * from the prototype's variant A but rendered as declarative React SVG (d3-geo
 * math only, no d3-selection). Also the render used under SSR / jsdom / any
 * browser without WebGL (or without a Mapbox token). Draws a paper-cream sphere
 * + graticule, visited-country fills, a dashed-crimson Japan accent, stamp dots
 * for tiny visited countries (Grenada), and a pulse beacon over Japan. Drag to
 * spin, wheel to zoom - both user-driven; there is NO auto-rotation.
 *
 * Sizing uses deterministic constants (jsdom's clientWidth is 0; without a hard
 * fallback the projection scale collapses and country paths render empty `d`).
 */

// Deterministic stage dimensions (the CSS stretches the svg to fill; the
// viewBox drives the projection math independent of the measured box).
const W = 640;
const H = 560;
const R0 = Math.min(W, H) / 2 - 24;

const SPHERE = { type: "Sphere" } as const;
const GRATICULE = geoGraticule10();

const clamp = (v: number, lo: number, hi: number) =>
	Math.max(lo, Math.min(hi, v));

const interactive = new Set([...VISITED_NAMES, NEXT_NAME]);

function fillFor(name: string): string {
	if (name === NEXT_NAME) return "rgba(226,59,84,0.16)";
	if (VISITED_NAMES.has(name)) return "rgba(226,59,84,0.66)";
	return "rgba(120,113,98,0.35)";
}

export function SvgGlobe({
	world,
	onSelect,
}: {
	world: WorldData;
	onSelect: (name: string) => void;
	active: boolean;
}) {
	const [rotation, setRotation] = useState<[number, number]>([-15, -30]);
	const [k, setK] = useState(1);
	const [dragging, setDragging] = useState(false);

	const svgRef = useRef<SVGSVGElement | null>(null);
	const lastPointer = useRef<{ x: number; y: number } | null>(null);

	// Non-passive wheel zoom (React's onWheel is passive, so preventDefault
	// there would warn/no-op).
	useEffect(() => {
		const svg = svgRef.current;
		if (!svg) return;
		const onWheel = (e: WheelEvent) => {
			e.preventDefault();
			setK((prev) => clamp(prev * (e.deltaY < 0 ? 1.12 : 0.89), 0.7, 4));
		};
		svg.addEventListener("wheel", onWheel, { passive: false });
		return () => svg.removeEventListener("wheel", onWheel);
	}, []);

	const projection = geoOrthographic()
		.translate([W / 2, H / 2])
		.scale(R0 * k)
		.rotate([rotation[0], rotation[1]])
		.clipAngle(90);
	const path = geoPath(projection);

	const handleCountryClick = (name: string) => {
		if (interactive.has(name)) onSelect(name);
	};

	const onPointerDown = (e: React.PointerEvent<SVGSVGElement>) => {
		setDragging(true);
		lastPointer.current = { x: e.clientX, y: e.clientY };
		e.currentTarget.setPointerCapture?.(e.pointerId);
	};
	const onPointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
		if (!dragging || !lastPointer.current) return;
		const dx = e.clientX - lastPointer.current.x;
		const dy = e.clientY - lastPointer.current.y;
		lastPointer.current = { x: e.clientX, y: e.clientY };
		const s = 75 / (R0 * k);
		setRotation(([lam, phi]) => [lam + dx * s, clamp(phi - dy * s, -80, 80)]);
	};
	const endDrag = () => {
		if (!dragging) return;
		setDragging(false);
		lastPointer.current = null;
	};

	const center: [number, number] = [-rotation[0], -rotation[1]];
	const projectVisible = (feature: CountryFeature) => {
		const centroid = geoCentroid(feature);
		const point = projection(centroid);
		const visible = geoDistance(centroid, center) < Math.PI / 2;
		return { point, visible: visible && !!point };
	};

	const japan = world.byName.get(NEXT_NAME);
	const japanMark = japan ? projectVisible(japan) : null;

	return (
		<svg
			ref={svgRef}
			className={`travel-globe-svg${dragging ? " dragging" : ""}`}
			viewBox={`0 0 ${W} ${H}`}
			onPointerDown={onPointerDown}
			onPointerMove={onPointerMove}
			onPointerUp={endDrag}
			onPointerLeave={endDrag}
		>
			<title>Interactive globe of visited countries</title>
			<defs>
				<radialGradient id="travel-sea" cx="38%" cy="32%">
					<stop offset="0%" stopColor="#faf6ec" />
					<stop offset="100%" stopColor="#e9dfc9" />
				</radialGradient>
			</defs>

			{/* perforation ring - the ticket-stub echo */}
			<circle
				cx={W / 2}
				cy={H / 2}
				r={R0 * k + 10}
				fill="none"
				stroke="rgba(226,59,84,0.55)"
				strokeDasharray="2 7"
				strokeWidth={1.6}
			/>
			<path
				d={path(SPHERE) ?? ""}
				fill="url(#travel-sea)"
				stroke="rgba(38,34,27,0.5)"
				strokeWidth={1}
			/>
			<path
				d={path(GRATICULE) ?? ""}
				fill="none"
				stroke="rgba(38,34,27,0.14)"
				strokeWidth={0.5}
			/>

			<g>
				{world.features.map((feature) => {
					const name = feature.properties.name;
					const isNext = name === NEXT_NAME;
					const clickable = interactive.has(name);
					return (
						// biome-ignore lint/a11y/noStaticElementInteractions: the globe is a pointer-driven graphic; visited-country polygons are click targets on the orthographic map.
						<path
							key={name}
							data-name={name}
							d={path(feature) ?? ""}
							fill={fillFor(name)}
							stroke={isNext ? TRAVEL_ACCENT : "rgba(38,34,27,0.35)"}
							strokeDasharray={isNext ? "4 3" : undefined}
							strokeWidth={isNext ? 1.4 : 0.5}
							style={clickable ? { cursor: "pointer" } : undefined}
							onClick={clickable ? () => handleCountryClick(name) : undefined}
						/>
					);
				})}
			</g>

			{/* tiny visited countries (Grenada) get a stamp dot to stay visible */}
			<g>
				{world.tinyVisited.map((feature) => {
					const name = feature.properties.name;
					const { point, visible } = projectVisible(feature);
					return (
						// biome-ignore lint/a11y/noStaticElementInteractions: the stamp dot is a pointer-driven click target for a tiny visited country (Grenada) on the graphic globe.
						<circle
							key={name}
							data-name={name}
							r={5}
							cx={point ? point[0] : 0}
							cy={point ? point[1] : 0}
							display={visible ? undefined : "none"}
							fill={TRAVEL_ACCENT}
							fillOpacity={0.85}
							stroke="#faf6ec"
							strokeWidth={1.2}
							style={{ cursor: "pointer" }}
							onClick={() => handleCountryClick(name)}
						/>
					);
				})}
			</g>

			{/* next-leg beacon - a slow crimson pulse over Japan */}
			{japanMark?.visible && japanMark.point && (
				<circle
					className="travel-beacon"
					cx={japanMark.point[0]}
					cy={japanMark.point[1]}
					r={6}
					fill="none"
					stroke={TRAVEL_ACCENT}
					strokeWidth={1.5}
					style={{ pointerEvents: "none" }}
				/>
			)}
		</svg>
	);
}
