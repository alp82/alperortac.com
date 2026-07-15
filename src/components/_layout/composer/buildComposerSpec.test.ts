import { describe, expect, it } from "vitest";
import { TOPICS } from "../../../data/topics";
import { INNERS } from "./index";
import {
	buildComposerSpec,
	type ComposerState,
	defaultState,
} from "./useComposerControls";

function makeState(over: Partial<ComposerState> = {}): ComposerState {
	return { ...defaultState(), ...over };
}

describe("buildComposerSpec", () => {
	it("baseline short-circuits to `baseline: on`", () => {
		expect(buildComposerSpec(makeState({ baseline: true }))).toBe(
			"baseline: on",
		);
	});

	it("all-default clusters emit no inner.* keys", () => {
		// defaultState starts every topic on its locked identity (wayfinder
		// plan-career-nameplate-lock); this stays green post-implementation as a
		// regression sentinel - do not rewrite.
		expect(buildComposerSpec(makeState())).not.toContain("inner.");
		expect(buildComposerSpec(makeState())).not.toContain("section.");
	});

	it("TC-C3: fresh defaultState() emits no inner.<topic> line for any of the nine non-career topics", () => {
		const spec = buildComposerSpec(defaultState());
		for (const t of TOPICS) {
			if (t.id === "career") continue;
			expect(spec).not.toContain(`inner.${t.id}`);
		}
	});

	it("TC-C4/TC-C8: career deviating only on screws (still nameplate) emits inner.career and the screws param line", () => {
		const base = defaultState();
		const spec = buildComposerSpec({
			...base,
			clusters: {
				...base.clusters,
				career: {
					id: "nameplate",
					params: { density: "roomy", screws: true, role: "title" },
				},
			},
		});
		expect(spec).toContain("inner.career: nameplate");
		expect(spec).toContain("inner.career.screws:");
	});

	it("TC-C5: career switched to a different frame entirely emits that frame's id and params", () => {
		const base = defaultState();
		const spec = buildComposerSpec({
			...base,
			clusters: {
				...base.clusters,
				career: { id: "minimal", params: { ...INNERS.minimal.defaults } },
			},
		});
		expect(spec).toContain("inner.career: minimal");
		expect(spec).toContain("inner.career.density:");
		expect(spec).toContain("inner.career.underline:");
		expect(spec).toContain("inner.career.align:");
	});

	it("a customized topic emits its inner.<topic>.* keys", () => {
		const base = defaultState();
		const spec = buildComposerSpec({
			...base,
			clusters: {
				...base.clusters,
				coding: { id: "minimal", params: { ...INNERS.minimal.defaults } },
			},
		});
		expect(spec).toContain("inner.coding: minimal");
		expect(spec).toContain("inner.coding.density:");
		expect(spec).toContain("inner.coding.underline:");
		expect(spec).toContain("inner.coding.align:");
	});

	it("other topics stay omitted when one is customized", () => {
		const base = defaultState();
		const spec = buildComposerSpec({
			...base,
			clusters: {
				...base.clusters,
				coding: { id: "comic", params: { ...INNERS.comic.defaults } },
			},
		});
		expect(spec).toContain("inner.coding: comic");
		expect(spec).not.toContain("inner.career");
		expect(spec).not.toContain("inner.games");
	});

	it("link === none omits the link.* keys", () => {
		const spec = buildComposerSpec(makeState({ link: "none" }));
		expect(spec).toContain("link: none");
		expect(spec).not.toContain("link.color");
		expect(spec).not.toContain("link.weight");
	});

	// Milestone 2 coverage: a per-topic inner deviation (id switch + a param
	// tweak) emits that topic's inner.* keys, leaves untouched topics omitted,
	// and never emits section.* - guarding the post-stage-removal state shape
	// (buildComposerSpec's stage loop is deleted in milestone 2).
	it("a deviated inner emits its topic's inner.* keys and no section.* keys", () => {
		const base = defaultState();
		const spec = buildComposerSpec({
			...base,
			clusters: {
				...base.clusters,
				travel: {
					id: "floating-island",
					params: { ...INNERS["floating-island"].defaults, tint: 70 },
				},
			},
		});
		expect(spec).toContain("inner.travel: floating-island");
		expect(spec).toContain("inner.travel.tint: 70");
		expect(spec).not.toContain("inner.coding");
		expect(spec).not.toContain("section.");
	});
});
