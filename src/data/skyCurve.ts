export type RGB = { r: number; g: number; b: number };
export type HSL = { h: number; s: number; l: number };
export type SkyCurve = {
	enabled: boolean;
	phase1: [number, number];
	phase2: [number, number];
	boost: number;
};

export const SKY_NOON: RGB = { r: 135, g: 206, b: 235 };
export const SKY_DUSK: RGB = { r: 244, g: 164, b: 96 };
export const SKY_NIGHT: RGB = { r: 20, g: 10, b: 50 };

// Scroll progress at which nav, footer, and section headers invert to white.
// Decoupled from the sky curve so the day→night background timing stays put;
// the dusk sky is still too light for white text right when the night
// transition begins, so the UI flip lands a bit later than the sky shift.
export const NIGHT_UI_THRESHOLD = 0.55;

export const LEGACY_NEUTRAL_PARAMS: SkyCurve = {
	enabled: true,
	phase1: [0, 0.5],
	phase2: [0.5, 1],
	boost: 0,
};

export const DEFAULT_SKY_CURVE: SkyCurve = {
	enabled: true,
	phase1: [0.162, 0.436],
	phase2: [0.466, 0.787],
	boost: 0.8,
};

export function clamp01(x: number): number {
	return Math.max(0, Math.min(1, x));
}

// Canonical scroll-progress formula: the single source both the live sky
// driver (_layout.tsx) and the mount-frozen section phase read from.
export function scrollProgressAt(
	scrollY: number,
	scrollHeight: number,
	innerHeight: number,
): number {
	const total = scrollHeight - innerHeight;
	return total > 0 ? clamp01(scrollY / total) : 0;
}

// Progress at the scroll position that centers `centerY` in the viewport.
export function sectionProgressAt(
	centerY: number,
	scrollHeight: number,
	innerHeight: number,
): number {
	return scrollProgressAt(centerY - innerHeight / 2, scrollHeight, innerHeight);
}

export function bell(t: number): number {
	return Math.sin(t * Math.PI);
}

export function lerpRgb(a: RGB, b: RGB, t: number): RGB {
	return {
		r: Math.round(a.r + (b.r - a.r) * t),
		g: Math.round(a.g + (b.g - a.g) * t),
		b: Math.round(a.b + (b.b - a.b) * t),
	};
}

export function rgbToHsl(rgb: RGB): HSL {
	const r = rgb.r / 255;
	const g = rgb.g / 255;
	const b = rgb.b / 255;
	const max = Math.max(r, g, b);
	const min = Math.min(r, g, b);
	let h = 0;
	let s = 0;
	const l = (max + min) / 2;
	if (max !== min) {
		const d = max - min;
		s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
		switch (max) {
			case r:
				h = (g - b) / d + (g < b ? 6 : 0);
				break;
			case g:
				h = (b - r) / d + 2;
				break;
			case b:
				h = (r - g) / d + 4;
				break;
		}
		h /= 6;
	}
	return { h, s, l };
}

export function hslToRgb(hsl: HSL): RGB {
	const { h, s, l } = hsl;
	if (s === 0) {
		const v = Math.round(l * 255);
		return { r: v, g: v, b: v };
	}
	const hue2rgb = (p: number, q: number, t: number): number => {
		let tt = t;
		if (tt < 0) tt += 1;
		if (tt > 1) tt -= 1;
		if (tt < 1 / 6) return p + (q - p) * 6 * tt;
		if (tt < 1 / 2) return q;
		if (tt < 2 / 3) return p + (q - p) * (2 / 3 - tt) * 6;
		return p;
	};
	const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
	const p = 2 * l - q;
	return {
		r: Math.round(hue2rgb(p, q, h + 1 / 3) * 255),
		g: Math.round(hue2rgb(p, q, h) * 255),
		b: Math.round(hue2rgb(p, q, h - 1 / 3) * 255),
	};
}

export function boostSat(rgb: RGB, boost: number, weight: number): RGB {
	const hsl = rgbToHsl(rgb);
	hsl.s = clamp01(hsl.s * (1 + boost * weight));
	return hslToRgb(hsl);
}

export function rgbToCss(rgb: RGB): string {
	return `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`;
}

export function skyAt(p: number, curve: SkyCurve): string {
	const eff = curve.enabled ? curve : LEGACY_NEUTRAL_PARAMS;
	const [s1, e1] = eff.phase1;
	const [s2, e2] = eff.phase2;
	if (p <= s1) return rgbToCss(SKY_NOON);
	if (p < e1) {
		const t = (p - s1) / (e1 - s1);
		return rgbToCss(
			boostSat(lerpRgb(SKY_NOON, SKY_DUSK, t), eff.boost, bell(t)),
		);
	}
	if (p <= s2) return rgbToCss(SKY_DUSK);
	if (p < e2) {
		const t = (p - s2) / (e2 - s2);
		return rgbToCss(
			boostSat(lerpRgb(SKY_DUSK, SKY_NIGHT, t), eff.boost, bell(t)),
		);
	}
	return rgbToCss(SKY_NIGHT);
}

export type ClampField = "p1s" | "p1e" | "p2s" | "p2e";

export function applyMonotonicClamp(
	field: ClampField,
	value: number,
	curve: SkyCurve,
	minGap: number = 0.001,
): SkyCurve {
	const arr: [number, number, number, number] = [
		curve.phase1[0],
		curve.phase1[1],
		curve.phase2[0],
		curve.phase2[1],
	];
	const idx =
		field === "p1s" ? 0 : field === "p1e" ? 1 : field === "p2s" ? 2 : 3;
	arr[idx] = clamp01(value);
	// Push forward: ensure each subsequent value is at least minGap larger
	for (let i = idx + 1; i < 4; i++) {
		const prev = arr[i - 1] as number;
		const cur = arr[i] as number;
		if (cur < prev + minGap) {
			arr[i] = clamp01(prev + minGap);
		}
	}
	// Push backward: ensure each previous value is at least minGap smaller
	for (let i = idx - 1; i >= 0; i--) {
		const next = arr[i + 1] as number;
		const cur = arr[i] as number;
		if (cur > next - minGap) {
			arr[i] = clamp01(next - minGap);
		}
	}
	return {
		enabled: curve.enabled,
		phase1: [arr[0], arr[1]],
		phase2: [arr[2], arr[3]],
		boost: curve.boost,
	};
}
