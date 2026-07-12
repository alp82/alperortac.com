// @vitest-environment jsdom

/*
 * InlineLink RED tests - written before the internal/external styling split.
 *
 * The current InlineLink renders a single className with no italic/decoration-wavy
 * branching, no isNight prop, and no trailing icon for external links.
 * Cases TC-IL-05, TC-IL-06, TC-IL-07, TC-IL-12, TC-IL-13, TC-IL-14,
 * TC-IL-15, TC-IL-16, TC-IL-17, TC-IL-18, TC-IL-19 MUST fail until the
 * implementation adds the internal/external split.
 * TC-IL-01 through TC-IL-04 and TC-IL-08 through TC-IL-11 verify existing
 * behaviour (href pass-through, target/rel rules) and may already pass.
 */

import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { InlineLink } from "../primitives";

describe("InlineLink", () => {
	afterEach(() => {
		cleanup();
	});

	// TC-IL-01 - Internal link renders as an anchor
	it("TC-IL-01: internal link renders a link element with the given label", () => {
		render(<InlineLink href="#music">label</InlineLink>);
		expect(screen.getByRole("link", { name: "label" })).not.toBeNull();
	});

	// TC-IL-02 - Internal link href passes through unchanged
	it("TC-IL-02: internal link has the correct href attribute", () => {
		render(<InlineLink href="#music">label</InlineLink>);
		const link = screen.getByRole("link", { name: "label" });
		expect(link.getAttribute("href")).toBe("#music");
	});

	// TC-IL-03 - Internal link has no target attribute
	it("TC-IL-03: internal link does not have a target attribute", () => {
		render(<InlineLink href="#music">label</InlineLink>);
		const link = screen.getByRole("link", { name: "label" });
		expect(link.hasAttribute("target")).toBe(false);
	});

	// TC-IL-04 - Internal link has no rel attribute
	it("TC-IL-04: internal link does not have a rel attribute", () => {
		render(<InlineLink href="#music">label</InlineLink>);
		const link = screen.getByRole("link", { name: "label" });
		expect(link.hasAttribute("rel")).toBe(false);
	});

	// TC-IL-05 - Internal link carries italic class
	it("TC-IL-05: internal link has italic class", () => {
		render(<InlineLink href="#music">label</InlineLink>);
		const link = screen.getByRole("link", { name: "label" });
		expect(link.classList.contains("italic")).toBe(true);
	});

	// TC-IL-06 - Internal link carries decoration-wavy class
	it("TC-IL-06: internal link has decoration-wavy class", () => {
		render(<InlineLink href="#music">label</InlineLink>);
		const link = screen.getByRole("link", { name: "label" });
		expect(link.classList.contains("decoration-wavy")).toBe(true);
	});

	// TC-IL-07 - Internal link has no trailing SVG icon
	it("TC-IL-07: internal link does not render a trailing svg icon", () => {
		render(<InlineLink href="#music">label</InlineLink>);
		const link = screen.getByRole("link", { name: "label" });
		expect(link.querySelector("svg")).toBeNull();
	});

	// TC-IL-08 - Internal link className is identical regardless of isNight
	it("TC-IL-08: internal link className is the same for isNight false and isNight true", () => {
		const { unmount } = render(
			<InlineLink href="#music" isNight={false}>
				day
			</InlineLink>,
		);
		const dayLink = screen.getByRole("link", { name: "day" });
		const dayClass = dayLink.className;
		unmount();

		render(
			<InlineLink href="#music" isNight={true}>
				night
			</InlineLink>,
		);
		const nightLink = screen.getByRole("link", { name: "night" });
		expect(nightLink.className).toBe(dayClass);
	});

	// TC-IL-09 - External link renders as an anchor
	it("TC-IL-09: external link renders a link element with the given label", () => {
		render(<InlineLink href="https://example.com">label</InlineLink>);
		expect(screen.getByRole("link", { name: "label" })).not.toBeNull();
	});

	// TC-IL-10 - External link opens in a new tab
	it("TC-IL-10: external link has target _blank", () => {
		render(<InlineLink href="https://example.com">label</InlineLink>);
		const link = screen.getByRole("link", { name: "label" });
		expect(link.getAttribute("target")).toBe("_blank");
	});

	// TC-IL-11 - External link has security rel
	it("TC-IL-11: external link has rel noopener noreferrer", () => {
		render(<InlineLink href="https://example.com">label</InlineLink>);
		const link = screen.getByRole("link", { name: "label" });
		expect(link.getAttribute("rel")).toBe("noopener noreferrer");
	});

	// TC-IL-12 - External link does NOT carry italic class
	it("TC-IL-12: external link does not have italic class", () => {
		render(<InlineLink href="https://example.com">label</InlineLink>);
		const link = screen.getByRole("link", { name: "label" });
		expect(link.classList.contains("italic")).toBe(false);
	});

	// TC-IL-13 - External link does NOT carry decoration-wavy class
	it("TC-IL-13: external link does not have decoration-wavy class", () => {
		render(<InlineLink href="https://example.com">label</InlineLink>);
		const link = screen.getByRole("link", { name: "label" });
		expect(link.classList.contains("decoration-wavy")).toBe(false);
	});

	// TC-IL-14 - External link renders a trailing aria-hidden SVG icon
	it("TC-IL-14: external link renders a trailing svg icon with aria-hidden=true", () => {
		render(<InlineLink href="https://example.com">label</InlineLink>);
		const link = screen.getByRole("link", { name: "label" });
		const svg = link.querySelector("svg");
		expect(svg).not.toBeNull();
		expect(svg?.getAttribute("aria-hidden")).toBe("true");
	});

	// TC-IL-15 - External isNight={false}: day tint class present, night tint absent
	it("TC-IL-15: external link with isNight false has text-amber-700 and not text-sky-300", () => {
		render(
			<InlineLink href="https://example.com" isNight={false}>
				label
			</InlineLink>,
		);
		const link = screen.getByRole("link", { name: "label" });
		expect(link.classList.contains("text-amber-700")).toBe(true);
		expect(link.classList.contains("text-sky-300")).toBe(false);
	});

	// TC-IL-16 - External isNight absent: defaults to day tint
	it("TC-IL-16: external link without isNight prop has text-amber-700", () => {
		render(<InlineLink href="https://example.com">label</InlineLink>);
		const link = screen.getByRole("link", { name: "label" });
		expect(link.classList.contains("text-amber-700")).toBe(true);
	});

	// TC-IL-17 - External isNight={true}: night tint present, day tint absent
	it("TC-IL-17: external link with isNight true has text-sky-300 and not text-amber-700", () => {
		render(
			<InlineLink href="https://example.com" isNight={true}>
				label
			</InlineLink>,
		);
		const link = screen.getByRole("link", { name: "label" });
		expect(link.classList.contains("text-sky-300")).toBe(true);
		expect(link.classList.contains("text-amber-700")).toBe(false);
	});

	// TC-IL-18 - Internal isNight={false}: neither tint class present
	it("TC-IL-18: internal link with isNight false has neither text-amber-700 nor text-sky-300", () => {
		render(
			<InlineLink href="#section" isNight={false}>
				label
			</InlineLink>,
		);
		const link = screen.getByRole("link", { name: "label" });
		expect(link.classList.contains("text-amber-700")).toBe(false);
		expect(link.classList.contains("text-sky-300")).toBe(false);
	});

	// TC-IL-19 - Internal isNight={true}: neither tint class present
	it("TC-IL-19: internal link with isNight true has neither text-amber-700 nor text-sky-300", () => {
		render(
			<InlineLink href="#section" isNight={true}>
				label
			</InlineLink>,
		);
		const link = screen.getByRole("link", { name: "label" });
		expect(link.classList.contains("text-amber-700")).toBe(false);
		expect(link.classList.contains("text-sky-300")).toBe(false);
	});

	// TC-IL-20 - href="#" alone is treated as internal (no target)
	it("TC-IL-20: href=# alone is treated as internal and has no target attribute", () => {
		render(<InlineLink href="#">label</InlineLink>);
		const link = screen.getByRole("link", { name: "label" });
		expect(link.hasAttribute("target")).toBe(false);
	});

	// TC-IL-21 - https URL with a hash fragment is still external
	it("TC-IL-21: href with https scheme and hash fragment is treated as external", () => {
		render(
			<InlineLink href="https://example.com/page#section">label</InlineLink>,
		);
		const link = screen.getByRole("link", { name: "label" });
		expect(link.getAttribute("target")).toBe("_blank");
	});
});
