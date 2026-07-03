// @vitest-environment jsdom
import { act, cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { FOOTER_PHRASES, FOOTER_ROLES } from "../../../../data/footer";
import { stubMatchMedia } from "../../../../test/stubMatchMedia";
import { FooterHeadline } from "../FooterHeadline";

describe("FooterHeadline render", () => {
	afterEach(() => {
		cleanup();
		vi.unstubAllGlobals();
	});

	const closingStatement = `${FOOTER_ROLES[0]} ${FOOTER_PHRASES[0]}`;

	it("reduced-motion — aria-label is the full closing statement and no .footer-cursor renders", () => {
		stubMatchMedia(true);
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
		stubMatchMedia(true);
		const { container } = render(<FooterHeadline />);
		const spans = Array.from(container.querySelectorAll("span"));
		expect(spans.length).toBeGreaterThan(0);
		for (const span of spans) {
			expect(span.getAttribute("aria-hidden")).toBe("true");
		}
	});

	it("animated — .footer-cursor present after act flush", async () => {
		stubMatchMedia(false);
		const { container } = render(<FooterHeadline />);
		await act(() => {});
		expect(container.querySelector(".footer-cursor")).not.toBeNull();
	});
});
