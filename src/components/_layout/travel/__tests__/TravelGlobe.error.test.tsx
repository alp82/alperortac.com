// @vitest-environment jsdom

/*
 * TravelGlobe load-failure tests (#travel-globe-subpage), split into their own
 * file so the module-level worldData cache (`cached` in worldData.ts) starts
 * fresh: TravelGlobe.test.tsx's own successful mounts leave that cache warm for
 * the rest of the file, which would make the world resolve without ever
 * exercising the error branch.
 *
 * "../worldData" is mocked outright (no importOriginal/real topojson) so
 * `loadWorld` is fully test-controlled.
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
import type { CountryFeature, WorldData } from "../worldData";

vi.mock("../MapboxGlobe", () => ({ default: () => null }));

vi.mock("../worldData", () => ({
	loadWorld: vi.fn(),
}));

import { loadWorld } from "../worldData";

const france: CountryFeature = {
	type: "Feature",
	properties: { name: "France" },
	geometry: {
		type: "Polygon",
		coordinates: [
			[
				[1, 45],
				[3, 45],
				[3, 47],
				[1, 47],
				[1, 45],
			],
		],
	},
};

const fakeWorld: WorldData = {
	features: [france],
	byName: new Map([["France", france]]),
	tinyVisited: [],
};

describe("TravelGlobe world-data load failure (#travel-globe-subpage)", () => {
	beforeEach(() => {
		stubMatchMedia(false);
		vi.mocked(loadWorld).mockReset();
	});

	afterEach(() => {
		cleanup();
		vi.unstubAllGlobals();
		vi.restoreAllMocks();
	});

	// tests-missing/regression: load-failure error state + retry
	it('shows "Couldn\'t load the globe." and a Retry button when loadWorld rejects', async () => {
		vi.mocked(loadWorld).mockRejectedValueOnce(new Error("network down"));

		render(<TravelGlobe active={true} />);

		expect(await screen.findByText("Couldn't load the globe.")).not.toBeNull();
		expect(screen.getByRole("button", { name: /retry/i })).not.toBeNull();
	});

	it("clicking Retry re-invokes loadWorld and recovers on success", async () => {
		vi.mocked(loadWorld).mockRejectedValueOnce(new Error("network down"));

		const { container } = render(<TravelGlobe active={true} />);
		await screen.findByText("Couldn't load the globe.");
		expect(vi.mocked(loadWorld)).toHaveBeenCalledTimes(1);

		vi.mocked(loadWorld).mockResolvedValueOnce(fakeWorld);
		fireEvent.click(screen.getByRole("button", { name: /retry/i }));

		await waitFor(() => {
			expect(vi.mocked(loadWorld)).toHaveBeenCalledTimes(2);
		});
		await waitFor(() => {
			expect(container.querySelector('[data-name="France"]')).not.toBeNull();
		});
		expect(screen.queryByText("Couldn't load the globe.")).toBeNull();
	});
});
