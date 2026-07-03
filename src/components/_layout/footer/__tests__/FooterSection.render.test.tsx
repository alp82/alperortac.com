// @vitest-environment jsdom
import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { stubMatchMedia } from "../../../../test/stubMatchMedia";
import { FooterSection } from "../FooterSection";

describe("FooterSection render", () => {
	afterEach(() => {
		cleanup();
		vi.unstubAllGlobals();
	});

	it("renders a footer element with id='contact'", () => {
		stubMatchMedia(true);
		const { container } = render(<FooterSection />);
		expect(container.querySelector("footer#contact")).not.toBeNull();
	});

	it("DOM order: role=img (FooterHeadline) precedes textarea (FooterContact), textarea precedes a[href^='mailto:']", () => {
		stubMatchMedia(true);
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
