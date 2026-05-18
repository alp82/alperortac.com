import { useState } from "react";
import {
	CELESTIAL_PRESETS,
	type CelestialParams,
	type CelestialState,
	DEFAULT_CELESTIAL,
} from "../data/celestial";

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
				aria-label="Return to main path"
				className="absolute left-0 top-0 h-full w-12 bg-slate-900 text-white font-black uppercase tracking-widest text-xs flex items-center justify-center border-r-2 border-slate-900 hover:bg-slate-700 transition-colors z-10"
				style={{ writingMode: "vertical-rl" }}
			>
				Return
			</button>

			<button
				type="button"
				onClick={onClose}
				aria-label="Return to main path"
				className="absolute top-4 left-16 z-10 bg-white text-slate-900 min-h-[44px] px-3 py-3 border-2 border-slate-900 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] font-black uppercase text-xs tracking-widest hover:-translate-y-0.5 transition-transform"
			>
				← Main Path
			</button>

			<div className="pl-20 pr-6 pt-20 pb-12 max-w-2xl font-mono">
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
								onClick={() => onChange(preset)}
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
