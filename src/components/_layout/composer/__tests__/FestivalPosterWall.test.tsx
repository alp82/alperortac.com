// @vitest-environment jsdom

/*
 * FestivalPosterCluster frame-gate tests (#26).
 *
 * Mounted through the real TopicComposition (not the raw Cluster component)
 * so the params/registry wiring is exercised too - the file-local harness is
 * modeled on StreamingBillboardGrid.test.tsx (which replicated
 * TopicComposition.test.tsx's `renderCompositionWithInner`).
 *
 * The gate under test: on the music band the poster gains the ambient
 * backdrop cover wall (dimmed flicker grid of the album shelf's real covers,
 * aria-hidden) and the date strip rewords into the ONE trigger into the
 * /music subpage; any other topic picking festival-poster keeps the plain
 * "EVERY DAY · ONE STAGE · ONE LISTENER" strip and gets no wall.
 */

import { cleanup, render, within } from "@testing-library/react";
import { createRef } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ALBUMS } from "../../../../data/personal";
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
// TopicComposition.test.tsx's own guard) for the wall's reduced-motion check.
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
 * onto festival-poster, using that inner's own registry defaults. */
function renderOnFestivalPoster(topic: Topic) {
	const state = defaultState();
	state.clusters[topic.id] = {
		id: "festival-poster",
		params: { ...INNERS["festival-poster"].defaults },
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

const MUSIC_TOPIC = TOPICS.find((t) => t.id === "music") as Topic;
const OTHER_TOPIC = TOPICS.find((t) => t.id === "games") as Topic;

describe("FestivalPosterCluster - cover wall + shelf-strip frame gating (#26)", () => {
	afterEach(() => {
		cleanup();
	});

	// TC-FPW-01
	it("renders the aria-hidden backdrop cover wall and the shelf-strip trigger for music, while a non-music topic on the same frame keeps the plain date strip and gets no wall", () => {
		const music = renderOnFestivalPoster(MUSIC_TOPIC);
		const wallImg = music.container.querySelector('img[src^="/albums/"]');
		expect(wallImg).not.toBeNull();
		expect(wallImg?.closest('[aria-hidden="true"]')).not.toBeNull();
		expect(
			within(music.container).queryByRole("button", {
				name: new RegExp(`all ${ALBUMS.length} albums on the shelf`, "i"),
			}),
		).not.toBeNull();
		expect(music.container.textContent).not.toContain(
			"EVERY DAY · ONE STAGE · ONE LISTENER",
		);
		music.unmount();

		const other = renderOnFestivalPoster(OTHER_TOPIC);
		expect(other.container.querySelector('img[src^="/albums/"]')).toBeNull();
		expect(
			within(other.container).queryByRole("button", {
				name: /albums on the shelf/i,
			}),
		).toBeNull();
		expect(other.container.textContent).toContain(
			"EVERY DAY · ONE STAGE · ONE LISTENER",
		);
		other.unmount();
	});

	// TC-FPW-02: the wall is a 12-cell dimmed grid - the flicker rotation's
	// visible window, pinned so a rewrite can't silently shrink the wall.
	it("the wall shows 12 covers", () => {
		const { container } = renderOnFestivalPoster(MUSIC_TOPIC);
		expect(container.querySelectorAll('img[src^="/albums/"]').length).toBe(12);
	});

	// TC-FPW-03: the #26 prototype plumbing is gone - `?variant=` must be
	// inert (the StreamingBillboardGrid TC-SBG-02 precedent).
	it("renders no variant-switcher artifacts even with ?variant=a in the URL (prototype deleted)", () => {
		const originalUrl = `${window.location.pathname}${window.location.search}`;
		window.history.pushState({}, "", "/?variant=a");
		try {
			const { container } = renderOnFestivalPoster(MUSIC_TOPIC);
			expect(
				container.querySelector('[aria-label="previous variant"]'),
			).toBeNull();
			expect(container.querySelector('[aria-label="next variant"]')).toBeNull();
			expect(container.textContent).not.toMatch(/fine print grid/i);
		} finally {
			window.history.pushState({}, "", originalUrl);
		}
	});
});
