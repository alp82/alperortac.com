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

describe("zero-visual-change lock (TC-B1, TC-B2, TC-B3)", () => {
	it("every topic's inner deep-equals the locked parallax-depth cluster", () => {
		for (const t of TOPICS) {
			expect(IDENTITIES[t.id].inner).toEqual(LOCKED_INNER);
		}
	});

	it("every topic's inner.params deep-equals the live parallax-depth defaults", () => {
		for (const t of TOPICS) {
			expect(IDENTITIES[t.id].inner.params).toEqual(
				INNERS["parallax-depth"].defaults,
			);
		}
	});

	it("buildComposerSpec(defaultState()) emits exactly `link: none`", () => {
		expect(buildComposerSpec(defaultState())).toBe("link: none");
	});
});

describe("registry wiring - defaultClusters()/defaultState() read the registry (TC-C1-C4)", () => {
	it("defaultState().clusters[topic] deep-equals IDENTITIES[topic].inner", () => {
		const state = defaultState();
		for (const t of TOPICS) {
			expect(state.clusters[t.id]).toEqual(IDENTITIES[t.id].inner);
		}
	});

	it("two calls to defaultState() return distinct-but-equal params objects", () => {
		const a = defaultState();
		const b = defaultState();
		for (const t of TOPICS) {
			expect(a.clusters[t.id].params).toEqual(b.clusters[t.id].params);
			expect(a.clusters[t.id].params).not.toBe(b.clusters[t.id].params);
		}
	});

	it("mutating a consumer's copy never mutates the registry", () => {
		const state = defaultState();
		const topicId = TOPICS[0]?.id ?? "career";
		const before = IDENTITIES[topicId].inner.params.depth;

		// biome-ignore lint/suspicious/noExplicitAny: intentional mutation of a copy to prove isolation
		(state.clusters[topicId].params as any).depth = 999;

		expect(IDENTITIES[topicId].inner.params.depth).toBe(before);
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
			result.current.patchInnerParams("career", { depth: 99 } as never);
		});
		expect(result.current.state.clusters.career.params).not.toEqual(
			IDENTITIES.career.inner.params,
		);
	});
});

describe("SSR determinism preserved (TC-D3, TC-D4)", () => {
	it("DEFAULT_STATE stays a module-level singleton (Object.is across imports)", async () => {
		const mod = await import("../useComposerControls");
		expect(Object.is(mod.DEFAULT_STATE, DEFAULT_STATE)).toBe(true);
	});

	it("defaultState() is pure - two calls yield deep-equal results for every topic", () => {
		const first = defaultState();
		const second = defaultState();
		expect(first).toEqual(second);
		for (const t of TOPICS) {
			expect(first.clusters[t.id]).toEqual(second.clusters[t.id]);
		}
	});
});

describe("DesignPanel reset targets the locked composition (TC-E1, TC-E2, TC-E4)", () => {
	it("reset() restores every topic's cluster to IDENTITIES[topic].inner, not just the mutated one", () => {
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

	it("reset() restores baseline/link/linkParams to defaultState()'s values", () => {
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

	it("reset() at defaults is a no-op observably", () => {
		const { result } = renderHook(() => useComposerControls());

		expect(() => {
			act(() => {
				result.current.reset();
			});
		}).not.toThrow();

		expect(result.current.state).toEqual(defaultState());
	});
});
