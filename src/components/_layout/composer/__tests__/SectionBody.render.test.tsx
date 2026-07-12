// @vitest-environment jsdom
import { cleanup, render } from "@testing-library/react";
import { createRef } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { Topic } from "../../../../data/topics";
import { stubSectionGeometry } from "../../../../test/stubSectionGeometry";
import { SectionBody } from "../SectionBody";

/*
 * SectionBody keeps its EXISTING `isNight` prop (no new `night` prop of its
 * own) - it forwards `night={isNight}` to the SectionTitle calls in its
 * header, so the caller's isNight decision wins over SectionTitle's own
 * (whole-section) measurement. Harness mirrors TopicComposition.test.tsx /
 * TopicBody.test.tsx: stub the router's useNavigate (useTriggerNav calls it
 * unconditionally via TopicBody) and the topics registry (TOPIC_CONTENTS:{}
 * forces every topic through the teaser branch).
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

// SB-N3 covers the non-stamped ("accent-bar") layout branch (SectionBody.tsx
// wraps SectionTitle in a `<div className="flex ...">` alongside the
// flourish image at ~line 86), whereas SB-N1/SB-N2 above only ever hit the
// "stamped" branch's SectionTitle call (~line 81) since `travel` is a
// stamped-layout topic. Without this case, an implementer who only wires
// `night={isNight}` onto the stamped call site would go green.
const accentBarTopic: Topic = {
	id: "coding",
	heading: "Coding",
	teaser: "ignored",
	triggers: [],
};

const lastTriggerRef = createRef<HTMLElement>();

afterEach(() => {
	cleanup();
	vi.unstubAllGlobals();
});

describe("SectionBody isNight overrides SectionTitle's own measurement", () => {
	// SB-N1: isNight={true} under ALL-DAY stub geometry still renders the
	// heading as night (text-white) - the isNight prop beats measurement.
	it("isNight={true} under all-day geometry renders the heading text-white", () => {
		const restore = stubSectionGeometry({
			scrollHeight: 1800,
			innerHeight: 800,
			rect: { top: 50, height: 800 },
		});
		const { container } = render(
			<SectionBody
				topic={topic}
				isNight={true}
				lastTriggerRef={lastTriggerRef}
			/>,
		);
		const heading = container.querySelector("h2");
		expect(heading?.className).toContain("text-white");
		restore();
	});

	// SB-N2: isNight={false} under ALL-NIGHT stub geometry keeps the heading
	// day (text-slate-900).
	it("isNight={false} under all-night geometry keeps the heading text-slate-900", () => {
		const restore = stubSectionGeometry({
			scrollHeight: 1800,
			innerHeight: 800,
			rect: { top: 900, height: 800 },
		});
		const { container } = render(
			<SectionBody
				topic={topic}
				isNight={false}
				lastTriggerRef={lastTriggerRef}
			/>,
		);
		const heading = container.querySelector("h2");
		expect(heading?.className).toContain("text-slate-900");
		expect(heading?.className).not.toContain("text-white");
		restore();
	});

	// SB-N3: same override behavior, but on the accent-bar (non-stamped)
	// layout branch - isNight={true} under ALL-DAY stub geometry still
	// renders the heading text-white.
	it("isNight={true} under all-day geometry renders the heading text-white on the accent-bar (non-stamped) branch", () => {
		const restore = stubSectionGeometry({
			scrollHeight: 1800,
			innerHeight: 800,
			rect: { top: 50, height: 800 },
		});
		const { container } = render(
			<SectionBody
				topic={accentBarTopic}
				isNight={true}
				lastTriggerRef={lastTriggerRef}
			/>,
		);
		const heading = container.querySelector("h2");
		expect(heading?.className).toContain("text-white");
		restore();
	});
});

/*
 * The whole-section freeze is meant to keep the heading AND the topic PLATE
 * (TopicBody -> TopicPlate, rendered here through the real teaser branch
 * since `travel`/`coding` carry a truthy teaser) in ONE phase - both driven
 * by the same `isNight` prop SectionBody forwards. TCM-N1 and SB-N1/N2/N3
 * only ever assert the <h2>'s day/night class, never the plate's, so an
 * implementer who wired `isNight` into SectionTitle but left TopicPlate on
 * its own (unfrozen) phase would still go green on those.
 */
describe("SectionBody keeps the topic plate in the same phase as the heading", () => {
	// SB-N4: isNight={true} renders both the heading text-white AND the plate
	// with its night classes (is-night / bg-slate-900/55 / text-slate-50).
	it("isNight={true} renders the heading text-white and the plate is-night together", () => {
		const restore = stubSectionGeometry({
			scrollHeight: 1800,
			innerHeight: 800,
			rect: { top: 50, height: 800 },
		});
		const { container } = render(
			<SectionBody
				topic={topic}
				isNight={true}
				lastTriggerRef={lastTriggerRef}
			/>,
		);
		const heading = container.querySelector("h2");
		expect(heading?.className).toContain("text-white");
		const plate = container.querySelector(".plate");
		expect(plate).not.toBeNull();
		expect(plate?.className).toContain("is-night");
		expect(plate?.className).toContain("bg-slate-900/55");
		expect(plate?.className).toContain("text-slate-50");
		restore();
	});

	// SB-N5: isNight={false} keeps the heading text-slate-900 AND the plate
	// off its night classes (no is-night, day bg/text instead).
	it("isNight={false} keeps the heading text-slate-900 and the plate off its night classes", () => {
		const restore = stubSectionGeometry({
			scrollHeight: 1800,
			innerHeight: 800,
			rect: { top: 900, height: 800 },
		});
		const { container } = render(
			<SectionBody
				topic={topic}
				isNight={false}
				lastTriggerRef={lastTriggerRef}
			/>,
		);
		const heading = container.querySelector("h2");
		expect(heading?.className).toContain("text-slate-900");
		expect(heading?.className).not.toContain("text-white");
		const plate = container.querySelector(".plate");
		expect(plate).not.toBeNull();
		expect(plate?.className).not.toContain("is-night");
		expect(plate?.className).toContain("bg-white/40");
		expect(plate?.className).toContain("text-slate-900");
		restore();
	});
});
