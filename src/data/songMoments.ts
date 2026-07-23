/*
 * Song/moment config for the music-subpage snippet player - hand-editable,
 * the album shelf's analogue of FAVORITES in favorites.ts.
 *
 * =============== EDIT ME ===============
 * One entry per album-shelf album, in shelf order. Per entry:
 *   artist  - must match the shelf artist in src/data/personal.ts exactly
 *   title   - the song
 *   moment  - one-liner shown under the player (why this part)
 *   youtube - ANY YouTube link: watch?v=..., youtu.be/..., or a bare video id
 *   start   - where the moment begins: "m:ss" (or "h:mm:ss") or plain seconds
 *   end     - where it stops playing
 *
 * Everything marked PLACEHOLDER is a guess - swap freely, hot-reloads.
 * Entries that fail validation (bad link, malformed or inverted timestamps)
 * are dropped from SONG_MOMENTS below, which degrades that album's cover to
 * non-playable - and fails the data test so it cannot ship unnoticed.
 */

type SongMomentConfig = {
	artist: string;
	title: string;
	moment: string;
	youtube: string;
	start: string | number;
	end: string | number;
};

export const SONG_MOMENT_CONFIG: SongMomentConfig[] = [
	{
		artist: "Gojira",
		title: "Vacuity",
		moment: "PLACEHOLDER - the riff that opens the floodgates",
		youtube: "https://www.youtube.com/watch?v=wM8LDVIiwhA",
		start: "2:55",
		end: "3:30",
	},
	{
		artist: "Noisia",
		title: "Machine Gun",
		moment: "PLACEHOLDER - the drop, obviously",
		youtube: "https://www.youtube.com/watch?v=SAO-lzl3vVQ",
		start: "0:55",
		end: "1:30",
	},
	{
		artist: "Haken",
		title: "Prosthetic",
		moment: "PLACEHOLDER - pick the moment",
		youtube: "https://www.youtube.com/watch?v=4EmbYo65Pbs",
		start: "1:00",
		end: "1:35",
	},
	{
		artist: "System of a Down",
		title: "Chop Suey!",
		moment: "PLACEHOLDER - the bridge, when everything drops away",
		youtube: "https://www.youtube.com/watch?v=CSvFpBOe8eY",
		start: "2:30",
		end: "3:15",
	},
	{
		artist: "Rezz",
		title: "Witching Hour",
		moment: "PLACEHOLDER - pick the moment",
		youtube: "https://www.youtube.com/watch?v=kaEAk_sguGo",
		start: "1:00",
		end: "1:35",
	},
	{
		artist: "Farin Urlaub",
		title: "Dusche",
		moment: "PLACEHOLDER - pick the moment",
		youtube: "https://www.youtube.com/watch?v=kHQl3VTrmkM",
		start: "1:00",
		end: "1:35",
	},
	{
		artist: "Periphery",
		title: "Marigold",
		moment: "PLACEHOLDER - pick the moment",
		youtube: "https://www.youtube.com/watch?v=gQqIF0yVtzc",
		start: "1:00",
		end: "1:35",
	},
	{
		artist: "Misanthrop",
		title: "Analog",
		moment: "PLACEHOLDER - pick the moment",
		youtube: "https://www.youtube.com/watch?v=6Glci7CP0g8",
		start: "1:00",
		end: "1:35",
	},
	{
		artist: "Porcupine Tree",
		title: "Time Flies",
		moment: "PLACEHOLDER - that guitar line out of nowhere",
		youtube: "https://www.youtube.com/watch?v=UkJBS0Zazmw",
		start: "2:00",
		end: "2:40",
	},
	{
		artist: "Waltari",
		title: "Helsinki",
		moment: "PLACEHOLDER - pick the moment",
		youtube: "https://www.youtube.com/watch?v=2X3_U8ayoZc",
		start: "1:00",
		end: "1:35",
	},
	{
		artist: "Savant",
		title: "Starfish",
		moment: "PLACEHOLDER - pick the moment",
		youtube: "https://www.youtube.com/watch?v=O1UzSAbMYIs",
		start: "1:00",
		end: "1:35",
	},
	{
		artist: "Muse",
		title: "Knights of Cydonia",
		moment: "PLACEHOLDER - the final gallop riff everyone waits for",
		youtube: "https://www.youtube.com/watch?v=G_sBOsh-vyI",
		start: "5:00",
		end: "5:45",
	},
	{
		artist: "Nine Inch Nails",
		title: "The Hand That Feeds",
		moment: "PLACEHOLDER - pick the moment",
		youtube: "https://www.youtube.com/watch?v=xwhBRJStz7w",
		start: "1:00",
		end: "1:35",
	},
	{
		artist: "Supergroove",
		title: "Can't Get Enough",
		moment: "PLACEHOLDER - pick the moment",
		youtube: "https://www.youtube.com/watch?v=0n7acp5rsu0",
		start: "1:00",
		end: "1:35",
	},
	{
		artist: "Unprocessed",
		title: "Sacrifice Me",
		moment: "PLACEHOLDER - pick the moment",
		youtube: "https://www.youtube.com/watch?v=ivXDVKwzCIw",
		start: "1:00",
		end: "1:35",
	},
	{
		artist: "Enter Shikari",
		title: "(pls) set me on fire",
		moment: "PLACEHOLDER - pick the moment",
		youtube: "https://www.youtube.com/watch?v=mvDFdLZJ-q0",
		start: "1:00",
		end: "1:35",
	},
	{
		artist: "Soilwork",
		title: "Rejection Role",
		moment: "PLACEHOLDER - pick the moment",
		youtube: "https://www.youtube.com/watch?v=VKZBFts4lPo",
		start: "1:00",
		end: "1:35",
	},
];

/* =========== plumbing below - no need to edit =========== */

// Strict "h:mm:ss" / "m:ss" / plain-seconds parse. Returns NaN on anything
// malformed (no partial parses), so a bad hand-edit fails validation cleanly.
function toSeconds(v: string | number): number {
	if (typeof v === "number") return Number.isFinite(v) ? v : Number.NaN;
	const trimmed = v.trim();
	if (/^\d+$/.test(trimmed)) return Number(trimmed);
	const match = trimmed.match(/^(?:(\d+):)?(\d+):(\d{2})$/);
	if (!match) return Number.NaN;
	const hours = match[1] === undefined ? 0 : Number(match[1]);
	const minutes = Number(match[2]);
	const seconds = Number(match[3]);
	if (seconds > 59) return Number.NaN;
	if (match[1] !== undefined && minutes > 59) return Number.NaN;
	return hours * 3600 + minutes * 60 + seconds;
}

// Any YouTube link shape (watch?v=, youtu.be/, embed/, or a bare 11-char id)
// to the video id; null when the value matches none of them.
function toYoutubeId(v: string): string | null {
	const id = v.match(/(?:v=|youtu\.be\/|embed\/)([\w-]{11})/)?.[1];
	if (id) return id;
	return /^[\w-]{11}$/.test(v) ? v : null;
}

export type SongMoment = {
	artist: string;
	title: string;
	moment: string;
	youtubeId: string;
	/** Whole seconds into the video. */
	start: number;
	end: number;
};

// Validated view of the config: entries with an unrecognizable link, a
// malformed timestamp, or end <= start are dropped, degrading that cover to
// non-playable instead of rendering a broken embed. The data test asserts
// nothing gets dropped, so a broken entry cannot ship silently.
export const SONG_MOMENTS: SongMoment[] = SONG_MOMENT_CONFIG.flatMap(
	(entry) => {
		const youtubeId = toYoutubeId(entry.youtube);
		const start = toSeconds(entry.start);
		const end = toSeconds(entry.end);
		if (
			youtubeId === null ||
			!Number.isFinite(start) ||
			!Number.isFinite(end) ||
			start < 0 ||
			end <= start
		) {
			return [];
		}
		return [
			{
				artist: entry.artist,
				title: entry.title,
				moment: entry.moment,
				youtubeId,
				start,
				end,
			},
		];
	},
);
