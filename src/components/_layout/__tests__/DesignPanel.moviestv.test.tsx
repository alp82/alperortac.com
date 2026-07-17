// @vitest-environment jsdom

/*
 * DesignPanel - InsideSpecificControls coverage for the Movies & TV candidate
 * frames (wayfinder #18): streaming-billboard, movie-poster, trailer-player,
 * score-card, letterbox. All five are new this round - no restored-from-
 * pruned shortlist frames to exclude, unlike the tech-stack round.
 *
 * Harness copied verbatim from DesignPanel.techstack.test.tsx: `Host` seeds
 * every topic's cluster onto one inner id via `setAllInners`, then asserts on
 * the rendered Segmented/Toggle controls and the exact `patch()` calls they
 * fire.
 */

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { useEffect, useRef } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { AnyInnerParams, InnerId } from "../composer/types";
import { useComposerControls } from "../composer/useComposerControls";
import { DesignPanel } from "../DesignPanel";

/** Seeds every topic's cluster onto `innerId` (via setAllInners) on mount, and
 * routes every `patch()` call for the active scope through `patchSpy` (in
 * addition to actually applying it), so tests can assert exact patch args. */
function Host({
	innerId,
	patchSpy = () => {},
}: {
	innerId: InnerId;
	patchSpy?: (p: Partial<AnyInnerParams>) => void;
}) {
	const controls = useComposerControls();
	const { setAllInners } = controls;
	const seeded = useRef(false);
	useEffect(() => {
		if (!seeded.current) {
			seeded.current = true;
			setAllInners(innerId);
		}
	}, [innerId, setAllInners]);

	const patchAllInnerParams = (p: Partial<AnyInnerParams>) => {
		patchSpy(p);
		controls.patchAllInnerParams(p);
	};

	return (
		<DesignPanel
			{...controls}
			patchAllInnerParams={patchAllInnerParams}
			onClose={() => {}}
		/>
	);
}

afterEach(() => {
	cleanup();
});

describe("PANEL-SBB - streaming-billboard controls", () => {
	it('Segmented "Glow" has exactly Crimson/Indigo/Ember, no more, no fewer', () => {
		render(<Host innerId="streaming-billboard" />);
		expect(screen.getByText("Glow")).toBeTruthy();
		expect(screen.getByRole("button", { name: "Crimson" })).toBeTruthy();
		expect(screen.getByRole("button", { name: "Indigo" })).toBeTruthy();
		expect(screen.getByRole("button", { name: "Ember" })).toBeTruthy();
	});

	it('Toggle "Badges" is bound to params.badges (default checked)', () => {
		render(<Host innerId="streaming-billboard" />);
		const toggle = screen.getByRole("switch", { name: "Badges" });
		expect(toggle.getAttribute("aria-checked")).toBe("true");
	});

	it('clicking "Indigo" calls patch({ glow: "indigo" }) exactly once, no other keys', () => {
		const spy = vi.fn();
		render(<Host innerId="streaming-billboard" patchSpy={spy} />);
		fireEvent.click(screen.getByRole("button", { name: "Indigo" }));
		expect(spy).toHaveBeenCalledWith({ glow: "indigo" });
		expect(spy).toHaveBeenCalledTimes(1);
	});

	it('clicking "Badges" calls patch({ badges: false }) exactly once, no other keys', () => {
		const spy = vi.fn();
		render(<Host innerId="streaming-billboard" patchSpy={spy} />);
		fireEvent.click(screen.getByRole("switch", { name: "Badges" }));
		expect(spy).toHaveBeenCalledWith({ badges: false });
		expect(spy).toHaveBeenCalledTimes(1);
	});
});

describe("PANEL-MPO - movie-poster controls", () => {
	it('Segmented "Art" has exactly Dusk/Neon/Noir, no more, no fewer', () => {
		render(<Host innerId="movie-poster" />);
		expect(screen.getByText("Art")).toBeTruthy();
		expect(screen.getByRole("button", { name: "Dusk" })).toBeTruthy();
		expect(screen.getByRole("button", { name: "Neon" })).toBeTruthy();
		expect(screen.getByRole("button", { name: "Noir" })).toBeTruthy();
	});

	it('Toggle "Billing block" is bound to params.billing (default checked)', () => {
		render(<Host innerId="movie-poster" />);
		const toggle = screen.getByRole("switch", { name: "Billing block" });
		expect(toggle.getAttribute("aria-checked")).toBe("true");
	});

	it('clicking "Neon" calls patch({ art: "neon" }) exactly once, no other keys', () => {
		const spy = vi.fn();
		render(<Host innerId="movie-poster" patchSpy={spy} />);
		fireEvent.click(screen.getByRole("button", { name: "Neon" }));
		expect(spy).toHaveBeenCalledWith({ art: "neon" });
		expect(spy).toHaveBeenCalledTimes(1);
	});

	it('clicking "Billing block" calls patch({ billing: false }) exactly once, no other keys', () => {
		const spy = vi.fn();
		render(<Host innerId="movie-poster" patchSpy={spy} />);
		fireEvent.click(screen.getByRole("switch", { name: "Billing block" }));
		expect(spy).toHaveBeenCalledWith({ billing: false });
		expect(spy).toHaveBeenCalledTimes(1);
	});
});

describe("PANEL-TPL - trailer-player controls", () => {
	it('Segmented "Skin" has exactly Onyx/Cinema/Slate, no more, no fewer', () => {
		render(<Host innerId="trailer-player" />);
		expect(screen.getByText("Skin")).toBeTruthy();
		expect(screen.getByRole("button", { name: "Onyx" })).toBeTruthy();
		expect(screen.getByRole("button", { name: "Cinema" })).toBeTruthy();
		expect(screen.getByRole("button", { name: "Slate" })).toBeTruthy();
	});

	it('Toggle "Controls" is bound to params.controls (default checked)', () => {
		render(<Host innerId="trailer-player" />);
		const toggle = screen.getByRole("switch", { name: "Controls" });
		expect(toggle.getAttribute("aria-checked")).toBe("true");
	});

	it('clicking "Cinema" calls patch({ skin: "cinema" }) exactly once, no other keys', () => {
		const spy = vi.fn();
		render(<Host innerId="trailer-player" patchSpy={spy} />);
		fireEvent.click(screen.getByRole("button", { name: "Cinema" }));
		expect(spy).toHaveBeenCalledWith({ skin: "cinema" });
		expect(spy).toHaveBeenCalledTimes(1);
	});

	it('clicking "Controls" calls patch({ controls: false }) exactly once, no other keys', () => {
		const spy = vi.fn();
		render(<Host innerId="trailer-player" patchSpy={spy} />);
		fireEvent.click(screen.getByRole("switch", { name: "Controls" }));
		expect(spy).toHaveBeenCalledWith({ controls: false });
		expect(spy).toHaveBeenCalledTimes(1);
	});
});

describe("PANEL-SCR - score-card controls", () => {
	it('Segmented "Verdict" has exactly Acclaimed/Fresh/Mixed, no more, no fewer', () => {
		render(<Host innerId="score-card" />);
		expect(screen.getByText("Verdict")).toBeTruthy();
		expect(screen.getByRole("button", { name: "Acclaimed" })).toBeTruthy();
		expect(screen.getByRole("button", { name: "Fresh" })).toBeTruthy();
		expect(screen.getByRole("button", { name: "Mixed" })).toBeTruthy();
	});

	it('Toggle "Consensus" is bound to params.consensus (default checked)', () => {
		render(<Host innerId="score-card" />);
		const toggle = screen.getByRole("switch", { name: "Consensus" });
		expect(toggle.getAttribute("aria-checked")).toBe("true");
	});

	it('clicking "Acclaimed" calls patch({ verdict: "acclaimed" }) exactly once, no other keys', () => {
		const spy = vi.fn();
		render(<Host innerId="score-card" patchSpy={spy} />);
		fireEvent.click(screen.getByRole("button", { name: "Acclaimed" }));
		expect(spy).toHaveBeenCalledWith({ verdict: "acclaimed" });
		expect(spy).toHaveBeenCalledTimes(1);
	});

	it('clicking "Consensus" calls patch({ consensus: false }) exactly once, no other keys', () => {
		const spy = vi.fn();
		render(<Host innerId="score-card" patchSpy={spy} />);
		fireEvent.click(screen.getByRole("switch", { name: "Consensus" }));
		expect(spy).toHaveBeenCalledWith({ consensus: false });
		expect(spy).toHaveBeenCalledTimes(1);
	});
});

describe("PANEL-LBX - letterbox controls", () => {
	it('Segmented "Grade" has exactly Silver/Amber/Teal, no more, no fewer', () => {
		render(<Host innerId="letterbox" />);
		expect(screen.getByText("Grade")).toBeTruthy();
		expect(screen.getByRole("button", { name: "Silver" })).toBeTruthy();
		expect(screen.getByRole("button", { name: "Amber" })).toBeTruthy();
		expect(screen.getByRole("button", { name: "Teal" })).toBeTruthy();
	});

	it('Toggle "Subtitles" is bound to params.subtitles (default checked)', () => {
		render(<Host innerId="letterbox" />);
		const toggle = screen.getByRole("switch", { name: "Subtitles" });
		expect(toggle.getAttribute("aria-checked")).toBe("true");
	});

	it('clicking "Amber" calls patch({ grade: "amber" }) exactly once, no other keys', () => {
		const spy = vi.fn();
		render(<Host innerId="letterbox" patchSpy={spy} />);
		fireEvent.click(screen.getByRole("button", { name: "Amber" }));
		expect(spy).toHaveBeenCalledWith({ grade: "amber" });
		expect(spy).toHaveBeenCalledTimes(1);
	});

	it('clicking "Subtitles" calls patch({ subtitles: false }) exactly once, no other keys', () => {
		const spy = vi.fn();
		render(<Host innerId="letterbox" patchSpy={spy} />);
		fireEvent.click(screen.getByRole("switch", { name: "Subtitles" }));
		expect(spy).toHaveBeenCalledWith({ subtitles: false });
		expect(spy).toHaveBeenCalledTimes(1);
	});
});

describe("PANEL-MTV - all five movies-tv candidates receive the shared Density control", () => {
	it.each([
		"streaming-billboard",
		"movie-poster",
		"trailer-player",
		"score-card",
		"letterbox",
	] as const)("%s's expanded row shows the Density Segmented", (id) => {
		render(<Host innerId={id} />);
		expect(screen.getByText("Density")).toBeTruthy();
		expect(screen.getByRole("button", { name: "Cozy" })).toBeTruthy();
		expect(screen.getByRole("button", { name: "Comfy" })).toBeTruthy();
		expect(screen.getByRole("button", { name: "Roomy" })).toBeTruthy();
	});
});
