// @vitest-environment jsdom
import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { FooterSection } from "../FooterSection";

// matchMedia stub — mirrors the pattern in FooterHeadline.render.test.tsx
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

describe("FooterSection render", () => {
	let originalMatchMedia: typeof window.matchMedia;

	afterEach(() => {
		cleanup();
		if (originalMatchMedia !== undefined) {
			window.matchMedia = originalMatchMedia;
		}
	});

	it("renders a footer element with id='contact'", () => {
		originalMatchMedia = stubMatchMedia(true);
		const { container } = render(<FooterSection />);
		expect(container.querySelector("footer#contact")).not.toBeNull();
	});

	it("DOM order: role=img (FooterHeadline) precedes textarea (FooterContact), textarea precedes a[href^='mailto:']", () => {
		originalMatchMedia = stubMatchMedia(true);
		const { container } = render(<FooterSection />);

		const allElements = Array.from(container.querySelectorAll("*"));

		const roleImg = container.querySelector("[role='img']")!;
		const textarea = container.querySelector("textarea")!;
		const mailtoAnchor = container.querySelector("a[href^='mailto:']")!;

		expect(roleImg).not.toBeNull();
		expect(textarea).not.toBeNull();
		expect(mailtoAnchor).not.toBeNull();

		const roleImgIndex = allElements.indexOf(roleImg);
		const textareaIndex = allElements.indexOf(textarea);
		const mailtoIndex = allElements.indexOf(mailtoAnchor);

		expect(roleImgIndex).toBeLessThan(textareaIndex);
		expect(textareaIndex).toBeLessThan(mailtoIndex);
	});
});
