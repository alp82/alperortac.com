// @vitest-environment jsdom

/*
 * MemoryCard direct-render tests (#travel-globe-subpage) - the real-memory
 * branch. TravelGlobe.test.tsx only ever exercises the placeholder branch
 * (travel.ts leaves every `memory` unset by design), so this covers the case
 * where a TravelPlace HAS a hand-filled `memory` string.
 */

import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import type { TravelPlace } from "../../../../data/travel";
import { MemoryCard } from "../MemoryCard";

afterEach(() => {
	cleanup();
	vi.restoreAllMocks();
});

// tests-missing:memorycard-real-memory-line
it("renders the real memory string verbatim, with no placeholder class or text", () => {
	const place: TravelPlace = {
		name: "France",
		code: "FRA",
		memory: "Paris, spring 2019 - the first solo trip.",
	};

	const { container } = render(
		<MemoryCard place={place} isNext={false} onClose={() => {}} />,
	);

	expect(
		screen.getByText("Paris, spring 2019 - the first solo trip."),
	).not.toBeNull();
	expect(screen.queryByText(/a line of memory/i)).toBeNull();
	expect(container.querySelector(".travel-card-memory-placeholder")).toBeNull();
});
