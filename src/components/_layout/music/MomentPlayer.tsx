import { X } from "lucide-react";
import type { SongMoment } from "../../../data/songMoments";

// The full-row expanded player: a visible youtube-nocookie embed playing the
// configured moment (start/end seconds) plus a slim caption bar. autoplay=1
// is legitimate click-to-load - the iframe only mounts after the user's
// cover click, so nothing plays before interaction.
export function MomentPlayer({
	song,
	onClose,
}: {
	song: SongMoment;
	onClose: () => void;
}) {
	return (
		<div className="flex flex-col rounded-md overflow-hidden ring-1 ring-white/25 bg-black">
			<div className="relative aspect-video">
				<iframe
					className="absolute inset-0 w-full h-full"
					src={`https://www.youtube-nocookie.com/embed/${song.youtubeId}?start=${song.start}&end=${song.end}&autoplay=1&rel=0`}
					title={`${song.artist} - ${song.title}`}
					allow="autoplay; encrypted-media; picture-in-picture"
					allowFullScreen
				/>
			</div>
			<div className="flex items-center gap-2 px-3 py-2 text-xs">
				<div className="min-w-0 flex-1">
					<p className="font-semibold truncate">
						{song.title}
						<span className="opacity-60 font-normal"> - {song.artist}</span>
					</p>
					<p className="opacity-60 truncate">{song.moment}</p>
				</div>
				<button
					type="button"
					onClick={onClose}
					aria-label="Close player"
					className="shrink-0 rounded-full ring-1 ring-white/15 h-7 w-7 flex items-center justify-center hover:ring-white/40 transition"
				>
					<X size={14} />
				</button>
			</div>
		</div>
	);
}
