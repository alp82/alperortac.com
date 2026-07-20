// @vitest-environment jsdom

/*
 * AIContent tests - pins the no-double-links invariant on the AI band: the
 * forge GitHub card, the Discord card, and the aistack.to card are gone
 * (their links live on the subpages now); only the paragraph-4 aistack.to
 * InlineLink and the two subpage trigger buttons remain. The assumptions
 * paragraph moved onto the Forge subpage, so it must be absent here -
 * assertions are scoped to this rendered container because the identical
 * string ships in projects.ts extraSection.body.
 *
 * AIContent uses TriggerCard which calls useNavigate() unconditionally, so
 * we must stub the router to prevent a crash on render - mirroring the
 * GamesContent test pattern.
 */

import { cleanup, render, screen } from "@testing-library/react";
import { createRef } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@tanstack/react-router", () => ({
	useNavigate: () => vi.fn(),
}));

import { AIContent } from "../AIContent";

const sharedRef = createRef<HTMLElement | null>();
const sharedProps = {
	lastTriggerRef: sharedRef,
	isNight: false,
	accent: "#ccc",
} as const;

describe("AIContent", () => {
	afterEach(() => {
		cleanup();
	});

	it("has no link to the forge GitHub repo or the Discord invite", () => {
		const { container } = render(<AIContent {...sharedProps} />);
		expect(
			container.querySelector('a[href="https://github.com/alp82/forge"]'),
		).toBeNull();
		expect(
			container.querySelector('a[href="https://discord.gg/5y4fpyahaF"]'),
		).toBeNull();
	});

	it("keeps exactly one aistack.to link (the paragraph-4 InlineLink)", () => {
		const { container } = render(<AIContent {...sharedProps} />);
		const links = container.querySelectorAll('a[href="https://aistack.to"]');
		expect(links).toHaveLength(1);
	});

	it("does not render the assumptions paragraph on the band", () => {
		const { container } = render(<AIContent {...sharedProps} />);
		expect(container.textContent).not.toContain("Assumptions are not allowed");
	});

	it("renders two trigger buttons (Forge and AIStack)", () => {
		render(<AIContent {...sharedProps} />);
		expect(screen.getAllByRole("button")).toHaveLength(2);
	});
});
