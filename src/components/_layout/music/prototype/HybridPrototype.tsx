/*
 * PROTOTYPE — Variant C: hybrid. Audio-first rows on iTunes previews (same
 * engine as A), plus a per-song "watch the exact moment" toggle that expands
 * a visible YouTube embed with start/end beneath the row — the research
 * report's recommended combo: quick audio taste by default, the true passage
 * on demand for songs where the exact second matters.
 */
import {
	AlertTriangle,
	ChevronDown,
	ChevronUp,
	Loader2,
	Pause,
	Play,
} from "lucide-react";
import { useState } from "react";
import { SNIPPET_SONGS } from "./songs";
import { useSnippetAudio } from "./useSnippetAudio";

const fmt = (s: number) =>
	`${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

export function HybridPrototype() {
	const { state, play, stop } = useSnippetAudio();
	const [expandedId, setExpandedId] = useState<string | null>(null);

	return (
		<div className="mt-10">
			<h3 className="text-xl font-bold tracking-tight mb-1">
				Moments I keep coming back to
			</h3>
			<p className="text-sm opacity-70 mb-5">
				Tap for a taste — or watch the exact moment.
			</p>
			<ul className="space-y-3">
				{SNIPPET_SONGS.map((song) => {
					const isCurrent = state.trackId === song.itunesTrackId;
					const expanded = expandedId === song.youtubeId;
					return (
						<li
							key={song.itunesTrackId}
							className="rounded-lg ring-1 ring-white/10 hover:ring-white/25 transition overflow-hidden"
						>
							<div className="flex items-center gap-4 px-4 py-3">
								<button
									type="button"
									onClick={() => play(song)}
									aria-label={
										isCurrent && state.status === "playing"
											? `Stop ${song.title}`
											: `Play ${song.title} preview`
									}
									className="shrink-0 rounded-full ring-1 ring-white/20 h-11 w-11 flex items-center justify-center hover:ring-white/50 hover:bg-white/5 transition"
								>
									{isCurrent && state.status === "loading" ? (
										<Loader2 size={18} className="animate-spin" />
									) : isCurrent && state.status === "error" ? (
										<AlertTriangle size={18} />
									) : isCurrent && state.status === "playing" ? (
										<Pause size={18} />
									) : (
										<Play size={18} className="translate-x-[1px]" />
									)}
								</button>
								<div className="min-w-0 flex-1">
									<p className="font-semibold leading-tight">
										{song.title}
										<span className="opacity-60 font-normal">
											{" "}
											— {song.artist}
										</span>
									</p>
									<p className="text-sm opacity-70 truncate">{song.moment}</p>
								</div>
								<button
									type="button"
									onClick={() => {
										stop();
										setExpandedId(expanded ? null : song.youtubeId);
									}}
									aria-expanded={expanded}
									className="shrink-0 flex items-center gap-1 text-xs opacity-70 hover:opacity-100 rounded-full ring-1 ring-white/15 px-2.5 py-1.5 hover:ring-white/40 transition"
								>
									{fmt(song.youtubeStart)}
									{expanded ? (
										<ChevronUp size={14} />
									) : (
										<ChevronDown size={14} />
									)}
									<span className="hidden sm:inline">
										{expanded ? "hide" : "watch the moment"}
									</span>
								</button>
							</div>
							{expanded && (
								<div className="px-4 pb-4">
									<div className="relative aspect-video rounded-md overflow-hidden ring-1 ring-white/10 bg-black">
										<iframe
											className="absolute inset-0 w-full h-full"
											src={`https://www.youtube-nocookie.com/embed/${song.youtubeId}?start=${song.youtubeStart}&end=${song.youtubeEnd}&autoplay=1&rel=0`}
											title={`${song.artist} — ${song.title}`}
											allow="autoplay; encrypted-media; picture-in-picture"
											allowFullScreen
										/>
									</div>
								</div>
							)}
						</li>
					);
				})}
			</ul>
			<div className="mt-3 flex items-center justify-between text-xs opacity-50">
				<span>Song previews provided courtesy of iTunes.</span>
				<a
					href={SNIPPET_SONGS[0]?.appleMusicUrl}
					target="_blank"
					rel="noreferrer"
					className="underline underline-offset-2 hover:opacity-100"
				>
					Apple Music ↗
				</a>
			</div>
		</div>
	);
}
