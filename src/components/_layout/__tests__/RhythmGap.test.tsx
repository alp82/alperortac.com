// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { createRef } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { CELESTIAL_PRESETS, DEFAULT_CELESTIAL } from "../../../data/celestial";
import { TOPICS } from "../../../data/topics";
import { stubSectionGeometry } from "../../../test/stubSectionGeometry";
import { SkyTuningPanel } from "../../SkyTuningPanel";
import { CraftSection } from "../CraftSection";
import { DEFAULT_STATE } from "../composer/useComposerControls";
import { RhythmGap } from "../RhythmGap";

/*
 * Vertical rhythm (wayfinder #35): the scroll journey gets landscape-through
 * breathing room between sections via RhythmGap spacers, height driven by the
 * live-tunable celestial `gapVh`.
 */

vi.mock("@tanstack/react-router", () => ({
	useNavigate: () => vi.fn(),
}));

vi.mock("../topics/registry", () => ({
	TOPIC_CONTENTS: {},
}));

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

afterEach(() => {
	cleanup();
});

describe("locked rhythm", () => {
	// Locked on the wayfinder #35 tuning walk (2026-07-18). Change deliberately.
	it("ships a 55vh landscape gap between sections", () => {
		expect(DEFAULT_CELESTIAL.gapVh).toBe(55);
	});
});

describe("RhythmGap", () => {
	it("renders a transparent aria-hidden spacer sized in vh", () => {
		render(<RhythmGap gapVh={42} />);
		const gap = screen.getByTestId("rhythm-gap");
		expect(gap.getAttribute("aria-hidden")).toBe("true");
		expect(gap.style.height).toBe("42vh");
		expect(gap.childNodes.length).toBe(0);
	});
});

describe("CraftSection seams", () => {
	it("renders one rhythm gap between each pair of consecutive topics", () => {
		const restore = stubSectionGeometry({
			scrollHeight: 10000,
			innerHeight: 800,
		});
		try {
			render(
				<CraftSection
					lastTriggerRef={createRef<HTMLElement>()}
					isNight={false}
					composer={DEFAULT_STATE}
					gapVh={60}
				/>,
			);
			const gaps = screen.getAllByTestId("rhythm-gap");
			expect(gaps.length).toBe(TOPICS.length - 1);
			for (const gap of gaps) {
				expect(gap.style.height).toBe("60vh");
			}
		} finally {
			restore();
		}
	});
});

describe("SkyTuningPanel rhythm knob", () => {
	it("slider change emits the new gapVh with the rest of the state intact", () => {
		const onChange = vi.fn();
		render(
			<SkyTuningPanel
				state={{ ...DEFAULT_CELESTIAL, gapVh: 10 }}
				onChange={onChange}
				onClose={() => {}}
			/>,
		);
		fireEvent.change(document.getElementById("rhythm-gap-range") as Element, {
			target: { value: "55" },
		});
		expect(onChange).toHaveBeenCalledWith({ ...DEFAULT_CELESTIAL, gapVh: 55 });
	});

	it("preset clicks preserve the tuned gapVh (and curve)", () => {
		const onChange = vi.fn();
		const tuned = { ...DEFAULT_CELESTIAL, gapVh: 77 };
		render(
			<SkyTuningPanel state={tuned} onChange={onChange} onClose={() => {}} />,
		);
		fireEvent.click(screen.getByRole("button", { name: "Crossover" }));
		expect(onChange).toHaveBeenCalledWith({
			...tuned,
			...CELESTIAL_PRESETS.Crossover,
		});
	});
});
