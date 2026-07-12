import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

// ---------------------------------------------------------------------------
// Binary-contract tests for the built OG landing image (public/og/landing.png).
// Verifies the PNG signature and IHDR dimensions directly from the file
// bytes - no image library needed, no network fetch.
// ---------------------------------------------------------------------------

const PNG_PATH = path.resolve(process.cwd(), "public/og/landing.png");
const PNG_SIGNATURE = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];

describe("public/og/landing.png binary contract", () => {
	it("exists and is readable as bytes", () => {
		let bytes: Buffer | undefined;
		expect(() => {
			bytes = readFileSync(PNG_PATH);
		}).not.toThrow();
		expect(bytes).toBeTruthy();
		expect(bytes!.length).toBeGreaterThan(0);
	});

	it("starts with the PNG signature", () => {
		const bytes = readFileSync(PNG_PATH);
		const signature = Array.from(bytes.subarray(0, 8));
		expect(signature).toEqual(PNG_SIGNATURE);
	});

	it("has an IHDR width of 1200", () => {
		const bytes = readFileSync(PNG_PATH);
		expect(bytes.readUInt32BE(16)).toBe(1200);
	});

	it("has an IHDR height of 630", () => {
		const bytes = readFileSync(PNG_PATH);
		expect(bytes.readUInt32BE(20)).toBe(630);
	});
});
