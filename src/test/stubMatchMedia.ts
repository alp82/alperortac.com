import { vi } from "vitest";

// Shared matchMedia stub for reduced-motion tests. Uses vitest's
// `vi.stubGlobal` so restoration (including deleting the property entirely
// in environments like jsdom that don't implement matchMedia at all) is
// handled by `vi.unstubAllGlobals()` in the caller's afterEach.
//
// "change" listeners registered via addEventListener are captured in a
// module-level registry so tests can simulate a live prefers-reduced-motion
// flip via setReducedMotion() without re-rendering. Each call to
// stubMatchMedia() resets the registry, so it must be called before any
// setReducedMotion() usage in a given test.
type MediaChangeListener = (event: { matches: boolean }) => void;

let changeListeners: MediaChangeListener[] = [];
let currentMatches = false;

export function stubMatchMedia(reduced: boolean): void {
	changeListeners = [];
	currentMatches = reduced;
	const mock = vi.fn().mockImplementation((query: string) => ({
		get matches() {
			return query === "(prefers-reduced-motion: reduce)"
				? currentMatches
				: false;
		},
		media: query,
		onchange: null,
		addEventListener(type: string, listener: MediaChangeListener) {
			if (type === "change") changeListeners.push(listener);
		},
		removeEventListener(type: string, listener: MediaChangeListener) {
			if (type === "change") {
				changeListeners = changeListeners.filter((l) => l !== listener);
			}
		},
		addListener() {},
		removeListener() {},
		dispatchEvent() {
			return false;
		},
	}));
	vi.stubGlobal("matchMedia", mock);
}

// Fires every registered "change" listener with the given matches value and
// updates the stubbed mql's matches getter for any subsequent reads. Callers
// must wrap this in `act()` since it drives React state updates.
export function setReducedMotion(matches: boolean): void {
	currentMatches = matches;
	for (const listener of changeListeners) {
		listener({ matches });
	}
}
