// @vitest-environment jsdom

/*
 * EarthTrigger tests - the travel band's rotating preview earth, the
 * tap-target into /travel (globe subpage, #21). Mirrors the PosterGrid
 * nav-contract cases: one trigger, the shared lastTriggerRef stash +
 * resetScroll:false navigation, and the dive-trigger data contract the
 * anticipation language keys on.
 */

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { createRef } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { EarthTrigger } from "../EarthTrigger";

const navigate = vi.hoisted(() => vi.fn());
vi.mock("@tanstack/react-router", () => ({ useNavigate: () => navigate }));

describe("EarthTrigger - travel band globe trigger", () => {
	afterEach(() => {
		cleanup();
		navigate.mockClear();
	});

	it("renders exactly one globe trigger button with the spinning earth", () => {
		const ref = createRef<HTMLElement | null>();
		const { container } = render(<EarthTrigger lastTriggerRef={ref} />);
		const btn = screen.getByRole("button", {
			name: /explore the travel globe/i,
		});
		expect(container.querySelectorAll("button").length).toBe(1);
		expect(btn.querySelector(".earth-globe")).not.toBeNull();
	});

	it("carries the dive-trigger contract matching PANEL_SIDES.travel", () => {
		const ref = createRef<HTMLElement | null>();
		render(<EarthTrigger lastTriggerRef={ref} />);
		const btn = screen.getByRole("button", {
			name: /explore the travel globe/i,
		});
		expect(btn.getAttribute("data-dive-trigger")).toBe("");
		expect(btn.getAttribute("data-dive-side")).toBe("right");
	});

	it("clicking navigates to /travel with resetScroll false and stashes lastTriggerRef", () => {
		const ref = createRef<HTMLElement | null>();
		render(<EarthTrigger lastTriggerRef={ref} />);
		const btn = screen.getByRole("button", {
			name: /explore the travel globe/i,
		});
		fireEvent.click(btn);
		expect(navigate).toHaveBeenCalledTimes(1);
		expect(navigate).toHaveBeenCalledWith({
			to: "/travel",
			resetScroll: false,
		});
		expect(ref.current).toBe(btn);
	});
});
