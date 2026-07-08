import type { ReactElement } from "react";
import { describe, expect, it } from "vitest";
import { HERO_SUMMARY, OG_HEADLINE, OG_TAGLINE } from "#/data/hero";
import { LandingOgTemplate, OG_HEIGHT, OG_WIDTH } from "../landingTemplate";

// ---------------------------------------------------------------------------
// Data-contract tests for the OG landing card template (satori-style React
// element tree — no DOM, no @testing-library). Copy is asserted against the
// imported hero data constants, never hardcoded, so editing the data files
// keeps the OG card in sync without requiring a test edit.
//
// JSON.stringify walks the element tree and silently drops non-serializable
// symbols (e.g. $$typeof), leaving every text leaf intact in the resulting
// string — no need for a bespoke tree-walker.
// ---------------------------------------------------------------------------

const AVATAR_STUB = "data:image/png;base64,AVATAR_TEST_STUB";

describe("LandingOgTemplate card copy contract", () => {
	it("contains OG_HEADLINE", () => {
		const tree = JSON.stringify(LandingOgTemplate({ avatarSrc: AVATAR_STUB }));
		expect(tree).toContain(OG_HEADLINE);
	});

	it("contains OG_TAGLINE across its pre-/post-\"passion\" spans", () => {
		const tree = JSON.stringify(LandingOgTemplate({ avatarSrc: AVATAR_STUB }));
		const [prePassion = "", postPassion] = OG_TAGLINE.split("passion");
		expect(tree).toContain(prePassion.trim());
		expect(tree).toContain("passion");
		if (postPassion) {
			expect(tree).toContain(postPassion.trim());
		}
	});

	it("does not contain the bio first line (HERO_SUMMARY[0])", () => {
		const tree = JSON.stringify(LandingOgTemplate({ avatarSrc: AVATAR_STUB }));
		expect(tree).not.toContain(HERO_SUMMARY[0]);
	});

	it("does not contain the bio second line (HERO_SUMMARY[1])", () => {
		const tree = JSON.stringify(LandingOgTemplate({ avatarSrc: AVATAR_STUB }));
		expect(tree).not.toContain(HERO_SUMMARY[1]);
	});

	it("is callable with an avatarSrc stub and returns a ReactElement without throwing", () => {
		let element: ReactElement | undefined;
		expect(() => {
			element = LandingOgTemplate({ avatarSrc: AVATAR_STUB });
		}).not.toThrow();
		expect(element).toBeTruthy();
		expect(typeof element).toBe("object");
	});

	it("wires avatarSrc into the card", () => {
		const tree = JSON.stringify(LandingOgTemplate({ avatarSrc: AVATAR_STUB }));
		expect(tree).toContain(AVATAR_STUB);
	});

	it("has fixed 1200x630 OG dimensions exported", () => {
		expect(OG_WIDTH).toBe(1200);
		expect(OG_HEIGHT).toBe(630);
	});

	it("is deterministic — two identical-arg calls produce identical stringified content", () => {
		const first = JSON.stringify(LandingOgTemplate({ avatarSrc: AVATAR_STUB }));
		const second = JSON.stringify(LandingOgTemplate({ avatarSrc: AVATAR_STUB }));
		expect(first).toBe(second);
	});
});
