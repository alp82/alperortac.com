// @vitest-environment jsdom

/*
 * TravelGlobe orchestrator tests (#travel-globe-subpage).
 *
 * The matchMedia stub is installed BEFORE every mount (mirrors
 * PersonalPanel.test.tsx / ProjectPanel.test.tsx's reduced-motion case).
 *
 * Two module-boundary doubles:
 *
 *  - "../MapboxGlobe" is mocked with a factory that flips a flag if it is
 *    ever EVALUATED (loaded), proving the mapbox-gl chunk never touches jsdom
 *    (which has no WebGL, so TravelGlobe must always resolve to the SVG
 *    fallback here).
 *  - "../worldData" is partially mocked via importOriginal: loadWorld is
 *    wrapped in a vi.fn() so call counts are observable (mirrors TC-PP-07's
 *    preload-gating idiom), while the REAL implementation still runs so the
 *    interaction tests (France/Japan/UK/Grenada/Croatia) exercise real
 *    world-atlas data and real travel.ts names.
 */

import {
	cleanup,
	fireEvent,
	render,
	screen,
	waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { stubMatchMedia } from "../../../../test/stubMatchMedia";
import { TravelGlobe } from "../TravelGlobe";

const mapboxGlobeEvaluated = vi.hoisted(() => ({ value: false }));
// Controls whether the mocked MapboxGlobe throws on render - flipped only by
// the renderer-error-boundary case below; default false leaves every other
// test's behavior (a no-op renderer) unchanged.
const mapboxGlobeBehavior = vi.hoisted(() => ({ throwOnRender: false }));

vi.mock("../MapboxGlobe", () => {
	mapboxGlobeEvaluated.value = true;
	return {
		default: () => {
			if (mapboxGlobeBehavior.throwOnRender) {
				throw new Error("boom: MapboxGlobe render failure");
			}
			return null;
		},
	};
});

vi.mock("../worldData", async (importOriginal) => {
	const actual = await importOriginal<typeof import("../worldData")>();
	return {
		...actual,
		loadWorld: vi.fn(actual.loadWorld),
	};
});

// Mocked so the renderer-error-boundary case can force mode="mapbox" without a
// real WebGL context; every other test relies on jsdom's real (false) result
// anyway, so the default return value here preserves prior behavior. (The
// Mapbox token is present in the test env, so webglAvailable is the only gate
// these tests need to flip.)
vi.mock("../webglSupport", () => ({
	webglAvailable: vi.fn(() => false),
}));

import { webglAvailable } from "../webglSupport";
import { loadWorld } from "../worldData";

async function findByDataName(
	container: HTMLElement,
	name: string,
): Promise<Element> {
	return waitFor(() => {
		const el = container.querySelector(`[data-name="${name}"]`);
		expect(el, `Missing element for data-name="${name}"`).not.toBeNull();
		return el as Element;
	});
}

describe("TravelGlobe (#travel-globe-subpage)", () => {
	beforeEach(() => {
		stubMatchMedia(false);
		mapboxGlobeEvaluated.value = false;
		mapboxGlobeBehavior.throwOnRender = false;
		vi.mocked(loadWorld).mockClear();
		vi.mocked(webglAvailable).mockReset().mockReturnValue(false);
	});

	afterEach(() => {
		cleanup();
		vi.unstubAllGlobals();
		vi.restoreAllMocks();
	});

	// M1 spine

	// TC-TG-01
	it("active={true} renders the SVG fallback: a France path appears", async () => {
		const { container } = render(<TravelGlobe active={true} />);
		const path = await findByDataName(container, "France");
		expect(path.tagName.toLowerCase()).toBe("path");

		const d = path.getAttribute("d");
		expect(d).toBeTruthy();
		expect(d).toMatch(/\d/); // real projected coordinates, not empty/degenerate
	});

	// TC-TG-02
	it("never evaluates the MapboxGlobe module in jsdom, and renders zero <canvas>", async () => {
		const { container } = render(<TravelGlobe active={true} />);
		await findByDataName(container, "France");
		expect(mapboxGlobeEvaluated.value).toBe(false);
		expect(container.querySelectorAll("canvas").length).toBe(0);
	});

	// TC-TG-03
	it("active={false} mount performs NO world-data load", () => {
		render(<TravelGlobe active={false} />);
		expect(vi.mocked(loadWorld)).not.toHaveBeenCalled();
	});

	// TC-TG-04
	it("activating (false -> true) calls loadWorld exactly once", async () => {
		const { rerender } = render(<TravelGlobe active={false} />);
		expect(vi.mocked(loadWorld)).not.toHaveBeenCalled();

		rerender(<TravelGlobe active={true} />);

		await waitFor(() => {
			expect(vi.mocked(loadWorld)).toHaveBeenCalledTimes(1);
		});
	});

	// TC-TG-05
	it("true -> false -> true keeps loadWorld's call count unchanged from first activation (hasActivatedRef)", async () => {
		const { rerender } = render(<TravelGlobe active={true} />);
		await waitFor(() => {
			expect(vi.mocked(loadWorld)).toHaveBeenCalledTimes(1);
		});

		rerender(<TravelGlobe active={false} />);
		rerender(<TravelGlobe active={true} />);

		expect(vi.mocked(loadWorld)).toHaveBeenCalledTimes(1);
	});

	// TC-TG-06
	it("active={false} renders only the static shell, with no [data-name] elements", () => {
		const { container } = render(<TravelGlobe active={false} />);
		expect(container.querySelectorAll("[data-name]").length).toBe(0);
	});

	// M2 interaction/card

	// TC-TG-07
	it("renders a Grenada stamp dot after world data resolves", async () => {
		const { container } = render(<TravelGlobe active={true} />);
		await findByDataName(container, "Grenada");
	});

	// TC-TG-08
	it("clicking the Grenada stamp dot opens the MemoryCard for Grenada", async () => {
		const { container } = render(<TravelGlobe active={true} />);
		const dot = await findByDataName(container, "Grenada");

		fireEvent.click(dot);

		expect(await screen.findByText("Visited")).not.toBeNull();
		expect(screen.getByText("Grenada")).not.toBeNull();
	});

	// TC-TG-09
	it('clicking France shows a "Visited" card titled France with a placeholder memory line', async () => {
		const { container } = render(<TravelGlobe active={true} />);
		const france = await findByDataName(container, "France");

		fireEvent.click(france);

		expect(await screen.findByText("Visited")).not.toBeNull();
		expect(screen.getByText("France")).not.toBeNull();
		expect(screen.getByText(/a line of memory/i)).not.toBeNull();
	});

	// TC-TG-10
	it("the card's close control (accessible name /close/i) dismisses it", async () => {
		const { container } = render(<TravelGlobe active={true} />);
		const france = await findByDataName(container, "France");
		fireEvent.click(france);
		await screen.findByText("France");

		const closeButton = screen.getByRole("button", { name: /close/i });
		fireEvent.click(closeButton);

		expect(screen.queryByText("France")).toBeNull();
	});

	// TC-TG-11
	it('clicking Japan (path or beacon) shows a "Next leg" card titled Japan', async () => {
		const { container } = render(<TravelGlobe active={true} />);
		const japan = await findByDataName(container, "Japan");

		fireEvent.click(japan);

		expect(await screen.findByText("Next leg")).not.toBeNull();
		expect(screen.getByText("Japan")).not.toBeNull();
	});

	// TC-TG-12
	it('clicking United Kingdom shows a card titled "United Kingdom & Scotland"', async () => {
		const { container } = render(<TravelGlobe active={true} />);
		const uk = await findByDataName(container, "United Kingdom");

		fireEvent.click(uk);

		expect(await screen.findByText("United Kingdom & Scotland")).not.toBeNull();
	});

	// TC-TG-13
	it("clicking France then Croatia replaces the card - exactly one card, showing Croatia", async () => {
		const { container } = render(<TravelGlobe active={true} />);
		const france = await findByDataName(container, "France");
		fireEvent.click(france);
		await screen.findByText("France");

		const croatia = await findByDataName(container, "Croatia");
		fireEvent.click(croatia);

		expect(await screen.findByText("Croatia")).not.toBeNull();
		expect(screen.queryByText("France")).toBeNull();
		expect(screen.getAllByRole("button", { name: /close/i }).length).toBe(1);
	});

	// TC-TG-14
	it("clicking the sphere/graticule background (no data-name) opens no card", async () => {
		const { container } = render(<TravelGlobe active={true} />);
		await findByDataName(container, "France");

		const svg = container.querySelector("svg");
		expect(svg).not.toBeNull();
		fireEvent.click(svg as SVGSVGElement);

		expect(screen.queryByRole("button", { name: /close/i })).toBeNull();
	});

	// tests-missing:travelglobe-renderer-error-boundary
	it("recovers to the SVG fallback when the mapbox branch is forced and MapboxGlobe throws on render", async () => {
		vi.mocked(webglAvailable).mockReturnValue(true);
		mapboxGlobeBehavior.throwOnRender = true;
		// Suppress the (expected) React error-boundary console.error noise for
		// this case only.
		vi.spyOn(console, "error").mockImplementation(() => {});

		const { container } = render(<TravelGlobe active={true} />);

		const path = await findByDataName(container, "France");
		expect(path.tagName.toLowerCase()).toBe("path");
		expect(container.querySelectorAll("canvas").length).toBe(0);
		// The fallback is only meaningful if the mapbox branch was actually
		// entered (and threw) first - proving mode="mapbox" was reached, not
		// that we silently stayed on the SVG path.
		expect(mapboxGlobeEvaluated.value).toBe(true);
	});

	// tests-missing/regression: keyboard/SR route to a memory card
	it("the sr-only France button opens the same MemoryCard as clicking the France path", async () => {
		render(<TravelGlobe active={true} />);

		const franceButton = await screen.findByRole("button", { name: /france/i });
		fireEvent.click(franceButton);

		expect(await screen.findByText("Visited")).not.toBeNull();
		expect(screen.getByText("France")).not.toBeNull();
	});

	// tests-missing/regression: MemoryCard dialog semantics (focus-in / Escape / focus-restore)
	describe("MemoryCard dialog semantics (role, focus-in, Escape, focus-restore)", () => {
		it("opening a card via the sr-only button moves focus into the dialog (the close button)", async () => {
			render(<TravelGlobe active={true} />);

			const franceButton = await screen.findByRole("button", {
				name: /france/i,
			});
			fireEvent.click(franceButton);

			const dialog = await screen.findByRole("dialog");
			expect(dialog.getAttribute("aria-modal")).toBe("true");
			const closeButton = screen.getByRole("button", { name: /close/i });
			expect(document.activeElement).toBe(closeButton);
		});

		it("pressing Escape closes the open card", async () => {
			render(<TravelGlobe active={true} />);

			const franceButton = await screen.findByRole("button", {
				name: /france/i,
			});
			fireEvent.click(franceButton);
			await screen.findByRole("dialog");

			fireEvent.keyDown(document, { key: "Escape" });

			expect(screen.queryByRole("dialog")).toBeNull();
		});

		it("closing the card restores focus to the invoking sr-only button", async () => {
			render(<TravelGlobe active={true} />);

			const franceButton = await screen.findByRole("button", {
				name: /france/i,
			});
			fireEvent.click(franceButton);
			await screen.findByRole("dialog");

			fireEvent.keyDown(document, { key: "Escape" });

			expect(screen.queryByRole("dialog")).toBeNull();
			expect(document.activeElement).toBe(franceButton);
		});
	});
});
