/*
 * PROTOTYPE — Variant A: pure-audio custom player on iTunes 30s previews.
 * Compact liner-notes list: each row is play button + song + Alper's moment
 * note + a 30s window bar with the highlight sub-range marked. Apple picks
 * the 30s window; we can only seek WITHIN it — the bar makes that constraint
 * visible so the walk can judge it honestly.
 */
import { AlertTriangle, Loader2, Pause, Play } from "lucide-react";
import { SNIPPET_SONGS } from "./songs";
import { useSnippetAudio } from "./useSnippetAudio";

const PREVIEW_LEN = 30;

export function ItunesPreviewPrototype() {
	const { state, play } = useSnippetAudio();

	return (
		<div className="mt-10">
			<h3 className="text-xl font-bold tracking-tight mb-1">
				Moments I keep coming back to
			</h3>
			<p className="text-sm opacity-70 mb-5">
				Thirty-second previews — the marked slice is the part I mean.
			</p>
			<ul className="space-y-3">
				{SNIPPET_SONGS.map((song) => {
					const isCurrent = state.trackId === song.itunesTrackId;
					const hl = song.previewHighlight;
					return (
						<li
							key={song.itunesTrackId}
							className="flex items-center gap-4 rounded-lg ring-1 ring-white/10 px-4 py-3 hover:ring-white/25 transition"
						>
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
								{/* 30s window bar: highlight band + live progress cursor */}
								<div className="relative mt-2 h-1.5 rounded-full bg-white/10 overflow-hidden">
									{hl && (
										<div
											className="absolute inset-y-0 bg-white/30 rounded-full"
											style={{
												left: `${(hl.start / PREVIEW_LEN) * 100}%`,
												width: `${((hl.end - hl.start) / PREVIEW_LEN) * 100}%`,
											}}
										/>
									)}
									{isCurrent && state.status === "playing" && (
										<div
											className="absolute inset-y-0 w-0.5 bg-white"
											style={{
												left: `${(state.position / PREVIEW_LEN) * 100}%`,
											}}
										/>
									)}
								</div>
							</div>
							<a
								href={song.appleMusicUrl}
								target="_blank"
								rel="noreferrer"
								className="shrink-0 text-xs opacity-60 hover:opacity-100 underline underline-offset-2"
							>
								Apple&nbsp;Music&nbsp;↗
							</a>
						</li>
					);
				})}
			</ul>
			<p className="mt-3 text-xs opacity-50">
				Song previews provided courtesy of iTunes.
			</p>
		</div>
	);
}
