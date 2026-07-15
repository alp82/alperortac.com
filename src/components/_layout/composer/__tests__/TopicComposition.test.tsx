// @vitest-environment jsdom
import { cleanup, render } from "@testing-library/react";
import { createRef } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { Topic } from "../../../../data/topics";
import { stubSectionGeometry } from "../../../../test/stubSectionGeometry";
import { INNER_ORDER, INNERS } from "../index";
import { TopicComposition } from "../TopicComposition";
import type { InnerId, InnerRenderProps } from "../types";
import { TOPIC_ACCENT } from "../types";
import { DEFAULT_INNER, defaultState } from "../useComposerControls";

/*
 * TopicComposition - additive-port regression suite (WORKFLOW milestone loop).
 *
 * This file was authored incrementally across the composer-stage-to-inside
 * refactor's three milestones; each milestone's round ADDED describe blocks
 * (never rewrote earlier ones), so the file accumulates the full contract:
 *
 *   Milestone 1 - additive port. "parallax-depth" and "floating-island"
 *     became plain InnerId entries in INNERS, prepended to INNER_ORDER. The
 *     stage layer (SECTIONS, TopicStage, DEFAULT_SECTION) still existed and
 *     was untouched at that point - kept OUT of that round's assertion
 *     surface because it was deleted in milestone 2. Those blocks render the
 *     ported inners directly off the INNERS registry with InnerRenderProps,
 *     the same way every existing inner (skyline, minimal, ...) is
 *     exercised - no TopicComposition/Stage wiring.
 *   Milestone 2 - stage removal: single `<article id>` neutral-wrapper
 *     assertions, DEFAULT_INNER flip, spec-emission guards. These blocks
 *     were authored red against the stage-era tree (plan steps 6-12 not yet
 *     applied at authoring time) - they render the REAL TopicComposition
 *     with defaultState() and assert the POST-removal contract; milestone 2
 *     applied the removal and turned them green.
 *   Milestone 3 - deco purge: final 8-entry INNER_ORDER, retired-id
 *     absence, a render smoke pass over the 8 survivors, and a skyline
 *     render regression.
 */

vi.mock("@tanstack/react-router", () => ({
	useNavigate: () => vi.fn(),
}));

vi.mock("../../topics/registry", () => ({
	TOPIC_CONTENTS: {},
}));

// jsdom does not implement matchMedia; the ported inners' scroll effects
// call `window.matchMedia("(prefers-reduced-motion: reduce)")` (mirroring
// the retired sections/parallax-depth.tsx + sections/floating-island.tsx),
// so stub it only when the jsdom env doesn't already provide one.
if (typeof window !== "undefined" && !window.matchMedia) {
	vi.stubGlobal("matchMedia", (query: string) => ({
		matches: false,
		media: query,
		onchange: null,
		addListener: () => {},
		removeListener: () => {},
		addEventListener: () => {},
		removeEventListener: () => {},
		dispatchEvent: () => false,
	}));
}

const topic: Topic = {
	id: "travel",
	heading: "Travel",
	teaser: "ignored",
	triggers: [],
};

const lastTriggerRef = createRef<HTMLElement>();

const ACCENT = "red";

/** Renders an inner straight off the INNERS registry, InnerRenderProps-style. */
function renderInner(
	id: InnerId,
	body: React.ReactNode = <p data-testid="body">real body</p>,
) {
	const def = INNERS[id];
	const Cluster = def.Component as React.ComponentType<InnerRenderProps>;
	return render(
		<Cluster
			topic={topic}
			index={0}
			isNight={false}
			lastTriggerRef={lastTriggerRef}
			params={def.defaults}
			accent={ACCENT}
		>
			{body}
		</Cluster>,
	);
}

describe("Milestone 1 - ported inners registered in INNERS", () => {
	afterEach(() => {
		cleanup();
	});

	// TC-11 (M1 form): INNER_ORDER's first two entries are the ported pair, in
	// order. Total count is NOT asserted here - it only lands at 8 in milestone 3.
	it("INNER_ORDER starts with parallax-depth then floating-island", () => {
		expect(INNER_ORDER.slice(0, 2)).toEqual([
			"parallax-depth",
			"floating-island",
		]);
	});

	// TC-14: parallax-depth's defaults key-set is exactly density/shape/depth/layers.
	it("parallax-depth defaults expose exactly density/shape/depth/layers", () => {
		const def = INNERS["parallax-depth"];
		expect(Object.keys(def.defaults).sort()).toEqual(
			["density", "depth", "layers", "shape"].sort(),
		);
	});

	// TC-15: floating-island's defaults key-set is exactly
	// density/floatHeight/bob/corners/tint - no height key.
	it("floating-island defaults expose exactly density/floatHeight/bob/corners/tint", () => {
		const def = INNERS["floating-island"];
		expect(Object.keys(def.defaults).sort()).toEqual(
			["bob", "corners", "density", "floatHeight", "tint"].sort(),
		);
		expect(Object.keys(def.defaults)).not.toContain("height");
	});

	// TC-16: parallax-depth's defaults match exactly.
	it("parallax-depth defaults match { density: roomy, shape: flourish, depth: 50, layers: 3 }", () => {
		const def = INNERS["parallax-depth"];
		expect(def.defaults).toEqual({
			density: "roomy",
			shape: "flourish",
			depth: 50,
			layers: 3,
		});
	});

	// TC-17: floating-island's defaults match exactly.
	it("floating-island defaults match { density: roomy, floatHeight: 50, bob: 50, corners: soft, tint: 35 }", () => {
		const def = INNERS["floating-island"];
		expect(def.defaults).toEqual({
			density: "roomy",
			floatHeight: 50,
			bob: 50,
			corners: "soft",
			tint: 35,
		});
	});

	// TC-18: parallax-depth's surface is "plate".
	it("parallax-depth surface is plate", () => {
		const def = INNERS["parallax-depth"];
		expect(def.surface).toBe("plate");
	});

	// TC-19: floating-island's surface is "dark".
	it("floating-island surface is dark", () => {
		const def = INNERS["floating-island"];
		expect(def.surface).toBe("dark");
	});

	// TC-20: both ported inners have a non-empty label and feel.
	it("both ported inners carry a non-empty label and feel", () => {
		for (const id of ["parallax-depth", "floating-island"] as const) {
			const def = INNERS[id];
			expect(def.label.length).toBeGreaterThan(0);
			expect(def.feel.length).toBeGreaterThan(0);
		}
	});
});

describe("Milestone 1 - parallax-depth cluster render", () => {
	afterEach(() => {
		cleanup();
	});

	// Coverage-close: mirrors the .cmp-island render check above for symmetry
	// (the milestone-1 smoke pass only exercised floating-island directly).
	// The default params carry layers: 3, so the far layer + the mid scrim
	// band both render as .cmp-parallax-layer elements.
	it("renders two .cmp-parallax-layer elements at the default (layers: 3)", () => {
		const { container } = renderInner("parallax-depth");
		expect(container.querySelectorAll(".cmp-parallax-layer").length).toBe(2);
	});
});

describe("Milestone 1 - floating-island cluster render", () => {
	afterEach(() => {
		cleanup();
	});

	// TC-7: rendering the floating-island cluster off the registry yields a
	// `.cmp-island` slab element (the retained slab structure from the old
	// sections/floating-island.tsx, now owned by the inner itself).
	it("renders a .cmp-island slab element", () => {
		const { container } = renderInner("floating-island");
		expect(container.querySelector(".cmp-island")).not.toBeNull();
	});

	// TC-8: the old under-slab glow span (sections/floating-island.tsx old
	// lines 85-91 - the blurred `<span>` with the `blur-md` class sitting under
	// the slab) must NOT be ported.
	it("does not render the retired under-slab glow element", () => {
		const { container } = renderInner("floating-island");
		const glow = container.querySelector('.cmp-island [class*="blur"]');
		expect(glow).toBeNull();
	});
});

describe("Milestone 1 - ported inners' Minimal-style chrome", () => {
	afterEach(() => {
		cleanup();
	});

	// TC-9: both ported inners carry the Minimal style's chrome - an uppercase
	// h2 showing topic.heading, and an accent-underline span whose background
	// is the resolved accent.
	it.each([
		"parallax-depth",
		"floating-island",
	] as const)("%s chrome shows an uppercase heading + accent underline", (id) => {
		const { container } = renderInner(id);
		const heading = container.querySelector("h2");
		expect(heading).not.toBeNull();
		expect(heading?.textContent).toBe(topic.heading);
		expect(heading?.className).toContain("uppercase");

		const underline = container.querySelector<HTMLSpanElement>(
			'span[aria-hidden="true"]',
		);
		expect(underline).not.toBeNull();
		expect(underline?.style.background).toBe(ACCENT);
	});
});

describe("Milestone 1 - existing inner regression", () => {
	afterEach(() => {
		cleanup();
	});

	// TC-21: constellation (an untouched existing inner) still renders the
	// topic's real body unaffected by the additive port.
	it("constellation still renders the topic body passed as children", () => {
		const { getByTestId } = renderInner("constellation");
		expect(getByTestId("body").textContent).toBe("real body");
	});
});

/*
 * Milestone 2 blocks below render the REAL TopicComposition dispatcher (not
 * the renderInner registry shortcut above) with a full defaultState(), the
 * same way TopicArticle wires it in production. These assertions were
 * authored red against the stage-era tree - a `.cmp-stage` article with an
 * inline minHeight style and "none"-source accent, plus constellation
 * chrome - and turned green once milestone 2 applied the stage removal.
 */

const codingTopic: Topic = {
	id: "coding",
	heading: "Coding",
	teaser: "ignored",
	triggers: [],
};

/** Renders the real TopicComposition dispatcher off a fresh defaultState(). */
function renderComposition(t: Topic = topic) {
	return render(
		<TopicComposition
			state={defaultState()}
			topic={t}
			index={0}
			lastTriggerRef={lastTriggerRef}
		/>,
	);
}

describe("Milestone 2 - neutral wrapper replaces the stage", () => {
	afterEach(() => {
		cleanup();
	});

	// TC-1/TC-2/TC-3: the default defaultState() render of one topic yields
	// exactly one <article>, its id is the topic id, and its className
	// carries the min-h-[90vh] Tailwind class (not an inline minHeight style
	// - the stage-era article was `.cmp-stage` with an inline `minHeight`
	// style and no `min-h-[90vh]` class).
	it("renders exactly one article, id=topic.id, className contains min-h-[90vh]", () => {
		const { container } = renderComposition(topic);
		const articles = container.querySelectorAll("article");
		expect(articles.length).toBe(1);
		const article = articles[0];
		expect(article?.id).toBe(topic.id);
		expect(article?.className).toContain("min-h-[90vh]");
	});

	// TC-5: the default render shows Parallax Depth chrome - an h2 containing
	// topic.heading, styled with SectionTitle's shared brutalist drop-shadow
	// class (the stage-era DEFAULT_INNER was "constellation", whose h2 used a
	// different text-shadow treatment; the ported inners' pre-SectionTitle
	// chrome used a softer 0_2px_16px shadow, which this swaps out).
	it("shows Parallax Depth chrome: an h2 with topic.heading and SectionTitle's shared drop-shadow class", () => {
		const { container } = renderComposition(topic);
		const heading = container.querySelector("h2");
		expect(heading).not.toBeNull();
		expect(heading?.textContent).toBe(topic.heading);
		expect(heading?.className).toContain(
			"drop-shadow-[4px_4px_0px_rgba(255,255,255,0.5)]",
		);
		expect(heading?.className).not.toContain(
			"drop-shadow-[0_2px_16px_rgba(0,0,0,0.45)]",
		);
	});

	// TC-13: DEFAULT_INNER is "parallax-depth" (was "constellation" on the
	// stage-era tree).
	it("DEFAULT_INNER is parallax-depth", () => {
		expect(DEFAULT_INNER).toBe("parallax-depth");
	});

	// TC-23: --cmp-accent reflects each topic's own palette across at least
	// two different topics (same "none"-source stage-era reason as TC-4).
	it("reflects each topic's own accent across multiple topics", () => {
		const { container: travelContainer } = renderComposition(topic);
		const travelArticle = travelContainer.querySelector("article");
		expect(travelArticle?.style.getPropertyValue("--cmp-accent")).toBe(
			TOPIC_ACCENT.travel,
		);
		cleanup();

		const { container: codingContainer } = renderComposition(codingTopic);
		const codingArticle = codingContainer.querySelector("article");
		expect(codingArticle?.style.getPropertyValue("--cmp-accent")).toBe(
			TOPIC_ACCENT.coding,
		);
		expect(TOPIC_ACCENT.travel).not.toBe(TOPIC_ACCENT.coding);
	});
});

/*
 * Milestone 3 blocks below guard the deco purge (plan steps 13-15): the five
 * deco inners (terrain, waterline, weather, wildlife, celestial) + their
 * inner/_deco.tsx engine, registry entries, and panel wiring are deleted;
 * INNER_ORDER lands at its final 8 entries; SkylineParams is rewired onto
 * the surviving DecoProminence/DecoPlacement/DecoColor aliases. TC-10/TC-12
 * are authored red against the current tree (the five deco ids are still in
 * INNER_ORDER/INNERS); TC-22/TC-29 are authorable green now - they guard the
 * purge leaving the 8 survivors (and skyline's alias rewire) intact.
 */

/** The final 8-entry INNER_ORDER this round lands on - kept literal so this
 * test fails if a survivor is accidentally deleted along with the deco five. */
const FINAL_INNER_ORDER = [
	"parallax-depth",
	"floating-island",
	"constellation",
	"skyline",
	"terminal",
	"ticket-stub",
	"arcade-hud",
	"seed-packet",
] as const;

const RETIRED_STAGE_IDS = [
	"centered-monolith",
	"split-stage",
	"marquee-scroll",
	"zoom-focus",
];

const RETIRED_DECO_IDS = [
	"terrain",
	"waterline",
	"weather",
	"wildlife",
	"celestial",
];

/** Renders the real TopicComposition with a single topic's cluster forced to
 * the given inner id, using that inner's own registry defaults. */
function renderCompositionWithInner(id: InnerId, t: Topic = topic) {
	const state = defaultState();
	state.clusters[t.id] = { id, params: { ...INNERS[id].defaults } };
	return render(
		<TopicComposition
			state={state}
			topic={t}
			index={0}
			lastTriggerRef={lastTriggerRef}
		/>,
	);
}

describe("Milestone 3 - INNER_ORDER lands at its final 8 entries", () => {
	afterEach(() => {
		cleanup();
	});

	// TC-10: INNER_ORDER now has exactly 12 entries (the 8-survivor guard plus
	// the four new ephemera frames, appended - never rewritten in place).
	it("has exactly 12 entries", () => {
		expect(INNER_ORDER.length).toBe(12);
	});

	// C2: the first 8 entries are unchanged and in original order - still equal
	// to the FINAL_INNER_ORDER survivor literal. This is the deco-purge guard
	// surviving the growth to 12: rewriting FINAL_INNER_ORDER itself (instead
	// of appending here) would silently defeat this assertion.
	it("first 8 entries still equal the FINAL_INNER_ORDER survivor literal", () => {
		expect(INNER_ORDER.slice(0, 8)).toEqual([...FINAL_INNER_ORDER]);
	});

	// C3: the last 4 entries are the four new ephemera frames, in order,
	// appended after the survivors (not interleaved) - this is exactly what
	// keeps the Milestone 1 slice(0,2) test at the top of this file green.
	it("last 4 entries are timecard, nameplate, punch-card, offer-letter in order", () => {
		expect(INNER_ORDER.slice(8)).toEqual([
			"timecard",
			"nameplate",
			"punch-card",
			"offer-letter",
		]);
	});

	// C4: no duplicate ids anywhere in INNER_ORDER.
	it("contains no duplicate ids", () => {
		expect(new Set(INNER_ORDER).size).toBe(INNER_ORDER.length);
	});

	// C-8: the retired conference-badge id is gone from INNER_ORDER (reshaped
	// into nameplate in place - no dangling reference survives).
	it("does not contain conference-badge", () => {
		expect(INNER_ORDER).not.toContain("conference-badge");
	});

	// TC-12 / C5: INNER_ORDER contains none of the retired ids - neither the
	// four never-ported stage variants nor the five deco inners.
	it("contains none of the retired stage or deco ids", () => {
		for (const id of [...RETIRED_STAGE_IDS, ...RETIRED_DECO_IDS]) {
			expect(INNER_ORDER).not.toContain(id);
		}
	});

	// C6: every id in INNER_ORDER has a matching INNERS registry entry.
	it("every id in INNER_ORDER has an INNERS entry", () => {
		for (const id of INNER_ORDER) {
			expect(INNERS[id]).toBeDefined();
			expect(INNERS[id].id).toBe(id);
		}
	});
});

/*
 * Four ephemera frames (timecard, nameplate, punch-card, offer-letter)
 * join the picker as a SEPARATE literal beside FINAL_INNER_ORDER - not folded
 * into it - so the 8-entry deco-purge survivor guard above stays untouched by
 * construction (plan v2's structural note). This is authored red: none of the
 * four ids exist in INNERS/INNER_ORDER yet.
 */
const EPHEMERA_IDS = [
	"timecard",
	"nameplate",
	"punch-card",
	"offer-letter",
] as const;

describe("ephemera inners render through TopicComposition", () => {
	afterEach(() => {
		cleanup();
	});

	// D4/D5: each new id renders via renderCompositionWithInner with its own
	// registry defaults without throwing, and produces exactly one <article>.
	it.each(EPHEMERA_IDS)("renders exactly one article for %s", (id) => {
		const { container } = renderCompositionWithInner(id);
		const articles = container.querySelectorAll("article");
		expect(articles.length).toBe(1);
	});

	// D6: each renders correctly at index 0 and at a later index (the
	// padStart microcopy boundary - "01" at index 0 vs a two-digit index).
	it.each(
		EPHEMERA_IDS,
	)("renders without throwing at index 0 and at a later index for %s", (id) => {
		const state0 = defaultState();
		state0.clusters[topic.id] = { id, params: { ...INNERS[id].defaults } };
		const first = render(
			<TopicComposition
				state={state0}
				topic={topic}
				index={0}
				lastTriggerRef={lastTriggerRef}
			/>,
		);
		expect(first.container.querySelectorAll("article").length).toBe(1);
		cleanup();

		const state9 = defaultState();
		state9.clusters[topic.id] = { id, params: { ...INNERS[id].defaults } };
		const later = render(
			<TopicComposition
				state={state9}
				topic={topic}
				index={9}
				lastTriggerRef={lastTriggerRef}
			/>,
		);
		expect(later.container.querySelectorAll("article").length).toBe(1);
	});

	// D7: the real TopicBody (children) is present and seated inside the
	// frame's DOM tree. Under this suite's `../../topics/registry` mock,
	// TOPIC_CONTENTS is empty, so TopicBody (TopicBody.tsx:112-124) falls back
	// to rendering topic.teaser verbatim - and this file's `topic` fixture sets
	// teaser: "ignored". Asserting that literal string proves the real body
	// was seated inside the frame, not merely that the frame's own chrome
	// (e.g. "Travel", "EMPLOYEE NO. 01") produced non-empty text.
	it.each(
		EPHEMERA_IDS,
	)("seats the real TopicBody children inside the frame for %s", (id) => {
		const { container } = renderCompositionWithInner(id);
		const article = container.querySelector("article");
		expect(article).not.toBeNull();
		expect(article?.textContent).toContain("ignored");
	});
});

describe("Milestone 3 - every surviving inner renders through TopicComposition", () => {
	afterEach(() => {
		cleanup();
	});

	// TC-22: rendering TopicComposition once with each of the 8 final
	// INNER_ORDER ids (set the topic's cluster to that id with that inner's
	// own defaults) does not throw and produces exactly one article each.
	// The id list is kept literal (not derived from INNER_ORDER) so this
	// fails if a survivor is accidentally deleted along with the purge.
	it.each(FINAL_INNER_ORDER)("renders exactly one article for %s", (id) => {
		const { container } = renderCompositionWithInner(id);
		const articles = container.querySelectorAll("article");
		expect(articles.length).toBe(1);
	});
});

describe("Milestone 3 - skyline render regression", () => {
	afterEach(() => {
		cleanup();
	});

	// TC-29: a skyline render regression guarding the SkylineParams alias
	// rewire (DecoProminence/DecoPlacement/DecoColor) didn't break the
	// component - skyline with its defaults renders without throwing and
	// shows its cluster.
	it("renders skyline with its defaults without throwing and shows its cluster", () => {
		const { container } = renderCompositionWithInner("skyline");
		expect(container.textContent).toContain("skyline");
		const heading = container.querySelector("h2");
		expect(heading?.textContent).toBe(topic.heading);
	});
});

/*
 * useRelativeScrollOffset (inner/shared-hooks.ts) never attaches its
 * scroll/resize listeners when the user prefers reduced motion - reduced-
 * motion users get a static frame at offset 0. This block stubs
 * window.matchMedia to report prefers-reduced-motion: reduce and asserts
 * the static contract directly through the ported inners that consume the
 * hook, rather than through hook internals.
 */
describe("useRelativeScrollOffset - reduced-motion guard", () => {
	afterEach(() => {
		cleanup();
		vi.unstubAllGlobals();
		vi.restoreAllMocks();
	});

	it.each([
		"parallax-depth",
		"floating-island",
	] as const)("%s never registers scroll/resize listeners when prefers-reduced-motion matches", (id) => {
		vi.stubGlobal("matchMedia", (query: string) => ({
			matches: true,
			media: query,
			onchange: null,
			addListener: () => {},
			removeListener: () => {},
			addEventListener: () => {},
			removeEventListener: () => {},
			dispatchEvent: () => false,
		}));
		const addEventListenerSpy = vi.spyOn(window, "addEventListener");

		renderInner(id);

		const registeredTypes = addEventListenerSpy.mock.calls.map(
			(call) => call[0],
		);
		expect(registeredTypes).not.toContain("scroll");
		expect(registeredTypes).not.toContain("resize");
	});
});

/*
 * v4 whole-section day/night freeze: TopicComposition's rendered inners lose
 * their isNight prop (dropped above from renderComposition/
 * renderCompositionWithInner) - night is now derived once from the whole
 * <article id=topic.id> section's own scroll position, via the inner's
 * SectionTitle measuring the ARTICLE root, not its own wrapper.
 */
describe("TopicComposition whole-section day/night freeze", () => {
	afterEach(() => {
		cleanup();
		vi.unstubAllGlobals();
	});

	// TCM-N1: adversarial - the article (#travel) gets a NIGHT-side rect,
	// while the DEFAULT rect (which the title's own wrapper receives, since
	// it doesn't match "#travel") is far-DAY. The heading must still follow
	// the ARTICLE's frozen phase (night), not its own rect.
	it("the Travel heading follows the article's frozen night phase, not its own rect", () => {
		// The reduced-motion describe block above unstubs the module-level
		// matchMedia stub set at import time; re-stub it here (a real
		// prefers-reduced-motion: reduce mismatch, matches:false) so the
		// ported inner's useRelativeScrollOffset can call it unconditionally.
		vi.stubGlobal("matchMedia", (query: string) => ({
			matches: false,
			media: query,
			onchange: null,
			addListener: () => {},
			removeListener: () => {},
			addEventListener: () => {},
			removeEventListener: () => {},
			dispatchEvent: () => false,
		}));
		const restore = stubSectionGeometry({
			scrollHeight: 10000,
			innerHeight: 800,
			rects: [{ match: "#travel", top: 5860, height: 1800 }],
			rect: { top: 100, height: 100 },
		});
		const { container } = renderCompositionWithInner("parallax-depth", topic);
		const heading = Array.from(container.querySelectorAll("h2")).find((h) =>
			h.className.includes("drop-shadow-[4px_4px_0px_rgba(255,255,255,0.5)]"),
		);
		expect(heading?.textContent).toBe(topic.heading);
		expect(heading?.className).toContain("text-white");
		restore();
	});
});
