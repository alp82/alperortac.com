// @vitest-environment jsdom
import { cleanup, render } from "@testing-library/react";
import { createRef } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { Topic } from "../../../../data/topics";

/*
 * TopicBody is the shared topic body (the plate/bespoke-else-teaser dispatch).
 * It must keep its two branches' margins distinct - CustomContent plate = mt-6,
 * teaser plate = mt-3 - so the shipped card stays byte-identical.
 *
 * useTriggerNav() calls useNavigate() unconditionally, so we stub the router.
 * We control TOPIC_CONTENTS to exercise both branches without coupling to the
 * real per-topic content components.
 */

vi.mock("@tanstack/react-router", () => ({
	useNavigate: () => vi.fn(),
}));

vi.mock("../../topics/registry", () => ({
	TOPIC_CONTENTS: {
		// A promoted topic → CustomContent branch.
		coding: () => <div data-testid="custom-content">custom</div>,
		// `career` intentionally absent → teaser branch.
	},
}));

import { TopicBody } from "../TopicBody";

const ref = createRef<HTMLElement>();

const promotedTopic: Topic = {
	id: "coding",
	heading: "Coding",
	teaser: "ignored when promoted",
	triggers: [],
};

const teaserTopic: Topic = {
	id: "career",
	heading: "Career",
	teaser: "First paragraph.\n\nSecond paragraph.",
	triggers: [],
};

describe("TopicBody branch margins", () => {
	afterEach(() => {
		cleanup();
	});

	it("CustomContent branch wraps the component in a plate with mt-6", () => {
		const { container, getByTestId } = render(
			<TopicBody topic={promotedTopic} isNight={false} lastTriggerRef={ref} />,
		);
		expect(getByTestId("custom-content")).not.toBeNull();
		const plate = container.querySelector(".plate");
		expect(plate).not.toBeNull();
		expect(plate?.classList.contains("mt-6")).toBe(true);
		expect(plate?.classList.contains("mt-3")).toBe(false);
	});

	it("teaser branch renders each paragraph in a plate with mt-3", () => {
		const { container } = render(
			<TopicBody topic={teaserTopic} isNight={false} lastTriggerRef={ref} />,
		);
		const plate = container.querySelector(".plate");
		expect(plate).not.toBeNull();
		expect(plate?.classList.contains("mt-3")).toBe(true);
		expect(plate?.classList.contains("mt-6")).toBe(false);
		// Both paragraphs render; the second carries the inter-paragraph mt-3.
		const paras = plate?.querySelectorAll("p") ?? [];
		expect(paras.length).toBe(2);
		expect(paras[0]?.textContent).toBe("First paragraph.");
		expect(paras[1]?.textContent).toBe("Second paragraph.");
		expect(paras[1]?.classList.contains("mt-3")).toBe(true);
	});
});
