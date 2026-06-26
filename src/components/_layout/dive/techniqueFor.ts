import type { DiveTechnique } from "./diveConstants";

export function techniqueFor(input: {
	isTrueNight: boolean;
	side: "left" | "right" | null;
}): DiveTechnique {
	if (input.isTrueNight) return "handheld";
	if (input.side === "left") return "swoop";
	if (input.side === "right") return "bank-hold";
	return "glide";
}

export function blurStrengthFor(isTrueNight: boolean, base: number): number {
	return isTrueNight ? base * 1.6 : base;
}
