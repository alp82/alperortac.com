// @vitest-environment jsdom
import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { SOCIAL_LINKS } from "../../social/socialLinks";
import { FollowMeRow } from "../FollowMeRow";

describe("FollowMeRow render", () => {
	afterEach(cleanup);

	it("renders every link from the full SOCIAL_LINKS registry", () => {
		const { container } = render(<FollowMeRow />);
		const anchors = Array.from(container.querySelectorAll("a"));
		expect(anchors.length).toBe(SOCIAL_LINKS.length);
		for (const link of SOCIAL_LINKS) {
			const anchor = anchors.find(
				(a) => a.getAttribute("aria-label") === link.label,
			);
			expect(anchor, `missing anchor for ${link.label}`).toBeTruthy();
		}
	});

	it("all anchors carry the registry href plus target/_blank and rel=noopener", () => {
		const { container } = render(<FollowMeRow />);
		const anchors = Array.from(container.querySelectorAll("a"));
		for (const link of SOCIAL_LINKS) {
			const anchor = anchors.find(
				(a) => a.getAttribute("aria-label") === link.label,
			)!;
			expect(anchor.getAttribute("href")).toBe(link.href);
			expect(anchor.getAttribute("target")).toBe("_blank");
			expect(anchor.getAttribute("rel")).toBe("noopener noreferrer");
		}
	});

	it("renders the vertical FOLLOW ME label", () => {
		const { container } = render(<FollowMeRow />);
		const label = Array.from(container.querySelectorAll("span")).find((s) =>
			/follow me/i.test(s.textContent ?? ""),
		);
		expect(label).toBeTruthy();
		expect(label!.className).toContain("[writing-mode:vertical-rl]");
	});
});
