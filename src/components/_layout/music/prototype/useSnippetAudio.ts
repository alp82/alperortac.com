/*
 * PROTOTYPE — shared audio engine for the iTunes-preview variants (A and C).
 * Resolves `previewUrl` lazily per play-click via the iTunes lookup API (the
 * research says preview URLs aren't stable, so the repo only stores track
 * ids), streams straight from Apple's CDN through one <audio> element, and
 * confines playback to the song's highlight sub-range within Apple's fixed
 * 30s window when one is set.
 */
import { useEffect, useRef, useState } from "react";
import type { SnippetSong } from "./songs";

type PlayerState = {
	trackId: number | null;
	status: "idle" | "loading" | "playing" | "error";
	/** seconds into the 30s preview window */
	position: number;
};

export function useSnippetAudio() {
	const audioRef = useRef<HTMLAudioElement | null>(null);
	const highlightEndRef = useRef<number | null>(null);
	const [state, setState] = useState<PlayerState>({
		trackId: null,
		status: "idle",
		position: 0,
	});

	useEffect(() => {
		return () => {
			audioRef.current?.pause();
			audioRef.current = null;
		};
	}, []);

	const stop = () => {
		audioRef.current?.pause();
		setState({ trackId: null, status: "idle", position: 0 });
	};

	const play = async (song: SnippetSong) => {
		if (state.trackId === song.itunesTrackId && state.status === "playing") {
			stop();
			return;
		}
		audioRef.current?.pause();
		setState({ trackId: song.itunesTrackId, status: "loading", position: 0 });
		try {
			const res = await fetch(
				`https://itunes.apple.com/lookup?id=${song.itunesTrackId}`,
			);
			const data = await res.json();
			const previewUrl: string | undefined = data.results?.[0]?.previewUrl;
			if (!previewUrl) throw new Error("no preview");

			if (!audioRef.current) {
				audioRef.current = new Audio();
				audioRef.current.preload = "none";
			}
			const audio = audioRef.current;
			audio.src = previewUrl;
			const start = song.previewHighlight?.start ?? 0;
			highlightEndRef.current = song.previewHighlight?.end ?? null;
			audio.currentTime = start;
			audio.ontimeupdate = () => {
				const end = highlightEndRef.current;
				if (end !== null && audio.currentTime >= end) {
					audio.pause();
					setState({ trackId: null, status: "idle", position: 0 });
					return;
				}
				setState((s) => ({ ...s, position: audio.currentTime }));
			};
			audio.onended = () =>
				setState({ trackId: null, status: "idle", position: 0 });
			await audio.play();
			setState({
				trackId: song.itunesTrackId,
				status: "playing",
				position: start,
			});
		} catch {
			setState({ trackId: song.itunesTrackId, status: "error", position: 0 });
		}
	};

	return { state, play, stop };
}
