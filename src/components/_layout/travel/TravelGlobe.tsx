import { ClientOnly } from "@tanstack/react-router";
import type { Map as MapboxMap } from "mapbox-gl";
import {
	Component,
	lazy,
	type ReactNode,
	Suspense,
	useCallback,
	useEffect,
	useRef,
	useState,
} from "react";
import {
	NEXT_DESTINATION,
	PLACE_BY_NAME,
	TRAVEL_STOPS,
	type TravelPlace,
	type TravelStop,
	VISITED_PLACES,
} from "../../../data/travel";
import { MemoryCard } from "./MemoryCard";
import { SvgGlobe } from "./SvgGlobe";
import { webglAvailable } from "./webglSupport";
import { loadWorld, type WorldData } from "./worldData";

/*
 * TravelGlobe (#travel-globe-subpage, fullscreen manifest split since #37) -
 * the whole /travel subpage: a slim "passenger manifest" column (title, the
 * verbatim intro line, and the TRAVEL_STOPS city list) beside a globe stage
 * that fills the rest of the viewport. The globe IS the experience now, not a
 * framed card in a prose column - PersonalPanel renders this instead of the
 * subpage-column for the travel slug.
 *
 * Clicking a manifest city flies the Mapbox camera to it (no-op on the SVG
 * fallback) and opens its memory card; the globe's country fills, tiny-country
 * dots, and the new city pins all open cards too.
 *
 * Loading is gated on the panel's `active` (open) signal, AlbumShelf-style: on
 * the FIRST activation only it kicks off the lazy world load and probes for
 * WebGL. Wraps the stage in TanStack's ClientOnly (a static shell on the
 * server / first paint), then renders the lazy Mapbox GL satellite globe
 * (primary) or the d3-geo SVG fallback (jsdom, SSR, any browser without WebGL,
 * and any client with no Mapbox token). A shared MemoryCard opens over the
 * stage on selection.
 */

// Behind React.lazy so the heavy mapbox-gl chunk is only fetched when a WebGL-
// capable, token-holding client actually renders it - never on the SVG path.
const MapboxGlobe = lazy(() => import("./MapboxGlobe"));

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN as string | undefined;

type Mode = "svg" | "mapbox";

// All selectable places (visited + the next-leg Japan) - drives the keyboard/
// screen-reader-reachable list of buttons below, one per country, so opening
// a memory card never depends on a pointer or the globe canvas.
const SELECTABLE_PLACES: TravelPlace[] = [...VISITED_PLACES, NEXT_DESTINATION];

// If the mapbox chunk fails to load or throws at runtime, fall back to the
// SVG globe rather than crashing the panel.
class RendererBoundary extends Component<
	{ fallback: ReactNode; children: ReactNode },
	{ failed: boolean }
> {
	state = { failed: false };
	static getDerivedStateFromError() {
		return { failed: true };
	}
	render() {
		return this.state.failed ? this.props.fallback : this.props.children;
	}
}

export function TravelGlobe({
	active,
	titleId,
}: {
	active: boolean;
	/** The panel dialog's aria-labelledby target - rendered on the manifest h2. */
	titleId?: string;
}) {
	const [world, setWorld] = useState<WorldData | null>(null);
	const [loadFailed, setLoadFailed] = useState(false);
	const [mode, setMode] = useState<Mode>("svg");
	const [selected, setSelected] = useState<TravelPlace | null>(null);
	const hasActivatedRef = useRef(false);
	// The element that triggered the currently-open card (a pointer target, a
	// manifest stop, or one of the sr-only buttons) - refocused on card close.
	const invokerRef = useRef<HTMLElement | null>(null);
	// Live Mapbox map handle (null on the SVG path) for manifest flyTo.
	const mapRef = useRef<MapboxMap | null>(null);

	const startLoad = useCallback(() => {
		setLoadFailed(false);
		loadWorld()
			.then(setWorld)
			.catch(() => setLoadFailed(true));
	}, []);

	// First activation only (hasActivatedRef idiom) - never on landing-page
	// first paint, never re-fired on re-open. Mapbox is the primary renderer
	// only when WebGL is available AND a Mapbox token is configured; without a
	// token we fall back to the SVG globe so the site never breaks.
	useEffect(() => {
		if (!active || hasActivatedRef.current) return;
		hasActivatedRef.current = true;
		const search = typeof window === "undefined" ? "" : window.location.search;
		setMode(webglAvailable(search) && MAPBOX_TOKEN ? "mapbox" : "svg");
		startLoad();
	}, [active, startLoad]);

	const stashInvoker = () => {
		invokerRef.current =
			typeof document === "undefined"
				? null
				: (document.activeElement as HTMLElement | null);
	};

	const handleSelect = (name: string) => {
		const place = PLACE_BY_NAME[name];
		if (!place) return;
		stashInvoker();
		setSelected(place);
	};

	// A city stop (pin or manifest row): card titled "City · Country", carrying
	// the country's memory line until per-stop copy exists.
	const stopPlace = (stop: TravelStop): TravelPlace => {
		const base = PLACE_BY_NAME[stop.country];
		return {
			name: stop.country,
			label: `${stop.city} · ${stop.country}`,
			code: base?.code ?? "···",
			...(base?.memory !== undefined ? { memory: base.memory } : {}),
		};
	};

	const handleSelectStop = (stop: TravelStop) => {
		stashInvoker();
		setSelected(stopPlace(stop));
	};

	const handleManifestClick = (stop: TravelStop) => {
		stashInvoker();
		setSelected(stopPlace(stop));
		mapRef.current?.flyTo({
			center: [stop.lng, stop.lat],
			zoom: 5.5,
			duration: 1800,
		});
	};

	const handleClose = () => {
		setSelected(null);
		invokerRef.current?.focus?.();
	};

	const isNext = selected?.name === NEXT_DESTINATION.name;

	return (
		<div className="travel-experience">
			<aside className="travel-manifest">
				<div className="text-[10px] font-black uppercase tracking-[0.3em] text-[#ff7a8d]">
					passenger manifest
				</div>
				<h2
					id={titleId}
					className="mt-1 text-3xl font-black uppercase tracking-tighter"
				>
					Travel
				</h2>
				<p className="mt-2 text-sm leading-relaxed text-slate-200/90">
					Thailand, Israel, Mexico, Grenada and all over Europe - next stamp:
					Japan 2027.
				</p>
				<div className="mt-5 text-[10px] font-black uppercase tracking-[0.25em] text-slate-400">
					stops · tap to fly
				</div>
				<ul className="mt-2 space-y-1">
					{TRAVEL_STOPS.map((stop) => (
						<li key={`${stop.city}-${stop.country}`}>
							<button
								type="button"
								onClick={() => handleManifestClick(stop)}
								className={`flex w-full items-baseline justify-between gap-2 rounded px-2 py-1.5 text-left text-sm font-semibold hover:bg-white/10 focus-visible:bg-white/10 ${
									stop.next ? "text-sky-300" : "text-slate-100"
								}`}
							>
								<span>{stop.city}</span>
								{/* ISO code, not the country name - boarding-pass shorthand
								    (and card titles stay the only place full names render). */}
								<span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
									{PLACE_BY_NAME[stop.country]?.code ?? "···"}
								</span>
							</button>
						</li>
					))}
				</ul>
				<div className="mt-4 text-[10px] uppercase tracking-widest text-slate-500">
					{VISITED_PLACES.length} countries · {TRAVEL_STOPS.length} stops
				</div>
			</aside>
			<div className="travel-stage">
				<ClientOnly
					fallback={<div className="travel-loading" aria-hidden="true" />}
				>
					{world ? (
						mode === "mapbox" ? (
							<RendererBoundary
								fallback={
									<SvgGlobe
										world={world}
										onSelect={handleSelect}
										active={active}
									/>
								}
							>
								<Suspense
									fallback={
										<div className="travel-loading">loading globe…</div>
									}
								>
									<MapboxGlobe
										world={world}
										onSelect={handleSelect}
										onSelectStop={handleSelectStop}
										onMapReady={(map) => {
											mapRef.current = map;
										}}
										active={active}
									/>
								</Suspense>
							</RendererBoundary>
						) : (
							<SvgGlobe world={world} onSelect={handleSelect} active={active} />
						)
					) : loadFailed ? (
						<div className="travel-loading travel-loading-error">
							<p>Couldn't load the globe.</p>
							<button type="button" onClick={startLoad}>
								Retry
							</button>
						</div>
					) : (
						<div className="travel-loading">loading world…</div>
					)}
				</ClientOnly>
				{/* Keyboard/screen-reader route to every memory card - independent of
				    the globe canvas (pointer-only country polygons/points). */}
				<ul className="sr-only">
					{SELECTABLE_PLACES.map((place) => {
						const title = place.label ?? place.name;
						return (
							<li key={place.name}>
								<button
									type="button"
									aria-label={title}
									onClick={(event) => {
										invokerRef.current = event.currentTarget;
										setSelected(place);
									}}
								>
									Open the {title} memory card
								</button>
							</li>
						);
					})}
				</ul>
				{selected && (
					<MemoryCard place={selected} isNext={isNext} onClose={handleClose} />
				)}
			</div>
		</div>
	);
}
