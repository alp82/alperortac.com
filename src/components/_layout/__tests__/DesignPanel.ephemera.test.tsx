// @vitest-environment jsdom

/*
 * DesignPanel - InsideSpecificControls coverage for the four new ephemera
 * frames (wayfinder plan-four-ephemera-frames, section I).
 *
 * `InsideSpecificControls` isn't exported, so these tests drive it through
 * the real `DesignPanel` + `useComposerControls` hook, the same wiring
 * `_layout` uses in production: a small `Host` seeds every topic's cluster
 * onto one ephemera id via `setAllInners` (so the "all" scope's representative
 * topic's params drive the visible controls), then asserts on the rendered
 * Segmented/Toggle controls and the exact `patch()` calls they fire.
 *
 * Authored red: `INNER_ORDER` doesn't contain any of the four ids yet, so
 * `setAllInners` throws reading `INNERS[id].defaults` before the panel ever
 * mounts a row for it - every case below fails until Milestone 0-4 land.
 */

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { useEffect, useRef } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { AnyInnerParams, InnerId } from "../composer/types";
import { useComposerControls } from "../composer/useComposerControls";
import { DesignPanel } from "../DesignPanel";

/** Renders the real DesignPanel wired to a fresh useComposerControls() with
 * no mutation - used to guard the fresh-load (pure-defaults) rendering. */
function FreshHost() {
	const controls = useComposerControls();
	return <DesignPanel {...controls} onClose={() => {}} />;
}

const EPHEMERA_IDS = [
	"timecard",
	"nameplate",
	"punch-card",
	"offer-letter",
] as const;

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

describe("I1 - timecard controls", () => {
	it('Segmented "Stock" has exactly Manila/Buff/Ledger', () => {
		render(<Host innerId="timecard" />);
		expect(screen.getByText("Stock")).toBeTruthy();
		expect(screen.getByRole("button", { name: "Manila" })).toBeTruthy();
		expect(screen.getByRole("button", { name: "Buff" })).toBeTruthy();
		expect(screen.getByRole("button", { name: "Ledger" })).toBeTruthy();
		expect(screen.queryByRole("button", { name: "Salmon" })).toBeNull();
		expect(screen.queryByRole("button", { name: "Mint" })).toBeNull();
	});

	it('Toggle "Time stamps" is bound to params.stamps', () => {
		render(<Host innerId="timecard" />);
		const toggle = screen.getByRole("switch", { name: "Time stamps" });
		expect(toggle.getAttribute("aria-checked")).toBe("true");
	});

	it('I5/I6 - "Stock" Segmented calls patch({ stock: <value> }) only', () => {
		const spy = vi.fn();
		render(<Host innerId="timecard" patchSpy={spy} />);
		fireEvent.click(screen.getByRole("button", { name: "Buff" }));
		expect(spy).toHaveBeenCalledWith({ stock: "buff" });
		expect(spy).toHaveBeenCalledTimes(1);
	});

	it('I5/I6 - "Time stamps" Toggle calls patch({ stamps: <value> }) only', () => {
		const spy = vi.fn();
		render(<Host innerId="timecard" patchSpy={spy} />);
		fireEvent.click(screen.getByRole("switch", { name: "Time stamps" }));
		expect(spy).toHaveBeenCalledWith({ stamps: false });
		expect(spy).toHaveBeenCalledTimes(1);
	});
});

describe("I2 - nameplate controls", () => {
	it('I2-1 - Segmented "Role" has exactly Title/Tenure/Focus', () => {
		render(<Host innerId="nameplate" />);
		expect(screen.getByText("Role")).toBeTruthy();
		expect(screen.getByRole("button", { name: "Title" })).toBeTruthy();
		expect(screen.getByRole("button", { name: "Tenure" })).toBeTruthy();
		expect(screen.getByRole("button", { name: "Focus" })).toBeTruthy();
	});

	it("I2-1b - none of the retired badge controls survive (no Ribbon, Speaker/Staff/VIP, or Lanyard clip)", () => {
		render(<Host innerId="nameplate" />);
		expect(screen.queryByText("Ribbon")).toBeNull();
		expect(screen.queryByRole("button", { name: "Speaker" })).toBeNull();
		expect(screen.queryByRole("button", { name: "Staff" })).toBeNull();
		expect(screen.queryByRole("button", { name: "VIP" })).toBeNull();
		expect(screen.queryByRole("switch", { name: "Lanyard clip" })).toBeNull();
	});

	it('I2-2 - Toggle "Screws" is bound to params.screws (default checked)', () => {
		render(<Host innerId="nameplate" />);
		const toggle = screen.getByRole("switch", { name: "Screws" });
		expect(toggle.getAttribute("aria-checked")).toBe("true");
	});

	it('I2-3 - clicking "Tenure" calls patch({ role: "tenure" }) exactly once, no other keys', () => {
		const spy = vi.fn();
		render(<Host innerId="nameplate" patchSpy={spy} />);
		fireEvent.click(screen.getByRole("button", { name: "Tenure" }));
		expect(spy).toHaveBeenCalledWith({ role: "tenure" });
		expect(spy).toHaveBeenCalledTimes(1);
	});

	it('I2-4 - clicking "Screws" calls patch({ screws: false }) exactly once, no other keys', () => {
		const spy = vi.fn();
		render(<Host innerId="nameplate" patchSpy={spy} />);
		fireEvent.click(screen.getByRole("switch", { name: "Screws" }));
		expect(spy).toHaveBeenCalledWith({ screws: false });
		expect(spy).toHaveBeenCalledTimes(1);
	});

	it('I2-5 - "Focus" -> patch({ role: "focus" }); "Title" -> patch({ role: "title" })', () => {
		const spy = vi.fn();
		render(<Host innerId="nameplate" patchSpy={spy} />);
		fireEvent.click(screen.getByRole("button", { name: "Focus" }));
		expect(spy).toHaveBeenCalledWith({ role: "focus" });
		fireEvent.click(screen.getByRole("button", { name: "Title" }));
		expect(spy).toHaveBeenCalledWith({ role: "title" });
	});
});

describe("I3 - punch-card controls", () => {
	it('Segmented "Stock" has exactly Manila/Salmon/Mint', () => {
		render(<Host innerId="punch-card" />);
		expect(screen.getByText("Stock")).toBeTruthy();
		expect(screen.getByRole("button", { name: "Manila" })).toBeTruthy();
		expect(screen.getByRole("button", { name: "Salmon" })).toBeTruthy();
		expect(screen.getByRole("button", { name: "Mint" })).toBeTruthy();
		expect(screen.queryByRole("button", { name: "Buff" })).toBeNull();
		expect(screen.queryByRole("button", { name: "Ledger" })).toBeNull();
	});

	it('Toggle "Punched holes" is bound to params.holes', () => {
		render(<Host innerId="punch-card" />);
		const toggle = screen.getByRole("switch", { name: "Punched holes" });
		expect(toggle.getAttribute("aria-checked")).toBe("true");
	});

	it('I5/I6 - "Stock" Segmented calls patch({ stock: <value> }) only', () => {
		const spy = vi.fn();
		render(<Host innerId="punch-card" patchSpy={spy} />);
		fireEvent.click(screen.getByRole("button", { name: "Salmon" }));
		expect(spy).toHaveBeenCalledWith({ stock: "salmon" });
		expect(spy).toHaveBeenCalledTimes(1);
	});

	it('I5/I6 - "Punched holes" Toggle calls patch({ holes: <value> }) only', () => {
		const spy = vi.fn();
		render(<Host innerId="punch-card" patchSpy={spy} />);
		fireEvent.click(screen.getByRole("switch", { name: "Punched holes" }));
		expect(spy).toHaveBeenCalledWith({ holes: false });
		expect(spy).toHaveBeenCalledTimes(1);
	});
});

describe("I4 - offer-letter controls", () => {
	it('Segmented "Stock" has exactly Cream/Ivory/Dove', () => {
		render(<Host innerId="offer-letter" />);
		expect(screen.getByText("Stock")).toBeTruthy();
		expect(screen.getByRole("button", { name: "Cream" })).toBeTruthy();
		expect(screen.getByRole("button", { name: "Ivory" })).toBeTruthy();
		expect(screen.getByRole("button", { name: "Dove" })).toBeTruthy();
	});

	it('Toggle "Signature" is bound to params.scrawl', () => {
		render(<Host innerId="offer-letter" />);
		const toggle = screen.getByRole("switch", { name: "Signature" });
		expect(toggle.getAttribute("aria-checked")).toBe("true");
	});

	it('I5/I6 - "Stock" Segmented calls patch({ stock: <value> }) only', () => {
		const spy = vi.fn();
		render(<Host innerId="offer-letter" patchSpy={spy} />);
		fireEvent.click(screen.getByRole("button", { name: "Ivory" }));
		expect(spy).toHaveBeenCalledWith({ stock: "ivory" });
		expect(spy).toHaveBeenCalledTimes(1);
	});

	it('I5/I6 - "Signature" Toggle calls patch({ scrawl: <value> }) only', () => {
		const spy = vi.fn();
		render(<Host innerId="offer-letter" patchSpy={spy} />);
		fireEvent.click(screen.getByRole("switch", { name: "Signature" }));
		expect(spy).toHaveBeenCalledWith({ scrawl: false });
		expect(spy).toHaveBeenCalledTimes(1);
	});
});

describe("I7 - all four still receive the shared Density control", () => {
	it.each(
		EPHEMERA_IDS,
	)("%s's expanded row shows the Density Segmented", (id) => {
		render(<Host innerId={id} />);
		expect(screen.getByText("Density")).toBeTruthy();
		expect(screen.getByRole("button", { name: "Cozy" })).toBeTruthy();
		expect(screen.getByRole("button", { name: "Comfy" })).toBeTruthy();
		expect(screen.getByRole("button", { name: "Roomy" })).toBeTruthy();
	});
});

describe("fresh defaults show no custom dot (wayfinder plan-career-nameplate-lock)", () => {
	it("a fresh DesignPanel render shows no topic chip carrying the custom (●) indicator, including Career", () => {
		// Load-bearing: at pure defaults every topic - including Career, now
		// locked to the nameplate frame - must read as "not customized" against
		// the IDENTITIES registry baseline, not the old factory DEFAULT_INNER.
		// A stale `isCustom` comparison would light Career's dot on a fresh load.
		render(<FreshHost />);
		expect(screen.queryAllByText("●")).toHaveLength(0);
	});
});
