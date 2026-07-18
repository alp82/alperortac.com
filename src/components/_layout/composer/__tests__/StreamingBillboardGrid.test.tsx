// @vitest-environment jsdom

/*
 * StreamingBillboardCluster frame-gate tests (#22).
 *
 * Mounted through the real TopicComposition (not the raw Cluster component)
 * so the params/registry wiring is exercised too - a small file-local harness
 * modeled on TopicComposition.test.tsx's `renderCompositionWithInner` (that
 * helper is file-local there, not exported, per plan step 9: replicate the
 * ~10-line mount rather than importing it).
 *
 * Today (pre-build) `topic.id === "movies-tv"` gating doesn't exist yet - the
 * top-chrome pills are only ever hidden behind the throwaway `?variant=`
 * plumbing (dormant with no query param), so under default test conditions
 * EVERY topic on streaming-billboard (movies-tv included) currently shows the
 * pills and never shows a poster grid. TC-SBG-01 is red today because the
 * movies-tv half of the assertion fails; TC-SBG-02 sets `?variant=a` to prove
 * the PROTOTYPE plumbing is still live (it must be gone once the prototype is
 * deleted).
 */

import { cleanup, render, within } from "@testing-library/react";
import { createRef } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { TOPICS, type Topic } from "../../../../data/topics";
import { INNERS } from "../index";
import { TopicComposition } from "../TopicComposition";
import { defaultState } from "../useComposerControls";

vi.mock("@tanstack/react-router", () => ({
	useNavigate: () => vi.fn(),
}));

vi.mock("../../topics/registry", () => ({
	TOPIC_CONTENTS: {},
}));

// jsdom does not implement matchMedia - stub it defensively (mirrors
// TopicComposition.test.tsx's own guard) since the grid's reduced-motion
// check will read it once PosterGrid is wired into this frame.
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

const lastTriggerRef = createRef<HTMLElement>();

/** Renders the real TopicComposition with the given topic's cluster forced
 * onto streaming-billboard, using that inner's own registry defaults. */
function renderOnStreamingBillboard(topic: Topic) {
	const state = defaultState();
	state.clusters[topic.id] = {
		id: "streaming-billboard",
		params: { ...INNERS["streaming-billboard"].defaults },
	};
	return render(
		<TopicComposition
			state={state}
			topic={topic}
			index={0}
			lastTriggerRef={lastTriggerRef}
		/>,
	);
}

const MOVIES_TV_TOPIC = TOPICS.find((t) => t.id === "movies-tv") as Topic;
const OTHER_TOPIC = TOPICS.find((t) => t.id === "games") as Topic;

describe("StreamingBillboardCluster - PosterGrid frame gating (#22)", () => {
	afterEach(() => {
		cleanup();
	});

	// TC-SBG-01
	it("hides the decorative top pills and renders the PosterGrid trigger for movies-tv, while a non-movies-tv topic on the same frame keeps the pills and renders no grid", () => {
		const movies = renderOnStreamingBillboard(MOVIES_TV_TOPIC);
		expect(movies.container.querySelector(".sbb-nav")).toBeNull();
		expect(
			within(movies.container).queryByRole("button", {
				name: /all-time favorite films and series/i,
			}),
		).not.toBeNull();
		movies.unmount();

		const other = renderOnStreamingBillboard(OTHER_TOPIC);
		expect(other.container.querySelector(".sbb-nav")).not.toBeNull();
		expect(other.container.querySelector('img[src^="/posters/"]')).toBeNull();
		expect(
			within(other.container).queryByRole("button", {
				name: /all-time favorite films and series/i,
			}),
		).toBeNull();
		other.unmount();
	});

	// TC-SBG-02
	it("renders no PrototypeSwitcher/variant artifacts even with ?variant=a in the URL (prototype plumbing deleted)", () => {
		const originalUrl = `${window.location.pathname}${window.location.search}`;
		window.history.pushState({}, "", "/?variant=a");
		try {
			const { container } = renderOnStreamingBillboard(MOVIES_TV_TOPIC);
			expect(
				container.querySelector('[aria-label="previous variant"]'),
			).toBeNull();
			expect(container.querySelector('[aria-label="next variant"]')).toBeNull();
			expect(container.textContent).not.toMatch(
				/grid under prose \(trigger\)/i,
			);
		} finally {
			window.history.pushState({}, "", originalUrl);
		}
	});
});
