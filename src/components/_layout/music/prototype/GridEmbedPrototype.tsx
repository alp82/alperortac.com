/*
 * PROTOTYPE — Variant D: the YouTube moment player lives INSIDE the album
 * grid. Every cover is playable (one snippet song per album); clicking one
 * expands a FULL-ROW player directly under the clicked cover's row — the
 * visible YouTube embed at the moment's start/end seconds plus a slim
 * caption bar. No covers are hidden: dense flow backfills the clicked row
 * and the rest shifts down. Rotation pauses while a player is open.
 * Clone of AlbumShelf's grid + transport, modified.
 */
import { Dices, Pause, Play, Undo2, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { Album } from "../../../../data/personal";
import { useReducedMotion } from "../../dive/useReducedMotion";
import { useAlbumRotation } from "../useAlbumRotation";
import { SNIPPET_SONGS, type SnippetSong } from "./songs";

const INTERVAL_MS = 2800;

const GHOST_BUTTON =
	"rounded-full ring-1 ring-white/10 h-9 w-9 flex items-center justify-center opacity-80 hover:ring-white/30 hover:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-current transition disabled:opacity-40 disabled:hover:ring-white/10 disabled:hover:opacity-40";

const SONG_BY_ARTIST = new Map<string, SnippetSong>(
	SNIPPET_SONGS.map((s) => [s.artist, s]),
);

export function GridEmbedPrototype({
	albums,
	active,
}: {
	albums: Album[];
	active: boolean;
}) {
	const reduced = useReducedMotion();
	const [hovered, setHovered] = useState(false);
	const [userPaused, setUserPaused] = useState(false);
	// The open player: which grid cell it anchors to + which song it plays.
	const [expanded, setExpanded] = useState<{
		cell: number;
		song: SnippetSong;
	} | null>(null);
	const paused =
		reduced || !active || userPaused || hovered || expanded !== null;
	const { visible, swap, cycle, next, prev, canPrev } = useAlbumRotation(
		albums,
		{
			visibleCount: 12,
			intervalMs: INTERVAL_MS,
			paused,
		},
	);

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
			<ul className="grid grid-cols-3 sm:grid-cols-4 gap-4 [grid-auto-flow:dense]">
				{visible.flatMap((album, i) => {
					const song = SONG_BY_ARTIST.get(album.artist);
					const isActive = expanded?.cell === i;
					const cells = [
						// biome-ignore lint/suspicious/noArrayIndexKey: key is the grid position by design - the element must persist across the content swap so each flicker phase's animation plays in place.
						<li key={i}>
							<button
								type="button"
								onClick={() =>
									song &&
									(isActive
										? setExpanded(null)
										: setExpanded({ cell: i, song }))
								}
								disabled={!song}
								aria-label={
									song
										? isActive
											? `Close the player for ${song.title}`
											: `Play the moment from ${song.title} by ${song.artist}`
										: undefined
								}
								className={`group relative block w-full aspect-square rounded-md overflow-hidden ring-1 transition duration-200 motion-reduce:transform-none cursor-pointer hover:scale-[1.03] hover:shadow-[0_0_20px_rgba(238,242,255,0.25)] ${
									isActive
										? "ring-2 ring-white/60"
										: "ring-white/10 hover:ring-white/40"
								}`}
							>
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
							<p className="mt-2 text-xs opacity-80 leading-snug">
								{album.artist} - {album.album}
							</p>
						</li>,
					];
					if (isActive && expanded) {
						const active = expanded.song;
						cells.push(
							<li key={`player-${i}`} className="col-span-full min-w-0">
								<div className="flex flex-col rounded-md overflow-hidden ring-1 ring-white/25 bg-black">
									<div className="relative aspect-video">
										<iframe
											className="absolute inset-0 w-full h-full"
											src={`https://www.youtube-nocookie.com/embed/${active.youtubeId}?start=${active.youtubeStart}&end=${active.youtubeEnd}&autoplay=1&rel=0`}
											title={`${active.artist} — ${active.title}`}
											allow="autoplay; encrypted-media; picture-in-picture"
											allowFullScreen
										/>
									</div>
									<div className="flex items-center gap-2 px-3 py-2 text-xs">
										<div className="min-w-0 flex-1">
											<p className="font-semibold truncate">
												{active.title}
												<span className="opacity-60 font-normal">
													{" "}
													— {active.artist}
												</span>
											</p>
											<p className="opacity-60 truncate">{active.moment}</p>
										</div>
										<button
											type="button"
											onClick={() => setExpanded(null)}
											aria-label="Close player"
											className="shrink-0 rounded-full ring-1 ring-white/15 h-7 w-7 flex items-center justify-center hover:ring-white/40 transition"
										>
											<X size={14} />
										</button>
									</div>
								</div>
							</li>,
						);
					}
					return cells;
				})}
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
