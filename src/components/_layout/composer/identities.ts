import type { TopicId } from "../../../data/topics";
import type { InnerId, InnerParamsMap } from "./types";

/*
 * Identity-lock registry (wayfinder #10).
 *
 * One row per Craft-band topic pins that topic's inner frame (id + params)
 * plus a media treatment note. Per-topic tickets edited exactly one row here
 * to give each topic its own locked look - career (nameplate), coding
 * (pull-request), tech-stack (server-rack), ai (agent-console), finance
 * (ticker-tape), family (polaroid), travel (ticket-stub), movies-tv
 * (streaming-billboard), games (quest-log) and music (festival-poster): all
 * ten are locked, the shared parallax-depth seed era is over. Every row is a
 * literal (no spreads of INNERS[...].defaults) so each stays independently
 * hand-editable, and the file holds only static literals - SSR-deterministic,
 * no runtime deps.
 */

/** One inner pick with params correlated to its id - switching `id` forces the matching params shape. */
export type IdentityCluster = {
	[Id in InnerId]: { id: Id; params: InnerParamsMap[Id] };
}[InnerId];

export type TopicIdentity = { inner: IdentityCluster; media: string };

export const IDENTITIES = {
	career: {
		inner: {
			id: "nameplate",
			params: { density: "roomy", screws: false, role: "title" },
		},
		media: "none - the frame is the visual",
	},
	coding: {
		inner: {
			id: "pull-request",
			params: { density: "roomy", checks: true, state: "merged" },
		},
		media: "none - the PR card is the visual",
	},
	"tech-stack": {
		inner: {
			id: "server-rack",
			params: { density: "roomy", leds: true, finish: "midnight" },
		},
		media: "none - the rack chrome is the visual",
	},
	ai: {
		inner: {
			id: "agent-console",
			params: { density: "roomy", steps: true, input: true, finish: "violet" },
		},
		media: "none - the console chrome is the visual",
	},
	finance: {
		inner: {
			id: "ticker-tape",
			params: { density: "roomy", tape: true, board: "navy" },
		},
		media: "none - the board chrome is the visual",
	},
	family: {
		inner: {
			id: "polaroid",
			params: { density: "roomy", tape: true, tilt: "left" },
		},
		media:
			"silhouette print - the golden-hour family SVG inside the kodak frame (anonymity-friendly by construction; swap for a real print scan if one lands)",
	},
	travel: {
		inner: {
			id: "ticket-stub",
			params: { density: "roomy", perforation: true, color: "crimson" },
		},
		media:
			"route imagery - the boarding-pass route strip printed in the ticket's fine print (visited stops THA/ISR/MEX/GRD/EUR, next leg JPN '27 in the accent); stops hand-edited in ticket-stub.tsx alongside the TravelContent prose",
	},
	"movies-tv": {
		inner: {
			id: "streaming-billboard",
			params: { density: "roomy", badges: true, glow: "crimson" },
		},
		media:
			"poster grid - flickering 3x2 all-time-favorites wall under the prose (channel-zap swaps; the top-chrome pills relocate onto it as functional All/Films/Series filters), doubling as the trigger into the /movies favorites subpage; titles hand-edited in src/data/favorites.ts",
	},
	games: {
		inner: {
			id: "quest-log",
			params: { density: "roomy", objectives: true, journal: "arcane" },
		},
		media:
			"none - the journal chrome is the visual; the quest content (objectives / buffs / party) is honest data in topics.ts questLog, hand-edited alongside GamesContent.tsx",
	},
	music: {
		inner: {
			id: "festival-poster",
			params: { density: "roomy", lineup: true, poster: "dusk" },
		},
		media:
			"none on the band - the poster chrome is the visual; the bill is honest chrome mirroring the album shelf's artists (personal.ts), hand-edited in festival-poster.tsx (album covers stay on the Music subpage)",
	},
} satisfies Record<TopicId, TopicIdentity>;
