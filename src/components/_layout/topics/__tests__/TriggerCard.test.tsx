// @vitest-environment jsdom

/*
 * TriggerCard acceptance tests.
 *
 * TC-TR-03 asserts the focusable button IS the BorderGlow root (it carries the
 * `border-glow-card` class) — the glow card and the keyboard-focusable control
 * are one element, via GlowTrigger (BorderGlow as="button").
 *
 * A STABLE hoisted navigate spy is used (not `() => vi.fn()`) so the exact args
 * can be inspected in TC-TR-04.
 */

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { createRef } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

const navigate = vi.hoisted(() => vi.fn());
vi.mock("@tanstack/react-router", () => ({ useNavigate: () => navigate }));

import { TriggerCard } from "../primitives";

const SLUG = "manaschmiede";

describe("TriggerCard", () => {
	afterEach(() => {
		cleanup();
		navigate.mockClear();
	});

	// TC-TR-01 — resolves a real button via role
	it("renders a button element accessible by role", () => {
		const ref = createRef<HTMLElement | null>();
		render(
			<TriggerCard
				trigger={{ kind: "project", slug: SLUG }}
				lastTriggerRef={ref}
			/>,
		);
		expect(screen.getByRole("button")).not.toBeNull();
	});

	// TC-TR-02 — button has type="button" (not implicit submit)
	it('button element has getAttribute("type") === "button"', () => {
		const ref = createRef<HTMLElement | null>();
		render(
			<TriggerCard
				trigger={{ kind: "project", slug: SLUG }}
				lastTriggerRef={ref}
			/>,
		);
		const button = screen.getByRole("button");
		expect(button.getAttribute("type")).toBe("button");
	});

	// TC-TR-03 — button IS the glow card (carries border-glow-card class)
	// RED: today TriggerCard renders btn-brutalist--ghost; this fails until
	// GlowTrigger (BorderGlow as="button") replaces the brutalist chrome.
	it("the focusable button carries the border-glow-card class", () => {
		const ref = createRef<HTMLElement | null>();
		render(
			<TriggerCard
				trigger={{ kind: "project", slug: SLUG }}
				lastTriggerRef={ref}
			/>,
		);
		const button = screen.getByRole("button");
		expect(button.classList.contains("border-glow-card")).toBe(true);
	});

	// TC-TR-04 — click calls navigate with the correct route and params
	it("click calls navigate once with the correct project route and slug", () => {
		const ref = createRef<HTMLElement | null>();
		render(
			<TriggerCard
				trigger={{ kind: "project", slug: SLUG }}
				lastTriggerRef={ref}
			/>,
		);
		const button = screen.getByRole("button");
		fireEvent.click(button);
		expect(navigate).toHaveBeenCalledTimes(1);
		expect(navigate).toHaveBeenCalledWith({
			to: "/projects/$slug",
			params: { slug: SLUG },
			resetScroll: false,
		});
	});

	// TC-TR-05 — lastTriggerRef is null before click, equals button after click
	it("lastTriggerRef.current is null before click and is the button after click", () => {
		const ref = createRef<HTMLElement | null>();
		render(
			<TriggerCard
				trigger={{ kind: "project", slug: SLUG }}
				lastTriggerRef={ref}
			/>,
		);
		const button = screen.getByRole("button");
		expect(ref.current).toBeNull();
		fireEvent.click(button);
		expect(ref.current).toBe(button);
	});
});
