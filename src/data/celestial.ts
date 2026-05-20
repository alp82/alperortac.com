import { DEFAULT_SKY_CURVE, type SkyCurve } from "./skyCurve";

export type CelestialParams = {
	startX: number;
	startY: number;
	endX: number;
	endY: number;
	arcLift: number;
};

export type CelestialState = {
	sun: CelestialParams;
	moon: CelestialParams;
	curve: SkyCurve;
};

export const DEFAULT_CELESTIAL: CelestialState = {
	sun: { startX: 75, startY: 12, endX: 28, endY: 58, arcLift: 8 },
	moon: { startX: 27, startY: 45, endX: 16, endY: 13, arcLift: 6 },
	curve: DEFAULT_SKY_CURVE,
};

export const CELESTIAL_PRESETS: Record<
	string,
	Pick<CelestialState, "sun" | "moon">
> = {
	Classic: { sun: DEFAULT_CELESTIAL.sun, moon: DEFAULT_CELESTIAL.moon },
	Crossover: {
		sun: { startX: 80, startY: 15, endX: 20, endY: 55, arcLift: 10 },
		moon: { startX: 20, startY: 60, endX: 75, endY: 18, arcLift: 8 },
	},
	Parallel: {
		sun: { startX: 72, startY: 10, endX: 72, endY: 60, arcLift: 14 },
		moon: { startX: 25, startY: 60, endX: 25, endY: 12, arcLift: 14 },
	},
	Centered: {
		sun: { startX: 50, startY: 15, endX: 50, endY: 70, arcLift: 0 },
		moon: { startX: 50, startY: 70, endX: 50, endY: 15, arcLift: 0 },
	},
};
