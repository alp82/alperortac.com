import type { Album } from "../../../data/personal";
import { type Swap, useRotation } from "../useRotation";

// Thin wrapper over the generic useRotation engine (the rotation machinery
// used to live here and moved verbatim to ../useRotation.ts for the movies
// PosterGrid to share). Albums are identified by cover; the public signature
// and defaults (2800ms cadence, 200/340ms flick - keep in sync with
// AlbumShelf.tsx INTERVAL_MS and the album-flick durations in styles.css)
// are unchanged.
export function useAlbumRotation(
	albums: Album[],
	opts: {
		visibleCount: number;
		intervalMs?: number;
		outMs?: number;
		inMs?: number;
		random?: () => number;
		paused?: boolean;
	},
): {
	visible: Album[];
	swap: Swap;
	cycle: number;
	next: () => void;
	prev: () => void;
	canPrev: boolean;
} {
	return useRotation(albums, { ...opts, keyOf: (a) => a.cover });
}
