import { act } from "@testing-library/react";
import { vi } from "vitest";

// Shared IntersectionObserver stub for reveal-on-scroll tests. Mirrors
// stubMatchMedia.ts's conventions: `vi.stubGlobal` for installation,
// restoration via the caller's `vi.unstubAllGlobals()` in afterEach.
//
// StubIntersectionObserver.instances collects every constructed instance so
// intersect() can locate the instance that is observing a given element and
// fire its callback with a minimal entry. Callers must clear `.instances`
// between tests (installStubIntersectionObserver() does this for you) so
// intersect() never accidentally targets a stale instance from a prior test.
export class StubIntersectionObserver implements IntersectionObserver {
	static instances: StubIntersectionObserver[] = [];

	callback: IntersectionObserverCallback;
	targets = new Set<Element>();
	root: Element | Document | null = null;
	rootMargin = "";
	scrollMargin = "";
	thresholds: ReadonlyArray<number> = [];
	disconnected = false;

	constructor(callback: IntersectionObserverCallback) {
		this.callback = callback;
		StubIntersectionObserver.instances.push(this);
	}

	observe(target: Element): void {
		this.targets.add(target);
	}

	unobserve(target: Element): void {
		this.targets.delete(target);
	}

	disconnect(): void {
		this.targets.clear();
		this.disconnected = true;
	}

	takeRecords(): IntersectionObserverEntry[] {
		return [];
	}
}

// Installs the stub as the global IntersectionObserver and clears any
// instances left over from a previous test.
export function installStubIntersectionObserver(): void {
	StubIntersectionObserver.instances = [];
	vi.stubGlobal(
		"IntersectionObserver",
		StubIntersectionObserver as unknown as typeof IntersectionObserver,
	);
}

// Fires the intersection callback for whichever observed instance is
// watching `el`, with a minimal entry ({ target: el, isIntersecting }).
export function intersect(el: Element, isIntersecting = true): void {
	intersectMany([el], isIntersecting);
}

// Fires a single callback invocation carrying multiple entries at once, for
// tests that need to verify batch-reveal behaviour (e.g. eras that are
// already visible at mount arriving in the observer's first callback
// together). Locates the instance observing every el in `els`.
export function intersectMany(els: Element[], isIntersecting = true): void {
	if (els.length === 0) {
		throw new Error("intersectMany(): els must be non-empty");
	}
	const instance = StubIntersectionObserver.instances.find((inst) =>
		els.every((el) => inst.targets.has(el)),
	);
	if (!instance) {
		throw new Error(
			"intersectMany(): no StubIntersectionObserver is observing all els",
		);
	}
	const entries = els.map((el) => ({
		target: el,
		isIntersecting,
	})) as IntersectionObserverEntry[];
	act(() => {
		instance.callback(entries, instance);
	});
}
