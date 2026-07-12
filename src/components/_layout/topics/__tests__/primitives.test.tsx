// @vitest-environment jsdom

import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { BulletList } from "../primitives";

function TestIcon({ className }: { className?: string }) {
	return <svg data-testid="test-icon" className={className} />;
}

describe("BulletList", () => {
	afterEach(() => {
		cleanup();
	});

	it("renders the provided Icon component when an item has one", () => {
		render(
			<BulletList
				items={[
					{
						primary: "Coolify",
						secondary: "to spin up my web apps",
						Icon: TestIcon,
					},
				]}
			/>,
		);
		expect(screen.getByTestId("test-icon")).not.toBeNull();
	});

	it("falls back to the chevron when an item has no Icon", () => {
		render(<BulletList items={[{ primary: "Plain item" }]} />);
		expect(screen.queryByTestId("test-icon")).toBeNull();
		expect(screen.getByText("›")).not.toBeNull();
	});
});
