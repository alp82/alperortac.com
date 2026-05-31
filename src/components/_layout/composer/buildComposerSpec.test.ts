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

	it("all-rich-card clusters emit no inner.* keys", () => {
		// defaultState starts every topic on the baseline rich-card cluster.
		expect(buildComposerSpec(makeState())).not.toContain("inner.");
	});

	it("a non-rich-card topic emits its inner.<topic>.* keys", () => {
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
});
