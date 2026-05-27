import { useState } from "react";
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
	InnerId,
	InnerParams,
	LinkId,
	LinkParams,
	SectionId,
	SectionParams,
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
 * composer to A/B against production. Below it, three labeled single-select
 * layers — SECTION STYLE / INSIDE THE TOPIC / BETWEEN TOPICS — and under the
 * SELECTED item in each layer, that item's focused param controls. Spec readout
 * + Copy spec + Reset at the bottom.
 *
 * Planner: removed with the rest of the composer host once a composition is
 * locked (see CLEANUP_NEEDED).
 */

export const DESIGN_PANEL_TITLE_ID = "design-panel-title";

type Handlers = {
	setBaseline: (v: boolean) => void;
	setSection: (id: SectionId) => void;
	setInner: (id: InnerId) => void;
	setLink: (id: LinkId) => void;
	patchSectionParams: (p: Partial<SectionParams>) => void;
	patchInnerParams: (p: Partial<InnerParams>) => void;
	patchLinkParams: (p: Partial<LinkParams>) => void;
};

type DesignPanelProps = Handlers & {
	state: ComposerState;
	reset: () => void;
	onClose: () => void;
};

const ACCENT_SWATCHES: {
	value: SectionParams["accent"];
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

function SectionParamsBlock({
	id,
	params,
	patch,
}: {
	id: SectionId;
	params: SectionParams;
	patch: (p: Partial<SectionParams>) => void;
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
			<Segmented
				label="Content position"
				value={params.align}
				options={[
					{ value: "center", label: "Center" },
					{ value: "left", label: "Left" },
					{ value: "right", label: "Right" },
					{ value: "bottom", label: "Bottom" },
				]}
				onChange={(align) => patch({ align })}
			/>
			<Slider
				label="Scrim / backdrop"
				value={params.scrim}
				min={0}
				max={80}
				onChange={(scrim) => patch({ scrim })}
			/>
			<Slider
				label="Stage height"
				value={params.height}
				min={lo}
				max={hi}
				unit="vh"
				onChange={(height) => patch({ height })}
			/>
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
					DEV-only. Stack a section style × an inner content style × a
					between-topic connector. Tune each layer's params, then scroll the
					page to judge it against the live landscape, day → night.
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
						<div className="flex flex-col gap-2">
							{INNER_ORDER.map((id) => (
								<LayerRow
									key={id}
									label={INNERS[id].label}
									feel={INNERS[id].feel}
									selected={id === state.inner}
									onSelect={() => setInner(id)}
								>
									<InnerParamsBlock
										id={id}
										params={state.innerParams}
										patch={patchInnerParams}
									/>
								</LayerRow>
							))}
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
