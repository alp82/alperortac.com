// @vitest-environment jsdom
import { cleanup, fireEvent, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { BorderGlow } from "../BorderGlow";

describe("BorderGlow render", () => {
	afterEach(cleanup);

	// TC-01 - Default DOM structure
	it("renders .border-glow-card with edge-light and border-glow-inner holding children", () => {
		const { container } = render(
			<BorderGlow>
				<p data-testid="child">x</p>
			</BorderGlow>,
		);
		expect(container.querySelector(".border-glow-card")).not.toBeNull();
		expect(
			container.querySelector(".border-glow-card > span.edge-light"),
		).not.toBeNull();
		expect(
			container.querySelector(".border-glow-card > .border-glow-inner"),
		).not.toBeNull();
		expect(
			container.querySelector(".border-glow-inner > [data-testid='child']"),
		).not.toBeNull();
	});

	// TC-02 - className merge
	it("merges className onto the card alongside border-glow-card", () => {
		const { container } = render(
			<BorderGlow className="subpage-column my-class" />,
		);
		const cardEl = container.querySelector(".border-glow-card") as HTMLElement;
		expect(cardEl.classList.contains("border-glow-card")).toBe(true);
		expect(cardEl.classList.contains("subpage-column")).toBe(true);
		expect(cardEl.classList.contains("my-class")).toBe(true);
	});

	// TC-03 - Default --card-bg === #120F17
	it("sets --card-bg to #120F17 by default", () => {
		const { container } = render(<BorderGlow />);
		const cardEl = container.querySelector(".border-glow-card") as HTMLElement;
		expect(cardEl.style.getPropertyValue("--card-bg")).toBe("#120F17");
	});

	// TC-04 - Custom backgroundColor → --card-bg
	it("maps backgroundColor prop to --card-bg CSS var", () => {
		const { container } = render(
			<BorderGlow backgroundColor="rgba(15, 23, 42, 0.7)" />,
		);
		const cardEl = container.querySelector(".border-glow-card") as HTMLElement;
		expect(cardEl.style.getPropertyValue("--card-bg")).toBe(
			"rgba(15, 23, 42, 0.7)",
		);
	});

	// TC-05 - style passthrough
	it("merges style prop onto the card without evicting CSS vars", () => {
		const { container } = render(<BorderGlow style={{ color: "red" }} />);
		const cardEl = container.querySelector(".border-glow-card") as HTMLElement;
		expect(cardEl.style.color).toBe("red");
		expect(cardEl.style.getPropertyValue("--card-bg")).toBe("#120F17");
	});

	// TC-06 - Stock palette preserved: gradient vars carry the default colors
	it("sets stock palette vars: --gradient-one, --gradient-base, --gradient-two contain default colors", () => {
		const { container } = render(<BorderGlow />);
		const cardEl = container.querySelector(".border-glow-card") as HTMLElement;
		expect(cardEl.style.getPropertyValue("--gradient-one")).toContain(
			"#c084fc",
		);
		expect(cardEl.style.getPropertyValue("--gradient-base")).toContain(
			"#c084fc",
		);
		expect(cardEl.style.getPropertyValue("--gradient-two")).toContain(
			"#f472b6",
		);
	});

	// TC-07 - --glow-color contains 40deg 80% 80%
	it("sets --glow-color to a value containing 40deg 80% 80%", () => {
		const { container } = render(<BorderGlow />);
		const cardEl = container.querySelector(".border-glow-card") as HTMLElement;
		expect(cardEl.style.getPropertyValue("--glow-color")).toContain(
			"40deg 80% 80%",
		);
	});

	// TC-08 - Default render → no sweep-active
	it("does not add sweep-active class on default render", () => {
		const { container } = render(<BorderGlow />);
		const cardEl = container.querySelector(".border-glow-card") as HTMLElement;
		expect(cardEl.classList.contains("sweep-active")).toBe(false);
	});

	// TC-09 - Touch pointerMove writes nothing
	it("touch pointerMove leaves --cursor-angle and --edge-proximity empty", () => {
		const { container } = render(<BorderGlow />);
		const cardEl = container.querySelector(".border-glow-card") as HTMLElement;
		fireEvent.pointerMove(cardEl, {
			pointerType: "touch",
			clientX: 100,
			clientY: 100,
		});
		expect(cardEl.style.getPropertyValue("--cursor-angle")).toBe("");
		expect(cardEl.style.getPropertyValue("--edge-proximity")).toBe("");
	});

	// TC-10 - Mouse pointerMove writes the tracking vars
	it("mouse pointerMove sets --cursor-angle and --edge-proximity to non-empty values", () => {
		const { container } = render(<BorderGlow />);
		const cardEl = container.querySelector(".border-glow-card") as HTMLElement;
		fireEvent.pointerMove(cardEl, {
			pointerType: "mouse",
			clientX: 100,
			clientY: 100,
		});
		expect(cardEl.style.getPropertyValue("--cursor-angle")).not.toBe("");
		expect(cardEl.style.getPropertyValue("--edge-proximity")).not.toBe("");
	});

	// TC-12 - Default render → root element is a div
	it("default render produces a div root (.border-glow-card tagName === DIV)", () => {
		const { container } = render(<BorderGlow />);
		const card = container.querySelector(".border-glow-card") as HTMLElement;
		expect(card.tagName).toBe("DIV");
	});

	// TC-13 - as="button" → root is a button, inner structure preserved
	it('as="button" renders the root as a BUTTON and keeps edge-light / border-glow-inner children', () => {
		const { container } = render(<BorderGlow as="button" />);
		const card = container.querySelector(".border-glow-card") as HTMLElement;
		expect(card.tagName).toBe("BUTTON");
		expect(
			container.querySelector(".border-glow-card > span.edge-light"),
		).not.toBeNull();
		expect(
			container.querySelector(".border-glow-card > .border-glow-inner"),
		).not.toBeNull();
	});

	// TC-14 - as="button" forwards native props (type + onClick)
	it('as="button" forwards type and onClick onto the root button', () => {
		const spy = vi.fn();
		const { container } = render(
			<BorderGlow as="button" type="button" onClick={spy} />,
		);
		const card = container.querySelector(".border-glow-card") as HTMLElement;
		fireEvent.click(card);
		expect(spy).toHaveBeenCalledTimes(1);
		expect(card.getAttribute("type")).toBe("button");
	});
});

describe("BorderGlow reduced-motion", () => {
	const originalMatchMedia = window.matchMedia;

	beforeEach(() => {
		Object.defineProperty(window, "matchMedia", {
			writable: true,
			value: (query: string) => ({
				matches: query === "(prefers-reduced-motion: reduce)",
				media: query,
				addEventListener: vi.fn(),
				removeEventListener: vi.fn(),
				addListener: vi.fn(),
				removeListener: vi.fn(),
				dispatchEvent: vi.fn(),
			}),
		});
	});

	afterEach(() => {
		cleanup();
		Object.defineProperty(window, "matchMedia", {
			writable: true,
			value: originalMatchMedia,
		});
	});

	// TC-11 - Reduced-motion + animated → no sweep
	it("does not add sweep-active when animated=true but reduced-motion is active", () => {
		const { container } = render(<BorderGlow animated={true} />);
		const cardEl = container.querySelector(".border-glow-card") as HTMLElement;
		expect(cardEl.classList.contains("sweep-active")).toBe(false);
	});
});
