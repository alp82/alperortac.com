import { useEffect } from "react";

/**
 * Compute the honest-liar progress curve.
 *
 * Linear from scroll 0 to 0.8, then visibly slower (half-speed) from 0.8 to 1.
 * Reaching the bottom of the page yields ~0.9.
 *
 * Last 10% (0.9-1.0) is reserved for future dig discoveries - the bar
 * reaching 90% at page-bottom is intentional, not a bug. See the
 * decoupling note in README.
 */
function honestLiar(scroll: number): number {
	const s = Math.max(0, Math.min(1, scroll));
	if (s <= 0.8) {
		return s;
	}
	return 0.8 + (s - 0.8) * 0.5;
}

function readScrollFraction(): number {
	const doc = document.documentElement;
	const max = Math.max(1, doc.scrollHeight - doc.clientHeight);
	return Math.max(0, Math.min(1, window.scrollY / max));
}

/**
 * Single rAF-driven scroll driver.
 *
 * Reads `window.scrollY` and writes `--scroll` and `--progress` onto
 * `document.documentElement`. Render code NEVER reads these CSS variables
 * (hydration invariant) - only stylesheets consume them.
 *
 * The initial read is synchronous, before the first rAF tick, so a
 * deep-link refresh paints the correct gradient without flashing the
 * top-of-page state.
 *
 * Side-effects:
 *  - Writes `aria-valuenow` to a host element matching the
 *    `progressbarSelector`, if provided. This is a render-side-effect
 *    (not a render-read), which keeps the hydration invariant intact.
 */
export function useScrollDriver(
	progressbarSelector: string = "[data-progressbar]",
): void {
	useEffect(() => {
		const root = document.documentElement;

		// Synchronous initial read - paints correct state before first rAF.
		const initialFraction = readScrollFraction();
		const initialProgress = honestLiar(initialFraction);
		root.style.setProperty("--scroll", initialFraction.toFixed(4));
		root.style.setProperty("--progress", initialProgress.toFixed(4));

		const initialBar = document.querySelector(progressbarSelector);
		if (initialBar) {
			initialBar.setAttribute(
				"aria-valuenow",
				String(Math.round(initialProgress * 100)),
			);
		}

		let dirty = false;
		let rafId = 0;

		const tick = () => {
			rafId = 0;
			if (!dirty) return;
			dirty = false;
			const fraction = readScrollFraction();
			const progress = honestLiar(fraction);
			root.style.setProperty("--scroll", fraction.toFixed(4));
			root.style.setProperty("--progress", progress.toFixed(4));
			const bar = document.querySelector(progressbarSelector);
			if (bar) {
				bar.setAttribute("aria-valuenow", String(Math.round(progress * 100)));
			}
		};

		const onScroll = () => {
			dirty = true;
			if (rafId === 0) {
				rafId = window.requestAnimationFrame(tick);
			}
		};

		window.addEventListener("scroll", onScroll, { passive: true });
		window.addEventListener("resize", onScroll, { passive: true });

		return () => {
			window.removeEventListener("scroll", onScroll);
			window.removeEventListener("resize", onScroll);
			if (rafId !== 0) {
				window.cancelAnimationFrame(rafId);
			}
		};
	}, [progressbarSelector]);
}
