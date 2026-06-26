// @vitest-environment jsdom
import { act, cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { FOOTER_PHRASES, FOOTER_ROLES } from "../../../../data/footer";
import { FooterHeadline } from "../FooterHeadline";

// matchMedia stub — mirrors the pattern in HeroSubtitle.render.test.tsx
function stubMatchMedia(reduced: boolean): typeof window.matchMedia {
	const original = window.matchMedia;
	window.matchMedia = vi.fn().mockImplementation((query: string) => ({
		matches: reduced ? query === "(prefers-reduced-motion: reduce)" : false,
		media: query,
		onchange: null,
		addEventListener() {},
		removeEventListener() {},
		addListener() {},
		removeListener() {},
		dispatchEvent() {
			return false;
		},
	})) as unknown as typeof window.matchMedia;
	return original;
}

describe("FooterHeadline render", () => {
	let originalMatchMedia: typeof window.matchMedia;

	afterEach(() => {
		cleanup();
		if (originalMatchMedia !== undefined) {
			window.matchMedia = originalMatchMedia;
		}
	});

	const closingStatement = `${FOOTER_ROLES[0]} ${FOOTER_PHRASES[0]}`;

	it("reduced-motion — aria-label is the full closing statement and no .footer-cursor renders", () => {
		originalMatchMedia = stubMatchMedia(true);
		const { container } = render(<FooterHeadline />);
		const el = container.querySelector("[aria-label]");
		expect(el).not.toBeNull();
		expect(el!.getAttribute("aria-label")).toBe(closingStatement);
		expect(el!.getAttribute("role")).toBe("img");
		expect(container.textContent).toContain(FOOTER_ROLES[0]);
		expect(container.textContent).toContain(FOOTER_PHRASES[0]);
		expect(container.querySelector(".footer-cursor")).toBeNull();
	});

	it("reduced-motion — all inner spans are aria-hidden", () => {
		originalMatchMedia = stubMatchMedia(true);
		const { container } = render(<FooterHeadline />);
		const spans = Array.from(container.querySelectorAll("span"));
		expect(spans.length).toBeGreaterThan(0);
		for (const span of spans) {
			expect(span.getAttribute("aria-hidden")).toBe("true");
		}
	});

	it("animated — .footer-cursor present after act flush", async () => {
		originalMatchMedia = stubMatchMedia(false);
		const { container } = render(<FooterHeadline />);
		await act(() => {});
		expect(container.querySelector(".footer-cursor")).not.toBeNull();
	});
});
