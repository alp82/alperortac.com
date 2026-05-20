import type { CelestialState } from "../../data/celestial";

export const SUN_WINDOW = { start: 0, end: 0.65 };
export const MOON_WINDOW = { start: 0.45, end: 1.0 };

export function windowedProgress(
	p: number,
	win: { start: number; end: number },
) {
	const range = win.end - win.start;
	if (range <= 0) return 0;
	return Math.min(Math.max((p - win.start) / range, 0), 1);
}

export function celestialPosition(
	localProgress: number,
	params: CelestialState["sun"],
) {
	const x = params.startX + (params.endX - params.startX) * localProgress;
	const yLinear = params.startY + (params.endY - params.startY) * localProgress;
	const y = yLinear - Math.sin(localProgress * Math.PI) * params.arcLift;
	return { x, y };
}

export function sunOpacityAt(p: number) {
	return p < 0.45 ? 1 : Math.max(0, 1 - (p - 0.45) / 0.2);
}

export function moonOpacityAt(p: number) {
	return p < 0.5 ? 0 : Math.min(1, (p - 0.5) / 0.2);
}
