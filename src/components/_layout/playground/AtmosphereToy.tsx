// The atmospheric-playground toy (wayfinder #38 / #32). A visitor toy centred on
// the living sky: a compact on-brand dial (bottom-left) opens a delicate popover
// with three controls, all driving the real scene:
//
//   - time of day  : soft time-slice override (scroll still gently animates)
//   - world palette : recolours sky anchors + landscape + sun; minimap mirrors
//   - celestial extras : extra moon / dense stars / shooting star
//
// No cross-reload persistence. The form (compact opener + popover) won the #38
// prototype walk over the diegetic grab-the-sun and the persistent edge-strip.

import { Moon, RotateCcw, Sparkles, Sun } from "lucide-react";
import { useMemo, useState } from "react";
import {
	clamp01,
	DEFAULT_SKY_ANCHORS,
	type RGB,
	type SkyAnchors,
} from "../../../data/skyCurve";

// ---------------------------------------------------------------------------
// Palettes - one-tap worlds. Each recolours the three sky anchors, the
// landscape fill, and (for the alien worlds) the sun disc.
// ---------------------------------------------------------------------------

export type PaletteKey = "earth" | "rust" | "verdant" | "aurora";

type Palette = {
	key: PaletteKey;
	label: string;
	world: "World" | "Alien";
	anchors: SkyAnchors;
	landscape: string;
	sun?: { bg: string; border: string };
};

export const PALETTES: Record<PaletteKey, Palette> = {
	earth: {
		key: "earth",
		label: "Earth",
		world: "World",
		anchors: DEFAULT_SKY_ANCHORS,
		landscape: "#4a7a8c",
	},
	rust: {
		key: "rust",
		label: "Rust",
		world: "Alien",
		anchors: {
			noon: { r: 222, g: 150, b: 120 },
			dusk: { r: 150, g: 60, b: 40 },
			night: { r: 30, g: 8, b: 12 },
		},
		landscape: "#6b3b2e",
		sun: { bg: "#ffd9a8", border: "#ffb066" },
	},
	verdant: {
		key: "verdant",
		label: "Verdant",
		world: "Alien",
		anchors: {
			noon: { r: 120, g: 200, b: 180 },
			dusk: { r: 170, g: 180, b: 80 },
			night: { r: 10, g: 30, b: 25 },
		},
		landscape: "#2f5d4a",
		sun: { bg: "#e6ff9e", border: "#b6e05a" },
	},
	aurora: {
		key: "aurora",
		label: "Aurora",
		world: "Alien",
		anchors: {
			noon: { r: 180, g: 190, b: 235 },
			dusk: { r: 200, g: 120, b: 190 },
			night: { r: 25, g: 12, b: 60 },
		},
		landscape: "#3a3a6a",
		sun: { bg: "#e9dcff", border: "#c9a8ff" },
	},
};

export const PALETTE_ORDER: PaletteKey[] = [
	"earth",
	"rust",
	"verdant",
	"aurora",
];

export const paletteAnchorsFor = (k: PaletteKey): SkyAnchors =>
	PALETTES[k].anchors;

export const paletteVisualsFor = (
	k: PaletteKey,
): { landscape: string; sun: { bg: string; border: string } | undefined } => ({
	landscape: PALETTES[k].landscape,
	sun: PALETTES[k].sun,
});

const rgbCss = (c: RGB) => `rgb(${c.r},${c.g},${c.b})`;
const paletteSwatchGradient = (k: PaletteKey) => {
	const a = PALETTES[k].anchors;
	return `linear-gradient(to bottom, ${rgbCss(a.noon)}, ${rgbCss(a.dusk)}, ${rgbCss(a.night)})`;
};

// ---------------------------------------------------------------------------
// Soft time-slice override (#32): holding a time still lets scroll gently
// animate a thin slice around it, rather than hard-freezing the sky.
// ---------------------------------------------------------------------------

export const SOFT_SLICE_SPAN = 0.12;
export function softSlice(time: number, scroll: number): number {
	return clamp01(time + (scroll - 0.5) * SOFT_SLICE_SPAN);
}

const timeLabel = (t: number): string => {
	if (t < 0.15) return "Bright day";
	if (t < 0.4) return "Afternoon";
	if (t < 0.55) return "Golden dusk";
	if (t < 0.8) return "Twilight";
	return "Deep night";
};

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

export type PlaygroundExtras = {
	extraMoon: boolean;
	denseStars: boolean;
	shootingStar: boolean;
};

export type PlaygroundState = {
	time: number | null; // null = live (scroll-driven)
	palette: PaletteKey;
	extras: PlaygroundExtras;
};

export const DEFAULT_PLAYGROUND: PlaygroundState = {
	time: null,
	palette: "earth",
	extras: { extraMoon: false, denseStars: false, shootingStar: false },
};

export type PlaygroundApi = {
	setTime: (t: number | null) => void;
	setPalette: (p: PaletteKey) => void;
	toggleExtra: (k: keyof PlaygroundExtras) => void;
	reset: () => void;
};

export function usePlayground(): [PlaygroundState, PlaygroundApi] {
	const [state, setState] = useState<PlaygroundState>(DEFAULT_PLAYGROUND);
	const api = useMemo<PlaygroundApi>(
		() => ({
			setTime: (t) => setState((s) => ({ ...s, time: t })),
			setPalette: (p) => setState((s) => ({ ...s, palette: p })),
			toggleExtra: (k) =>
				setState((s) => ({
					...s,
					extras: { ...s.extras, [k]: !s.extras[k] },
				})),
			reset: () => setState(DEFAULT_PLAYGROUND),
		}),
		[],
	);
	return [state, api];
}

// ---------------------------------------------------------------------------
// Control pieces - delicate, atmospheric, legible over any sky.
// ---------------------------------------------------------------------------

const PANEL =
	"rounded-2xl border border-white/20 bg-slate-900/70 backdrop-blur-md text-white shadow-[0_8px_30px_rgba(0,0,0,0.35)]";
const LABEL = "text-[10px] font-bold uppercase tracking-[0.15em] text-white/60";

function TimeScrubber({
	value,
	live,
	onChange,
	onClear,
}: {
	value: number | null;
	live: number;
	onChange: (t: number) => void;
	onClear: () => void;
}) {
	const shown = value ?? live;
	return (
		<div className="space-y-1.5">
			<div className="flex items-center justify-between">
				<span className={LABEL}>Time of day</span>
				<span className="text-[11px] font-semibold text-white/80">
					{value == null ? "Live · scroll" : timeLabel(value)}
				</span>
			</div>
			<div className="flex items-center gap-2">
				<Sun size={14} className="shrink-0 text-yellow-200/80" aria-hidden />
				<input
					type="range"
					min={0}
					max={1}
					step={0.001}
					value={shown}
					onChange={(e) => onChange(Number(e.target.value))}
					aria-label="Time of day"
					className="atmosphere-range h-1.5 w-full cursor-pointer appearance-none rounded-full"
					style={{
						background:
							"linear-gradient(to right,#8ecae6 0%,#f4a460 45%,#140a32 100%)",
					}}
				/>
				<Moon size={13} className="shrink-0 text-slate-200/80" aria-hidden />
			</div>
			{value != null && (
				<button
					type="button"
					onClick={onClear}
					className="text-[10px] font-semibold uppercase tracking-widest text-white/50 hover:text-white/90"
				>
					Back to live
				</button>
			)}
		</div>
	);
}

function PaletteSwatches({
	value,
	onChange,
}: {
	value: PaletteKey;
	onChange: (p: PaletteKey) => void;
}) {
	return (
		<div className="space-y-1.5">
			<span className={LABEL}>World</span>
			<div className="flex gap-2">
				{PALETTE_ORDER.map((k) => {
					const active = value === k;
					return (
						<button
							key={k}
							type="button"
							onClick={() => onChange(k)}
							aria-pressed={active}
							title={`${PALETTES[k].world} · ${PALETTES[k].label}`}
							className={`h-8 w-8 shrink-0 rounded-full transition-transform hover:scale-110 ${
								active
									? "ring-2 ring-white ring-offset-2 ring-offset-slate-900/0"
									: "ring-1 ring-white/25"
							}`}
							style={{ background: paletteSwatchGradient(k) }}
						>
							<span className="sr-only">{PALETTES[k].label}</span>
						</button>
					);
				})}
			</div>
			<div className="text-[11px] font-semibold text-white/70">
				{PALETTES[value].world} · {PALETTES[value].label}
			</div>
		</div>
	);
}

const EXTRA_META: { key: keyof PlaygroundExtras; label: string }[] = [
	{ key: "extraMoon", label: "Extra moon" },
	{ key: "denseStars", label: "Dense stars" },
	{ key: "shootingStar", label: "Shooting star" },
];

function ExtrasToggles({
	value,
	onToggle,
}: {
	value: PlaygroundExtras;
	onToggle: (k: keyof PlaygroundExtras) => void;
}) {
	return (
		<div className="space-y-1.5">
			<span className={LABEL}>Celestial extras</span>
			<div className="flex flex-wrap gap-1.5">
				{EXTRA_META.map(({ key, label }) => {
					const on = value[key];
					return (
						<button
							key={key}
							type="button"
							onClick={() => onToggle(key)}
							aria-pressed={on}
							className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold transition-colors ${
								on
									? "bg-white text-slate-900"
									: "bg-white/10 text-white/70 hover:bg-white/20"
							}`}
						>
							<Sparkles size={11} aria-hidden />
							{label}
						</button>
					);
				})}
			</div>
		</div>
	);
}

// ---------------------------------------------------------------------------
// The toy: compact dial (bottom-left) + popover with all three controls.
// ---------------------------------------------------------------------------

export function AtmosphereToy({
	playground,
	api,
	live,
	isNight,
}: {
	playground: PlaygroundState;
	api: PlaygroundApi;
	live: number;
	isNight: boolean;
}) {
	const [open, setOpen] = useState(false);
	return (
		<div className="fixed bottom-4 left-4 z-50">
			<style
				// biome-ignore lint/security/noDangerouslySetInnerHtml: scoped range-thumb styling
				dangerouslySetInnerHTML={{
					__html: `
						.atmosphere-range::-webkit-slider-thumb {
							-webkit-appearance: none; appearance: none;
							width: 14px; height: 14px; border-radius: 9999px;
							background: #fff; border: 2px solid rgba(15,23,42,0.6);
							box-shadow: 0 1px 4px rgba(0,0,0,0.4); cursor: pointer;
						}
						.atmosphere-range::-moz-range-thumb {
							width: 14px; height: 14px; border-radius: 9999px;
							background: #fff; border: 2px solid rgba(15,23,42,0.6);
							box-shadow: 0 1px 4px rgba(0,0,0,0.4); cursor: pointer;
						}
					`,
				}}
			/>
			{open && (
				<div className={`mb-3 w-72 space-y-4 p-4 ${PANEL}`}>
					<div className="flex items-center justify-between">
						<span className="text-xs font-black uppercase tracking-[0.2em]">
							Atmosphere
						</span>
						<button
							type="button"
							onClick={api.reset}
							className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-widest text-white/50 hover:text-white/90"
						>
							<RotateCcw size={11} aria-hidden />
							Reset
						</button>
					</div>
					<TimeScrubber
						value={playground.time}
						live={live}
						onChange={api.setTime}
						onClear={() => api.setTime(null)}
					/>
					<PaletteSwatches
						value={playground.palette}
						onChange={api.setPalette}
					/>
					<ExtrasToggles value={playground.extras} onToggle={api.toggleExtra} />
				</div>
			)}
			<button
				type="button"
				onClick={() => setOpen((v) => !v)}
				aria-label="Atmosphere toy"
				aria-expanded={open}
				className="grid h-12 w-12 place-items-center rounded-full border border-white/30 bg-slate-900/60 text-white backdrop-blur-md shadow-[0_6px_20px_rgba(0,0,0,0.35)] transition-transform hover:scale-105"
			>
				{isNight ? (
					<Moon size={20} className="text-slate-100" aria-hidden />
				) : (
					<Sun size={20} className="text-yellow-200" aria-hidden />
				)}
			</button>
		</div>
	);
}
