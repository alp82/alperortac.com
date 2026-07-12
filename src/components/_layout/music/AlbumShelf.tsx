import { Dices, Pause, Play, Undo2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { Album } from "../../../data/personal";
import { useReducedMotion } from "../dive/useReducedMotion";
import { useAlbumRotation } from "./useAlbumRotation";

// Rotation cadence - passed to the hook AND used as the countdown ring's
// animation duration, so ring and cadence can never drift.
const INTERVAL_MS = 2800;

// Delicate 36px ghost button shared by the three transport controls
// (same role/size as the ShortsCarousel nav buttons, but the shelf's own
// delicate rounded-full ring vocabulary rather than that carousel's
// brutalist square border).
const GHOST_BUTTON =
	"rounded-full ring-1 ring-white/10 h-9 w-9 flex items-center justify-center opacity-80 hover:ring-white/30 hover:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-current transition disabled:opacity-40 disabled:hover:ring-white/10 disabled:hover:opacity-40";

// `active` is the panel-open signal threaded from PanelHost. PanelHost
// renders every personal dialog at app start, so mount-time work would fire
// during landing-page first paint - everything here is gated on activation.
export function AlbumShelf({
	albums,
	active,
}: {
	albums: Album[];
	active: boolean;
}) {
	const reduced = useReducedMotion();
	const [hovered, setHovered] = useState(false);
	const [userPaused, setUserPaused] = useState(false);
	const paused = reduced || !active || userPaused || hovered;
	const { visible, swap, cycle, next, prev, canPrev } = useAlbumRotation(
		albums,
		{
			visibleCount: 12,
			intervalMs: INTERVAL_MS,
			paused,
		},
	);

	// Preload all covers on FIRST activation only - never during landing-page
	// first paint, never re-fired on re-open (the browser cache holds them).
	// This caches the off-shelf covers before their first swap so the flick-in
	// never reveals an empty frame.
	const hasPreloadedRef = useRef(false);
	useEffect(() => {
		if (!active || hasPreloadedRef.current) return;
		hasPreloadedRef.current = true;
		for (const album of albums) {
			const img = new Image();
			img.src = album.cover;
		}
	}, [active, albums]);

	return (
		<div
			className="mt-8"
			onPointerEnter={(e) => {
				if (e.pointerType !== "touch") setHovered(true);
			}}
			onPointerLeave={() => setHovered(false)}
			onPointerCancel={() => setHovered(false)}
		>
			<ul className="grid grid-cols-3 sm:grid-cols-4 gap-4">
				{visible.map((album, i) => (
					// biome-ignore lint/suspicious/noArrayIndexKey: key is the grid position by design - the element must persist across the content swap so each flicker phase's animation plays in place.
					<li key={i}>
						<div className="aspect-square rounded-md overflow-hidden ring-1 ring-white/10 transition duration-200 hover:scale-[1.03] hover:ring-white/30 hover:shadow-[0_0_20px_rgba(238,242,255,0.25)] motion-reduce:transform-none">
							{/* Inner div carries the flick classes so the box-shadow-animating
							    keyframes never run on the ring-bearing wrapper above. */}
							<div
								className={`w-full h-full ${
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
									className="object-cover w-full h-full"
								/>
							</div>
						</div>
						<p className="mt-2 text-xs opacity-80 leading-snug">
							{album.artist} - {album.album}
						</p>
					</li>
				))}
			</ul>
			<div className="mt-5 flex items-center justify-center gap-3">
				<button
					type="button"
					onClick={prev}
					disabled={!canPrev}
					aria-label="Previous album"
					className={GHOST_BUTTON}
				>
					<Undo2 size={16} strokeWidth={1.5} />
				</button>
				<button
					type="button"
					onClick={() => setUserPaused((p) => !p)}
					aria-pressed={userPaused}
					aria-label={
						userPaused ? "Resume album rotation" : "Pause album rotation"
					}
					className={`relative ${GHOST_BUTTON}`}
				>
					{/* key remount restarts the CSS ring animation on every cycle
					    (auto tick, manual nav, rotation restart); data-cycle is the
					    jsdom-assertable reset signal. */}
					<svg
						viewBox="0 0 44 44"
						aria-hidden="true"
						className="pointer-events-none absolute -inset-1 h-11 w-11 -rotate-90"
					>
						<circle
							cx="22"
							cy="22"
							r="20.5"
							fill="none"
							strokeWidth="1"
							className="stroke-white/10"
						/>
						<circle
							key={cycle}
							data-cycle={cycle}
							cx="22"
							cy="22"
							r="20.5"
							fill="none"
							strokeWidth="1.5"
							pathLength={1}
							className="album-ring-fill stroke-white/40"
							style={{
								animationDuration: `${INTERVAL_MS}ms`,
								animationPlayState: paused ? "paused" : "running",
							}}
						/>
					</svg>
					{userPaused ? (
						<Play size={16} strokeWidth={1.5} />
					) : (
						<Pause size={16} strokeWidth={1.5} />
					)}
				</button>
				<button
					type="button"
					onClick={next}
					aria-label="Next album"
					className={GHOST_BUTTON}
				>
					<Dices size={16} strokeWidth={1.5} />
				</button>
			</div>
		</div>
	);
}
