import { useState } from "react";
import { TOPICS, type TopicId } from "../../data/topics";
import { Segmented, Slider, Swatches, Toggle } from "./composer/DesignControls";
import {
	INNER_ORDER,
	INNERS,
	LINK_ORDER,
	LINKS,
	SECTION_ORDER,
	SECTIONS,
} from "./composer/index";
import type {
	AccentSource,
	AnySectionParams,
	InnerId,
	InnerParams,
	IslandParams,
	LinkId,
	LinkParams,
	MarqueeParams,
	MonolithParams,
	ParallaxParams,
	SectionId,
	SplitParams,
	ZoomParams,
} from "./composer/types";
import {
	buildComposerSpec,
	type ComposerState,
} from "./composer/useComposerControls";

/*
 * DEV-ONLY composer panel.
 *
 * Renders inside the existing `panel-dialog-modal` <dialog> so the live
 * landscape stays visible. A top "Shipped baseline" toggle bypasses the
 * composer to A/B against production. Below it, three tabbed layers — a GLOBAL
 * Stage and Connector (one pick each) plus a per-topic Cluster (chosen per topic
 * via the topic selector) — each exposing the selected item's focused params.
 * Spec readout + Copy spec + Reset at the bottom.
 *
 * Planner: removed with the rest of the composer host once a composition is
 * locked (see CLEANUP_NEEDED).
 */

export const DESIGN_PANEL_TITLE_ID = "design-panel-title";

type Handlers = {
	setBaseline: (v: boolean) => void;
	setSection: (id: SectionId) => void;
	setInner: (topicId: TopicId, id: InnerId) => void;
	setLink: (id: LinkId) => void;
	patchSectionParams: (p: Partial<AnySectionParams>) => void;
	patchInnerParams: (topicId: TopicId, p: Partial<InnerParams>) => void;
	patchLinkParams: (p: Partial<LinkParams>) => void;
};

type DesignPanelProps = Handlers & {
	state: ComposerState;
	reset: () => void;
	onClose: () => void;
};

const ACCENT_SWATCHES: {
	value: AccentSource;
	label: string;
	swatch: string;
}[] = [
	{
		value: "topic",
		label: "Topic",
		swatch: "linear-gradient(90deg,#a7f3d0,#c7d2fe)",
	},
	{ value: "fixed", label: "Amber", swatch: "#fde68a" },
	{
		value: "none",
		label: "None",
		swatch: "repeating-linear-gradient(45deg,#fff 0 3px,#cbd5e1 3px 6px)",
	},
];

const LINK_COLOR_SWATCHES: {
	value: LinkParams["color"];
	label: string;
	swatch: string;
}[] = [
	{ value: "ink", label: "Ink", swatch: "#0f172a" },
	{ value: "sky", label: "Sky", swatch: "#7dd3fc" },
	{ value: "earth", label: "Earth", swatch: "#8a5a28" },
	{
		value: "accent",
		label: "Accent",
		swatch: "linear-gradient(90deg,#a7f3d0,#c7d2fe)",
	},
];

/* ── per-layer radio row + selected-item param block ────────────────────── */

function LayerRow({
	label,
	feel,
	selected,
	onSelect,
	children,
}: {
	label: string;
	feel: string;
	selected: boolean;
	onSelect: () => void;
	children?: React.ReactNode;
}) {
	return (
		<div
			className={`border-2 transition-colors ${selected ? "border-slate-900" : "border-slate-300"}`}
		>
			<button
				type="button"
				onClick={onSelect}
				aria-pressed={selected}
				className={`block w-full text-left px-3 py-2.5 transition-colors ${
					selected
						? "bg-slate-900 text-white"
						: "bg-white text-slate-900 hover:bg-slate-50"
				}`}
			>
				<div className="flex items-center gap-2">
					<span
						className={`inline-block w-3 h-3 shrink-0 border-2 ${selected ? "bg-emerald-300 border-white" : "border-slate-400"}`}
						aria-hidden="true"
					/>
					<span className="font-black uppercase tracking-tight text-sm leading-none">
						{label}
					</span>
				</div>
				<p
					className={`mt-1.5 text-[11px] leading-snug font-sans ${selected ? "text-slate-200" : "text-slate-600"}`}
				>
					{feel}
				</p>
			</button>
			{selected && children && (
				<div className="bg-slate-50 border-t-2 border-slate-900 px-3 py-3 flex flex-col gap-3">
					{children}
				</div>
			)}
		</div>
	);
}

type SectionPatch = (p: Partial<AnySectionParams>) => void;

/* Each stage's signature knobs. `params` is the union; the selected row's id
 * always matches the live params (the setters keep them in lockstep), so the
 * per-case cast is sound. */
function StageSpecificControls({
	id,
	params,
	patch,
}: {
	id: SectionId;
	params: AnySectionParams;
	patch: SectionPatch;
}) {
	switch (id) {
		case "centered-monolith": {
			const p = params as MonolithParams;
			return (
				<>
					<Slider
						label="Vignette"
						value={p.vignette}
						min={0}
						max={80}
						onChange={(vignette) => patch({ vignette })}
					/>
					<Slider
						label="Edge glow"
						value={p.edgeGlow}
						min={0}
						max={100}
						onChange={(edgeGlow) => patch({ edgeGlow })}
					/>
					<Segmented
						label="Title scale"
						value={p.titleScale}
						options={[
							{ value: "modest", label: "Modest" },
							{ value: "bold", label: "Bold" },
							{ value: "towering", label: "Towering" },
						]}
						onChange={(titleScale) => patch({ titleScale })}
					/>
					<Toggle
						label="Index tag"
						checked={p.indexTag}
						onChange={(indexTag) => patch({ indexTag })}
					/>
				</>
			);
		}
		case "split-stage": {
			const p = params as SplitParams;
			return (
				<>
					<Slider
						label="Split ratio"
						value={p.ratio}
						min={50}
						max={78}
						unit="%"
						onChange={(ratio) => patch({ ratio })}
					/>
					<Segmented
						label="Content side"
						value={p.side}
						options={[
							{ value: "left", label: "Left" },
							{ value: "right", label: "Right" },
						]}
						onChange={(side) => patch({ side })}
					/>
					<Slider
						label="Flourish"
						value={p.flourish}
						min={0}
						max={40}
						onChange={(flourish) => patch({ flourish })}
					/>
					<Toggle
						label="Accent spine"
						checked={p.spine}
						onChange={(spine) => patch({ spine })}
					/>
				</>
			);
		}
		case "parallax-depth": {
			const p = params as ParallaxParams;
			return (
				<>
					<Segmented
						label="Backdrop shape"
						value={p.shape}
						options={[
							{ value: "flourish", label: "Flourish" },
							{ value: "blob", label: "Blob" },
							{ value: "rings", label: "Rings" },
							{ value: "grid", label: "Grid" },
							{ value: "strata", label: "Strata" },
						]}
						onChange={(shape) => patch({ shape })}
					/>
					<Slider
						label="Drift depth"
						value={p.depth}
						min={0}
						max={100}
						onChange={(depth) => patch({ depth })}
					/>
					<Segmented
						label="Layers"
						value={String(p.layers)}
						options={[
							{ value: "2", label: "2" },
							{ value: "3", label: "3" },
						]}
						onChange={(v) => patch({ layers: Number(v) as 2 | 3 })}
					/>
				</>
			);
		}
		case "marquee-scroll": {
			const p = params as MarqueeParams;
			return (
				<>
					<Segmented
						label="Strips"
						value={String(p.strips)}
						options={[
							{ value: "1", label: "1" },
							{ value: "2", label: "2" },
							{ value: "3", label: "3" },
						]}
						onChange={(v) => patch({ strips: Number(v) as 1 | 2 | 3 })}
					/>
					<Slider
						label="Drift speed"
						value={p.speed}
						min={0}
						max={100}
						onChange={(speed) => patch({ speed })}
					/>
					<Segmented
						label="Text style"
						value={p.textStyle}
						options={[
							{ value: "filled", label: "Filled" },
							{ value: "outline", label: "Outline" },
							{ value: "accent", label: "Accent" },
						]}
						onChange={(textStyle) => patch({ textStyle })}
					/>
					<Toggle
						label="Mirror directions"
						checked={p.mirrored}
						onChange={(mirrored) => patch({ mirrored })}
					/>
				</>
			);
		}
		case "floating-island": {
			const p = params as IslandParams;
			return (
				<>
					<Slider
						label="Float height"
						value={p.floatHeight}
						min={0}
						max={100}
						onChange={(floatHeight) => patch({ floatHeight })}
					/>
					<Slider
						label="Bob"
						value={p.bob}
						min={0}
						max={100}
						onChange={(bob) => patch({ bob })}
					/>
					<Segmented
						label="Corners"
						value={p.corners}
						options={[
							{ value: "sharp", label: "Sharp" },
							{ value: "soft", label: "Soft" },
							{ value: "pill", label: "Pill" },
						]}
						onChange={(corners) => patch({ corners })}
					/>
					<Slider
						label="Slab tint"
						value={p.tint}
						min={0}
						max={100}
						onChange={(tint) => patch({ tint })}
					/>
				</>
			);
		}
		default: {
			const p = params as ZoomParams;
			return (
				<>
					<Slider
						label="Enter zoom"
						value={p.enterZoom}
						min={0}
						max={100}
						onChange={(enterZoom) => patch({ enterZoom })}
					/>
					<Slider
						label="Ken Burns speed"
						value={p.speed}
						min={0}
						max={100}
						onChange={(speed) => patch({ speed })}
					/>
					<Segmented
						label="Drift"
						value={p.drift}
						options={[
							{ value: "in", label: "In" },
							{ value: "up-left", label: "Up-L" },
							{ value: "up-right", label: "Up-R" },
							{ value: "down", label: "Down" },
						]}
						onChange={(drift) => patch({ drift })}
					/>
				</>
			);
		}
	}
}

function SectionParamsBlock({
	id,
	params,
	patch,
}: {
	id: SectionId;
	params: AnySectionParams;
	patch: SectionPatch;
}) {
	const [lo, hi] = SECTIONS[id].heightRange;
	return (
		<>
			<Swatches
				label="Accent source"
				value={params.accent}
				options={ACCENT_SWATCHES}
				onChange={(accent) => patch({ accent })}
			/>
			<Slider
				label="Stage height"
				value={params.height}
				min={lo}
				max={hi}
				unit="vh"
				onChange={(height) => patch({ height })}
			/>
			<StageSpecificControls id={id} params={params} patch={patch} />
		</>
	);
}

function InnerParamsBlock({
	id,
	params,
	patch,
}: {
	id: InnerId;
	params: InnerParams;
	patch: (p: Partial<InnerParams>) => void;
}) {
	return (
		<>
			<Segmented
				label="Color treatment"
				value={params.color}
				options={[
					{ value: "accent", label: "Accent" },
					{ value: "neutral", label: "Neutral" },
					{ value: "inverted", label: "Inverted" },
				]}
				onChange={(color) => patch({ color })}
			/>
			<Segmented
				label="Density"
				value={params.density}
				options={[
					{ value: "cozy", label: "Cozy" },
					{ value: "comfortable", label: "Comfy" },
					{ value: "roomy", label: "Roomy" },
				]}
				onChange={(density) => patch({ density })}
			/>
			<Toggle
				label={INNERS[id].motifLabel}
				checked={params.motif}
				onChange={(motif) => patch({ motif })}
			/>
		</>
	);
}

function LinkParamsBlock({
	id,
	params,
	patch,
}: {
	id: LinkId;
	params: LinkParams;
	patch: (p: Partial<LinkParams>) => void;
}) {
	return (
		<>
			<Swatches
				label="Color"
				value={params.color}
				options={LINK_COLOR_SWATCHES}
				onChange={(color) => patch({ color })}
			/>
			<Slider
				label="Weight"
				value={params.weight}
				min={1}
				max={8}
				unit="px"
				onChange={(weight) => patch({ weight })}
			/>
			{LINKS[id].hasCurve && (
				<Slider
					label="Curve amount"
					value={params.curve}
					min={0}
					max={100}
					onChange={(curve) => patch({ curve })}
				/>
			)}
			<Slider
				label="Height"
				value={params.height}
				min={20}
				max={150}
				unit="vh"
				onChange={(height) => patch({ height })}
			/>
			<Slider
				label="Blend into sections"
				value={params.blend}
				min={0}
				max={100}
				unit="%"
				onChange={(blend) => patch({ blend })}
			/>
			<Toggle
				label="Animate on scroll"
				checked={params.animate}
				onChange={(animate) => patch({ animate })}
			/>
		</>
	);
}

type LayerTab = "section" | "inner" | "link";

const TABS: { id: LayerTab; label: string; feel: string }[] = [
	{ id: "section", label: "Stage", feel: "Section style" },
	{ id: "inner", label: "Cluster", feel: "Inside the topic" },
	{ id: "link", label: "Connector", feel: "Between topics" },
];

function TabBar({
	active,
	onSelect,
}: {
	active: LayerTab;
	onSelect: (id: LayerTab) => void;
}) {
	return (
		<div className="flex border-2 border-slate-900 mb-4">
			{TABS.map((tab, i) => {
				const selected = tab.id === active;
				return (
					<button
						key={tab.id}
						type="button"
						onClick={() => onSelect(tab.id)}
						aria-pressed={selected}
						className={`flex-1 px-2 py-2 text-left transition-colors ${
							i > 0 ? "border-l-2 border-slate-900" : ""
						} ${
							selected
								? "bg-slate-900 text-white"
								: "bg-white text-slate-900 hover:bg-slate-50"
						}`}
					>
						<div className="font-black uppercase tracking-tight text-[11px] leading-none">
							{tab.label}
						</div>
						<div
							className={`mt-1 text-[9px] uppercase tracking-wider font-sans leading-none ${selected ? "text-slate-300" : "text-slate-500"}`}
						>
							{tab.feel}
						</div>
					</button>
				);
			})}
		</div>
	);
}

/* Cluster is per-topic, so the Cluster tab edits ONE topic at a time — this
 * chooses which. */
function TopicSelector({
	active,
	clusters,
	onSelect,
}: {
	active: TopicId;
	clusters: ComposerState["clusters"];
	onSelect: (id: TopicId) => void;
}) {
	return (
		<div>
			<div className="text-[9px] uppercase font-bold tracking-[0.18em] opacity-55 mb-1.5">
				Editing cluster for
			</div>
			<div className="flex flex-wrap gap-1">
				{TOPICS.map((t) => {
					const selected = t.id === active;
					const custom = clusters[t.id].id !== "rich-card";
					return (
						<button
							key={t.id}
							type="button"
							onClick={() => onSelect(t.id)}
							aria-pressed={selected}
							title={`${t.heading} — ${INNERS[clusters[t.id].id].label}`}
							className={`px-2 py-1 text-[10px] font-black uppercase tracking-wider border-2 transition-colors ${
								selected
									? "bg-slate-900 text-white border-slate-900"
									: "bg-white text-slate-700 border-slate-300 hover:border-slate-900"
							}`}
						>
							{t.heading}
							{custom && (
								<span className="ml-1 text-emerald-400" aria-hidden="true">
									●
								</span>
							)}
						</button>
					);
				})}
			</div>
		</div>
	);
}

export function DesignPanel({
	state,
	setBaseline,
	setSection,
	setInner,
	setLink,
	patchSectionParams,
	patchInnerParams,
	patchLinkParams,
	reset,
	onClose,
}: DesignPanelProps) {
	const [copied, setCopied] = useState(false);
	const [tab, setTab] = useState<LayerTab>("section");
	// Start editing the first topic's cluster (TOPICS is a non-empty literal).
	const [activeTopic, setActiveTopic] = useState<TopicId>(
		TOPICS[0]?.id ?? "career",
	);
	const spec = buildComposerSpec(state);
	const disabled = state.baseline;

	const copySpec = async () => {
		try {
			await navigator.clipboard.writeText(spec);
			setCopied(true);
			setTimeout(() => setCopied(false), 1500);
		} catch {
			// clipboard unavailable — user can still read the spec line below
		}
	};

	return (
		<div className="relative w-full max-h-[calc(100dvh_-_5.5rem)] text-slate-900 bg-white overflow-hidden flex flex-col">
			<button
				type="button"
				onClick={onClose}
				aria-label="Close"
				className="absolute top-2 right-2 z-20 w-9 h-9 flex items-center justify-center bg-white text-slate-900 border-2 border-slate-900 font-black text-lg leading-none hover:bg-slate-900 hover:text-white transition-colors"
			>
				×
			</button>

			<div className="flex-1 min-h-0 overflow-y-auto px-5 pt-5 pb-6">
				<h2
					id={DESIGN_PANEL_TITLE_ID}
					className="text-2xl font-black uppercase tracking-tighter mb-1 font-mono"
				>
					Composer
				</h2>
				<p className="text-xs opacity-70 mb-4 font-sans leading-snug">
					DEV-only. A global stage × a per-topic cluster × a global connector.
					Tune each layer's params, then scroll the page to judge it against the
					live landscape, day → night.
				</p>

				{/* Shipped baseline bypass */}
				<div className="mb-4 border-2 border-slate-900 bg-slate-900 text-white px-3 py-2.5">
					<Toggle
						label="Shipped baseline (A/B vs production)"
						checked={state.baseline}
						onChange={setBaseline}
					/>
				</div>

				<div
					className={
						disabled ? "opacity-40 pointer-events-none select-none" : ""
					}
					aria-hidden={disabled}
				>
					<TabBar active={tab} onSelect={setTab} />

					{tab === "section" && (
						<div className="flex flex-col gap-2">
							{SECTION_ORDER.map((id) => (
								<LayerRow
									key={id}
									label={SECTIONS[id].label}
									feel={SECTIONS[id].feel}
									selected={id === state.section}
									onSelect={() => setSection(id)}
								>
									<SectionParamsBlock
										id={id}
										params={state.sectionParams}
										patch={patchSectionParams}
									/>
								</LayerRow>
							))}
						</div>
					)}

					{tab === "inner" && (
						<div className="flex flex-col gap-3">
							<TopicSelector
								active={activeTopic}
								clusters={state.clusters}
								onSelect={setActiveTopic}
							/>
							<div className="flex flex-col gap-2">
								{INNER_ORDER.map((id) => (
									<LayerRow
										key={id}
										label={INNERS[id].label}
										feel={INNERS[id].feel}
										selected={id === state.clusters[activeTopic].id}
										onSelect={() => setInner(activeTopic, id)}
									>
										{id !== "rich-card" && (
											<InnerParamsBlock
												id={id}
												params={state.clusters[activeTopic].params}
												patch={(p) => patchInnerParams(activeTopic, p)}
											/>
										)}
									</LayerRow>
								))}
							</div>
						</div>
					)}

					{tab === "link" && (
						<div className="flex flex-col gap-2">
							{LINK_ORDER.map((id) => (
								<LayerRow
									key={id}
									label={LINKS[id].label}
									feel={LINKS[id].feel}
									selected={id === state.link}
									onSelect={() => setLink(id)}
								>
									{id !== "none" && (
										<LinkParamsBlock
											id={id}
											params={state.linkParams}
											patch={patchLinkParams}
										/>
									)}
								</LayerRow>
							))}
						</div>
					)}
				</div>

				<div className="mt-6 mb-2 text-[10px] uppercase font-bold tracking-[0.18em] opacity-60">
					Spec
				</div>
				<output className="block text-xs leading-relaxed break-all bg-slate-900 text-emerald-200 border border-slate-700 p-2.5 font-mono">
					{spec}
				</output>

				<div className="flex gap-2 mt-3">
					<button
						type="button"
						onClick={copySpec}
						className="flex-1 bg-slate-900 text-white px-3 py-2 font-bold uppercase text-[10px] tracking-wider hover:bg-slate-700 transition-colors"
					>
						{copied ? "Copied!" : "Copy spec"}
					</button>
					<button
						type="button"
						onClick={reset}
						className="px-3 py-2 border-2 border-slate-900 font-bold uppercase text-[10px] tracking-wider hover:bg-slate-100"
					>
						Reset
					</button>
				</div>
				<p className="mt-2 text-[10px] opacity-60 font-sans leading-snug">
					Click Copy spec, then paste the line back into chat to lock the
					composition.
				</p>
			</div>
		</div>
	);
}
