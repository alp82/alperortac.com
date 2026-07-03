import { vi } from "vitest";

// Shared matchMedia stub for reduced-motion tests. Uses vitest's
// `vi.stubGlobal` so restoration (including deleting the property entirely
// in environments like jsdom that don't implement matchMedia at all) is
// handled by `vi.unstubAllGlobals()` in the caller's afterEach.
export function stubMatchMedia(reduced: boolean): void {
	const mock = vi.fn().mockImplementation((query: string) => ({
		matches: reduced ? query === "(prefers-reduced-motion: reduce)" : false,
		media: query,
		onchange: null,
		addEventListener() {},
		removeEventListener() {},
		addListener() {},
		removeListener() {},
		dispatchEvent() {
			return false;
		},
	}));
	vi.stubGlobal("matchMedia", mock);
}
