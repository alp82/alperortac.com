// @vitest-environment jsdom

import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { TOPICS, type TopicId } from "../../../../data/topics";
// `identities.ts` does not exist yet (wayfinder #10 identity-lock registry) -
// this import is the expected red until the registry ships.
import { IDENTITIES } from "../identities";
import { INNERS } from "../index";
import {
	buildComposerSpec,
	DEFAULT_STATE,
	defaultState,
	useComposerControls,
} from "../useComposerControls";

/*
 * Identity-lock registry tests (wayfinder #10).
 *
 * Runtime coverage below (A1-A2, B1-B3, C1-C4, D3-D4, E1-E2, E4) fails today
 * because `identities.ts` does not exist - that import failure IS the red.
 *
 * Compile-time contracts the plan calls for (TC-A3 to TC-A6) can't be encoded
 * as vitest assertions - the repo has no `@ts-expect-error` type-test harness
 * to fabricate one against. They are build-enforced instead, by the shapes
 * below:
 *   - TC-A3: `IDENTITIES: Record<TopicId, TopicIdentity>` - omitting a topic's
 *     literal entry fails `tsc` (missing property on a Record).
 *   - TC-A4: an extra key not in `TopicId` fails `tsc` (excess property on a
 *     `Record<TopicId, ...>` literal).
 *   - TC-A5: `IdentityCluster` is the correlated union
 *     `{ [Id in InnerId]: { id: Id; params: InnerParamsMap[Id] } }[InnerId]`,
 *     so setting `inner.id: "parallax-depth"` while supplying
 *     `floating-island`'s params (floatHeight/bob/corners/tint) fails `tsc` -
 *     the id and params must correlate, not just both be present.
 *   - TC-A6: dropping a required params field (e.g. `layers`) fails `tsc`
 *     against `InnerParamsMap["parallax-depth"]`.
 * `tsc` is the enforcement mechanism for all four; no runtime test asserts
 * them.
 *
 * Suite-level/build-level regressions the plan calls for (TC-B4-B6, TC-D5,
 * TC-F1-F2) are not new test code - they are existing suites
 * (`buildComposerSpec.test.ts`, `TopicComposition.test.tsx`, `TopicBody.test.tsx`)
 * that must keep passing unmodified, plus a full `tsc` build, plus a grep for
 * `.media` usage outside this file. Left to test-verifier.
 */

const LOCKED_INNER = {
	id: "parallax-depth" as const,
	params: { density: "roomy", shape: "flourish", depth: 50, layers: 3 },
};

/** Career's locked identity (wayfinder plan-career-nameplate-lock) - the one
 * topic that diverges from the shared parallax-depth seed. */
const CAREER_LOCK = {
	id: "nameplate" as const,
	params: { density: "roomy", screws: false, role: "title" },
};

/** Coding's locked identity (wayfinder plan-pr-frame-spec, TC-LOCK) - the
 * second topic that diverges from the shared parallax-depth seed. */
const CODING_LOCK = {
	id: "pull-request" as const,
	params: { density: "roomy", checks: true, state: "merged" },
};

/** Tech Stack's locked identity (wayfinder #13) - the third topic that
 * diverges from the shared parallax-depth seed. */
const TECH_STACK_LOCK = {
	id: "server-rack" as const,
	params: { density: "roomy", leds: true, finish: "midnight" },
};

/** AI's locked identity (wayfinder #14) - the fourth topic that diverges
 * from the shared parallax-depth seed: the violet agent-console with the
 * chat elements merged in, picked on the live walk (aurora was picked
 * first, then rejected). */
const AI_LOCK = {
	id: "agent-console" as const,
	params: { density: "roomy", steps: true, input: true, finish: "violet" },
};

/** Finance's locked identity (wayfinder #15) - the fifth topic that
 * diverges from the shared parallax-depth seed: the navy exchange board
 * with the real build-time quote tape, picked on the live walk (chalkboard
 * and topo-map were shortlisted, the three new trading frames built on the
 * walk's ask, ticker-tape won). */
const FINANCE_LOCK = {
	id: "ticker-tape" as const,
	params: { density: "roomy", tape: true, board: "navy" },
};

/** Family's locked identity (wayfinder #16) - the sixth topic that diverges
 * from the shared parallax-depth seed: the kodak-print rework of the
 * shortlisted polaroid, picked on the live walk after the first execution
 * was rejected (print floated in the prose flow so text wraps, silhouette
 * photo, tape on, tilt left). */
const FAMILY_LOCK = {
	id: "polaroid" as const,
	params: { density: "roomy", tape: true, tilt: "left" },
};

/** Travel's locked identity (wayfinder #17) - the seventh topic that
 * diverges from the shared parallax-depth seed: the shortlisted ticket-stub
 * primary held on the live walk (crimson, perforation on) and grew the
 * boarding-pass route strip as its media treatment. */
const TRAVEL_LOCK = {
	id: "ticket-stub" as const,
	params: { density: "roomy", perforation: true, color: "crimson" },
};

/** Movies & TV's locked identity (wayfinder #18) - the eighth topic that
 * diverges from the shared parallax-depth seed: the streaming-billboard
 * primary won the live walk in crimson (badges on), a Netflix-style
 * featured-title screen whose chrome is the whole visual. */
const MOVIES_TV_LOCK = {
	id: "streaming-billboard" as const,
	params: { density: "roomy", badges: true, glow: "crimson" },
};

/** Games' locked identity (wayfinder #19) - the ninth topic that diverges
 * from the shared parallax-depth seed: the quest-log frame, built on the
 * live walk after the retro shortlist (arcade-hud/collectible) was passed
 * over for modern candidates; reworked on the walk to read the topic's own
 * honest questLog data (objectives above the prose, WoW-style buff tiles,
 * party inventory, steam-library stats strip). */
const GAMES_LOCK = {
	id: "quest-log" as const,
	params: { density: "roomy", objectives: true, journal: "arcane" },
};

/** Music's locked identity (wayfinder #20) - the tenth and final topic to
 * diverge from the shared parallax-depth seed: the festival-poster frame,
 * built on the live walk after the night-sky shortlist
 * (neon-sign/moonrise/aurora) was passed over for modern + live/festival
 * candidates; the bill tiers are the album shelf's real artists. With this
 * lock the seed era is over - every topic is locked. */
const MUSIC_LOCK = {
	id: "festival-poster" as const,
	params: { density: "roomy", lineup: true, poster: "dusk" },
};

const NON_CAREER_TOPICS = TOPICS.filter((t) => t.id !== "career");

/** The seed list: every topic except the ten locks - EMPTY since the music
 * lock (wayfinder #20) closed the seed era. Kept (with TC-LOCK-4/5 asserting
 * emptiness) so an eleventh topic added without a registry lock decision
 * trips a test instead of silently shipping on the seed. */
const NON_LOCKED_TOPICS = TOPICS.filter(
	(t) =>
		t.id !== "career" &&
		t.id !== "coding" &&
		t.id !== "tech-stack" &&
		t.id !== "ai" &&
		t.id !== "finance" &&
		t.id !== "family" &&
		t.id !== "travel" &&
		t.id !== "movies-tv" &&
		t.id !== "games" &&
		t.id !== "music",
);

describe("IDENTITIES registry coverage (TC-A1, TC-A2)", () => {
	it("has an entry for every TOPICS id", () => {
		for (const t of TOPICS) {
			expect(IDENTITIES[t.id]).toBeDefined();
		}
	});

	it("has no extra keys beyond the ten Craft-band topic ids", () => {
		const topicIds = new Set(TOPICS.map((t) => t.id));
		const keys = Object.keys(IDENTITIES);
		expect(keys.length).toBe(10);
		for (const key of keys) {
			expect(topicIds.has(key as TopicId)).toBe(true);
		}
	});
});

describe("ten divergent locks: career is nameplate, coding is pull-request, tech-stack is server-rack, ai is agent-console, finance is ticker-tape, family is polaroid, travel is ticket-stub, movies-tv is streaming-billboard, games is quest-log, music is festival-poster - the seed era is over (TC-B1-B5, TC-LOCK-1-6)", () => {
	it("TC-B1: career's inner deep-equals the exact nameplate lock, no extra keys", () => {
		expect(IDENTITIES.career.inner).toEqual(CAREER_LOCK);
		expect(Object.keys(IDENTITIES.career.inner)).toEqual(
			Object.keys(CAREER_LOCK),
		);
		expect(Object.keys(IDENTITIES.career.inner.params)).toEqual(
			Object.keys(CAREER_LOCK.params),
		);
	});

	it("TC-B2: career's media note is the verbatim lock string", () => {
		expect(IDENTITIES.career.media).toBe("none - the frame is the visual");
	});

	it("TC-B5: career's params carry no depth/shape/layers keys (not a parallax-depth cluster)", () => {
		const params = IDENTITIES.career.inner.params as Record<string, unknown>;
		expect(params).not.toHaveProperty("depth");
		expect(params).not.toHaveProperty("shape");
		expect(params).not.toHaveProperty("layers");
	});

	it("TC-LOCK-1: coding's inner deep-equals the exact pull-request lock, no extra keys", () => {
		expect(IDENTITIES.coding.inner).toEqual(CODING_LOCK);
		expect(Object.keys(IDENTITIES.coding.inner)).toEqual(
			Object.keys(CODING_LOCK),
		);
		expect(Object.keys(IDENTITIES.coding.inner.params)).toEqual(
			Object.keys(CODING_LOCK.params),
		);
	});

	it("TC-LOCK-2: coding's media note is the verbatim lock string", () => {
		expect(IDENTITIES.coding.media).toBe("none - the PR card is the visual");
	});

	it("TC-LOCK-3: coding's params carry no depth/shape/layers keys (not a parallax-depth cluster)", () => {
		const params = IDENTITIES.coding.inner.params as Record<string, unknown>;
		expect(params).not.toHaveProperty("depth");
		expect(params).not.toHaveProperty("shape");
		expect(params).not.toHaveProperty("layers");
	});

	it("TC-TS-1: tech-stack's inner deep-equals the exact server-rack lock, no extra keys", () => {
		expect(IDENTITIES["tech-stack"].inner).toEqual(TECH_STACK_LOCK);
		expect(Object.keys(IDENTITIES["tech-stack"].inner)).toEqual(
			Object.keys(TECH_STACK_LOCK),
		);
		expect(Object.keys(IDENTITIES["tech-stack"].inner.params)).toEqual(
			Object.keys(TECH_STACK_LOCK.params),
		);
	});

	it("TC-TS-2: tech-stack's media note is the verbatim lock string", () => {
		expect(IDENTITIES["tech-stack"].media).toBe(
			"none - the rack chrome is the visual",
		);
	});

	it("TC-TS-3: tech-stack's params carry no depth/shape/layers keys (not a parallax-depth cluster)", () => {
		const params = IDENTITIES["tech-stack"].inner.params as Record<
			string,
			unknown
		>;
		expect(params).not.toHaveProperty("depth");
		expect(params).not.toHaveProperty("shape");
		expect(params).not.toHaveProperty("layers");
	});

	it("TC-AI-1: ai's inner deep-equals the exact aurora lock, no extra keys", () => {
		expect(IDENTITIES.ai.inner).toEqual(AI_LOCK);
		expect(Object.keys(IDENTITIES.ai.inner)).toEqual(Object.keys(AI_LOCK));
		expect(Object.keys(IDENTITIES.ai.inner.params)).toEqual(
			Object.keys(AI_LOCK.params),
		);
	});

	it("TC-AI-2: ai's media note is the verbatim lock string", () => {
		expect(IDENTITIES.ai.media).toBe("none - the console chrome is the visual");
	});

	it("TC-AI-3: ai's params carry no depth/shape/layers keys (not a parallax-depth cluster)", () => {
		const params = IDENTITIES.ai.inner.params as Record<string, unknown>;
		expect(params).not.toHaveProperty("depth");
		expect(params).not.toHaveProperty("shape");
		expect(params).not.toHaveProperty("layers");
	});

	it("TC-FIN-1: finance's inner deep-equals the exact ticker-tape lock, no extra keys", () => {
		expect(IDENTITIES.finance.inner).toEqual(FINANCE_LOCK);
		expect(Object.keys(IDENTITIES.finance.inner)).toEqual(
			Object.keys(FINANCE_LOCK),
		);
		expect(Object.keys(IDENTITIES.finance.inner.params)).toEqual(
			Object.keys(FINANCE_LOCK.params),
		);
	});

	it("TC-FIN-2: finance's media note is the verbatim lock string", () => {
		expect(IDENTITIES.finance.media).toBe(
			"none - the board chrome is the visual",
		);
	});

	it("TC-FIN-3: finance's params carry no depth/shape/layers keys (not a parallax-depth cluster)", () => {
		const params = IDENTITIES.finance.inner.params as Record<string, unknown>;
		expect(params).not.toHaveProperty("depth");
		expect(params).not.toHaveProperty("shape");
		expect(params).not.toHaveProperty("layers");
	});

	it("TC-FAM-1: family's inner deep-equals the exact polaroid lock, no extra keys", () => {
		expect(IDENTITIES.family.inner).toEqual(FAMILY_LOCK);
		expect(Object.keys(IDENTITIES.family.inner)).toEqual(
			Object.keys(FAMILY_LOCK),
		);
		expect(Object.keys(IDENTITIES.family.inner.params)).toEqual(
			Object.keys(FAMILY_LOCK.params),
		);
	});

	it("TC-FAM-2: family's media note is the verbatim lock string", () => {
		expect(IDENTITIES.family.media).toBe(
			"silhouette print - the golden-hour family SVG inside the kodak frame (anonymity-friendly by construction; swap for a real print scan if one lands)",
		);
	});

	it("TC-FAM-3: family's params carry no depth/shape/layers keys (not a parallax-depth cluster)", () => {
		const params = IDENTITIES.family.inner.params as Record<string, unknown>;
		expect(params).not.toHaveProperty("depth");
		expect(params).not.toHaveProperty("shape");
		expect(params).not.toHaveProperty("layers");
	});

	it("TC-TRV-1: travel's inner deep-equals the exact ticket-stub lock, no extra keys", () => {
		expect(IDENTITIES.travel.inner).toEqual(TRAVEL_LOCK);
		expect(Object.keys(IDENTITIES.travel.inner)).toEqual(
			Object.keys(TRAVEL_LOCK),
		);
		expect(Object.keys(IDENTITIES.travel.inner.params)).toEqual(
			Object.keys(TRAVEL_LOCK.params),
		);
	});

	it("TC-TRV-2: travel's media note is the verbatim lock string", () => {
		expect(IDENTITIES.travel.media).toBe(
			"route imagery - the boarding-pass route strip printed in the ticket's fine print (visited stops THA/ISR/MEX/GRD/EUR, next leg JPN '27 in the accent); stops hand-edited in ticket-stub.tsx alongside the TravelContent prose",
		);
	});

	it("TC-TRV-3: travel's params carry no depth/shape/layers keys (not a parallax-depth cluster)", () => {
		const params = IDENTITIES.travel.inner.params as Record<string, unknown>;
		expect(params).not.toHaveProperty("depth");
		expect(params).not.toHaveProperty("shape");
		expect(params).not.toHaveProperty("layers");
	});

	it("TC-MTV-1: movies-tv's inner deep-equals the exact streaming-billboard lock, no extra keys", () => {
		expect(IDENTITIES["movies-tv"].inner).toEqual(MOVIES_TV_LOCK);
		expect(Object.keys(IDENTITIES["movies-tv"].inner)).toEqual(
			Object.keys(MOVIES_TV_LOCK),
		);
		expect(Object.keys(IDENTITIES["movies-tv"].inner.params)).toEqual(
			Object.keys(MOVIES_TV_LOCK.params),
		);
	});

	// #22: the poster grid is a new named media treatment on the movies-tv
	// band, so the media note amends from "none" to describe it (params are
	// unchanged - no new streaming-billboard param was added for the grid).
	it("TC-MTV-2: movies-tv's media note is the verbatim lock string", () => {
		expect(IDENTITIES["movies-tv"].media).toBe(
			"poster grid - flickering 3x2 all-time-favorites wall under the prose (channel-zap swaps; the top-chrome pills relocate onto it as functional All/Films/Series filters), doubling as the trigger into the /movies favorites subpage; titles hand-edited in src/data/favorites.ts",
		);
	});

	it("TC-MTV-3: movies-tv's params carry no depth/shape/layers keys (not a parallax-depth cluster)", () => {
		const params = IDENTITIES["movies-tv"].inner.params as Record<
			string,
			unknown
		>;
		expect(params).not.toHaveProperty("depth");
		expect(params).not.toHaveProperty("shape");
		expect(params).not.toHaveProperty("layers");
	});

	it("TC-GAMES-1: games' inner deep-equals the exact quest-log lock, no extra keys", () => {
		expect(IDENTITIES.games.inner).toEqual(GAMES_LOCK);
		expect(Object.keys(IDENTITIES.games.inner)).toEqual(
			Object.keys(GAMES_LOCK),
		);
		expect(Object.keys(IDENTITIES.games.inner.params)).toEqual(
			Object.keys(GAMES_LOCK.params),
		);
	});

	it("TC-GAMES-2: games' media note is the verbatim lock string", () => {
		expect(IDENTITIES.games.media).toBe(
			"none - the journal chrome is the visual; the quest content (objectives / buffs / party) is honest data in topics.ts questLog, hand-edited alongside GamesContent.tsx",
		);
	});

	it("TC-GAMES-3: games' params carry no depth/shape/layers keys (not a parallax-depth cluster)", () => {
		const params = IDENTITIES.games.inner.params as Record<string, unknown>;
		expect(params).not.toHaveProperty("depth");
		expect(params).not.toHaveProperty("shape");
		expect(params).not.toHaveProperty("layers");
	});

	it("TC-MUS-1: music's inner deep-equals the exact festival-poster lock, no extra keys", () => {
		expect(IDENTITIES.music.inner).toEqual(MUSIC_LOCK);
		expect(Object.keys(IDENTITIES.music.inner)).toEqual(
			Object.keys(MUSIC_LOCK),
		);
		expect(Object.keys(IDENTITIES.music.inner.params)).toEqual(
			Object.keys(MUSIC_LOCK.params),
		);
	});

	it("TC-MUS-2: music's media note is the verbatim lock string (#26 amends the #20 'none' to the backdrop cover wall)", () => {
		expect(IDENTITIES.music.media).toBe(
			"backdrop cover wall (#26 amends the #20 'none') - the album shelf's real covers (personal.ts) as a dimmed ambient flicker wall behind the poster, and the date strip reworded into the one /music trigger (both in music/CoverWall.tsx); the bill stays honest chrome mirroring the shelf's artists, hand-edited in festival-poster.tsx; the curated shelf itself stays on the Music subpage",
		);
	});

	it("TC-MUS-3: music's params carry no depth/shape/layers keys (not a parallax-depth cluster)", () => {
		const params = IDENTITIES.music.inner.params as Record<string, unknown>;
		expect(params).not.toHaveProperty("depth");
		expect(params).not.toHaveProperty("shape");
		expect(params).not.toHaveProperty("layers");
	});

	// TC-B3/TC-B4 (seed-list parity with the live parallax-depth defaults)
	// retired with the seed era: the list they iterated is now empty, and an
	// empty it.each throws at collection. TC-LOCK-4/5 below carries the
	// guard forward - a topic added without a lock decision lands in
	// NON_LOCKED_TOPICS and trips the emptiness assertion.
	it("TC-LOCK-4/5: the non-locked list is empty - every topic carries a divergent lock", () => {
		expect(NON_LOCKED_TOPICS.length).toBe(0);
		// Widened to string: at today's registry the literal id types can't
		// overlap "parallax-depth" (tsc would reject the comparison), and THAT
		// is the guard - this stays behavioral so a future seeded row trips it.
		const lockedIds = TOPICS.map((t) => IDENTITIES[t.id].inner.id as string);
		expect(lockedIds).not.toContain(LOCKED_INNER.id);
	});

	it("buildComposerSpec(defaultState()) emits exactly `link: none`", () => {
		expect(buildComposerSpec(defaultState())).toBe("link: none");
	});
});

describe("registry wiring - defaultClusters()/defaultState() read the registry (TC-D1, TC-D2, TC-D3, TC-D4, TC-D5, TC-D7)", () => {
	it("TC-D1: defaultState().clusters.career deep-equals IDENTITIES.career.inner", () => {
		const state = defaultState();
		expect(state.clusters.career).toEqual(IDENTITIES.career.inner);
	});

	it.each(
		NON_CAREER_TOPICS.map((t) => [t.id, t] as const),
	)("TC-D2: defaultState().clusters.%s deep-equals IDENTITIES.%s.inner", (_id, t) => {
		const state = defaultState();
		expect(state.clusters[t.id]).toEqual(IDENTITIES[t.id].inner);
	});

	it("TC-LOCK-8: defaultState().clusters.coding deep-equals IDENTITIES.coding.inner", () => {
		const state = defaultState();
		expect(state.clusters.coding).toEqual(IDENTITIES.coding.inner);
	});

	it("TC-D3: two calls to defaultState() return distinct-but-equal params objects, including career's nameplate shape", () => {
		const a = defaultState();
		const b = defaultState();
		for (const t of TOPICS) {
			expect(a.clusters[t.id].params).toEqual(b.clusters[t.id].params);
			expect(a.clusters[t.id].params).not.toBe(b.clusters[t.id].params);
		}
	});

	it("TC-D4/TC-LOCK-6: mutating a consumer's copy never mutates the registry (music, params.lineup - the depth probe retired with the seed era; music now carries the festival-poster lock)", () => {
		const state = defaultState();
		const topicId = "music" as const;
		const before = IDENTITIES[topicId].inner.params.lineup;

		// biome-ignore lint/suspicious/noExplicitAny: intentional mutation of a copy to prove isolation
		(state.clusters[topicId].params as any).lineup = false;

		expect(IDENTITIES[topicId].inner.params.lineup).toBe(before);
	});

	it("TC-D5: mutating a consumer's copy of career's nameplate params never mutates the registry (screws)", () => {
		const state = defaultState();
		const before = IDENTITIES.career.inner.params.screws;

		// biome-ignore lint/suspicious/noExplicitAny: intentional mutation of a copy to prove isolation
		(state.clusters.career.params as any).screws = true;

		expect(IDENTITIES.career.inner.params.screws).toBe(before);
	});

	it("setInner/patchInnerParams override the registry value for live in-session edits", () => {
		const { result } = renderHook(() => useComposerControls());

		act(() => {
			result.current.setInner("coding", "floating-island");
		});
		expect(result.current.state.clusters.coding.id).toBe("floating-island");
		expect(result.current.state.clusters.coding).not.toEqual(
			IDENTITIES.coding.inner,
		);

		act(() => {
			result.current.patchInnerParams("career", { screws: true });
		});
		expect(result.current.state.clusters.career.params).not.toEqual(
			IDENTITIES.career.inner.params,
		);
	});
});

describe("SSR determinism preserved (TC-E1, TC-E2)", () => {
	it("TC-E1: DEFAULT_STATE stays a module-level singleton (Object.is across imports)", async () => {
		const mod = await import("../useComposerControls");
		expect(Object.is(mod.DEFAULT_STATE, DEFAULT_STATE)).toBe(true);
	});

	it("TC-E2: defaultState() is pure - two calls yield deep-equal results for every topic, including career's nameplate shape", () => {
		const first = defaultState();
		const second = defaultState();
		expect(first).toEqual(second);
		for (const t of TOPICS) {
			expect(first.clusters[t.id]).toEqual(second.clusters[t.id]);
		}
	});
});

describe("DesignPanel reset targets the locked composition - THE trap (TC-F1, TC-F2, TC-F3, TC-F4, TC-F5)", () => {
	it("TC-F1/TC-F2: after mutating career away, reset() restores it to the LOCK, not the plain nameplate defaults", () => {
		const { result } = renderHook(() => useComposerControls());

		act(() => {
			result.current.setInner("career", "floating-island");
		});
		expect(result.current.state.clusters.career.id).toBe("floating-island");

		act(() => {
			result.current.reset();
		});

		// TC-F1: restored to the exact lock.
		expect(result.current.state.clusters.career).toEqual(
			IDENTITIES.career.inner,
		);
		// TC-F2 (load-bearing negative): reset must restore the LOCK's screws:false,
		// not the plain nameplate factory default (screws:true) - a reset that
		// silently reverted to INNERS.nameplate.defaults would still pass TC-F1's
		// id check alone, so this proves the params came from the registry lock.
		expect(result.current.state.clusters.career.params).not.toEqual(
			INNERS.nameplate.defaults,
		);
		expect(result.current.state.clusters.career.params).toEqual(
			expect.objectContaining({ screws: false }),
		);
	});

	it("TC-F3: reset() restores every topic's cluster to IDENTITIES[topic].inner, not just the mutated one", () => {
		const { result } = renderHook(() => useComposerControls());

		act(() => {
			result.current.setInner("coding", "floating-island");
		});
		expect(result.current.state.clusters.coding.id).toBe("floating-island");

		act(() => {
			result.current.reset();
		});

		for (const t of TOPICS) {
			expect(result.current.state.clusters[t.id]).toEqual(
				IDENTITIES[t.id].inner,
			);
		}
	});

	it("TC-LOCK-9: after setInner('coding', 'floating-island'), reset() restores coding to the pull-request lock, sourced from the registry", () => {
		const { result } = renderHook(() => useComposerControls());

		act(() => {
			result.current.setInner("coding", "floating-island");
		});
		expect(result.current.state.clusters.coding.id).toBe("floating-island");

		act(() => {
			result.current.reset();
		});

		expect(result.current.state.clusters.coding).toEqual(CODING_LOCK);
		expect(result.current.state.clusters.coding).toEqual(
			IDENTITIES.coding.inner,
		);
	});

	it("TC-F4: reset() restores baseline/link/linkParams to defaultState()'s values", () => {
		const { result } = renderHook(() => useComposerControls());

		act(() => {
			result.current.setBaseline(true);
			result.current.setLink("trail-dashes");
		});
		expect(result.current.state.baseline).toBe(true);
		expect(result.current.state.link).toBe("trail-dashes");

		act(() => {
			result.current.reset();
		});

		const fresh = defaultState();
		expect(result.current.state.baseline).toBe(fresh.baseline);
		expect(result.current.state.link).toBe(fresh.link);
		expect(result.current.state.linkParams).toEqual(fresh.linkParams);
	});

	it("TC-F5: reset() at defaults is a no-op observably", () => {
		const { result } = renderHook(() => useComposerControls());

		expect(() => {
			act(() => {
				result.current.reset();
			});
		}).not.toThrow();

		expect(result.current.state).toEqual(defaultState());
	});
});
