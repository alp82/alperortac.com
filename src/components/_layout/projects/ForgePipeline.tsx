/*
 * Forge subpage "How it works" pipeline (wayfinder #30).
 * Pick a task size — Small, Mid or Large — and the pipeline itself grows:
 * Small runs a lean Intent → Build pass, Mid adds Scout + Review, Large runs
 * the full seven stages. The chosen stages walk themselves one at a time,
 * each opening to show what happens there and how many subagents fan out.
 * Click any step to jump to it and take control of the walk. Reduced-motion
 * users get the whole pipeline at rest, still clickable.
 */
import { useEffect, useState } from "react";
import { useReducedMotion } from "../dive/useReducedMotion";
import {
	agentsAt,
	SIZE_META,
	type Size,
	STAGES,
	stagesFor,
	totalAgents,
} from "./forgePipeline";

const STEP_MS = 780;

const CHOICES: { size: Size; label: string }[] = [
	{ size: "S", label: "Small" },
	{ size: "M", label: "Mid" },
	{ size: "L", label: "Large" },
];

export function ForgePipeline() {
	const reduced = useReducedMotion();
	const [size, setSize] = useState<Size | null>(null);
	const [active, setActive] = useState(-1); // -1 = not yet run
	const [walking, setWalking] = useState(false);

	// The stages that actually run at this size (full pipeline as a preview
	// before anything is picked).
	const stages = size ? stagesFor(size) : STAGES;
	const last = stages.length - 1;

	const pick = (sz: Size) => {
		setSize(sz);
		if (reduced) {
			setActive(stagesFor(sz).length - 1);
			setWalking(false);
		} else {
			setActive(0);
			setWalking(true);
		}
	};

	// Auto-walk: advance one stage at a time until the last, then stop.
	useEffect(() => {
		if (!walking || active >= last) return;
		const id = window.setTimeout(() => setActive((a) => a + 1), STEP_MS);
		return () => window.clearTimeout(id);
	}, [walking, active, last]);

	useEffect(() => {
		if (walking && active >= last) setWalking(false);
	}, [walking, active, last]);

	const jump = (i: number) => {
		setActive(i);
		setWalking(false); // clicking takes control
	};

	const started = active >= 0;
	const walkDone = started && !walking && active >= last;

	return (
		<div className="mb-4">
			{/* size chooser */}
			<div className="rounded-t-lg border border-white/15 bg-white/5 p-4">
				<p className="text-xs font-black uppercase tracking-widest text-white/50 mb-3">
					Pick a task size
				</p>
				<div className="grid grid-cols-3 gap-2">
					{CHOICES.map((c) => {
						const selected = size === c.size;
						return (
							<button
								key={c.size}
								type="button"
								onClick={() => pick(c.size)}
								aria-pressed={selected}
								className={`rounded-lg border px-3 py-3 text-center transition-all ${
									selected
										? "border-emerald-400 bg-emerald-500/15"
										: "border-white/15 hover:bg-white/10"
								}`}
							>
								<span
									className="block font-black text-lg"
									style={{
										color: selected ? SIZE_META[c.size].tint : undefined,
									}}
								>
									{c.label}
								</span>
								<span className="block text-xs text-white/50 mt-0.5">
									{totalAgents(c.size)} subagent
									{totalAgents(c.size) === 1 ? "" : "s"}
								</span>
							</button>
						);
					})}
				</div>
			</div>

			{/* size readout */}
			<div className="flex items-center gap-3 border-x border-white/15 bg-emerald-950/30 px-4 py-2.5">
				{size ? (
					<>
						<span
							className="px-2.5 py-0.5 rounded font-black text-black text-sm"
							style={{ background: SIZE_META[size].tint }}
						>
							{size}
						</span>
						<span className="text-white/80 text-sm min-w-0">
							<b>{SIZE_META[size].label}</b> task. {SIZE_META[size].blurb}
						</span>
						<span className="ml-auto text-white/50 text-xs whitespace-nowrap">
							{totalAgents(size)} subagent{totalAgents(size) === 1 ? "" : "s"}
						</span>
					</>
				) : (
					<span className="text-white/60 text-sm">
						Pick a size above to run the pipeline.
					</span>
				)}
			</div>

			{/* the walk-through stepper */}
			<ol className="border-x border-b border-white/15 rounded-b-lg">
				{stages.map((s, i) => {
					const done = started && i < active;
					const current = started && i === active;
					const n = size ? agentsAt(size, s.key) : 0;
					return (
						<li key={s.key} className="relative">
							<button
								type="button"
								onClick={() => jump(i)}
								aria-current={current ? "step" : undefined}
								className={`w-full flex items-start gap-4 px-5 py-5 text-left transition-colors ${
									current
										? "bg-emerald-500/10"
										: done
											? "bg-emerald-600/20"
											: "hover:bg-white/5"
								}`}
							>
								{/* spine node */}
								<span className="relative flex flex-col items-center self-stretch">
									<span
										className={`grid place-items-center w-12 h-12 rounded-full text-2xl shrink-0 transition-all ${
											current
												? "ring-2 ring-emerald-400 bg-emerald-500/25 scale-110 animate-pulse motion-reduce:animate-none"
												: done
													? "bg-emerald-500/90"
													: "bg-white/10 opacity-60"
										}`}
										style={
											current
												? { boxShadow: "0 0 20px rgba(52,211,153,0.6)" }
												: undefined
										}
									>
										<span aria-hidden="true">{s.emoji}</span>
									</span>
									{i < last && (
										<span
											className={`w-0.5 flex-1 mt-1.5 ${done ? "bg-emerald-500/60" : "bg-white/15"}`}
										/>
									)}
								</span>

								{/* header row */}
								<span className="flex-1 min-w-0">
									<span className="flex items-center gap-2">
										<span className="text-white/40 font-mono text-sm">
											{String(i + 1).padStart(2, "0")}
										</span>
										<span
											className={`font-bold text-lg ${current ? "text-emerald-100" : "text-white"}`}
										>
											{s.label}
										</span>
										<span className="ml-auto flex items-center gap-2">
											{s.role ? (
												<span className="flex items-center gap-1.5 text-xs">
													<span className="hidden sm:inline text-emerald-300/70">
														{s.role}
													</span>
													{size && (
														<span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-200 font-bold tabular-nums">
															×{n}
														</span>
													)}
												</span>
											) : (
												<span className="text-xs text-white/40">
													orchestrator
												</span>
											)}
										</span>
									</span>

									{/* expanded detail under the current step */}
									{current && (
										<span className="block mt-2 text-white/70 text-sm leading-relaxed">
											{s.what}
											{s.role && (
												<span className="mt-2 flex items-center gap-1">
													{Array.from({ length: n }).map((_, k) => (
														<span
															// biome-ignore lint/suspicious/noArrayIndexKey: fixed-length decorative dots
															key={`${s.key}-dot-${k}`}
															className="w-2 h-2 rounded-full bg-emerald-400/80"
														/>
													))}
													<span className="ml-1.5 text-xs text-white/40">
														{n} {s.role} subagent{n > 1 ? "s" : ""}
													</span>
												</span>
											)}
										</span>
									)}
								</span>
							</button>
						</li>
					);
				})}
			</ol>

			{/* replay */}
			{walkDone && (
				<div className="mt-2 flex justify-end">
					<button
						type="button"
						onClick={() => size && pick(size)}
						className="text-xs text-emerald-300/80 hover:text-emerald-200 flex items-center gap-1"
					>
						↻ replay the walk
					</button>
				</div>
			)}
		</div>
	);
}
