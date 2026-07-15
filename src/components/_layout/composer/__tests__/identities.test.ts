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

const NON_CAREER_TOPICS = TOPICS.filter((t) => t.id !== "career");

/** The seed list: every topic except the two locks (career, coding) - these
 * eight still deep-equal the shared parallax-depth defaults (TC-LOCK-4/5). */
const NON_LOCKED_TOPICS = TOPICS.filter(
	(t) => t.id !== "career" && t.id !== "coding",
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

describe("two divergent locks: career is nameplate, coding is pull-request, the other eight stay the seed (TC-B1-B5, TC-LOCK-1-6)", () => {
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

	it("TC-LOCK-4/5: the non-locked list has exactly eight entries containing neither career nor coding", () => {
		expect(NON_LOCKED_TOPICS.length).toBe(8);
		expect(NON_LOCKED_TOPICS.some((t) => t.id === "career")).toBe(false);
		expect(NON_LOCKED_TOPICS.some((t) => t.id === "coding")).toBe(false);
	});

	it.each(
		NON_LOCKED_TOPICS.map((t) => [t.id, t] as const),
	)("TC-B3: %s's inner deep-equals the locked parallax-depth cluster", (_id, t) => {
		expect(IDENTITIES[t.id].inner).toEqual(LOCKED_INNER);
	});

	it.each(
		NON_LOCKED_TOPICS.map((t) => [t.id, t] as const),
	)("TC-B4: %s's inner.params deep-equals the live parallax-depth defaults", (_id, t) => {
		expect(IDENTITIES[t.id].inner.params).toEqual(
			INNERS["parallax-depth"].defaults,
		);
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

	it("TC-D4/TC-LOCK-6: mutating a consumer's copy never mutates the registry (tech-stack, params.depth - moved off coding, which no longer has a depth param under the pull-request lock)", () => {
		const state = defaultState();
		const topicId = "tech-stack" as const;
		const before = IDENTITIES[topicId].inner.params.depth;

		// biome-ignore lint/suspicious/noExplicitAny: intentional mutation of a copy to prove isolation
		(state.clusters[topicId].params as any).depth = 999;

		expect(IDENTITIES[topicId].inner.params.depth).toBe(before);
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
