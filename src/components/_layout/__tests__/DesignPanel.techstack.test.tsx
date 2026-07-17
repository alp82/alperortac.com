// @vitest-environment jsdom

/*
 * DesignPanel - InsideSpecificControls coverage for the tech-stack candidate
 * frames (wayfinder #13): server-rack, status-page, cargo-container. The two
 * restored shortlist frames (blueprint, circuit-board) keep their original
 * panel cases and are pinned here only via the shared Density sweep, since
 * their control wiring predates this round unchanged.
 *
 * Harness copied from DesignPanel.coding.test.tsx: `Host` seeds every
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

afterEach(() => {
	cleanup();
});

describe("PANEL-SR - server-rack controls", () => {
	it('Segmented "Finish" has exactly Graphite/Steel/Midnight, no more, no fewer', () => {
		render(<Host innerId="server-rack" />);
		expect(screen.getByText("Finish")).toBeTruthy();
		expect(screen.getByRole("button", { name: "Graphite" })).toBeTruthy();
		expect(screen.getByRole("button", { name: "Steel" })).toBeTruthy();
		expect(screen.getByRole("button", { name: "Midnight" })).toBeTruthy();
	});

	it('Toggle "Status LEDs" is bound to params.leds (default checked)', () => {
		render(<Host innerId="server-rack" />);
		const toggle = screen.getByRole("switch", { name: "Status LEDs" });
		expect(toggle.getAttribute("aria-checked")).toBe("true");
	});

	it('clicking "Steel" calls patch({ finish: "steel" }) exactly once, no other keys', () => {
		const spy = vi.fn();
		render(<Host innerId="server-rack" patchSpy={spy} />);
		fireEvent.click(screen.getByRole("button", { name: "Steel" }));
		expect(spy).toHaveBeenCalledWith({ finish: "steel" });
		expect(spy).toHaveBeenCalledTimes(1);
	});

	it('clicking "Status LEDs" calls patch({ leds: false }) exactly once, no other keys', () => {
		const spy = vi.fn();
		render(<Host innerId="server-rack" patchSpy={spy} />);
		fireEvent.click(screen.getByRole("switch", { name: "Status LEDs" }));
		expect(spy).toHaveBeenCalledWith({ leds: false });
		expect(spy).toHaveBeenCalledTimes(1);
	});
});

describe("PANEL-SP - status-page controls", () => {
	it('Segmented "Status" has exactly Stable/Degraded/Maint, no more, no fewer', () => {
		render(<Host innerId="status-page" />);
		expect(screen.getByText("Status")).toBeTruthy();
		expect(screen.getByRole("button", { name: "Stable" })).toBeTruthy();
		expect(screen.getByRole("button", { name: "Degraded" })).toBeTruthy();
		expect(screen.getByRole("button", { name: "Maint" })).toBeTruthy();
	});

	it('Toggle "Uptime bars" is bound to params.bars (default checked)', () => {
		render(<Host innerId="status-page" />);
		const toggle = screen.getByRole("switch", { name: "Uptime bars" });
		expect(toggle.getAttribute("aria-checked")).toBe("true");
	});

	it('clicking "Degraded" calls patch({ status: "degraded" }) exactly once, no other keys', () => {
		const spy = vi.fn();
		render(<Host innerId="status-page" patchSpy={spy} />);
		fireEvent.click(screen.getByRole("button", { name: "Degraded" }));
		expect(spy).toHaveBeenCalledWith({ status: "degraded" });
		expect(spy).toHaveBeenCalledTimes(1);
	});

	it('clicking "Uptime bars" calls patch({ bars: false }) exactly once, no other keys', () => {
		const spy = vi.fn();
		render(<Host innerId="status-page" patchSpy={spy} />);
		fireEvent.click(screen.getByRole("switch", { name: "Uptime bars" }));
		expect(spy).toHaveBeenCalledWith({ bars: false });
		expect(spy).toHaveBeenCalledTimes(1);
	});
});

describe("PANEL-CC - cargo-container controls", () => {
	it('Segmented "Livery" has exactly Rust/Ocean/Forest, no more, no fewer', () => {
		render(<Host innerId="cargo-container" />);
		expect(screen.getByText("Livery")).toBeTruthy();
		expect(screen.getByRole("button", { name: "Rust" })).toBeTruthy();
		expect(screen.getByRole("button", { name: "Ocean" })).toBeTruthy();
		expect(screen.getByRole("button", { name: "Forest" })).toBeTruthy();
	});

	it('Toggle "Corrugation" is bound to params.corrugation (default checked)', () => {
		render(<Host innerId="cargo-container" />);
		const toggle = screen.getByRole("switch", { name: "Corrugation" });
		expect(toggle.getAttribute("aria-checked")).toBe("true");
	});

	it('clicking "Ocean" calls patch({ livery: "ocean" }) exactly once, no other keys', () => {
		const spy = vi.fn();
		render(<Host innerId="cargo-container" patchSpy={spy} />);
		fireEvent.click(screen.getByRole("button", { name: "Ocean" }));
		expect(spy).toHaveBeenCalledWith({ livery: "ocean" });
		expect(spy).toHaveBeenCalledTimes(1);
	});

	it('clicking "Corrugation" calls patch({ corrugation: false }) exactly once, no other keys', () => {
		const spy = vi.fn();
		render(<Host innerId="cargo-container" patchSpy={spy} />);
		fireEvent.click(screen.getByRole("switch", { name: "Corrugation" }));
		expect(spy).toHaveBeenCalledWith({ corrugation: false });
		expect(spy).toHaveBeenCalledTimes(1);
	});
});

describe("PANEL-TS - all five tech-stack candidates receive the shared Density control", () => {
	it.each([
		"blueprint",
		"circuit-board",
		"server-rack",
		"status-page",
		"cargo-container",
	] as const)("%s's expanded row shows the Density Segmented", (id) => {
		render(<Host innerId={id} />);
		expect(screen.getByText("Density")).toBeTruthy();
		expect(screen.getByRole("button", { name: "Cozy" })).toBeTruthy();
		expect(screen.getByRole("button", { name: "Comfy" })).toBeTruthy();
		expect(screen.getByRole("button", { name: "Roomy" })).toBeTruthy();
	});
});
