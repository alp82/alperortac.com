import { describe, expect, it } from "vitest";
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
		// defaultState starts every topic on the untouched default parallax-depth cluster.
		expect(buildComposerSpec(makeState())).not.toContain("inner.");
		expect(buildComposerSpec(makeState())).not.toContain("section.");
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
