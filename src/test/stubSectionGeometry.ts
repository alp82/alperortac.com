/*
 * Shared per-element geometry stub for scroll-position-derived, mount-frozen
 * night/day tests (SectionTitle, FindMeSection, TopicComposition, SectionBody,
 * ...). Extends the single-rect `stubGeometry` inline helper that used to live
 * in SectionTitle.render.test.tsx: instead of one uniform DOMRect for every
 * element, `rects` lets a test give DIFFERENT rects to different elements
 * (e.g. a whole `<section>` vs. a nested title wrapper) matched by CSS
 * selector or predicate, first match wins, falling back to a single default
 * `rect` for anything unmatched.
 *
 * Patches `HTMLElement.prototype.getBoundingClientRect` exactly once (shared
 * across every element in the tree for the lifetime of the stub) plus
 * window.scrollY / window.innerHeight / document.documentElement.scrollHeight
 * via Object.defineProperty - none of which vi.unstubAllGlobals() reverts, so
 * callers MUST invoke the returned restore() in every test (mirroring the
 * afterEach convention in SectionTitle.render.test.tsx).
 */

export type RectSpec = {
	match: string | ((el: Element) => boolean);
	top: number;
	height: number;
};

export function stubSectionGeometry(opts: {
	scrollY?: number;
	scrollHeight: number;
	innerHeight: number;
	rect?: { top: number; height: number };
	rects?: RectSpec[];
}): () => void {
	const scrollY = opts.scrollY ?? 0;
	const defaultRect = opts.rect ?? { top: 0, height: 0 };
	const rects = opts.rects ?? [];

	const originalRect = HTMLElement.prototype.getBoundingClientRect;
	const originalScrollY = Object.getOwnPropertyDescriptor(window, "scrollY");
	const originalInnerHeight = Object.getOwnPropertyDescriptor(
		window,
		"innerHeight",
	);
	const originalScrollHeight = Object.getOwnPropertyDescriptor(
		document.documentElement,
		"scrollHeight",
	);

	HTMLElement.prototype.getBoundingClientRect = function (this: HTMLElement) {
		let resolved = defaultRect;
		for (const spec of rects) {
			const matches =
				typeof spec.match === "string"
					? this.matches(spec.match)
					: spec.match(this);
			if (matches) {
				resolved = { top: spec.top, height: spec.height };
				break;
			}
		}
		return {
			top: resolved.top,
			height: resolved.height,
			left: 0,
			right: 0,
			bottom: 0,
			width: 0,
			x: 0,
			y: resolved.top,
			toJSON() {
				return {};
			},
		} as DOMRect;
	};

	Object.defineProperty(window, "scrollY", {
		value: scrollY,
		configurable: true,
	});
	Object.defineProperty(window, "innerHeight", {
		value: opts.innerHeight,
		configurable: true,
	});
	Object.defineProperty(document.documentElement, "scrollHeight", {
		value: opts.scrollHeight,
		configurable: true,
	});

	return () => {
		HTMLElement.prototype.getBoundingClientRect = originalRect;
		if (originalScrollY) {
			Object.defineProperty(window, "scrollY", originalScrollY);
		} else {
			delete (window as { scrollY?: number }).scrollY;
		}
		if (originalInnerHeight) {
			Object.defineProperty(window, "innerHeight", originalInnerHeight);
		} else {
			delete (window as { innerHeight?: number }).innerHeight;
		}
		if (originalScrollHeight) {
			Object.defineProperty(
				document.documentElement,
				"scrollHeight",
				originalScrollHeight,
			);
		} else {
			delete (document.documentElement as { scrollHeight?: number })
				.scrollHeight;
		}
	};
}
