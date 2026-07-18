import { ArrowRight, Pause, Play } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { FAVORITES, type Favorite } from "../../../data/favorites";
import { useTriggerNav } from "../composer/useTriggerNav";
import { useReducedMotion } from "../dive/useReducedMotion";
import { useRotation } from "../useRotation";

/*
 * The movies-tv band's flickering 3x2 all-time-favorites wall, seated under
 * the streaming-billboard prose (the approved #22 variant-A walk). Poster
 * swaps use the channel-zap CRT transition (.poster-zap* in styles.css); the
 * billboard's top-chrome pills live HERE as functional All/Films/Series
 * filters; the whole grid is the trigger into the /movies favorites subpage.
 *
 * Pause semantics mirror the Music shelf: non-touch hover pauses, the
 * explicit pause button is the touch-reachable WCAG 2.2.2 equivalent, and
 * nothing runs off-screen (IntersectionObserver gate). Reduced motion does
 * NOT pause the rotation - swaps keep their cadence but land instantly with
 * no zap classes (intent AC1).
 */

const VISIBLE = 6;
const INTERVAL_MS = 2600;
// keep in sync with the .poster-zap--out / --in durations in styles.css
const OUT_MS = 180;
const IN_MS = 280;

type Filter = "all" | "film" | "series";

const FILTERS: { key: Filter; label: string }[] = [
	{ key: "all", label: "All" },
	{ key: "film", label: "Films" },
	{ key: "series", label: "Series" },
];

function pool(filter: Filter): Favorite[] {
	if (filter === "all") return FAVORITES;
	return FAVORITES.filter((f) => f.kind === filter);
}

export function PosterGrid({
	lastTriggerRef,
}: {
	lastTriggerRef: React.RefObject<HTMLElement | null>;
}) {
	const [filter, setFilter] = useState<Filter>("all");
	const [hovered, setHovered] = useState(false);
	const [userPaused, setUserPaused] = useState(false);
	const [onScreen, setOnScreen] = useState(false);
	const reduced = useReducedMotion();
	const wrapperRef = useRef<HTMLDivElement>(null);
	// The one shared production nav contract (lastTriggerRef stash +
	// resetScroll:false) - never null for a personal trigger, but the
	// resolver's project branch makes its type nullable.
	const { resolveTrigger } = useTriggerNav(lastTriggerRef);
	const resolved = resolveTrigger({ kind: "personal", slug: "movies" }, "");

	// On-screen gate: no rotation interval and no image work during
	// landing-page first paint or while scrolled away (the band-world
	// analogue of AlbumShelf's `active` flag). Guarded for jsdom suites
	// that mount the frame without an IntersectionObserver stub.
	useEffect(() => {
		const el = wrapperRef.current;
		if (!el || typeof IntersectionObserver === "undefined") return;
		const observer = new IntersectionObserver(
			(entries) => {
				const entry = entries[0];
				if (entry) setOnScreen(entry.isIntersecting);
			},
			{ threshold: 0 },
		);
		observer.observe(el);
		return () => observer.disconnect();
	}, []);

	// Preload ALL 24 posters (both kinds) on first on-screen only - filter
	// switches and zap-ins never reveal an empty frame (AlbumShelf pattern).
	const hasPreloadedRef = useRef(false);
	useEffect(() => {
		if (!onScreen || hasPreloadedRef.current) return;
		hasPreloadedRef.current = true;
		for (const favorite of FAVORITES) {
			const img = new Image();
			img.src = favorite.poster;
		}
	}, [onScreen]);

	// `reduced` deliberately absent: rotation keeps its cadence under reduced
	// motion; the render suppresses the zap classes instead (instant swaps).
	const paused = !onScreen || userPaused || hovered;
	const items = pool(filter);

	return (
		<div
			ref={wrapperRef}
			className="relative px-6 md:px-9 pb-6"
			onPointerEnter={(e) => {
				if (e.pointerType !== "touch") setHovered(true);
			}}
			onPointerLeave={() => setHovered(false)}
			onPointerCancel={() => setHovered(false)}
		>
			{/* the relocated billboard pills - functional filters - plus the
			    touch-reachable pause; all OUTSIDE the trigger button below
			    (nested buttons are invalid HTML) */}
			<div className="flex items-center justify-between mb-3">
				<div className="flex items-center gap-2 text-[11px] font-semibold tracking-[0.08em]">
					{FILTERS.map((f) => (
						<button
							key={f.key}
							type="button"
							onClick={() => setFilter(f.key)}
							className={`sbb-pill poster-filter-pill cursor-pointer ${filter === f.key ? "sbb-pill--on" : "opacity-60 hover:opacity-100"}`}
							aria-pressed={filter === f.key}
						>
							{f.label}
						</button>
					))}
				</div>
				<div className="flex items-center gap-3">
					<span className="text-[11px] font-bold tracking-[0.2em] text-white/70">
						ALL-TIME FAVORITES
					</span>
					<button
						type="button"
						onClick={() => setUserPaused((p) => !p)}
						aria-pressed={userPaused}
						aria-label={
							userPaused ? "Resume poster rotation" : "Pause poster rotation"
						}
						className="rounded-full ring-1 ring-white/15 h-7 w-7 flex items-center justify-center opacity-80 hover:ring-white/30 hover:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-current transition cursor-pointer"
					>
						{userPaused ? (
							<Play size={12} strokeWidth={1.5} />
						) : (
							<Pause size={12} strokeWidth={1.5} />
						)}
					</button>
				</div>
			</div>
			<button
				type="button"
				className="group block w-full text-left cursor-pointer"
				aria-label={`Browse all ${items.length} all-time favorite films and series`}
				onClick={(e) => resolved?.navigate(e.currentTarget)}
			>
				{/* key={filter} remounts the rotation on a filter change: visible
				    cells and undo history reset to the new pool with zero
				    hook-reset API */}
				<ZapGrid key={filter} items={items} paused={paused} reduced={reduced} />
				{/* Resting opacity kept high (not hover-only) plus a permanently
				    visible arrow icon - the GoodWatch TriggerCard precedent - so
				    touch users get the same affordance as a hover reveal. */}
				<div className="mt-2 flex items-center justify-end gap-1.5 text-[11px] font-semibold text-white/80 group-hover:text-white/95 transition-colors">
					browse all {items.length}
					<ArrowRight
						size={14}
						strokeWidth={2}
						className="shrink-0 transition-transform group-hover:translate-x-1"
					/>
				</div>
			</button>
		</div>
	);
}

function ZapGrid({
	items,
	paused,
	reduced,
}: {
	items: Favorite[];
	paused: boolean;
	reduced: boolean;
}) {
	const { visible, swap } = useRotation(items, {
		visibleCount: VISIBLE,
		intervalMs: INTERVAL_MS,
		outMs: OUT_MS,
		inMs: IN_MS,
		paused,
		keyOf: (f) => f.slug,
	});

	return (
		<div className="grid grid-cols-3 gap-2 md:gap-3">
			{visible.map((poster, i) => {
				// Reduced motion: the swap still lands (content changes on
				// cadence) but the zap classes never render - instant switch.
				const zapClass = reduced
					? ""
					: swap?.cell === i
						? swap.phase === "out"
							? "poster-zap--out"
							: "poster-zap--in"
						: "";
				return (
					<div
						// biome-ignore lint/suspicious/noArrayIndexKey: key is the grid position by design - the element must persist across the content swap so each zap phase's animation plays in place.
						key={i}
						className={`poster-zap ${zapClass} aspect-[2/3] rounded-md ring-1 ring-white/15 group-hover:ring-white/30 transition-shadow`}
					>
						<img
							src={poster.poster}
							alt=""
							loading="lazy"
							className="poster-zap-content w-full h-full object-cover rounded-md"
						/>
						<span className="poster-static rounded-md" aria-hidden="true" />
					</div>
				);
			})}
		</div>
	);
}
