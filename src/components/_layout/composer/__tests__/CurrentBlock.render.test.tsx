// @vitest-environment jsdom
import { cleanup, render } from "@testing-library/react";
import { createRef } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { Topic } from "../../../../data/topics";
import { stubSectionGeometry } from "../../../../test/stubSectionGeometry";
import { CurrentBlock } from "../current";

/*
 * CurrentBlock is the "shipped baseline" path (reached via TopicArticle's
 * composer.baseline branch, not exercised by TopicComposition.test.tsx). It
 * owns the ARTICLE root and measures its OWN frozen night phase there -
 * `const night = useSectionNightPhase(ref)` on `<article id={topic.id}>` -
 * then passes `night` down to SectionBody (which forwards it, unmeasured,
 * into SectionTitle). No existing test renders CurrentBlock itself:
 * SectionBody.render.test.tsx renders SectionBody in isolation with an
 * explicit isNight prop, bypassing this ref-measurement wiring entirely.
 *
 * Harness mirrors SectionBody.render.test.tsx / TopicComposition.test.tsx:
 * stub the router's useNavigate (useTriggerNav calls it unconditionally via
 * TopicBody) and the topics registry (TOPIC_CONTENTS: {} forces the topic
 * through the teaser branch).
 */

vi.mock("@tanstack/react-router", () => ({
	useNavigate: () => vi.fn(),
}));

vi.mock("../../topics/registry", () => ({
	TOPIC_CONTENTS: {},
}));

const topic: Topic = {
	id: "travel",
	heading: "Travel",
	teaser: "ignored",
	triggers: [],
};

const lastTriggerRef = createRef<HTMLElement>();

afterEach(() => {
	cleanup();
	vi.unstubAllGlobals();
});

describe("CurrentBlock measures the article root, not the title's own rect", () => {
	// CB-N1: adversarial - the article (#travel) gets a NIGHT-side rect, while
	// the DEFAULT rect (which the title's own wrapper receives, since it
	// doesn't match "#travel") is far-DAY. The heading must still follow the
	// ARTICLE's frozen phase (night), not its own rect.
	it("renders the heading night (text-white) when the article root is night-side, even though the title's own rect is day-side", () => {
		const restore = stubSectionGeometry({
			scrollHeight: 10000,
			innerHeight: 800,
			rects: [{ match: "#travel", top: 5860, height: 1800 }],
			rect: { top: 100, height: 100 },
		});
		const { container } = render(
			<CurrentBlock topic={topic} lastTriggerRef={lastTriggerRef} />,
		);
		const article = container.querySelector("article");
		expect(article?.id).toBe(topic.id);
		const heading = container.querySelector("h2");
		expect(heading?.textContent).toBe(topic.heading);
		expect(heading?.className).toContain("text-white");
		restore();
	});

	// CB-N2: the day-direction mirror - the article (#travel) gets a DAY-side
	// rect, while the DEFAULT rect (the title's own wrapper) is far-NIGHT. The
	// heading must still follow the ARTICLE's frozen phase (day).
	it("renders the heading day (text-slate-900) when the article root is day-side, even though the title's own rect is night-side", () => {
		const restore = stubSectionGeometry({
			scrollHeight: 10000,
			innerHeight: 800,
			rects: [{ match: "#travel", top: 100, height: 100 }],
			rect: { top: 5860, height: 1800 },
		});
		const { container } = render(
			<CurrentBlock topic={topic} lastTriggerRef={lastTriggerRef} />,
		);
		const heading = container.querySelector("h2");
		expect(heading?.textContent).toBe(topic.heading);
		expect(heading?.className).toContain("text-slate-900");
		expect(heading?.className).not.toContain("text-white");
		restore();
	});
});
