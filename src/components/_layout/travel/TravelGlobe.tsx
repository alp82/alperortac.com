import { ClientOnly } from "@tanstack/react-router";
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
	type TravelPlace,
	VISITED_PLACES,
} from "../../../data/travel";
import { MemoryCard } from "./MemoryCard";
import { SvgGlobe } from "./SvgGlobe";
import { webglAvailable } from "./webglSupport";
import { loadWorld, type WorldData } from "./worldData";

/*
 * TravelGlobe (#travel-globe-subpage) - the mode-switching orchestrator behind
 * the Travel panel's real globe. Gated on the panel's `active` (open) signal,
 * AlbumShelf-style: on the FIRST activation only it kicks off the lazy world
 * load and probes for WebGL. Wraps the stage in TanStack's ClientOnly (a static
 * shell on the server / first paint), then renders the lazy Mapbox GL satellite
 * globe (primary) or the d3-geo SVG fallback (jsdom, SSR, any browser without
 * WebGL, and any client with no Mapbox token). A shared MemoryCard opens over
 * the stage on country click.
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

export function TravelGlobe({ active }: { active: boolean }) {
	const [world, setWorld] = useState<WorldData | null>(null);
	const [loadFailed, setLoadFailed] = useState(false);
	const [mode, setMode] = useState<Mode>("svg");
	const [selected, setSelected] = useState<TravelPlace | null>(null);
	const hasActivatedRef = useRef(false);
	// The element that triggered the currently-open card (a pointer target or
	// one of the sr-only buttons below) - refocused when the card closes.
	const invokerRef = useRef<HTMLElement | null>(null);

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

	const handleSelect = (name: string) => {
		const place = PLACE_BY_NAME[name];
		if (!place) return;
		invokerRef.current =
			typeof document === "undefined"
				? null
				: (document.activeElement as HTMLElement | null);
		setSelected(place);
	};

	const handleClose = () => {
		setSelected(null);
		invokerRef.current?.focus?.();
	};

	const isNext = selected?.name === NEXT_DESTINATION.name;

	return (
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
								fallback={<div className="travel-loading">loading globe…</div>}
							>
								<MapboxGlobe
									world={world}
									onSelect={handleSelect}
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
	);
}
