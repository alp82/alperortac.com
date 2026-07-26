// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import {
	ATTACH_URL,
	CURIA_LEGS,
	CuriaThread,
	PREVIEW_URL,
} from "../CuriaThread";

describe("CuriaThread golden-thread legs", () => {
	afterEach(() => {
		cleanup();
	});

	it("walks all seven legs in order, so the artwork matches the thread the body describes", () => {
		expect([...CURIA_LEGS]).toEqual([
			"Frontier",
			"Dispatch",
			"Escalate",
			"Answer",
			"Preview",
			"Attach",
			"Resolve",
		]);
	});

	it("renders one divider per leg, in the exported order", () => {
		render(<CuriaThread />);
		const rendered = CURIA_LEGS.map((leg) => screen.getByText(leg));
		expect(rendered).toHaveLength(CURIA_LEGS.length);
		// Document order must match the declared order: a thread that escalates
		// before it dispatches is not the golden thread.
		for (let i = 1; i < rendered.length; i += 1) {
			const previous = rendered[i - 1];
			const current = rendered[i];
			if (!previous || !current) throw new Error("missing divider");
			expect(
				previous.compareDocumentPosition(current) &
					Node.DOCUMENT_POSITION_FOLLOWING,
			).toBeTruthy();
		}
	});
});

describe("CuriaThread rendering", () => {
	afterEach(() => {
		cleanup();
	});

	it("is one labelled image with all internals decorative (aria-hidden)", () => {
		render(<CuriaThread />);
		const img = screen.getByRole("img");
		expect(img.getAttribute("aria-label")).toMatch(/golden thread/i);
		expect(img.firstElementChild?.getAttribute("aria-hidden")).toBe("true");
	});

	it("renders the real surface: the #curia channel, both slash commands, the escalation, and the dispatched ticket", () => {
		const { container } = render(<CuriaThread />);
		expect(screen.getByText("curia")).not.toBeNull();
		expect(screen.getByText("/frontier")).not.toBeNull();
		expect(screen.getByText("/attach")).not.toBeNull();
		expect(screen.getByText("/start")).not.toBeNull();
		expect(screen.getByText("#48 asks")).not.toBeNull();
		// Self-referential on purpose: the thread dispatches the ticket that
		// authored this page.
		expect(container.textContent).toContain("Author subpage: Curia");
	});

	it("publishes no real tailnet hostname: attach sits behind tailnet membership alone, so the page shows a generic box", () => {
		render(<CuriaThread />);
		for (const url of [PREVIEW_URL, ATTACH_URL]) {
			expect(url).toContain("box.tailnet.ts.net");
			expect(url).not.toMatch(/alppc|tail3b99f1/);
			expect(screen.getByText(url)).not.toBeNull();
		}
	});

	it("is decorative text only: no real anchors a keyboard user could tab into", () => {
		const { container } = render(<CuriaThread />);
		expect(container.querySelector("a")).toBeNull();
		expect(container.querySelector("button")).toBeNull();
	});

	it("is static: no video, no animation classes, so reduced motion needs no guard", () => {
		const { container } = render(<CuriaThread />);
		expect(container.querySelector("video")).toBeNull();
		expect(container.querySelector('[class*="animate-"]')).toBeNull();
	});
});
