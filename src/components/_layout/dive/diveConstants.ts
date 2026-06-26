export type DiveTechnique =
	| "glide"
	| "swoop"
	| "bank-hold"
	| "handheld"
	| "lens-warp";

export type DiveRenderState = {
	u: 0 | 1;
	origin: string;
	technique: DiveTechnique;
	focalDepth: number;
	blurStrength: number;
};

export const TRUE_NIGHT_DIVE_THRESHOLD = 0.8;
export const BASE_DIVE_BLUR = 5;
export const DIVE_DEPTH = 0.28;
export const DIVE_DURATION_MS = 760;
export const DIVE_ZK = 4.6;
export const DIVE_PARALLAX = 0.8;
