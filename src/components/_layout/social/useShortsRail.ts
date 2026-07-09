import { useCallback, useEffect, useRef } from "react";
import { useReducedMotion } from "../dive/useReducedMotion";

const AUTO_MS = 3500;
const SPRING_MS = 620;

function easeOutBack(t: number): number {
	const c1 = 1.70158;
	const c3 = c1 + 1;
	return 1 + c3 * (t - 1) ** 3 + c1 * (t - 1) ** 2;
}

// Left offset of a rail child relative to the first child. offsetLeft is
// measured against the shared offsetParent, so the difference is rail-local.
function childLeft(rail: HTMLElement, index: number): number {
	const child = rail.children[index] as HTMLElement | undefined;
	const first = rail.children[0] as HTMLElement | undefined;
	if (!child || !first) return 0;
	return child.offsetLeft - first.offsetLeft;
}

// Card slots are uniform, so one step is the offset gap between the first
// two children. In jsdom (and before first layout) every offset is 0; the
// zero/non-finite guard pins the index to 0 and skips scroll writes so
// round(scrollLeft / 0) never produces a NaN scrollLeft assignment.
function stepSize(rail: HTMLElement): number {
	const first = rail.children[0] as HTMLElement | undefined;
	if (!first) return 0;
	const step =
		rail.children.length > 1 ? childLeft(rail, 1) : first.offsetWidth;
	return Number.isFinite(step) && step > 0 ? step : 0;
}

// springTo clamps every target to maxScroll, so once the rail is at (or
// within a hairline of) its right edge, the only way forward is to loop
// back to the start rather than request an index that can never be reached.
function atMaxScroll(rail: HTMLElement): boolean {
	return rail.scrollLeft >= rail.scrollWidth - rail.clientWidth - 1;
}

// Behavioral port of the prototype's wireHeroRail: easeOutBack spring,
// 3.5s auto-advance, pause on hover/focus/pointer-drag, instant jumps (and
// no auto-advance at all) under reduced motion. All window access lives in
// effects and event handlers, so SSR renders never touch it.
export function useShortsRail() {
	const railRef = useRef<HTMLDivElement>(null);
	const reducedMotion = useReducedMotion();
	const rafRef = useRef<number | null>(null);
	const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
	const draggingRef = useRef(false);
	const hoverRef = useRef(false);
	const focusRef = useRef(false);

	const cancelSpring = useCallback(() => {
		if (rafRef.current !== null) {
			cancelAnimationFrame(rafRef.current);
			rafRef.current = null;
		}
	}, []);

	const springTo = useCallback(
		(target: number) => {
			const rail = railRef.current;
			if (!rail) return;
			cancelSpring();
			const maxScroll = Math.max(0, rail.scrollWidth - rail.clientWidth);
			const clamped = Math.max(0, Math.min(maxScroll, target));
			if (reducedMotion) {
				rail.scrollLeft = clamped;
				return;
			}
			const start = rail.scrollLeft;
			const delta = clamped - start;
			const t0 = performance.now();
			const step = (now: number) => {
				const t = Math.min(1, (now - t0) / SPRING_MS);
				rail.scrollLeft = start + delta * easeOutBack(t);
				rafRef.current = t < 1 ? requestAnimationFrame(step) : null;
			};
			rafRef.current = requestAnimationFrame(step);
		},
		[cancelSpring, reducedMotion],
	);

	const currentIndex = useCallback(() => {
		const rail = railRef.current;
		if (!rail) return 0;
		const step = stepSize(rail);
		if (step === 0) return 0;
		return Math.round(rail.scrollLeft / step);
	}, []);

	const goTo = useCallback(
		(index: number) => {
			const rail = railRef.current;
			if (!rail) return;
			const count = rail.children.length;
			if (count === 0 || stepSize(rail) === 0) return;
			const wrapped = ((index % count) + count) % count;
			springTo(wrapped === 0 ? 0 : childLeft(rail, wrapped));
		},
		[springTo],
	);

	const stopAuto = useCallback(() => {
		if (timerRef.current !== null) {
			clearInterval(timerRef.current);
			timerRef.current = null;
		}
	}, []);

	const startAuto = useCallback(() => {
		if (reducedMotion) return;
		stopAuto();
		timerRef.current = setInterval(() => {
			const rail = railRef.current;
			if (rail && atMaxScroll(rail)) {
				goTo(0);
			} else {
				goTo(currentIndex() + 1);
			}
		}, AUTO_MS);
	}, [reducedMotion, stopAuto, goTo, currentIndex]);

	// Pause is governed by whole-carousel state (hover, focus-within, or an
	// active drag) rather than by individual handlers restarting the timer,
	// so the arrows and rail agree on when auto-advance should run.
	const syncAuto = useCallback(() => {
		if (draggingRef.current || hoverRef.current || focusRef.current) {
			stopAuto();
		} else {
			startAuto();
		}
	}, [stopAuto, startAuto]);

	const next = useCallback(() => {
		const rail = railRef.current;
		if (rail && atMaxScroll(rail)) {
			goTo(0);
		} else {
			goTo(currentIndex() + 1);
		}
	}, [goTo, currentIndex]);

	const prev = useCallback(() => {
		goTo(currentIndex() - 1);
	}, [goTo, currentIndex]);

	useEffect(() => {
		syncAuto();
		const onPointerRelease = () => {
			if (draggingRef.current) {
				draggingRef.current = false;
				syncAuto();
			}
		};
		window.addEventListener("pointerup", onPointerRelease);
		window.addEventListener("pointercancel", onPointerRelease);
		return () => {
			stopAuto();
			cancelSpring();
			window.removeEventListener("pointerup", onPointerRelease);
			window.removeEventListener("pointercancel", onPointerRelease);
		};
	}, [stopAuto, cancelSpring, syncAuto]);

	const onPointerDown = useCallback(() => {
		draggingRef.current = true;
		stopAuto();
		cancelSpring();
	}, [stopAuto, cancelSpring]);

	const onMouseEnter = useCallback(() => {
		hoverRef.current = true;
		syncAuto();
	}, [syncAuto]);

	const onMouseLeave = useCallback(() => {
		hoverRef.current = false;
		syncAuto();
	}, [syncAuto]);

	const onFocus = useCallback(() => {
		focusRef.current = true;
		syncAuto();
	}, [syncAuto]);

	const onBlur = useCallback(() => {
		focusRef.current = false;
		syncAuto();
	}, [syncAuto]);

	const onKeyDown = useCallback(
		(e: React.KeyboardEvent<HTMLDivElement>) => {
			if (e.key === "ArrowRight") {
				next();
				e.preventDefault();
			}
			if (e.key === "ArrowLeft") {
				prev();
				e.preventDefault();
			}
		},
		[next, prev],
	);

	return {
		railRef,
		wrapProps: {
			onMouseEnter,
			onMouseLeave,
			onFocus,
			onBlur,
		},
		railProps: {
			tabIndex: 0,
			role: "region" as const,
			"aria-label": "Latest Shorts - use arrow keys to scroll",
			onPointerDown,
			onKeyDown,
		},
		prev,
		next,
	};
}
