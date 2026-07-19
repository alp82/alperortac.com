import { ArrowRight } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { ALBUMS } from "../../../data/personal";
import { useTriggerNav } from "../composer/useTriggerNav";
import { useReducedMotion } from "../dive/useReducedMotion";
import { useRotation } from "../useRotation";

/*
 * The music band's ambient backdrop cover wall + shelf-strip trigger, seated
 * inside the festival-poster frame (the approved #26 variant-C walk). The
 * wall is a dimmed flicker-rotating grid of the album shelf's real covers
 * (personal.ts) behind the whole poster - pure atmosphere, aria-hidden,
 * non-interactive. The poster's date strip becomes the one trigger into the
 * /music subpage (no-double-links: the band's "Listen with me" card is gone).
 *
 * Rotation semantics mirror the subpage shelf (2800ms cadence, album-flick
 * transition) with NO visible controls - no pause button, no transport, no
 * countdown ring. Non-touch hover still pauses, reduced motion pauses the
 * rotation entirely (AlbumShelf semantics), and nothing runs off-screen
 * (PosterGrid's IntersectionObserver gate).
 *
 * WCAG 2.2.2 (Pause, Stop, Hide) without controls: on a coarse-pointer /
 * no-hover device there is no hover-pause, so the wall renders STATIC there
 * (no rotation at all) - Alper's affirmed ruling over PosterGrid's visible
 * pause-button route. Desktop pointers keep flicker + hover-pause.
 */

const VISIBLE = 12;
const INTERVAL_MS = 2800;

/** Ambient dimmed cover wall behind the poster. Absolute within `.fsp`. */
export function CoverWallBackdrop() {
	const [hovered, setHovered] = useState(false);
	const [onScreen, setOnScreen] = useState(false);
	const [coarse, setCoarse] = useState(false);
	const reduced = useReducedMotion();
	const wrapperRef = useRef<HTMLDivElement>(null);

	// Static-on-touch gate (see the header comment) - the useReducedMotion
	// subscription pattern, inlined for its one call site.
	useEffect(() => {
		if (typeof window === "undefined" || !window.matchMedia) return;
		const mql = window.matchMedia("(hover: none), (pointer: coarse)");
		setCoarse(mql.matches);
		const onChange = (e: MediaQueryListEvent) => setCoarse(e.matches);
		mql.addEventListener("change", onChange);
		return () => mql.removeEventListener("change", onChange);
	}, []);

	// On-screen gate: no rotation interval and no image work during
	// landing-page first paint or while scrolled away. Guarded for jsdom
	// suites that mount the frame without an IntersectionObserver stub.
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

	// Preload all covers on first on-screen only - flick-ins never reveal an
	// empty frame (AlbumShelf pattern; the browser cache holds them after).
	const hasPreloadedRef = useRef(false);
	useEffect(() => {
		if (!onScreen || hasPreloadedRef.current) return;
		hasPreloadedRef.current = true;
		for (const album of ALBUMS) {
			const img = new Image();
			img.src = album.cover;
		}
	}, [onScreen]);

	const paused = reduced || coarse || !onScreen || hovered;
	const { visible, swap } = useRotation(ALBUMS, {
		visibleCount: VISIBLE,
		intervalMs: INTERVAL_MS,
		paused,
		keyOf: (a) => a.cover,
	});

	return (
		<div
			ref={wrapperRef}
			className="absolute inset-0 overflow-hidden"
			aria-hidden="true"
			onPointerEnter={(e) => {
				if (e.pointerType !== "touch") setHovered(true);
			}}
			onPointerLeave={() => setHovered(false)}
			onPointerCancel={() => setHovered(false)}
		>
			<div className="grid h-full w-full grid-cols-4 opacity-25">
				{visible.map((album, i) => (
					// biome-ignore lint/suspicious/noArrayIndexKey: key is the grid position by design - the element persists across the content swap so each flick phase's animation plays in place.
					<div key={i} className="overflow-hidden">
						<div
							className={`h-full w-full ${
								swap?.cell === i
									? swap.phase === "out"
										? "album-flick-out"
										: "album-flick-in"
									: ""
							}`}
						>
							<img
								src={album.cover}
								alt=""
								loading="lazy"
								className="h-full w-full object-cover"
							/>
						</div>
					</div>
				))}
			</div>
		</div>
	);
}

/** The date strip reworded into the shelf invitation - the /music trigger. */
export function ShelfStripTrigger({
	lastTriggerRef,
}: {
	lastTriggerRef: React.RefObject<HTMLElement | null>;
}) {
	// The one shared production nav contract (lastTriggerRef stash +
	// resetScroll:false); never null for a personal trigger, but the
	// resolver's project branch makes its type nullable.
	const { resolveTrigger } = useTriggerNav(lastTriggerRef);
	const resolved = resolveTrigger({ kind: "personal", slug: "music" }, "");

	return (
		<button
			type="button"
			className="fsp-dates group relative mx-6 mt-6 block w-[calc(100%-3rem)] cursor-pointer py-2 text-[10px] font-extrabold tracking-[0.28em]"
			aria-label={`Browse all ${ALBUMS.length} albums on the shelf`}
			onClick={(e) => resolved?.navigate(e.currentTarget)}
		>
			{ALBUMS.length} ALBUMS · TAP TO BROWSE THE SHELF{" "}
			<ArrowRight
				size={12}
				strokeWidth={2.5}
				className="inline-block align-baseline transition-transform group-hover:translate-x-1"
			/>
		</button>
	);
}
