// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { webglAvailable } from "../webglSupport";

/*
 * webglSupport.ts contract (#travel-globe-subpage, M1) - webglAvailable(search)
 * returns false when the `nogl` query param is present (regardless of its
 * value - it's presence-checked, the escape hatch documented in the plan as
 * `&nogl=1`), and otherwise probes for a real WebGL2/WebGL canvas context,
 * never throwing even if the probe itself throws.
 */
describe("webglAvailable (#travel-globe-subpage)", () => {
	afterEach(() => {
		vi.restoreAllMocks();
	});

	// TC-WGL-01
	it('returns false when "?nogl=1" is present', () => {
		expect(webglAvailable("?nogl=1")).toBe(false);
	});

	// TC-WGL-02
	it('returns false when "nogl=1" is present alongside other params', () => {
		expect(webglAvailable("?foo=bar&nogl=1")).toBe(false);
	});

	// TC-WGL-03
	it("returns false under jsdom (no real WebGL) with an empty search string", () => {
		expect(webglAvailable("")).toBe(false);
	});

	// TC-WGL-04 (presence-checked, not value-checked)
	it('treats "nogl" as presence-checked, not value-checked: "?nogl=0" still forces false', () => {
		expect(webglAvailable("?nogl=0")).toBe(false);
	});

	// TC-WGL-05
	it("never throws even if canvas.getContext throws", () => {
		const getContextSpy = vi
			.spyOn(HTMLCanvasElement.prototype, "getContext")
			.mockImplementation(() => {
				throw new Error("boom");
			});

		expect(() => webglAvailable("")).not.toThrow();
		expect(webglAvailable("")).toBe(false);

		getContextSpy.mockRestore();
	});
});
