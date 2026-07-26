// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
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
	// Re-locked on ticket #46 (Projects band scroll integration): the extra
	// section tightens the site-wide landscape gap from 55vh to 30vh.
	it("ships a 30vh landscape gap between sections", () => {
		expect(DEFAULT_CELESTIAL.gapVh).toBe(30);
	});
});

// Ticket #51 (manual walk). The four boundary gaps were all a correct 30vh,
// but the SPACE between sections was not: each section root also carried its
// own ad-hoc vertical padding (hero pb-48, socials pt-4 pb-64, footer py-16),
// so the perceived boundary ran 270px -> 590px and the cadence read uneven.
// gapVh is now the single variable that sets every boundary, which only holds
// while no section root re-adds padding on an edge it shares with a RhythmGap.
// Asserted on the root element's own class list (inner padding is untouched):
// a render test cannot see this, because the defect is spacing that LOOKS
// deliberate at every individual seam and only reads wrong across the page.
describe("one variable owns every boundary", () => {
	const ROOTS: Array<{ file: string; tag: string; allowed: RegExp | null }> = [
		// pt-24 clears the fixed nav; it is page-top spacing, not a boundary.
		{ file: "HeroSection.tsx", tag: "section", allowed: /^pt-24$/ },
		{ file: "FindMeSection.tsx", tag: "section", allowed: null },
		{ file: "ProjectsSection.tsx", tag: "section", allowed: null },
		{ file: "CraftSection.tsx", tag: "section", allowed: null },
		// pb-16 is the end of the page, not a seam with a RhythmGap.
		{ file: "footer/FooterSection.tsx", tag: "footer", allowed: /^pb-16$/ },
	];

	for (const { file, tag, allowed } of ROOTS) {
		it(`${file} root adds no padding on an edge a RhythmGap owns`, () => {
			const src = readFileSync(
				resolve(process.cwd(), "src/components/_layout", file),
				"utf8",
			);
			const open = src.slice(src.indexOf(`<${tag}`));
			const className = /className=(?:"([^"]*)"|\{`([^`]*)`\})/.exec(
				open.slice(0, open.indexOf(">")),
			);
			expect(className, `no root className found in ${file}`).not.toBeNull();
			const vertical = (className?.[1] ?? className?.[2] ?? "")
				.split(/\s+/)
				.filter((c) => /^(pt|pb|py)-/.test(c))
				.filter((c) => !allowed?.test(c));
			expect(
				vertical,
				`${file} root re-added boundary padding: ${vertical.join(", ")}`,
			).toEqual([]);
		});
	}
});

describe("RhythmGap", () => {
	it("renders a transparent aria-hidden spacer sized in vh", () => {
		render(<RhythmGap gapVh={42} />);
		const gap = screen.getByTestId("rhythm-gap");
		expect(gap.getAttribute("aria-hidden")).toBe("true");
		// Height comes straight from the prop - no --gap-vh indirection, since
		// nothing is persisted and SSR already renders the final value.
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
