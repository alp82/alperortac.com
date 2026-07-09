import { useCallback, useEffect, useRef, useState } from "react";
import { useReducedMotion } from "../dive/useReducedMotion";
import {
	AUTO_ADVANCE_MS,
	atEnd,
	clampDt,
	clampOffset,
	isSettled,
	nearestIndex,
	offsetForIndex,
	offsetFromBarX,
	projectRelease,
	type SpringState,
	stepSpring,
	thumbGeometry,
	wrapIndex,
} from "./railMotion";

// Seconds a drag release is projected along its velocity before snapping to
// the nearest card, so a flick lands where the gesture was heading.
const PROJECT_S = 0.12;
// A drag past this travel suppresses the click that would otherwise open the
// card the pointer happened to land on.
const DRAG_SUPPRESS_PX = 8;
// Trackpad deltaX pauses snapping until the stream has been idle this long.
const WHEEL_IDLE_MS = 150;

type RailSizes = {
	viewportW: number;
	contentW: number;
	step: number;
	maxOffset: number;
	barW: number;
	barLeft: number;
	thumbW: number;
};

// GPU-composited port of the prototype's momentum-drift rail: the .shorts-rail
// viewport hides overflow while an inner .shorts-track strip is moved purely
// via translate3d, driven by the locked damped spring (railMotion.ts) in a
// rAF loop that idles once settled. Layout reads live in measure() (mount +
// resize only); the frame loop only writes transforms. Auto-advance pauses on
// hover/focus/drag, and reduced motion means instant jumps and no auto at
// all. All window access lives in effects and event handlers, so SSR renders
// never touch it.
export function useShortsRail() {
	const railRef = useRef<HTMLDivElement>(null);
	const trackRef = useRef<HTMLDivElement>(null);
	const barRef = useRef<HTMLDivElement>(null);
	const thumbRef = useRef<HTMLDivElement>(null);
	const offWrapRef = useRef<HTMLDivElement>(null);
	const reducedMotion = useReducedMotion();
	// Mirrors the bar's hidden-when-it-fits toggle for the prev/next arrows:
	// starts false (sane pre-measure default, matching the bar's default
	// `hidden` JSX attribute) and flips true only once measure() finds room
	// to scroll.
	const [canScroll, setCanScroll] = useState(false);

	const springRef = useRef<SpringState>({ pos: 0, vel: 0 });
	const targetRef = useRef(0);
	const indexRef = useRef(0);
	const rafRef = useRef<number | null>(null);
	const lastFrameRef = useRef(0);
	const sizesRef = useRef<RailSizes>({
		viewportW: 0,
		contentW: 0,
		step: 0,
		maxOffset: 0,
		barW: 0,
		barLeft: 0,
		thumbW: 0,
	});

	const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
	const draggingRef = useRef(false);
	const dragPointerIdRef = useRef<number | null>(null);
	const hoverRef = useRef(false);
	const focusRef = useRef(false);

	const dragStartXRef = useRef(0);
	const dragStartOffsetRef = useRef(0);
	const dragLastXRef = useRef(0);
	const dragLastTRef = useRef(0);
	const dragVelRef = useRef(0);
	const dragTravelRef = useRef(0);
	const suppressClickRef = useRef(false);
	const wheelIdleRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	// Active bar-scrub session's grab point (pointer distance from the thumb's
	// left edge); null means no bar session. The cursor swap is the only piece
	// that needs a re-render, hence the separate state flag.
	const barGrabRef = useRef<number | null>(null);
	// Whether the pointer actually scrubbed after a bar press (vs. a plain
	// click that only glides via the track-press goTo retarget). Set false on
	// every press, flipped true by onBarPointerMove's first real move.
	const barMovedRef = useRef(false);
	const [barGrabbing, setBarGrabbing] = useState(false);

	// The single write path: every mover (spring frame, drag, wheel, instant
	// jump) funnels through here so track and thumb can never disagree.
	const render = useCallback((offset: number) => {
		const track = trackRef.current;
		if (track) {
			track.style.transform = `translate3d(${-offset}px,0,0)`;
		}
		const thumb = thumbRef.current;
		if (thumb) {
			const { viewportW, contentW, barW } = sizesRef.current;
			const { widthFrac, posFrac } = thumbGeometry(viewportW, contentW, offset);
			thumb.style.transform = `translate3d(${posFrac * barW}px,0,0)`;
			const offWrap = offWrapRef.current;
			if (offWrap) {
				const leftPct = posFrac * 100;
				const rightPct = (posFrac + widthFrac) * 100;
				const mask = `linear-gradient(to right, #000 0%, #000 ${leftPct}%, transparent ${leftPct}%, transparent ${rightPct}%, #000 ${rightPct}%, #000 100%)`;
				offWrap.style.maskImage = mask;
				offWrap.style.webkitMaskImage = mask;
			}
		}
	}, []);

	const stopLoop = useCallback(() => {
		if (rafRef.current !== null) {
			cancelAnimationFrame(rafRef.current);
			rafRef.current = null;
		}
	}, []);

	const ensureLoop = useCallback(() => {
		if (rafRef.current !== null) return;
		lastFrameRef.current = performance.now();
		const frame = (now: number) => {
			const dt = clampDt((now - lastFrameRef.current) / 1000);
			lastFrameRef.current = now;
			springRef.current = stepSpring(springRef.current, targetRef.current, dt);
			if (isSettled(springRef.current, targetRef.current)) {
				springRef.current = { pos: targetRef.current, vel: 0 };
				render(springRef.current.pos);
				rafRef.current = null;
				return;
			}
			render(springRef.current.pos);
			rafRef.current = requestAnimationFrame(frame);
		};
		rafRef.current = requestAnimationFrame(frame);
	}, [render]);

	// The only place that reads layout. Card slots are uniform, so one step is
	// the gap between the first two children; in jsdom (and before first
	// layout) every measurement is 0 and the zero/non-finite guard pins the
	// step to 0, which downstream turns goTo into a no-op.
	const measure = useCallback(() => {
		const rail = railRef.current;
		const track = trackRef.current;
		if (!rail || !track) return;
		const first = track.children[0] as HTMLElement | undefined;
		const second = track.children[1] as HTMLElement | undefined;
		// Fluid card widths are fractional, so integer offsetLeft deltas miss
		// maxOffset by up to (N-3)*0.5px — outside atEnd's 1px hairline
		// (railMotion.ts) — causing an end-of-rail double-press/dead-beat.
		// Rect deltas are fractional-exact and transform-invariant (the shared
		// track translate cancels in the delta — never use an absolute .left).
		const rawStep =
			second && first
				? second.getBoundingClientRect().left -
					first.getBoundingClientRect().left
				: (first?.offsetWidth ?? 0);
		const step = Number.isFinite(rawStep) && rawStep > 0 ? rawStep : 0;
		const viewportW = rail.clientWidth;
		const contentW = track.scrollWidth;
		const maxOffset = Math.max(0, contentW - viewportW);
		const { widthFrac } = thumbGeometry(viewportW, contentW, 0);
		const bar = barRef.current;
		if (bar) {
			bar.hidden = widthFrac >= 1;
		}
		const thumb = thumbRef.current;
		if (thumb) {
			thumb.style.width = `${widthFrac * 100}%`;
		}
		const barW = bar && !bar.hidden ? bar.clientWidth : 0;
		const barLeft = bar && !bar.hidden ? bar.getBoundingClientRect().left : 0;
		const thumbW = widthFrac * barW;
		sizesRef.current = {
			viewportW,
			contentW,
			step,
			maxOffset,
			barW,
			barLeft,
			thumbW,
		};
		targetRef.current = clampOffset(targetRef.current, maxOffset);
		springRef.current.pos = clampOffset(springRef.current.pos, maxOffset);
		setCanScroll(maxOffset > 0);
		render(springRef.current.pos);
	}, [render]);

	const goTo = useCallback(
		(index: number) => {
			const track = trackRef.current;
			const count = track ? track.children.length : 0;
			const { step, maxOffset } = sizesRef.current;
			if (count === 0 || step === 0) return;
			indexRef.current = wrapIndex(index, count);
			targetRef.current = offsetForIndex(indexRef.current, step, maxOffset);
			if (reducedMotion) {
				stopLoop();
				springRef.current = { pos: targetRef.current, vel: 0 };
				render(targetRef.current);
				return;
			}
			ensureLoop();
		},
		[reducedMotion, stopLoop, render, ensureLoop],
	);

	// Targets are clamped to maxOffset, so once the rail is at (or within a
	// hairline of) its right edge, the only way forward is to loop back to
	// the start rather than request an index that can never be reached.
	const next = useCallback(() => {
		if (atEnd(targetRef.current, sizesRef.current.maxOffset)) {
			goTo(0);
		} else {
			goTo(indexRef.current + 1);
		}
	}, [goTo]);

	const prev = useCallback(() => {
		goTo(indexRef.current - 1);
	}, [goTo]);

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
			next();
		}, AUTO_ADVANCE_MS);
	}, [reducedMotion, stopAuto, next]);

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

	useEffect(() => {
		measure();
		if (typeof ResizeObserver === "undefined") {
			window.addEventListener("resize", measure);
			return () => window.removeEventListener("resize", measure);
		}
		const observer = new ResizeObserver(measure);
		const rail = railRef.current;
		if (rail) observer.observe(rail);
		return () => observer.disconnect();
	}, [measure]);

	useEffect(() => {
		syncAuto();
		const onWindowRelease = (e: PointerEvent) => {
			if (draggingRef.current && e.pointerId === dragPointerIdRef.current) {
				draggingRef.current = false;
				dragPointerIdRef.current = null;
				barGrabRef.current = null;
				setBarGrabbing(false);
				syncAuto();
			}
		};
		window.addEventListener("pointerup", onWindowRelease);
		window.addEventListener("pointercancel", onWindowRelease);
		return () => {
			stopAuto();
			stopLoop();
			window.removeEventListener("pointerup", onWindowRelease);
			window.removeEventListener("pointercancel", onWindowRelease);
		};
	}, [stopAuto, stopLoop, syncAuto]);

	// Drag mechanics per the prototype's approach 4, adapted to clamped
	// offsets (no clone wrap): pointermove drives the offset directly while
	// the spring loop is halted; release projects the tracked velocity 120ms
	// ahead, snaps to the nearest card, and seeds the spring with that
	// velocity so the glide continues the gesture instead of restarting.
	// Pointer capture is deliberately NOT taken here. In Chromium, capture
	// active at pointerup retargets the click to the capture target (the
	// rail), so a plain click on a card's <a> would never reach it. Capture
	// is instead claimed in onPointerMove, once, only after the net
	// displacement crosses the drag threshold - by then it's genuinely a
	// drag and a plain click can no longer occur.
	const onPointerDown = useCallback(
		(e: React.PointerEvent<HTMLDivElement>) => {
			if (!e.isPrimary || e.button !== 0) return;
			if (draggingRef.current) return;
			draggingRef.current = true;
			dragPointerIdRef.current = e.pointerId;
			stopAuto();
			stopLoop();
			dragStartXRef.current = e.clientX;
			dragStartOffsetRef.current = springRef.current.pos;
			dragLastXRef.current = e.clientX;
			dragLastTRef.current = performance.now();
			dragVelRef.current = 0;
			dragTravelRef.current = 0;
			suppressClickRef.current = false;
		},
		[stopAuto, stopLoop],
	);

	const onPointerMove = useCallback(
		(e: React.PointerEvent<HTMLDivElement>) => {
			if (!draggingRef.current || e.pointerId !== dragPointerIdRef.current)
				return;
			const now = performance.now();
			const { maxOffset } = sizesRef.current;
			const offset = clampOffset(
				dragStartOffsetRef.current - (e.clientX - dragStartXRef.current),
				maxOffset,
			);
			const dx = e.clientX - dragLastXRef.current;
			const dtMs = Math.max(1, now - dragLastTRef.current);
			dragVelRef.current = -dx / (dtMs / 1000);
			dragLastXRef.current = e.clientX;
			dragLastTRef.current = now;
			// Net displacement from the pointer-down origin, not accumulated
			// per-move deltas, so jitter around the origin can't cross the
			// threshold and eat a legitimate click.
			dragTravelRef.current = Math.abs(e.clientX - dragStartXRef.current);
			if (dragTravelRef.current > DRAG_SUPPRESS_PX) {
				suppressClickRef.current = true;
				const rail = railRef.current;
				if (
					rail &&
					!rail.hasPointerCapture?.(e.pointerId) &&
					typeof rail.setPointerCapture === "function"
				) {
					rail.setPointerCapture(e.pointerId);
				}
			}
			springRef.current = { pos: offset, vel: dragVelRef.current };
			render(offset);
		},
		[render],
	);

	// Shared landing for every scrub release (rail drag and bar scrub alike):
	// project the tracked velocity 120ms ahead, snap to the nearest card, and
	// either jump there (reduced motion) or seed the spring with the release
	// velocity so the glide continues the gesture instead of restarting.
	const settleRelease = useCallback(() => {
		// Pointermove doesn't fire while the pointer is stationary, so a
		// flick-then-hold-still-then-release would otherwise still project
		// the stale last-move velocity. Zero it once the pointer's been
		// still for a beat.
		if (performance.now() - dragLastTRef.current > 90) {
			dragVelRef.current = 0;
		}
		const track = trackRef.current;
		const count = track ? track.children.length : 0;
		const { step, maxOffset } = sizesRef.current;
		if (count > 0 && step > 0) {
			const offset = springRef.current.pos;
			const projected = projectRelease(offset, dragVelRef.current, PROJECT_S);
			indexRef.current = nearestIndex(projected, step, count);
			targetRef.current = offsetForIndex(indexRef.current, step, maxOffset);
			if (reducedMotion) {
				springRef.current = { pos: targetRef.current, vel: 0 };
				render(targetRef.current);
			} else {
				springRef.current = { pos: offset, vel: dragVelRef.current };
				ensureLoop();
			}
		}
		syncAuto();
	}, [reducedMotion, render, ensureLoop, syncAuto]);

	const onPointerRelease = useCallback(
		(e: React.PointerEvent<HTMLDivElement>) => {
			if (!draggingRef.current || e.pointerId !== dragPointerIdRef.current)
				return;
			draggingRef.current = false;
			dragPointerIdRef.current = null;
			settleRelease();
		},
		[settleRelease],
	);

	// A real drag must not open the card the pointer happens to release on;
	// the capture-phase listener eats exactly the one click that follows it.
	const onClickCapture = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
		if (!suppressClickRef.current) return;
		suppressClickRef.current = false;
		e.preventDefault();
		e.stopPropagation();
	}, []);

	// Bar scrub session, native-scrollbar semantics built from the cached
	// measure() geometry (zero per-frame layout reads): pressing the track
	// glides the rail to that spot via the spring (goTo), one continuous
	// motion with no instant warp; grabbing the thumb preserves the grab
	// point and scrubs live through render(). Both share the rail drag's
	// session refs, so the two gestures can never run concurrently. A real
	// scrub (barMovedRef) lands through settleRelease()'s snap; a plain
	// click just lets the goTo glide finish undisturbed.
	const onBarPointerDown = useCallback(
		(e: React.PointerEvent<HTMLDivElement>) => {
			if (!e.isPrimary || e.button !== 0) return;
			if (draggingRef.current) return;
			const { viewportW, contentW, maxOffset, barW, barLeft, thumbW } =
				sizesRef.current;
			if (maxOffset <= 0 || barW - thumbW <= 0) return;
			stopAuto();
			stopLoop();
			draggingRef.current = true;
			dragPointerIdRef.current = e.pointerId;
			const thumbLeftX =
				barLeft +
				thumbGeometry(viewportW, contentW, springRef.current.pos).posFrac *
					barW;
			const onThumb =
				e.clientX >= thumbLeftX && e.clientX <= thumbLeftX + thumbW;
			barGrabRef.current = onThumb ? e.clientX - thumbLeftX : thumbW / 2;
			barMovedRef.current = false;
			if (!onThumb) {
				// A plain track press glides via the same card-navigation path as
				// arrows/wheel/focus, so it's one continuous spring motion rather
				// than an instant warp followed by a second settle animation on
				// release. onBarPointerMove's first real move will stopLoop() so a
				// subsequent scrub takes over cleanly.
				const clickedOffset = offsetFromBarX(
					e.clientX,
					barLeft,
					barW,
					thumbW,
					barGrabRef.current,
					maxOffset,
				);
				const { step } = sizesRef.current;
				const track = trackRef.current;
				const count = track ? track.children.length : 0;
				goTo(nearestIndex(clickedOffset, step, count));
			}
			dragLastTRef.current = performance.now();
			dragVelRef.current = 0;
			// Unlike the rail, the bar holds no clickable children, so capture
			// is safe to claim immediately (jsdom-safe guard as on the rail).
			const bar = barRef.current;
			if (bar && typeof bar.setPointerCapture === "function") {
				bar.setPointerCapture(e.pointerId);
			}
			setBarGrabbing(true);
		},
		[stopAuto, stopLoop, goTo],
	);

	const onBarPointerMove = useCallback(
		(e: React.PointerEvent<HTMLDivElement>) => {
			if (
				barGrabRef.current === null ||
				e.pointerId !== dragPointerIdRef.current
			)
				return;
			if (!barMovedRef.current) {
				// First real move of this session: this is genuinely a scrub, not
				// a plain click, so the track-press glide (if any) must yield to
				// the drag rather than fight it for control of the offset.
				barMovedRef.current = true;
				stopLoop();
			}
			const now = performance.now();
			const { maxOffset, barW, barLeft, thumbW } = sizesRef.current;
			const offset = offsetFromBarX(
				e.clientX,
				barLeft,
				barW,
				thumbW,
				barGrabRef.current,
				maxOffset,
			);
			// Velocity tracked in offset space so settleRelease() projects the
			// scrub exactly like a rail flick.
			const dtMs = Math.max(1, now - dragLastTRef.current);
			dragVelRef.current = (offset - springRef.current.pos) / (dtMs / 1000);
			dragLastTRef.current = now;
			springRef.current = { pos: offset, vel: dragVelRef.current };
			render(offset);
		},
		[render, stopLoop],
	);

	const onBarPointerRelease = useCallback(
		(e: React.PointerEvent<HTMLDivElement>) => {
			if (
				barGrabRef.current === null ||
				e.pointerId !== dragPointerIdRef.current
			)
				return;
			const moved = barMovedRef.current;
			barGrabRef.current = null;
			barMovedRef.current = false;
			draggingRef.current = false;
			dragPointerIdRef.current = null;
			setBarGrabbing(false);
			if (moved) {
				// A real scrub happened: snap to the nearest card from the live
				// scrub position/velocity, same as a rail drag release.
				settleRelease();
			} else {
				// A plain click with no scrub: the track-press goTo glide from
				// onBarPointerDown is already animating toward the correct nearest
				// card, so re-snapping here would read the mid-glide spring
				// position and could land on the wrong card. But thumb-press calls
				// stopLoop() on down, so if the press landed mid-glide (e.g. during
				// auto-advance or an arrow/track-click glide), the loop must be
				// resumed here or the rail freezes between cards. No-op when the
				// loop is already running, and self-terminates on the next frame
				// if already settled.
				if (!reducedMotion) ensureLoop();
				syncAuto();
			}
		},
		[settleRelease, syncAuto, reducedMotion, ensureLoop],
	);

	// Trackpad horizontal panning needs a native non-passive listener so
	// preventDefault can stop history-swipe; React's onWheel is passive.
	// Deltas drive the offset directly, then a 150ms idle window snaps to
	// the nearest card. Vertical wheel falls through to page scroll.
	useEffect(() => {
		const rail = railRef.current;
		if (!rail) return;
		const onWheel = (e: WheelEvent) => {
			if (draggingRef.current) return;
			if (Math.abs(e.deltaX) <= Math.abs(e.deltaY)) return;
			e.preventDefault();
			stopAuto();
			stopLoop();
			const { maxOffset } = sizesRef.current;
			const offset = clampOffset(springRef.current.pos + e.deltaX, maxOffset);
			springRef.current = { pos: offset, vel: 0 };
			render(offset);
			if (wheelIdleRef.current !== null) clearTimeout(wheelIdleRef.current);
			wheelIdleRef.current = setTimeout(() => {
				wheelIdleRef.current = null;
				// A drag may have started after this timeout was armed but before
				// it fired; the wheel handler already no-ops mid-drag, but the
				// pending timeout doesn't know that. The drag's own release
				// (settleRelease) will handle the snap, so bail here.
				if (draggingRef.current) return;
				const track = trackRef.current;
				const count = track ? track.children.length : 0;
				goTo(nearestIndex(springRef.current.pos, sizesRef.current.step, count));
				syncAuto();
			}, WHEEL_IDLE_MS);
		};
		rail.addEventListener("wheel", onWheel, { passive: false });
		return () => {
			rail.removeEventListener("wheel", onWheel);
			if (wheelIdleRef.current !== null) {
				clearTimeout(wheelIdleRef.current);
				wheelIdleRef.current = null;
			}
		};
	}, [stopAuto, stopLoop, render, goTo, syncAuto]);

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

	// The viewport never scrolls by design, but the browser force-scrolls any
	// hidden-overflow container to reveal a focused descendant. Neutralize
	// that native jump and glide to the focused card via the spring instead.
	const onRailScroll = useCallback(() => {
		const rail = railRef.current;
		if (!rail) return;
		rail.scrollLeft = 0;
		rail.scrollTop = 0;
	}, []);

	const onRailFocus = useCallback(
		(e: React.FocusEvent<HTMLDivElement>) => {
			// The browser force-scrolls the hidden-overflow rail to reveal the
			// newly-focused descendant regardless of drag state, so this must
			// still run. But Chrome focuses a card's <a> on mousedown, meaning
			// a drag's pointerdown is immediately followed by a focusin - goTo
			// must not fight the in-progress drag for control of the offset.
			onRailScroll();
			if (draggingRef.current) return;
			const track = trackRef.current;
			if (!track) return;
			const index = Array.from(track.children).findIndex((child) =>
				child.contains(e.target as Node),
			);
			if (index >= 0) goTo(index);
		},
		[onRailScroll, goTo],
	);

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
		trackRef,
		barRef,
		thumbRef,
		offWrapRef,
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
			onPointerMove,
			onPointerUp: onPointerRelease,
			onPointerCancel: onPointerRelease,
			onClickCapture,
			onKeyDown,
			onFocus: onRailFocus,
			onScroll: onRailScroll,
		},
		barProps: {
			onPointerDown: onBarPointerDown,
			onPointerMove: onBarPointerMove,
			onPointerUp: onBarPointerRelease,
			onPointerCancel: onBarPointerRelease,
		},
		barGrabbing,
		prev,
		next,
		canScroll,
	};
}
