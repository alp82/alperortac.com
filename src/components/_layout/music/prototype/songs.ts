/*
 * PROTOTYPE — song/moment config for the snippet-player prototype (#27).
 *
 * ═══════════════ EDIT ME ═══════════════
 * One entry per album-shelf album, in shelf order. Per entry:
 *   artist  — must match the shelf artist in src/data/personal.ts exactly
 *   title   — the song
 *   moment  — one-liner shown under the player (why this part)
 *   youtube — ANY YouTube link: watch?v=…, youtu.be/…, or a bare video id
 *   start   — where the moment begins: "m:ss" or plain seconds
 *   end     — where it stops playing
 *   itunes  — (variants A/C only) trackId + Apple Music link; `highlight`
 *             is the good slice INSIDE Apple's fixed 30s preview
 *
 * Everything below marked PLACEHOLDER is my guess — swap freely, hot-reloads.
 */

type SongConfig = {
	artist: string;
	title: string;
	moment: string;
	youtube: string;
	start: string | number;
	end: string | number;
	itunes?: {
		trackId: number;
		appleMusicUrl: string;
		highlight?: [string | number, string | number];
	};
};

const SONGS: SongConfig[] = [
	{
		artist: "Gojira",
		title: "Vacuity",
		moment: "PLACEHOLDER — the riff that opens the floodgates",
		youtube: "https://www.youtube.com/watch?v=wM8LDVIiwhA",
		start: "2:55",
		end: "3:30",
		itunes: {
			trackId: 291261427,
			appleMusicUrl:
				"https://music.apple.com/us/album/vacuity/291261388?i=291261427",
			highlight: [6, 20],
		},
	},
	{
		artist: "Noisia",
		title: "Machine Gun",
		moment: "PLACEHOLDER — the drop, obviously",
		youtube: "https://www.youtube.com/watch?v=SAO-lzl3vVQ",
		start: "0:55",
		end: "1:30",
		itunes: {
			trackId: 1129252642,
			appleMusicUrl:
				"https://music.apple.com/us/album/machine-gun/1129252242?i=1129252642",
			highlight: [8, 24],
		},
	},
	{
		artist: "Haken",
		title: "Prosthetic",
		moment: "PLACEHOLDER — pick the moment",
		youtube: "https://www.youtube.com/watch?v=4EmbYo65Pbs",
		start: "1:00",
		end: "1:35",
		itunes: {
			trackId: 1503491134,
			appleMusicUrl:
				"https://music.apple.com/us/album/prosthetic/1503491133?i=1503491134",
			highlight: [8, 22],
		},
	},
	{
		artist: "System of a Down",
		title: "Chop Suey!",
		moment: "PLACEHOLDER — the bridge, when everything drops away",
		youtube: "https://www.youtube.com/watch?v=CSvFpBOe8eY",
		start: "2:30",
		end: "3:15",
		itunes: {
			trackId: 273714640,
			appleMusicUrl:
				"https://music.apple.com/us/album/chop-suey/273714443?i=273714640",
			highlight: [4, 18],
		},
	},
	{
		artist: "Rezz",
		title: "Witching Hour",
		moment: "PLACEHOLDER — pick the moment",
		youtube: "https://www.youtube.com/watch?v=kaEAk_sguGo",
		start: "1:00",
		end: "1:35",
		itunes: {
			trackId: 1811896695,
			appleMusicUrl:
				"https://music.apple.com/us/album/witching-hour/1811896693?i=1811896695",
			highlight: [8, 22],
		},
	},
	{
		artist: "Farin Urlaub",
		title: "Dusche",
		moment: "PLACEHOLDER — pick the moment",
		youtube: "https://www.youtube.com/watch?v=kHQl3VTrmkM",
		start: "1:00",
		end: "1:35",
		itunes: {
			trackId: 1521505602,
			appleMusicUrl:
				"https://music.apple.com/us/album/dusche/1521505181?i=1521505602",
			highlight: [8, 22],
		},
	},
	{
		artist: "Periphery",
		title: "Marigold",
		moment: "PLACEHOLDER — pick the moment",
		youtube: "https://www.youtube.com/watch?v=gQqIF0yVtzc",
		start: "1:00",
		end: "1:35",
		itunes: {
			trackId: 1639115794,
			appleMusicUrl:
				"https://music.apple.com/us/album/marigold/1639115788?i=1639115794",
			highlight: [8, 22],
		},
	},
	{
		artist: "Misanthrop",
		title: "Analog",
		moment: "PLACEHOLDER — pick the moment",
		youtube: "https://www.youtube.com/watch?v=6Glci7CP0g8",
		start: "1:00",
		end: "1:35",
		itunes: {
			trackId: 1674423263,
			appleMusicUrl:
				"https://music.apple.com/us/album/analog/1674423256?i=1674423263",
			highlight: [8, 22],
		},
	},
	{
		artist: "Porcupine Tree",
		title: "Time Flies",
		moment: "PLACEHOLDER — that guitar line out of nowhere",
		youtube: "https://www.youtube.com/watch?v=UkJBS0Zazmw",
		start: "2:00",
		end: "2:40",
		itunes: {
			trackId: 1532131588,
			appleMusicUrl:
				"https://music.apple.com/us/album/time-flies/1532131566?i=1532131588",
			highlight: [5, 20],
		},
	},
	{
		artist: "Waltari",
		title: "Helsinki",
		moment: "PLACEHOLDER — pick the moment",
		youtube: "https://www.youtube.com/watch?v=2X3_U8ayoZc",
		start: "1:00",
		end: "1:35",
		itunes: {
			trackId: 995191772,
			appleMusicUrl:
				"https://music.apple.com/us/album/helsinki/995191767?i=995191772",
			highlight: [8, 22],
		},
	},
	{
		artist: "Savant",
		title: "Starfish",
		moment: "PLACEHOLDER — pick the moment",
		youtube: "https://www.youtube.com/watch?v=O1UzSAbMYIs",
		start: "1:00",
		end: "1:35",
		itunes: {
			trackId: 560448875,
			appleMusicUrl:
				"https://music.apple.com/us/album/starfish/560448869?i=560448875",
			highlight: [8, 22],
		},
	},
	{
		artist: "Muse",
		title: "Knights of Cydonia",
		moment: "PLACEHOLDER — the final gallop riff everyone waits for",
		youtube: "https://www.youtube.com/watch?v=G_sBOsh-vyI",
		start: "5:00",
		end: "5:45",
		itunes: {
			trackId: 992222005,
			appleMusicUrl:
				"https://music.apple.com/us/album/knights-of-cydonia/992221994?i=992222005",
			highlight: [10, 26],
		},
	},
	{
		artist: "Nine Inch Nails",
		title: "The Hand That Feeds",
		moment: "PLACEHOLDER — pick the moment",
		youtube: "https://www.youtube.com/watch?v=xwhBRJStz7w",
		start: "1:00",
		end: "1:35",
		itunes: {
			trackId: 1440852198,
			appleMusicUrl:
				"https://music.apple.com/us/album/the-hand-that-feeds/1440851583?i=1440852198",
			highlight: [8, 22],
		},
	},
	{
		artist: "Supergroove",
		title: "Can't Get Enough",
		moment: "PLACEHOLDER — pick the moment",
		youtube: "https://www.youtube.com/watch?v=0n7acp5rsu0",
		start: "1:00",
		end: "1:35",
		itunes: {
			trackId: 663271805,
			appleMusicUrl:
				"https://music.apple.com/us/album/cant-get-enough/663271794?i=663271805",
			highlight: [8, 22],
		},
	},
	{
		artist: "Unprocessed",
		title: "Sacrifice Me",
		moment: "PLACEHOLDER — pick the moment",
		youtube: "https://www.youtube.com/watch?v=ivXDVKwzCIw",
		start: "1:00",
		end: "1:35",
		itunes: {
			trackId: 1827910987,
			appleMusicUrl:
				"https://music.apple.com/us/album/sacrifice-me/1827910983?i=1827910987",
			highlight: [8, 22],
		},
	},
	{
		artist: "Enter Shikari",
		title: "(pls) set me on fire",
		moment: "PLACEHOLDER — pick the moment",
		youtube: "https://www.youtube.com/watch?v=mvDFdLZJ-q0",
		start: "1:00",
		end: "1:35",
		itunes: {
			trackId: 1659051073,
			appleMusicUrl:
				"https://music.apple.com/us/album/pls-set-me-on-fire/1659051070?i=1659051073",
			highlight: [8, 22],
		},
	},
	{
		artist: "Soilwork",
		title: "Rejection Role",
		moment: "PLACEHOLDER — pick the moment",
		youtube: "https://www.youtube.com/watch?v=VKZBFts4lPo",
		start: "1:00",
		end: "1:35",
		itunes: {
			trackId: 1460472146,
			appleMusicUrl:
				"https://music.apple.com/us/album/rejection-role/1460471875?i=1460472146",
			highlight: [8, 22],
		},
	},
];

/* ═══════════ plumbing below — no need to edit ═══════════ */

// "m:ss" (or "h:mm:ss") or plain seconds → seconds.
function toSeconds(v: string | number): number {
	if (typeof v === "number") return v;
	const parts = v.split(":").map(Number);
	return parts.reduce((acc, p) => acc * 60 + p, 0);
}

// Any YouTube link shape (watch?v=, youtu.be/, embed/, or a bare id) → id.
function toYoutubeId(v: string): string {
	const m = v.match(/(?:v=|youtu\.be\/|embed\/)([\w-]{11})/);
	return m?.[1] ?? v;
}

export type SnippetSong = {
	artist: string;
	title: string;
	moment: string;
	itunesTrackId: number;
	appleMusicUrl: string;
	youtubeId: string;
	youtubeStart: number;
	youtubeEnd: number;
	previewHighlight?: { start: number; end: number };
};

export const SNIPPET_SONGS: SnippetSong[] = SONGS.map((s) => ({
	artist: s.artist,
	title: s.title,
	moment: s.moment,
	itunesTrackId: s.itunes?.trackId ?? 0,
	appleMusicUrl: s.itunes?.appleMusicUrl ?? "",
	youtubeId: toYoutubeId(s.youtube),
	youtubeStart: toSeconds(s.start),
	youtubeEnd: toSeconds(s.end),
	...(s.itunes?.highlight
		? {
				previewHighlight: {
					start: toSeconds(s.itunes.highlight[0]),
					end: toSeconds(s.itunes.highlight[1]),
				},
			}
		: {}),
}));
