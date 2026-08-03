// @vitest-environment jsdom

/*
 * Drift guard for the two coding stops that quote TechStackContent.
 *
 * Those sentences live in JSX, not in a data file, so `coding.ts` cannot import
 * them. It holds literals instead, and this test renders the real component and
 * checks the literals still read back out of it. Reword the component and this
 * goes red, instead of the subpage quietly holding a line Alper no longer says.
 */

import { cleanup, render } from "@testing-library/react";
import { createRef } from "react";
import { afterEach, describe, expect, it } from "vitest";
import { TechStackContent } from "../../components/_layout/topics/TechStackContent";
import { CODING_STOPS } from "../coding";

const squash = (text: string) => text.replace(/\s+/g, " ").trim();

function techStackText(): string {
	const { container } = render(
		<TechStackContent
			lastTriggerRef={createRef<HTMLElement>()}
			isNight={false}
			accent="#fbbf24"
		/>,
	);
	return squash(container.textContent ?? "");
}

describe("coding - the tech-stack quotes", () => {
	afterEach(() => {
		cleanup();
	});

	// TC-CDP-01
	it("quotes the self-hosting line on the 2022 stop", () => {
		const stop = CODING_STOPS.find((s) => s.year === 2022);
		expect(stop?.beats.length).toBe(1);
		expect(techStackText()).toContain(squash(stop?.beats[0] ?? ""));
	});

	// TC-CDP-02
	it("quotes the Hetzner opinion on the 2022 stop", () => {
		const stop = CODING_STOPS.find((s) => s.year === 2022);
		expect(stop?.op).toBeDefined();
		expect(techStackText()).toContain(squash(stop?.op ?? ""));
	});

	// TC-CDP-03
	it("quotes the new-app line on the 2025 stop", () => {
		const stop = CODING_STOPS.find((s) => s.year === 2025);
		expect(stop?.beats.length).toBe(1);
		expect(techStackText()).toContain(squash(stop?.beats[0] ?? ""));
	});
});
