import type { TopicId } from "../../../data/topics";
import type { InnerId, InnerParamsMap } from "./types";

/*
 * Identity-lock registry (wayfinder #10).
 *
 * One row per Craft-band topic pins that topic's inner frame (id + params)
 * plus a media treatment note. Follow-up per-topic tickets edit exactly one
 * row here to give a topic its own locked look - career (nameplate) and
 * coding (pull-request) are locked so far; the remaining eight hold the
 * shared parallax-depth seed. Every row is a literal (no
 * spreads of INNERS[...].defaults) so each stays independently hand-editable,
 * and the file holds only static literals - SSR-deterministic, no runtime deps.
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
			id: "parallax-depth",
			params: { density: "roomy", shape: "flourish", depth: 50, layers: 3 },
		},
		media: "default - no per-topic treatment yet",
	},
	ai: {
		inner: {
			id: "parallax-depth",
			params: { density: "roomy", shape: "flourish", depth: 50, layers: 3 },
		},
		media: "default - no per-topic treatment yet",
	},
	finance: {
		inner: {
			id: "parallax-depth",
			params: { density: "roomy", shape: "flourish", depth: 50, layers: 3 },
		},
		media: "default - no per-topic treatment yet",
	},
	family: {
		inner: {
			id: "parallax-depth",
			params: { density: "roomy", shape: "flourish", depth: 50, layers: 3 },
		},
		media: "default - no per-topic treatment yet",
	},
	travel: {
		inner: {
			id: "parallax-depth",
			params: { density: "roomy", shape: "flourish", depth: 50, layers: 3 },
		},
		media: "default - no per-topic treatment yet",
	},
	"movies-tv": {
		inner: {
			id: "parallax-depth",
			params: { density: "roomy", shape: "flourish", depth: 50, layers: 3 },
		},
		media: "default - no per-topic treatment yet",
	},
	games: {
		inner: {
			id: "parallax-depth",
			params: { density: "roomy", shape: "flourish", depth: 50, layers: 3 },
		},
		media: "default - no per-topic treatment yet",
	},
	music: {
		inner: {
			id: "parallax-depth",
			params: { density: "roomy", shape: "flourish", depth: 50, layers: 3 },
		},
		media: "default - no per-topic treatment yet",
	},
} satisfies Record<TopicId, TopicIdentity>;
