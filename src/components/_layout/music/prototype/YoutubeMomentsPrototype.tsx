/*
 * PROTOTYPE — Variant B: video-first "watch this moment" cards on visible
 * YouTube embeds with start/end. The only legal route to an arbitrary second
 * of the full recording — at the price of a video player that must stay
 * visible (>=200x200px, no audio-only, no obscuring overlays). Lite pattern:
 * thumbnail + moment badge until click, then the real iframe with autoplay.
 */
import { Play } from "lucide-react";
import { useState } from "react";
import { SNIPPET_SONGS } from "./songs";

const fmt = (s: number) =>
	`${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

export function YoutubeMomentsPrototype() {
	const [activeId, setActiveId] = useState<string | null>(null);

	return (
		<div className="mt-10">
			<h3 className="text-xl font-bold tracking-tight mb-1">
				Watch these moments
			</h3>
			<p className="text-sm opacity-70 mb-5">
				The exact passages, straight from the source.
			</p>
			<div className="grid sm:grid-cols-2 gap-5">
				{SNIPPET_SONGS.map((song) => (
					<div key={song.youtubeId} className="min-w-0">
						<div className="relative aspect-video rounded-lg overflow-hidden ring-1 ring-white/10 bg-black">
							{activeId === song.youtubeId ? (
								<iframe
									className="absolute inset-0 w-full h-full"
									src={`https://www.youtube-nocookie.com/embed/${song.youtubeId}?start=${song.youtubeStart}&end=${song.youtubeEnd}&autoplay=1&rel=0`}
									title={`${song.artist} — ${song.title}`}
									allow="autoplay; encrypted-media; picture-in-picture"
									allowFullScreen
								/>
							) : (
								<button
									type="button"
									onClick={() => setActiveId(song.youtubeId)}
									aria-label={`Watch the moment in ${song.title}`}
									className="group absolute inset-0 w-full h-full"
								>
									<img
										src={`https://i.ytimg.com/vi/${song.youtubeId}/hqdefault.jpg`}
										alt=""
										loading="lazy"
										className="absolute inset-0 w-full h-full object-cover opacity-80 group-hover:opacity-100 transition"
									/>
									<span className="absolute inset-0 flex items-center justify-center">
										<span className="rounded-full bg-black/60 ring-1 ring-white/40 h-14 w-14 flex items-center justify-center group-hover:scale-110 transition">
											<Play size={22} className="translate-x-[2px]" />
										</span>
									</span>
									<span className="absolute bottom-2 right-2 rounded bg-black/70 px-1.5 py-0.5 text-xs font-mono">
										{fmt(song.youtubeStart)}–{fmt(song.youtubeEnd)}
									</span>
								</button>
							)}
						</div>
						<p className="mt-2 font-semibold leading-tight">
							{song.title}
							<span className="opacity-60 font-normal"> — {song.artist}</span>
						</p>
						<p className="text-sm opacity-70">{song.moment}</p>
					</div>
				))}
			</div>
		</div>
	);
}
