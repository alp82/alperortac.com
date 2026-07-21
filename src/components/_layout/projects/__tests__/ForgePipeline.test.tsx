// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { ForgePipeline } from "../ForgePipeline";

function pipelineText(container: HTMLElement) {
	return container.querySelector("ol")?.textContent ?? "";
}

describe("ForgePipeline size chooser", () => {
	afterEach(cleanup);

	it("previews the full seven-stage pipeline before a size is picked", () => {
		const { container } = render(<ForgePipeline />);
		expect(container.querySelectorAll("ol > li")).toHaveLength(7);
	});

	it("Small runs a lean Intent → Build pass", () => {
		const { container } = render(<ForgePipeline />);
		fireEvent.click(screen.getByRole("button", { name: /small/i }));
		expect(container.querySelectorAll("ol > li")).toHaveLength(2);
		const text = pipelineText(container);
		expect(text).toContain("Intent");
		expect(text).toContain("Build");
		expect(text).not.toContain("Scout");
	});

	it("Mid adds Scout + Review (four stages)", () => {
		const { container } = render(<ForgePipeline />);
		fireEvent.click(screen.getByRole("button", { name: /mid/i }));
		expect(container.querySelectorAll("ol > li")).toHaveLength(4);
		const text = pipelineText(container);
		for (const label of ["Intent", "Scout", "Build", "Review"]) {
			expect(text).toContain(label);
		}
		expect(text).not.toContain("Blueprint");
	});

	it("Large runs the full seven-stage pipeline", () => {
		const { container } = render(<ForgePipeline />);
		fireEvent.click(screen.getByRole("button", { name: /large/i }));
		expect(container.querySelectorAll("ol > li")).toHaveLength(7);
	});
});
