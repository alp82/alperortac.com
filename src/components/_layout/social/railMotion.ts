// Pure, DOM-free motion math for the Shorts rail: the locked spring spec,
// its semi-implicit-Euler stepper, and the index/offset/thumb geometry the
// hook drives per frame. Behavioral port of the prototype's momentum-drift
// mount (.prototypes/shorts-carousel-motion.html). Keeping this module free
// of imports and side effects makes every branch unit-testable without jsdom.

// Locked motion spec (Decision 1): momentum drift between rest points via a
// damped spring, single source of truth for hook and tests alike.
export const SHORTS_SPRING = { stiffness: 245, damping: 37, mass: 1 } as const;
export const AUTO_ADVANCE_MS = 3500;

export type SpringState = { pos: number; vel: number };

// One semi-implicit Euler step: integrate velocity from the spring/damper
// forces first, then position from the new velocity. dt is in seconds.
export function stepSpring(
	state: SpringState,
	target: number,
	dt: number,
): SpringState {
	const accel =
		(-SHORTS_SPRING.stiffness * (state.pos - target) -
			SHORTS_SPRING.damping * state.vel) /
		SHORTS_SPRING.mass;
	const vel = state.vel + accel * dt;
	const pos = state.pos + vel * dt;
	return { pos, vel };
}

// Shared clamp for rail offsets: keeps the drag/wheel/measure sites from
// each rolling their own Math.max(0, Math.min(...)) duplicate.
export function clampOffset(offset: number, maxOffset: number): number {
	return Math.max(0, Math.min(maxOffset, offset));
}

// Cap frame deltas at 32ms so a background-tab wakeup can't explode the
// integrator; floor at 0 guards clock skew.
export function clampDt(dtSeconds: number): number {
	return Math.min(0.032, Math.max(0, dtSeconds));
}

export function isSettled(state: SpringState, target: number): boolean {
	return Math.abs(state.pos - target) < 0.3 && Math.abs(state.vel) < 5;
}

export function wrapIndex(index: number, count: number): number {
	if (count <= 0) return 0;
	return ((index % count) + count) % count;
}

// Card slots are uniform, so an index maps to index*step clamped into the
// reachable range. Zero/non-finite step (jsdom, pre-layout) pins to 0 so no
// NaN ever reaches a style write.
export function offsetForIndex(
	index: number,
	step: number,
	maxOffset: number,
): number {
	if (!Number.isFinite(step) || step <= 0) return 0;
	return clampOffset(index * step, maxOffset);
}

export function nearestIndex(
	offset: number,
	step: number,
	count: number,
): number {
	if (step <= 0) return 0;
	return Math.max(0, Math.min(count - 1, Math.round(offset / step)));
}

// Within a hairline of the right edge counts as "at the end", mirroring the
// old atMaxScroll semantics, so next() loops back instead of requesting an
// index that can never be reached.
export function atEnd(offset: number, maxOffset: number): boolean {
	return offset >= maxOffset - 1;
}

// Project a drag release a short way along its velocity so a flick lands on
// the card the gesture was heading for, not the one under the finger.
export function projectRelease(
	offset: number,
	offsetVelocity: number,
	projectionS: number,
): number {
	return offset + offsetVelocity * projectionS;
}

// Exact inverse of thumbGeometry's placement math (posFrac * barW, where the
// thumb travels barW * (1 - widthFrac) = barW - thumbW): map a pointer X on
// the bar back to a rail offset, honoring where on the thumb the grab landed
// (grabX = pointer distance from the thumb's left edge; track presses pass
// thumbW / 2 to center the thumb under the pointer). Degenerate bars - thumb
// as wide as the bar, nothing to scroll - pin to 0 so no NaN can escape.
export function offsetFromBarX(
	pointerX: number,
	barLeft: number,
	barW: number,
	thumbW: number,
	grabX: number,
	maxOffset: number,
): number {
	const usable = barW - thumbW;
	if (usable <= 0 || maxOffset <= 0) return 0;
	return clampOffset(
		((pointerX - barLeft - grabX) / usable) * maxOffset,
		maxOffset,
	);
}

// Minimap-style thumb geometry: widthFrac is the visible share of the
// content (>= 1 means it fits, hide the bar); posFrac is the thumb's left
// edge as a fraction of the bar, scaled so the thumb's right edge lands
// flush at offset === maxOffset.
export function thumbGeometry(
	viewportW: number,
	contentW: number,
	offset: number,
): { widthFrac: number; posFrac: number } {
	if (contentW <= 0) return { widthFrac: 1, posFrac: 0 };
	const widthFrac = Math.max(0, Math.min(1, viewportW / contentW));
	const maxOffset = contentW - viewportW;
	if (maxOffset <= 0) return { widthFrac, posFrac: 0 };
	const progress = Math.max(0, Math.min(1, offset / maxOffset));
	return { widthFrac, posFrac: progress * (1 - widthFrac) };
}
