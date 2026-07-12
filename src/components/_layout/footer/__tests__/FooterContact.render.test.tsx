// @vitest-environment jsdom
import { cleanup, fireEvent, render, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
	CONTACT_EMAIL,
	CONTACT_PLACEHOLDER,
	CONTACT_SUBJECT,
} from "../../../../data/footer";
import { FooterContact } from "../FooterContact";

describe("FooterContact render", () => {
	afterEach(cleanup);

	// TC-01 - exactly one textarea and one anchor in the container
	it("renders exactly one textarea and one anchor", () => {
		const { container } = render(<FooterContact />);
		expect(container.querySelectorAll("textarea").length).toBe(1);
		expect(container.querySelectorAll("a").length).toBe(1);
	});

	// TC-02 - textarea has id="contact-message" and the expected placeholder
	it('textarea has id "contact-message" and the placeholder constant', () => {
		const { container } = render(<FooterContact />);
		const textarea = container.querySelector("textarea")!;
		expect(textarea.id).toBe("contact-message");
		expect(textarea.getAttribute("placeholder")).toBe(CONTACT_PLACEHOLDER);
	});

	// TC-03 - label[for="contact-message"] is present and has sr-only class
	it('has a label associated with the textarea that carries "sr-only"', () => {
		const { container } = render(<FooterContact />);
		const label = container.querySelector('label[for="contact-message"]');
		expect(label).not.toBeNull();
		expect(label!.className).toContain("sr-only");
	});

	// TC-04 - anchor text includes "Email me"
	it('anchor textContent includes "Email me"', () => {
		const { container } = render(<FooterContact />);
		const anchor = container.querySelector("a")!;
		expect(anchor.textContent).toContain("Email me");
	});

	// TC-05 - initial anchor href equals the base mailto with empty body
	it("initial anchor href is the base mailto with empty body", () => {
		const { container } = render(<FooterContact />);
		const anchor = container.querySelector("a")!;
		const expected = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(CONTACT_SUBJECT)}&body=`;
		expect(anchor.getAttribute("href")).toBe(expected);
	});

	// TC-06 - after typing "Hello" body segment updates
	it('after typing "Hello" the anchor href ends with "body=Hello"', () => {
		const { container } = render(<FooterContact />);
		const textarea = container.querySelector("textarea")!;
		fireEvent.change(textarea, { target: { value: "Hello" } });
		const href = container.querySelector("a")!.getAttribute("href")!;
		expect(href.endsWith("body=Hello")).toBe(true);
	});

	// TC-07 - special characters are percent-encoded
	it('after typing "Hello world & more" the body is percent-encoded', () => {
		const { container } = render(<FooterContact />);
		const textarea = container.querySelector("textarea")!;
		fireEvent.change(textarea, { target: { value: "Hello world & more" } });
		const href = container.querySelector("a")!.getAttribute("href")!;
		expect(href.endsWith("body=Hello%20world%20%26%20more")).toBe(true);
	});

	// TC-08 - subject is preserved after a body change
	it("subject segment is still present after a body change", () => {
		const { container } = render(<FooterContact />);
		const textarea = container.querySelector("textarea")!;
		fireEvent.change(textarea, { target: { value: "any value" } });
		const href = container.querySelector("a")!.getAttribute("href")!;
		expect(href).toContain(`subject=${encodeURIComponent(CONTACT_SUBJECT)}`);
	});

	// TC-09 - second change replaces first; no residue of prior value
	it("second change fully replaces the first value in the body", () => {
		const { container } = render(<FooterContact />);
		const textarea = container.querySelector("textarea")!;
		fireEvent.change(textarea, { target: { value: "first" } });
		fireEvent.change(textarea, { target: { value: "second message" } });
		const href = container.querySelector("a")!.getAttribute("href")!;
		expect(href.endsWith(`body=${encodeURIComponent("second message")}`)).toBe(
			true,
		);
		expect(href).not.toContain("first");
	});

	// TC-10 - clearing the textarea resets body to empty
	it("clearing the textarea resets the body segment to empty", () => {
		const { container } = render(<FooterContact />);
		const textarea = container.querySelector("textarea")!;
		fireEvent.change(textarea, { target: { value: "some text" } });
		fireEvent.change(textarea, { target: { value: "" } });
		const href = container.querySelector("a")!.getAttribute("href")!;
		expect(href.endsWith("body=")).toBe(true);
	});

	// TC-11 - fallback address is visible in textContent
	it("rendered textContent includes the CONTACT_EMAIL fallback address", () => {
		const { container } = render(<FooterContact />);
		expect(container.textContent).toContain(CONTACT_EMAIL);
	});
});

describe("FooterContact copy button", () => {
	const writeText = vi.fn().mockResolvedValue(undefined);

	beforeEach(() => {
		writeText.mockClear();
		Object.defineProperty(navigator, "clipboard", {
			value: { writeText },
			configurable: true,
		});
	});

	afterEach(cleanup);

	it("renders a copy button without disturbing the single anchor/textarea counts", () => {
		const { container } = render(<FooterContact />);
		expect(
			container.querySelector('button[aria-label="Copy email address"]'),
		).not.toBeNull();
		expect(container.querySelectorAll("a").length).toBe(1);
		expect(container.querySelectorAll("textarea").length).toBe(1);
	});

	it("copies CONTACT_EMAIL and announces it via the status region", async () => {
		const { container } = render(<FooterContact />);
		const button = container.querySelector(
			'button[aria-label="Copy email address"]',
		)!;
		fireEvent.click(button);
		await waitFor(() => {
			expect(writeText).toHaveBeenCalledWith(CONTACT_EMAIL);
			expect(container.querySelector('[role="status"]')!.textContent).toBe(
				"Email address copied",
			);
		});
	});
});
