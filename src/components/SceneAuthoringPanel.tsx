import { useEffect, useReducer, useRef, useState } from "react";
import type { CelestialState } from "../data/celestial";
import { presenceOver } from "../data/scene";
import {
	DRAG_SNAP,
	emitSceneSource,
	MIN_WINDOW_SPAN,
	round3,
	SCENE_ROW_GROUPS,
	SCENE_ROWS,
	snapTo,
} from "../data/sceneAuthoring";
import type { Journey } from "./_layout/scrollJourney/useScrollJourney";

// The scene-authoring panel (wayfinder #63, built on #88): the day board -
// one timeline row per schedulable unit, draggable window bars, phase shading,
// a playhead synced to live scroll - with the selected row's numeric detail
// below and a one-shot emit modal. Dev-only, gated by the ?scene query param.
//
// The panel edits SESSION state: every input mutates the schedule tables in
// place (see sceneAuthoring.ts) and repaints the journey at the current scroll
// offset, so the real scene reacts live. scene.ts stays the source of truth
// and a reload restores the committed values.

export type SceneAuthoringPanelProps = {
	journey: Journey;
	celestial: CelestialState;
	/** the atmosphere toy's time-slice override (identity when off) */
	sliceFor: (rawProgress: number) => number;
	onClose: () => void;
};

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

/** A row's presence at p - stars derive from the sky curve's phase2 ramp. */
function rowPresence(row: SceneRow2, p: number, celestial: CelestialState) {
	if (row.derived) {
		const [p2s, p2e] = celestial.curve.phase2;
		return clamp01((p - p2s) / Math.max(p2e - p2s, 0.001));
	}
	return presenceOver(p, row.windows());
}

// The registry's row type, re-exported locally to keep prop signatures short.
type SceneRow2 = (typeof SCENE_ROWS)[number];

function Sparkline({
	row,
	progress,
	celestial,
}: {
	row: SceneRow2;
	progress: number;
	celestial: CelestialState;
}) {
	const pts: string[] = [];
	for (let i = 0; i <= 60; i++) {
		const t = i / 60;
		pts.push(
			`${(t * 100).toFixed(1)},${(22 - rowPresence(row, t, celestial) * 20).toFixed(1)}`,
		);
	}
	return (
		<svg
			viewBox="0 0 100 24"
			preserveAspectRatio="none"
			className="w-full h-6"
			aria-hidden="true"
		>
			<polyline
				points={pts.join(" ")}
				fill="none"
				stroke="#0f172a"
				strokeWidth="1.5"
			/>
			<line
				x1={progress * 100}
				y1="0"
				x2={progress * 100}
				y2="24"
				stroke="#f59e0b"
				strokeWidth="1.5"
			/>
		</svg>
	);
}

export function SceneAuthoringPanel({
	journey,
	celestial,
	sliceFor,
	onClose,
}: SceneAuthoringPanelProps) {
	// The tables are mutated in place, so a plain version bump is the render
	// trigger - React state never holds the schedule.
	const [, bump] = useReducer((c: number) => c + 1, 0);
	const [selectedKey, setSelectedKey] = useState<string>(
		SCENE_ROWS[0]?.key ?? "",
	);
	const [emitOpen, setEmitOpen] = useState(false);
	const [copied, setCopied] = useState(false);
	// The playhead's progress: the sky-facing value the windows key off.
	const [progress, setProgress] = useState(0);
	const boardRef = useRef<HTMLDivElement>(null);

	// Apply an edit: repaint the real scene at the current offset, re-render.
	const apply = () => {
		journey.applyAt(window.scrollY);
		bump();
	};

	// Playhead sync: one rAF-coalesced scroll listener, panel-local (the panel
	// is a dev tool - it renders ~15 rows, a state set per frame is fine here).
	useEffect(() => {
		let queued = false;
		const read = () => {
			queued = false;
			const m = journey.metrics;
			const raw = m && m.max > 0 ? clamp01(window.scrollY / m.max) : 0;
			setProgress(sliceFor(raw));
		};
		const onScroll = () => {
			if (queued) return;
			queued = true;
			requestAnimationFrame(read);
		};
		read();
		window.addEventListener("scroll", onScroll, { passive: true });
		return () => window.removeEventListener("scroll", onScroll);
	}, [journey, sliceFor]);

	const selected = SCENE_ROWS.find((r) => r.key === selectedKey);
	const [p1s] = celestial.curve.phase1;
	const [p2s, p2e] = celestial.curve.phase2;

	const scrollToProgress = (t: number) => {
		const m = journey.metrics;
		if (m) window.scrollTo({ top: clamp01(t) * m.max });
	};

	// Window-edge drag: pointermove against the track's rect, snapped to 0.005
	// (#63: raw drag floats leaked into the first emit).
	const startDrag = (
		e: React.PointerEvent,
		row: SceneRow2,
		wi: number,
		edge: "start" | "end",
	) => {
		e.preventDefault();
		e.stopPropagation();
		const track = (e.currentTarget as HTMLElement).closest(
			"[data-scene-track]",
		);
		if (!track) return;
		const rect = track.getBoundingClientRect();
		const move = (ev: PointerEvent) => {
			const w = row.windows()[wi];
			if (!w) return;
			const t = snapTo(clamp01((ev.clientX - rect.left) / rect.width));
			if (edge === "start") w.start = Math.min(t, w.end - MIN_WINDOW_SPAN);
			else w.end = Math.max(t, w.start + MIN_WINDOW_SPAN);
			apply();
		};
		const up = () => {
			window.removeEventListener("pointermove", move);
			window.removeEventListener("pointerup", up);
		};
		window.addEventListener("pointermove", move);
		window.addEventListener("pointerup", up);
	};

	const copyEmit = async () => {
		try {
			await navigator.clipboard.writeText(emitSceneSource());
			setCopied(true);
			setTimeout(() => setCopied(false), 1500);
		} catch {
			// clipboard unavailable
		}
	};

	const numInput = (
		value: number,
		onChange: (v: number) => void,
		opts?: { step?: number; min?: number; max?: number; label?: string },
	) => (
		<input
			aria-label={opts?.label}
			type="number"
			step={opts?.step ?? 0.01}
			min={opts?.min}
			max={opts?.max}
			value={round3(value)}
			onChange={(e) => {
				const v = Number(e.target.value);
				if (!Number.isNaN(v)) {
					onChange(v);
					apply();
				}
			}}
			className="w-16 px-1 border border-slate-300 text-right text-xs"
		/>
	);

	const trackEditor = (row: SceneRow2) => {
		const spec = row.count.get();
		const isTrack = typeof spec !== "number";
		return (
			<div className="border border-slate-300 p-2">
				<div className="flex items-center justify-between mb-1.5">
					<span className="text-[10px] uppercase font-bold">
						{row.count.field}
						<span className="ml-2 font-normal opacity-60 normal-case">
							pool {row.count.ceiling}
						</span>
					</span>
					{row.count.trackable && (
						<button
							type="button"
							onClick={() => {
								row.count.set(
									isTrack ? (spec[0] ?? 0) : [spec as number, spec as number],
								);
								apply();
							}}
							className={`text-[9px] uppercase font-bold border border-slate-900 px-1.5 py-0.5 ${isTrack ? "bg-slate-900 text-white" : "bg-white"}`}
						>
							{isTrack ? "track" : "fixed"}
						</button>
					)}
				</div>
				<div className="flex items-center gap-1 flex-wrap">
					{isTrack ? (
						<>
							{(spec as number[]).map((v, i) => (
								<span
									// biome-ignore lint/suspicious/noArrayIndexKey: stops are positional by definition
									key={i}
									className="flex items-center gap-1"
								>
									{i > 0 && <span className="text-[10px] opacity-50">→</span>}
									{numInput(
										v,
										(nv) => {
											const t = row.count.get();
											if (typeof t !== "number") t[i] = nv;
										},
										{ step: 1, min: 0, label: `${row.key} stop ${i + 1}` },
									)}
								</span>
							))}
							<button
								type="button"
								aria-label="add stop"
								onClick={() => {
									const t = row.count.get();
									if (typeof t !== "number") t.push(t[t.length - 1] ?? 0);
									apply();
								}}
								className="text-[10px] border border-slate-900 px-1.5 py-0.5 font-bold"
							>
								+
							</button>
							{(spec as number[]).length > 1 && (
								<button
									type="button"
									aria-label="remove last stop"
									onClick={() => {
										const t = row.count.get();
										if (typeof t !== "number") t.pop();
										apply();
									}}
									className="text-[10px] border border-slate-900 px-1.5 py-0.5 font-bold"
								>
									−
								</button>
							)}
						</>
					) : (
						numInput(spec as number, (v) => row.count.set(v), {
							step: 1,
							min: 0,
							label: `${row.key} ${row.count.field}`,
						})
					)}
				</div>
			</div>
		);
	};

	return (
		<>
			<section
				aria-label="Scene schedule authoring"
				className="fixed bottom-0 inset-x-0 z-[70] bg-white text-slate-900 border-t-2 border-slate-900 font-mono max-h-[56vh] flex flex-col shadow-[0_-6px_24px_rgba(15,23,42,0.25)]"
			>
				<header className="flex items-center justify-between gap-3 px-4 py-2 border-b-2 border-slate-900 shrink-0">
					<div className="flex items-baseline gap-3 min-w-0">
						<h2 className="text-sm font-black uppercase tracking-tighter whitespace-nowrap">
							Scene Schedule
						</h2>
						<p className="text-[10px] opacity-60 font-sans truncate">
							Session only - emit, paste into scene.ts, commit. Reload restores
							committed values.
						</p>
					</div>
					<div className="flex items-center gap-2 shrink-0">
						<div className="text-[10px] font-bold tabular-nums w-12 text-right">
							{progress.toFixed(3)}
						</div>
						<button
							type="button"
							onClick={() => setEmitOpen(true)}
							className="bg-slate-900 text-white px-3 py-1.5 font-bold uppercase text-[10px] tracking-wider hover:bg-slate-700"
						>
							Emit scene.ts
						</button>
						<button
							type="button"
							onClick={onClose}
							aria-label="Close"
							className="w-7 h-7 flex items-center justify-center border-2 border-slate-900 font-black leading-none hover:bg-slate-900 hover:text-white"
						>
							×
						</button>
					</div>
				</header>

				<div className="overflow-y-auto px-4 py-3" ref={boardRef}>
					{/* the day axis */}
					<div className="grid grid-cols-[108px_1fr] gap-2 mb-1">
						<div />
						<div className="relative h-4 text-[8px] uppercase opacity-60">
							<span className="absolute left-0">hero</span>
							<span
								className="absolute -translate-x-1/2"
								style={{ left: `${p1s * 100}%` }}
							>
								day
							</span>
							<span
								className="absolute -translate-x-1/2"
								style={{ left: `${p2s * 100}%` }}
							>
								dusk
							</span>
							<span
								className="absolute -translate-x-1/2"
								style={{ left: `${p2e * 100}%` }}
							>
								night
							</span>
							<span className="absolute right-0">end</span>
						</div>
					</div>

					{SCENE_ROW_GROUPS.map((group) => (
						<div key={group} className="mb-1">
							{SCENE_ROWS.filter((r) => r.group === group).map((row, gi) => {
								const pres = rowPresence(row, progress, celestial);
								return (
									<div
										key={row.key}
										className="grid grid-cols-[108px_1fr] gap-2 items-center mb-0.5"
									>
										<button
											type="button"
											onClick={() => setSelectedKey(row.key)}
											className={`text-[10px] uppercase font-bold text-right px-1.5 py-1 truncate ${row.key === selectedKey ? "bg-slate-900 text-white" : "hover:bg-slate-100"}`}
										>
											{gi === 0 && group !== row.label ? (
												<span className="opacity-50 mr-1 normal-case font-normal">
													{group}
												</span>
											) : null}
											{row.label}
										</button>
										{/* biome-ignore lint/a11y/useKeyWithClickEvents: dev tool - the numeric detail below covers keyboard editing; the track click is a mouse shortcut to scroll the page */}
										{/* biome-ignore lint/a11y/noStaticElementInteractions: same - a mouse-only scroll shortcut on a dev tool */}
										<div
											data-scene-track
											onClick={(e) => {
												if (
													(e.target as HTMLElement).closest("[data-scene-win]")
												)
													return;
												const rect = (
													e.currentTarget as HTMLElement
												).getBoundingClientRect();
												scrollToProgress((e.clientX - rect.left) / rect.width);
											}}
											className="relative h-6 bg-slate-100 border border-slate-300 cursor-pointer"
										>
											{/* phase shading: day and dusk ramps of the sky curve */}
											<div
												className="absolute inset-y-0 bg-slate-900/5 pointer-events-none"
												style={{
													left: `${celestial.curve.phase1[0] * 100}%`,
													width: `${(celestial.curve.phase1[1] - celestial.curve.phase1[0]) * 100}%`,
												}}
											/>
											<div
												className="absolute inset-y-0 bg-slate-900/10 pointer-events-none"
												style={{
													left: `${p2s * 100}%`,
													width: `${(p2e - p2s) * 100}%`,
												}}
											/>
											{row.derived ? (
												// Stars: the phase2 presence ramp, shown but not draggable.
												<div
													className="absolute top-1 bottom-1 bg-slate-900/60 pointer-events-none"
													style={{
														left: `${p2s * 100}%`,
														width: `${(1 - p2s) * 100}%`,
													}}
												/>
											) : (
												row.windows().map((w, wi) => {
													const span = Math.max(w.end - w.start, 1e-6);
													return (
														<div
															// biome-ignore lint/suspicious/noArrayIndexKey: windows are positional
															key={wi}
															data-scene-win
															className="absolute top-1 bottom-1 bg-slate-900/85"
															style={{
																left: `${w.start * 100}%`,
																width: `${span * 100}%`,
															}}
														>
															<div
																className="absolute inset-y-0 left-0 bg-white/55 pointer-events-none"
																style={{
																	width: `${(w.rampIn / span) * 100}%`,
																}}
															/>
															<div
																className="absolute inset-y-0 right-0 bg-white/55 pointer-events-none"
																style={{
																	width: `${(w.rampOut / span) * 100}%`,
																}}
															/>
															<div
																className="absolute -inset-y-1 -left-1 w-2 cursor-ew-resize"
																onPointerDown={(e) =>
																	startDrag(e, row, wi, "start")
																}
															/>
															<div
																className="absolute -inset-y-1 -right-1 w-2 cursor-ew-resize"
																onPointerDown={(e) =>
																	startDrag(e, row, wi, "end")
																}
															/>
														</div>
													);
												})
											)}
											{/* live presence dot + playhead */}
											<div
												className="absolute top-0.5 right-0.5 w-1.5 h-1.5 rounded-full bg-emerald-600 pointer-events-none"
												style={{ opacity: pres }}
											/>
											<div
												className="absolute inset-y-0 w-0.5 bg-amber-500 pointer-events-none"
												style={{ left: `${progress * 100}%` }}
											/>
										</div>
									</div>
								);
							})}
						</div>
					))}

					{/* the selected row's detail (#63: B's detail under A's board) */}
					{selected && (
						<div className="mt-3 pt-3 border-t-2 border-slate-900">
							<div className="flex items-baseline gap-3 mb-2">
								<h3 className="text-xs font-black uppercase">
									{selected.group} · {selected.label}
								</h3>
								<span className="text-[10px] opacity-60">{selected.home}</span>
								<span className="text-[10px] tabular-nums">
									p={rowPresence(selected, progress, celestial).toFixed(2)}
								</span>
							</div>
							<div className="grid md:grid-cols-[1fr_240px] gap-3">
								<div>
									{selected.derived ? (
										<p className="text-[10px] opacity-60 font-sans mb-2">
											Presence derives from the sky curve (phase2 ramp) - tune
											it on the Sky panel. Count rides progress from phase2
											start to the page bottom.
										</p>
									) : (
										selected.windows().map((w, wi) => (
											<div
												// biome-ignore lint/suspicious/noArrayIndexKey: windows are positional
												key={wi}
												className="flex items-center gap-2 mb-1.5 flex-wrap"
											>
												<span className="text-[9px] uppercase opacity-60 w-16">
													window {wi + 1}
												</span>
												<span className="text-[9px] uppercase opacity-60">
													start
												</span>
												{numInput(
													w.start,
													(v) => {
														w.start = Math.min(v, w.end - MIN_WINDOW_SPAN);
													},
													{
														step: DRAG_SNAP,
														min: 0,
														max: 1,
														label: `${selected.key} window ${wi + 1} start`,
													},
												)}
												<span className="text-[9px] uppercase opacity-60">
													rampIn
												</span>
												{numInput(
													w.rampIn,
													(v) => {
														w.rampIn = Math.max(0, v);
													},
													{
														step: DRAG_SNAP,
														min: 0,
														max: 0.5,
														label: `${selected.key} window ${wi + 1} rampIn`,
													},
												)}
												<span className="text-[9px] uppercase opacity-60">
													end
												</span>
												{numInput(
													w.end,
													(v) => {
														w.end = Math.max(v, w.start + MIN_WINDOW_SPAN);
													},
													{
														step: DRAG_SNAP,
														min: 0,
														max: 1,
														label: `${selected.key} window ${wi + 1} end`,
													},
												)}
												<span className="text-[9px] uppercase opacity-60">
													rampOut
												</span>
												{numInput(
													w.rampOut,
													(v) => {
														w.rampOut = Math.max(0, v);
													},
													{
														step: DRAG_SNAP,
														min: 0,
														max: 0.5,
														label: `${selected.key} window ${wi + 1} rampOut`,
													},
												)}
												{selected.removeWindow &&
													selected.windows().length > 1 && (
														<button
															type="button"
															aria-label={`remove window ${wi + 1}`}
															onClick={() => {
																selected.removeWindow?.(wi);
																apply();
															}}
															className="text-[10px] border border-slate-900 px-1.5 py-0.5 font-bold"
														>
															×
														</button>
													)}
											</div>
										))
									)}
									{selected.addWindow && (
										<button
											type="button"
											onClick={() => {
												selected.addWindow?.();
												apply();
											}}
											className="text-[10px] border border-slate-900 px-2 py-0.5 font-bold uppercase"
										>
											+ window
										</button>
									)}
									<div className="mt-2 grid grid-cols-2 gap-2 max-w-md">
										{trackEditor(selected)}
										{selected.alpha && (
											<div className="border border-slate-300 p-2">
												<div className="text-[10px] uppercase font-bold mb-1.5">
													alpha
												</div>
												{numInput(
													selected.alpha.get(),
													(v) => selected.alpha?.set(clamp01(v)),
													{
														step: 0.01,
														min: 0,
														max: 1,
														label: `${selected.key} alpha`,
													},
												)}
											</div>
										)}
									</div>
								</div>
								<div>
									<div className="text-[9px] uppercase opacity-60 mb-1">
										presence over the day
									</div>
									<Sparkline
										row={selected}
										progress={progress}
										celestial={celestial}
									/>
								</div>
							</div>
						</div>
					)}
				</div>
			</section>

			{/* the one-shot emit modal (#63: no always-visible code pane) */}
			{emitOpen && (
				// biome-ignore lint/a11y/useKeyWithClickEvents: Esc handling is not required for this dev-only overlay; the Close button is keyboard-reachable
				// biome-ignore lint/a11y/noStaticElementInteractions: same - backdrop click-out is a mouse convenience on a dev tool
				<div
					className="fixed inset-0 z-[80] bg-slate-900/55 flex items-center justify-center"
					onClick={(e) => {
						if (e.target === e.currentTarget) setEmitOpen(false);
					}}
				>
					<div className="bg-slate-900 text-slate-200 border-2 border-white w-[min(680px,92vw)] max-h-[80vh] flex flex-col font-mono">
						<div className="flex items-center justify-between px-4 py-2 border-b border-slate-600">
							<h3 className="text-[11px] uppercase tracking-wider font-bold">
								src/data/scene.ts - committed form
							</h3>
							<div className="flex gap-2">
								<button
									type="button"
									onClick={copyEmit}
									className="border-2 border-white px-3 py-1 font-bold uppercase text-[10px] tracking-wider hover:bg-white hover:text-slate-900"
								>
									{copied ? "Copied!" : "Copy"}
								</button>
								<button
									type="button"
									onClick={() => setEmitOpen(false)}
									className="bg-white text-slate-900 px-3 py-1 font-bold uppercase text-[10px] tracking-wider hover:opacity-85"
								>
									Close
								</button>
							</div>
						</div>
						<pre className="p-4 overflow-auto text-[11px] leading-relaxed">
							{emitSceneSource()}
						</pre>
					</div>
				</div>
			)}
		</>
	);
}
