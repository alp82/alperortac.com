// @vitest-environment jsdom

/*
 * DesignPanel - InsideSpecificControls coverage for the coding frames
 * (wayfinder plan-coding-frames). Milestone 1 slice: the terminal panel case
 * only, unchanged by the restyle - these are regression pins. Milestone 2
 * adds code-editor/pull-request, milestone 3 adds commit-graph/man-page, and
 * milestone 4 (final) adds keycaps plus the fresh-defaults "no custom dot"
 * sweep guard.
 *
 * Harness copied from DesignPanel.ephemera.test.tsx: `Host` seeds every
 * topic's cluster onto one inner id via `setAllInners`, then asserts on the
 * rendered Segmented/Toggle controls and the exact `patch()` calls they fire.
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

/** Renders DesignPanel straight off useComposerControls' own defaults - no
 * seeding - for the fresh-state "no custom dot" guard (TC-PANEL-6). Copied
 * from DesignPanel.ephemera.test.tsx's FreshHost. */
function FreshHost() {
	const controls = useComposerControls();
	return <DesignPanel {...controls} onClose={() => {}} />;
}

afterEach(() => {
	cleanup();
});

describe("PANEL-TM - terminal controls (regression, unchanged by the restyle)", () => {
	it('TC-PANEL-TM-1: Segmented "Scheme" has exactly Midnight/Matrix/Amber/Ice, no more, no fewer', () => {
		render(<Host innerId="terminal" />);
		expect(screen.getByText("Scheme")).toBeTruthy();
		expect(screen.getByRole("button", { name: "Midnight" })).toBeTruthy();
		expect(screen.getByRole("button", { name: "Matrix" })).toBeTruthy();
		expect(screen.getByRole("button", { name: "Amber" })).toBeTruthy();
		expect(screen.getByRole("button", { name: "Ice" })).toBeTruthy();
	});

	it("TC-PANEL-TM-2: no cursor Toggle renders for terminal (still locked on)", () => {
		render(<Host innerId="terminal" />);
		expect(screen.queryByRole("switch", { name: /cursor/i })).toBeNull();
	});

	it('TC-PANEL-TM-3: clicking "Amber" calls patch({ scheme: "amber" }) exactly once, no other keys', () => {
		const spy = vi.fn();
		render(<Host innerId="terminal" patchSpy={spy} />);
		fireEvent.click(screen.getByRole("button", { name: "Amber" }));
		expect(spy).toHaveBeenCalledWith({ scheme: "amber" });
		expect(spy).toHaveBeenCalledTimes(1);
	});
});

/*
 * Milestone 2 slice - the two new IDE frames' panel cases (code-editor,
 * pull-request), section 13 of the test-plan artifact. Authored red: neither
 * id exists in INNER_ORDER/INNERS yet, so `setAllInners` throws reading
 * `INNERS[id].defaults` before the panel ever mounts a row for it.
 */

describe("PANEL-CE - code-editor controls", () => {
	it('TC-PANEL-1: Segmented "Theme" has exactly One Dark/Nord/Monokai, no more, no fewer', () => {
		render(<Host innerId="code-editor" />);
		expect(screen.getByText("Theme")).toBeTruthy();
		expect(screen.getByRole("button", { name: "One Dark" })).toBeTruthy();
		expect(screen.getByRole("button", { name: "Nord" })).toBeTruthy();
		expect(screen.getByRole("button", { name: "Monokai" })).toBeTruthy();
	});

	it('TC-PANEL-2: Toggle "Line numbers" is bound to params.gutter (default checked)', () => {
		render(<Host innerId="code-editor" />);
		const toggle = screen.getByRole("switch", { name: "Line numbers" });
		expect(toggle.getAttribute("aria-checked")).toBe("true");
	});

	it('TC-PANEL-3: clicking "Nord" calls patch({ theme: "nord" }) exactly once, no other keys', () => {
		const spy = vi.fn();
		render(<Host innerId="code-editor" patchSpy={spy} />);
		fireEvent.click(screen.getByRole("button", { name: "Nord" }));
		expect(spy).toHaveBeenCalledWith({ theme: "nord" });
		expect(spy).toHaveBeenCalledTimes(1);
	});

	it('TC-PANEL-4: clicking "Line numbers" calls patch({ gutter: false }) exactly once, no other keys', () => {
		const spy = vi.fn();
		render(<Host innerId="code-editor" patchSpy={spy} />);
		fireEvent.click(screen.getByRole("switch", { name: "Line numbers" }));
		expect(spy).toHaveBeenCalledWith({ gutter: false });
		expect(spy).toHaveBeenCalledTimes(1);
	});
});

describe("PANEL-PR - pull-request controls", () => {
	it('TC-PANEL-1: Segmented "State" has exactly Open/Merged/Draft, no more, no fewer', () => {
		render(<Host innerId="pull-request" />);
		expect(screen.getByText("State")).toBeTruthy();
		expect(screen.getByRole("button", { name: "Open" })).toBeTruthy();
		expect(screen.getByRole("button", { name: "Merged" })).toBeTruthy();
		expect(screen.getByRole("button", { name: "Draft" })).toBeTruthy();
	});

	it('TC-PANEL-2: Toggle "CI checks" is bound to params.checks (default checked)', () => {
		render(<Host innerId="pull-request" />);
		const toggle = screen.getByRole("switch", { name: "CI checks" });
		expect(toggle.getAttribute("aria-checked")).toBe("true");
	});

	it('TC-PANEL-3: clicking "Open" calls patch({ state: "open" }) exactly once, no other keys', () => {
		const spy = vi.fn();
		render(<Host innerId="pull-request" patchSpy={spy} />);
		fireEvent.click(screen.getByRole("button", { name: "Open" }));
		expect(spy).toHaveBeenCalledWith({ state: "open" });
		expect(spy).toHaveBeenCalledTimes(1);
	});

	it('TC-PANEL-4: clicking "CI checks" calls patch({ checks: false }) exactly once, no other keys', () => {
		const spy = vi.fn();
		render(<Host innerId="pull-request" patchSpy={spy} />);
		fireEvent.click(screen.getByRole("switch", { name: "CI checks" }));
		expect(spy).toHaveBeenCalledWith({ checks: false });
		expect(spy).toHaveBeenCalledTimes(1);
	});
});

describe("PANEL-CODING - both M2 frames also receive the shared Density control", () => {
	it.each([
		"code-editor",
		"pull-request",
	] as const)("TC-PANEL-5: %s's expanded row shows the Density Segmented", (id) => {
		render(<Host innerId={id} />);
		expect(screen.getByText("Density")).toBeTruthy();
		expect(screen.getByRole("button", { name: "Cozy" })).toBeTruthy();
		expect(screen.getByRole("button", { name: "Comfy" })).toBeTruthy();
		expect(screen.getByRole("button", { name: "Roomy" })).toBeTruthy();
	});
});

/*
 * Milestone 3 slice - the version-control/retro pair's panel cases
 * (commit-graph, man-page). Authored red: neither id exists in
 * INNER_ORDER/INNERS yet, so `setAllInners` throws reading
 * `INNERS[id].defaults` before the panel ever mounts a row for it.
 */

describe("PANEL-CG - commit-graph controls", () => {
	it('TC-PANEL-1: Segmented "Stock" has exactly White/Cream/Mist, no more, no fewer', () => {
		render(<Host innerId="commit-graph" />);
		expect(screen.getByText("Stock")).toBeTruthy();
		expect(screen.getByRole("button", { name: "White" })).toBeTruthy();
		expect(screen.getByRole("button", { name: "Cream" })).toBeTruthy();
		expect(screen.getByRole("button", { name: "Mist" })).toBeTruthy();
	});

	it('TC-PANEL-2: Toggle "Ref chips" is bound to params.refs (default checked)', () => {
		render(<Host innerId="commit-graph" />);
		const toggle = screen.getByRole("switch", { name: "Ref chips" });
		expect(toggle.getAttribute("aria-checked")).toBe("true");
	});

	it('TC-PANEL-3: clicking "Cream" calls patch({ stock: "cream" }) exactly once, no other keys', () => {
		const spy = vi.fn();
		render(<Host innerId="commit-graph" patchSpy={spy} />);
		fireEvent.click(screen.getByRole("button", { name: "Cream" }));
		expect(spy).toHaveBeenCalledWith({ stock: "cream" });
		expect(spy).toHaveBeenCalledTimes(1);
	});

	it('TC-PANEL-4: clicking "Ref chips" calls patch({ refs: false }) exactly once, no other keys', () => {
		const spy = vi.fn();
		render(<Host innerId="commit-graph" patchSpy={spy} />);
		fireEvent.click(screen.getByRole("switch", { name: "Ref chips" }));
		expect(spy).toHaveBeenCalledWith({ refs: false });
		expect(spy).toHaveBeenCalledTimes(1);
	});
});

describe("PANEL-MP - man-page controls", () => {
	it('TC-PANEL-1: Segmented "Stock" has exactly White/Greenbar/Aged, no more, no fewer', () => {
		render(<Host innerId="man-page" />);
		expect(screen.getByText("Stock")).toBeTruthy();
		expect(screen.getByRole("button", { name: "White" })).toBeTruthy();
		expect(screen.getByRole("button", { name: "Greenbar" })).toBeTruthy();
		expect(screen.getByRole("button", { name: "Aged" })).toBeTruthy();
	});

	it('TC-PANEL-2: Toggle "Tractor feed" is bound to params.tractor (default checked)', () => {
		render(<Host innerId="man-page" />);
		const toggle = screen.getByRole("switch", { name: "Tractor feed" });
		expect(toggle.getAttribute("aria-checked")).toBe("true");
	});

	it('TC-PANEL-3: clicking "Aged" calls patch({ stock: "aged" }) exactly once, no other keys', () => {
		const spy = vi.fn();
		render(<Host innerId="man-page" patchSpy={spy} />);
		fireEvent.click(screen.getByRole("button", { name: "Aged" }));
		expect(spy).toHaveBeenCalledWith({ stock: "aged" });
		expect(spy).toHaveBeenCalledTimes(1);
	});

	it('TC-PANEL-4: clicking "Tractor feed" calls patch({ tractor: false }) exactly once, no other keys', () => {
		const spy = vi.fn();
		render(<Host innerId="man-page" patchSpy={spy} />);
		fireEvent.click(screen.getByRole("switch", { name: "Tractor feed" }));
		expect(spy).toHaveBeenCalledWith({ tractor: false });
		expect(spy).toHaveBeenCalledTimes(1);
	});
});

describe("PANEL-CODING-M3 - both M3 frames also receive the shared Density control", () => {
	it.each([
		"commit-graph",
		"man-page",
	] as const)("TC-PANEL-5: %s's expanded row shows the Density Segmented", (id) => {
		render(<Host innerId={id} />);
		expect(screen.getByText("Density")).toBeTruthy();
		expect(screen.getByRole("button", { name: "Cozy" })).toBeTruthy();
		expect(screen.getByRole("button", { name: "Comfy" })).toBeTruthy();
		expect(screen.getByRole("button", { name: "Roomy" })).toBeTruthy();
	});
});

/*
 * Milestone 4 slice (final) - keycaps' panel case, the last of the coding
 * frames' panel cases. Authored red: "keycaps" doesn't exist in
 * INNER_ORDER/INNERS yet, so `setAllInners` throws reading
 * `INNERS["keycaps"].defaults` before the panel ever mounts a row for it.
 */

describe("PANEL-KC - keycaps controls", () => {
	it('TC-PANEL-1: Segmented "Colorway" has exactly Beige/Graphite/Milkshake, no more, no fewer', () => {
		render(<Host innerId="keycaps" />);
		expect(screen.getByText("Colorway")).toBeTruthy();
		expect(screen.getByRole("button", { name: "Beige" })).toBeTruthy();
		expect(screen.getByRole("button", { name: "Graphite" })).toBeTruthy();
		expect(screen.getByRole("button", { name: "Milkshake" })).toBeTruthy();
	});

	it('TC-PANEL-2: Toggle "Backlight" is bound to params.backlight (default checked)', () => {
		render(<Host innerId="keycaps" />);
		const toggle = screen.getByRole("switch", { name: "Backlight" });
		expect(toggle.getAttribute("aria-checked")).toBe("true");
	});

	it('TC-PANEL-3: clicking "Graphite" calls patch({ colorway: "graphite" }) exactly once, no other keys', () => {
		const spy = vi.fn();
		render(<Host innerId="keycaps" patchSpy={spy} />);
		fireEvent.click(screen.getByRole("button", { name: "Graphite" }));
		expect(spy).toHaveBeenCalledWith({ colorway: "graphite" });
		expect(spy).toHaveBeenCalledTimes(1);
	});

	it('TC-PANEL-4: clicking "Backlight" calls patch({ backlight: false }) exactly once, no other keys', () => {
		const spy = vi.fn();
		render(<Host innerId="keycaps" patchSpy={spy} />);
		fireEvent.click(screen.getByRole("switch", { name: "Backlight" }));
		expect(spy).toHaveBeenCalledWith({ backlight: false });
		expect(spy).toHaveBeenCalledTimes(1);
	});

	it("keycaps' expanded row shows the Density Segmented, same as every other coding frame", () => {
		render(<Host innerId="keycaps" />);
		expect(screen.getByText("Density")).toBeTruthy();
		expect(screen.getByRole("button", { name: "Cozy" })).toBeTruthy();
		expect(screen.getByRole("button", { name: "Comfy" })).toBeTruthy();
		expect(screen.getByRole("button", { name: "Roomy" })).toBeTruthy();
	});
});

describe("PANEL-SCOPE - fresh defaults show no custom dot (final coding sweep)", () => {
	it("TC-PANEL-6 (final): a fresh DesignPanel render shows no custom (●) dot on any topic chip - Coding is locked to pull-request in identities.ts; pins that no default accidentally swapped", () => {
		render(<FreshHost />);
		expect(screen.queryAllByText("●")).toHaveLength(0);
	});
});
