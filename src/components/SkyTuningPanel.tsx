import { useState } from "react";
import {
	CELESTIAL_PRESETS,
	type CelestialParams,
	type CelestialState,
	DEFAULT_CELESTIAL,
} from "../data/celestial";
import {
	applyMonotonicClamp,
	type ClampField,
	type SkyCurve,
} from "../data/skyCurve";
import { DualRangeSlider } from "./DualRangeSlider";

export const SKY_PANEL_TITLE_ID = "sky-panel-title";

const CELESTIAL_FIELD_META: Record<
	keyof CelestialParams,
	{ min: number; max: number }
> = {
	startX: { min: 0, max: 100 },
	startY: { min: 0, max: 100 },
	endX: { min: 0, max: 100 },
	endY: { min: 0, max: 100 },
	arcLift: { min: -30, max: 30 },
};

type SkyTuningPanelProps = {
	state: CelestialState;
	onChange: (s: CelestialState) => void;
	onClose: () => void;
};

export function SkyTuningPanel({
	state,
	onChange,
	onClose,
}: SkyTuningPanelProps) {
	const [copied, setCopied] = useState(false);

	const updateField = (
		body: "sun" | "moon",
		key: keyof CelestialParams,
		value: number,
	) => {
		onChange({ ...state, [body]: { ...state[body], [key]: value } });
	};

	const updateCurve = (next: SkyCurve) => {
		onChange({ ...state, curve: next });
	};

	const updateCurveWindow = (field: ClampField, value: number) => {
		updateCurve(applyMonotonicClamp(field, value, state.curve));
	};

	const copyValues = async () => {
		try {
			await navigator.clipboard.writeText(JSON.stringify(state, null, 2));
			setCopied(true);
			setTimeout(() => setCopied(false), 1500);
		} catch {
			// clipboard unavailable
		}
	};

	return (
		<div className="relative w-full h-full text-slate-900 bg-white overflow-y-auto">
			<button
				type="button"
				onClick={onClose}
				aria-label="Close"
				className="absolute top-2 right-2 z-10 w-9 h-9 flex items-center justify-center bg-white text-slate-900 border-2 border-slate-900 font-black text-lg leading-none hover:bg-slate-900 hover:text-white transition-colors"
			>
				×
			</button>

			<div className="px-6 pt-6 pb-6 font-mono">
				<h2
					id={SKY_PANEL_TITLE_ID}
					className="text-3xl font-black uppercase tracking-tighter mb-2"
				>
					Tune the Sky
				</h2>
				<p className="text-sm opacity-70 mb-8 font-sans">
					Move the sun and moon arcs across the scroll journey.
				</p>

				<div className="mb-6">
					<div className="text-[10px] uppercase font-bold opacity-60 mb-2">
						Presets
					</div>
					<div className="flex flex-wrap gap-2">
						{Object.entries(CELESTIAL_PRESETS).map(([name, preset]) => (
							<button
								key={name}
								type="button"
								onClick={() => onChange({ ...preset, curve: state.curve })}
								className="px-3 py-1.5 bg-slate-100 hover:bg-slate-900 hover:text-white border border-slate-900 font-bold uppercase text-[10px] tracking-wider transition-colors"
							>
								{name}
							</button>
						))}
					</div>
				</div>

				{(["sun", "moon"] as const).map((body) => (
					<div key={body} className="mb-6">
						<div className="font-black uppercase text-sm mb-3 tracking-wider">
							{body === "sun" ? "☀ Sun" : "☾ Moon"}
						</div>
						{(
							Object.keys(CELESTIAL_FIELD_META) as Array<keyof CelestialParams>
						).map((key) => {
							const value = state[body][key];
							const { min, max } = CELESTIAL_FIELD_META[key];
							const rangeId = `celestial-${body}-${key}-range`;
							const numberId = `celestial-${body}-${key}-number`;
							return (
								<div key={key} className="flex items-center gap-2 mb-2">
									<label
										htmlFor={rangeId}
										className="w-20 text-[10px] uppercase opacity-70"
									>
										{key}
									</label>
									<input
										id={rangeId}
										type="range"
										min={min}
										max={max}
										value={value}
										onChange={(e) =>
											updateField(body, key, Number(e.target.value))
										}
										className="flex-1 accent-slate-900"
									/>
									<input
										id={numberId}
										aria-label={`${body} ${key} value`}
										type="number"
										min={min}
										max={max}
										value={value}
										onChange={(e) =>
											updateField(body, key, Number(e.target.value))
										}
										className="w-14 px-1 border border-slate-300 text-right text-xs"
									/>
								</div>
							);
						})}
					</div>
				))}

				<div className="mb-6">
					<div className="flex items-center justify-between mb-3">
						<div className="font-black uppercase text-sm tracking-wider">
							Sky Curve
						</div>
						<button
							type="button"
							role="switch"
							aria-checked={state.curve.enabled}
							onClick={() =>
								updateCurve({ ...state.curve, enabled: !state.curve.enabled })
							}
							className="border-2 border-slate-900 px-3 py-1 font-black uppercase text-[10px] tracking-wider bg-slate-900 text-white aria-checked:bg-white aria-checked:text-slate-900 hover:opacity-90 transition-colors"
						>
							{state.curve.enabled ? "ON" : "OFF"}
						</button>
					</div>

					<div
						className={
							state.curve.enabled ? undefined : "opacity-50 pointer-events-none"
						}
					>
						<div className="mb-3">
							<div className="flex items-center justify-between mb-1">
								<div className="text-[10px] uppercase opacity-70">
									Phase 1 · noon → dusk
								</div>
								<div className="text-[10px] font-bold tabular-nums opacity-80">
									{state.curve.phase1[0].toFixed(3)} -{" "}
									{state.curve.phase1[1].toFixed(3)}
								</div>
							</div>
							<DualRangeSlider
								startValue={state.curve.phase1[0]}
								endValue={state.curve.phase1[1]}
								onChange={(s, e) => {
									if (s !== state.curve.phase1[0]) updateCurveWindow("p1s", s);
									else if (e !== state.curve.phase1[1])
										updateCurveWindow("p1e", e);
								}}
								startAriaLabel="Phase 1 start"
								endAriaLabel="Phase 1 end"
								disabled={!state.curve.enabled}
							/>
						</div>

						<div className="mb-3">
							<div className="flex items-center justify-between mb-1">
								<div className="text-[10px] uppercase opacity-70">
									Phase 2 · dusk → night
								</div>
								<div className="text-[10px] font-bold tabular-nums opacity-80">
									{state.curve.phase2[0].toFixed(3)} -{" "}
									{state.curve.phase2[1].toFixed(3)}
								</div>
							</div>
							<DualRangeSlider
								startValue={state.curve.phase2[0]}
								endValue={state.curve.phase2[1]}
								onChange={(s, e) => {
									if (s !== state.curve.phase2[0]) updateCurveWindow("p2s", s);
									else if (e !== state.curve.phase2[1])
										updateCurveWindow("p2e", e);
								}}
								startAriaLabel="Phase 2 start"
								endAriaLabel="Phase 2 end"
								disabled={!state.curve.enabled}
							/>
						</div>

						<div className="flex items-center gap-2 mb-2">
							<label
								htmlFor="sky-curve-boost-range"
								className="w-20 text-[10px] uppercase opacity-70"
							>
								boost
							</label>
							<input
								id="sky-curve-boost-range"
								type="range"
								min={0}
								max={1.5}
								step={0.01}
								value={state.curve.boost}
								onChange={(e) =>
									updateCurve({ ...state.curve, boost: Number(e.target.value) })
								}
								className="flex-1 accent-slate-900"
								disabled={!state.curve.enabled}
							/>
							<input
								aria-label="sky curve boost value"
								type="number"
								min={0}
								max={1.5}
								step={0.01}
								value={state.curve.boost}
								onChange={(e) =>
									updateCurve({ ...state.curve, boost: Number(e.target.value) })
								}
								className="w-14 px-1 border border-slate-300 text-right text-xs"
								disabled={!state.curve.enabled}
							/>
						</div>
					</div>
				</div>

				<div className="flex gap-2 mt-6">
					<button
						type="button"
						onClick={copyValues}
						className="flex-1 bg-slate-900 text-white px-3 py-2 font-bold uppercase text-[10px] tracking-wider hover:bg-slate-700 transition-colors"
					>
						{copied ? "Copied!" : "Copy JSON"}
					</button>
					<button
						type="button"
						onClick={() => onChange(DEFAULT_CELESTIAL)}
						className="px-3 py-2 border-2 border-slate-900 font-bold uppercase text-[10px] tracking-wider hover:bg-slate-100"
					>
						Reset
					</button>
				</div>
			</div>
		</div>
	);
}
