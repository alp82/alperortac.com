import { Dices, Pause, Play, Undo2, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { Album } from "../../../data/personal";
import { SONG_MOMENTS, type SongMoment } from "../../../data/songMoments";
import { useReducedMotion } from "../dive/useReducedMotion";
import { MomentPlayer } from "./MomentPlayer";
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

// Which shelf albums have a playable song moment - covers without an entry
// (a filtered-out invalid config row) stay non-interactive and keep rotating.
const SONG_BY_ARTIST = new Map<string, SongMoment>(
	SONG_MOMENTS.map((s) => [s.artist, s]),
);

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
	// The open moment player: which grid cell it anchors to. The song itself
	// is re-derived from SONG_BY_ARTIST at render/click time, so there is a
	// single source of truth for it rather than a copy living in state.
	const [expandedCell, setExpandedCell] = useState<number | null>(null);
	const paused =
		reduced || !active || userPaused || hovered || expandedCell !== null;
	const { visible, swap, cycle, next, prev, canPrev } = useAlbumRotation(
		albums,
		{
			visibleCount: 12,
			intervalMs: INTERVAL_MS,
			paused,
		},
	);

	// Focus anchor for the open player's cover button, so closing the player
	// returns keyboard focus where the expansion started.
	const anchorRef = useRef<HTMLButtonElement | null>(null);
	const closePlayer = () => {
		setExpandedCell(null);
		anchorRef.current?.focus();
	};

	// Panel-close guard: PanelHost closes personal panels with dialog.close(),
	// which leaves this subtree mounted and merely display:none - a hidden
	// iframe would keep playing audio. Unmount the player when the panel goes
	// inactive so the snippet stops.
	useEffect(() => {
		if (!active) setExpandedCell(null);
	}, [active]);

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
			{/* dense flow backfills the clicked row around the col-span-full player */}
			<ul className="grid grid-cols-3 sm:grid-cols-4 gap-4 [grid-auto-flow:dense]">
				{visible.flatMap((album, i) => {
					const song = SONG_BY_ARTIST.get(album.artist);
					const isActive = expandedCell === i;
					const playerId = `player-${i}`;
					// Inner div carries the flick classes so the box-shadow-animating
					// keyframes never run on the ring-bearing wrapper above.
					const flickInner = (
						// biome-ignore lint/correctness/useJsxKeyInIterable: not an iterable item - this fragment is rendered exactly once inside the keyed <li> below.
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
					);
					const cells = [
						// biome-ignore lint/suspicious/noArrayIndexKey: key is the grid position by design - the element must persist across the content swap so each flicker phase's animation plays in place.
						<li key={i}>
							{song ? (
								<button
									type="button"
									ref={isActive ? anchorRef : undefined}
									onClick={() =>
										isActive ? closePlayer() : setExpandedCell(i)
									}
									aria-expanded={isActive}
									aria-controls={isActive ? playerId : undefined}
									aria-label={
										isActive
											? `Close the player for ${song.title}`
											: `Play the moment from ${song.title} by ${song.artist}`
									}
									className={`group relative block w-full aspect-square rounded-md overflow-hidden transition duration-200 cursor-pointer hover:scale-[1.03] hover:ring-white/30 hover:shadow-[0_0_20px_rgba(238,242,255,0.25)] motion-reduce:transform-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-current ${
										isActive ? "ring-2 ring-white/60" : "ring-1 ring-white/10"
									}`}
								>
									{flickInner}
									{/* hover/focus play badge - sits on the cover, never on the embed */}
									<span
										className={`absolute bottom-1.5 right-1.5 rounded-full bg-black/60 ring-1 ring-white/30 h-6 w-6 flex items-center justify-center transition ${
											isActive
												? "opacity-100"
												: "opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100"
										}`}
									>
										{isActive ? (
											<X size={11} />
										) : (
											<Play size={11} className="translate-x-[1px]" />
										)}
									</span>
								</button>
							) : (
								<div className="aspect-square rounded-md overflow-hidden ring-1 ring-white/10 transition duration-200 hover:scale-[1.03] hover:ring-white/30 hover:shadow-[0_0_20px_rgba(238,242,255,0.25)] motion-reduce:transform-none">
									{flickInner}
								</div>
							)}
							<p className="mt-2 text-xs opacity-80 leading-snug">
								{album.artist} - {album.album}
							</p>
						</li>,
					];
					if (isActive && song) {
						cells.push(
							<li
								key={playerId}
								id={playerId}
								className="col-span-full min-w-0"
							>
								<MomentPlayer song={song} onClose={closePlayer} />
							</li>,
						);
					}
					return cells;
				})}
			</ul>
			<div className="mt-5 flex items-center justify-center gap-3">
				<button
					type="button"
					onClick={() => {
						// Clear the player before the manual swap: the swap targets one
						// random cell, which may be the player's anchor.
						setExpandedCell(null);
						prev();
					}}
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
					onClick={() => {
						setExpandedCell(null);
						next();
					}}
					aria-label="Next album"
					className={GHOST_BUTTON}
				>
					<Dices size={16} strokeWidth={1.5} />
				</button>
			</div>
		</div>
	);
}
