/*
 * DEV-ONLY shared control primitives for the composer panel.
 *
 * Small, dependency-free controls whose type matches the parameter semantics:
 * a segmented control for enumerated choices, a slider for numeric ranges, a
 * toggle for booleans, and color swatches for the accent/color sources. Styled
 * in the brutalist panel idiom (heavy borders, mono labels).
 *
 * Planner: removed with the rest of the composer panel.
 */

export function ControlLabel({ children }: { children: React.ReactNode }) {
	return (
		<div className="text-[9px] uppercase font-bold tracking-[0.18em] opacity-55 mb-1.5">
			{children}
		</div>
	);
}

export function Segmented<T extends string>({
	label,
	value,
	options,
	onChange,
}: {
	label: string;
	value: T;
	options: { value: T; label: string }[];
	onChange: (v: T) => void;
}) {
	return (
		<div>
			<ControlLabel>{label}</ControlLabel>
			<div className="flex flex-wrap gap-1">
				{options.map((opt) => {
					const active = opt.value === value;
					return (
						<button
							key={opt.value}
							type="button"
							onClick={() => onChange(opt.value)}
							aria-pressed={active}
							className={`px-2.5 py-1.5 text-[10px] font-black uppercase tracking-wider border-2 transition-colors ${
								active
									? "bg-slate-900 text-white border-slate-900"
									: "bg-white text-slate-700 border-slate-300 hover:border-slate-900"
							}`}
						>
							{opt.label}
						</button>
					);
				})}
			</div>
		</div>
	);
}

export function Slider({
	label,
	value,
	min,
	max,
	step = 1,
	unit = "",
	onChange,
}: {
	label: string;
	value: number;
	min: number;
	max: number;
	step?: number;
	unit?: string;
	onChange: (v: number) => void;
}) {
	return (
		<div>
			<div className="flex items-baseline justify-between">
				<ControlLabel>{label}</ControlLabel>
				<span className="text-[10px] font-mono font-bold tabular-nums">
					{value}
					{unit}
				</span>
			</div>
			<input
				type="range"
				min={min}
				max={max}
				step={step}
				value={value}
				onChange={(e) => onChange(Number(e.target.value))}
				className="cmp-slider w-full"
			/>
		</div>
	);
}

export function Toggle({
	label,
	checked,
	onChange,
}: {
	label: string;
	checked: boolean;
	onChange: (v: boolean) => void;
}) {
	return (
		<button
			type="button"
			role="switch"
			aria-checked={checked}
			onClick={() => onChange(!checked)}
			className="flex items-center justify-between gap-3 w-full text-left"
		>
			<span className="text-[9px] uppercase font-bold tracking-[0.18em] opacity-55">
				{label}
			</span>
			<span
				className={`relative inline-flex h-5 w-9 shrink-0 border-2 border-slate-900 transition-colors ${checked ? "bg-emerald-300" : "bg-white"}`}
			>
				<span
					className={`absolute top-0 h-3.5 w-3.5 bg-slate-900 transition-transform ${checked ? "translate-x-4" : "translate-x-0"}`}
				/>
			</span>
		</button>
	);
}

export function Swatches<T extends string>({
	label,
	value,
	options,
	onChange,
}: {
	label: string;
	value: T;
	options: { value: T; label: string; swatch: string }[];
	onChange: (v: T) => void;
}) {
	return (
		<div>
			<ControlLabel>{label}</ControlLabel>
			<div className="flex flex-wrap gap-1.5">
				{options.map((opt) => {
					const active = opt.value === value;
					return (
						<button
							key={opt.value}
							type="button"
							onClick={() => onChange(opt.value)}
							aria-pressed={active}
							title={opt.label}
							className={`flex items-center gap-1.5 pl-1 pr-2 py-1 border-2 transition-colors ${
								active
									? "border-slate-900 bg-slate-900 text-white"
									: "border-slate-300 bg-white text-slate-700 hover:border-slate-900"
							}`}
						>
							<span
								className="inline-block w-4 h-4 border border-slate-900"
								style={{ background: opt.swatch }}
								aria-hidden="true"
							/>
							<span className="text-[10px] font-black uppercase tracking-wider">
								{opt.label}
							</span>
						</button>
					);
				})}
			</div>
		</div>
	);
}
