import { useState } from "react";
import { TOPICS, type TopicId } from "../../data/topics";
import { Segmented, Slider, Swatches, Toggle } from "./composer/DesignControls";
import { IDENTITIES } from "./composer/identities";
import { INNER_ORDER, INNERS, LINK_ORDER, LINKS } from "./composer/index";
import {
	SKYLINE_COLOR_OPTS,
	SKYLINE_HAS_VARIETY,
} from "./composer/inner/skyline";
import type {
	AnyInnerParams,
	AnyLinkParams,
	InnerId,
	InnerParamsMap,
	LinkBase,
	LinkId,
	LinkParamsMap,
} from "./composer/types";
import {
	buildComposerSpec,
	type ComposerState,
} from "./composer/useComposerControls";

/*
 * Composer panel - shipped to prod inside the `panel-dialog-modal` <dialog>.
 *
 * Renders so the live landscape stays visible. A top "Shipped baseline" toggle
 * bypasses the composer to A/B against the baseline. Below it, two tabbed
 * layers - a per-topic Inside style (chosen per topic via the topic selector)
 * plus a GLOBAL Connector (one pick) - each exposing the selected item's
 * focused params. Spec readout + Copy spec + Reset at the bottom.
 */

export const DESIGN_PANEL_TITLE_ID = "design-panel-title";

type Handlers = {
	setBaseline: (v: boolean) => void;
	setInner: (topicId: TopicId, id: InnerId) => void;
	setAllInners: (id: InnerId) => void;
	setLink: (id: LinkId) => void;
	patchInnerParams: (topicId: TopicId, p: Partial<AnyInnerParams>) => void;
	patchAllInnerParams: (p: Partial<AnyInnerParams>) => void;
	patchLinkParams: (p: Partial<AnyLinkParams>) => void;
};

type DesignPanelProps = Handlers & {
	state: ComposerState;
	reset: () => void;
	onClose: () => void;
};

const LINK_COLOR_SWATCHES: {
	value: LinkBase["color"];
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

type InnerPatch = (p: Partial<AnyInnerParams>) => void;

/* Each inside style's signature toggle + theming knob. `params` is the union;
 * the active row's id always matches the live params, so the per-case cast is
 * sound. An inner with no signature controls falls through to default null. */
function InsideSpecificControls({
	id,
	params,
	patch,
}: {
	id: InnerId;
	params: AnyInnerParams;
	patch: InnerPatch;
}) {
	switch (id) {
		case "minimal": {
			const p = params as InnerParamsMap["minimal"];
			return (
				<>
					<Segmented
						label="Alignment"
						value={p.align}
						options={[
							{ value: "center", label: "Center" },
							{ value: "left", label: "Left" },
						]}
						onChange={(align) => patch({ align })}
					/>
					<Toggle
						label="Accent underline"
						checked={p.underline}
						onChange={(underline) => patch({ underline })}
					/>
				</>
			);
		}
		case "trail-signpost": {
			const p = params as InnerParamsMap["trail-signpost"];
			return (
				<>
					<Segmented
						label="Wood"
						value={p.wood}
						options={[
							{ value: "pine", label: "Pine" },
							{ value: "walnut", label: "Walnut" },
							{ value: "weathered", label: "Weathered" },
						]}
						onChange={(wood) => patch({ wood })}
					/>
					<Toggle
						label="Waypoint marker"
						checked={p.marker}
						onChange={(marker) => patch({ marker })}
					/>
				</>
			);
		}
		case "field-journal": {
			const p = params as InnerParamsMap["field-journal"];
			return (
				<>
					<Segmented
						label="Paper"
						value={p.paper}
						options={[
							{ value: "kraft", label: "Kraft" },
							{ value: "graph", label: "Graph" },
							{ value: "aged", label: "Aged" },
						]}
						onChange={(paper) => patch({ paper })}
					/>
					<Toggle
						label="Specimen tape"
						checked={p.tape}
						onChange={(tape) => patch({ tape })}
					/>
				</>
			);
		}
		case "constellation": {
			const p = params as InnerParamsMap["constellation"];
			return (
				<>
					<Segmented
						label="Tint"
						value={p.tint}
						options={[
							{ value: "indigo", label: "Indigo" },
							{ value: "cyan", label: "Cyan" },
							{ value: "violet", label: "Violet" },
						]}
						onChange={(tint) => patch({ tint })}
					/>
					<Segmented
						label="Figure"
						value={p.figure}
						options={[
							{ value: "wing", label: "Wing" },
							{ value: "crown", label: "Crown" },
							{ value: "river", label: "River" },
						]}
						onChange={(figure) => patch({ figure })}
					/>
					<Toggle
						label="Connecting lines"
						checked={p.lines}
						onChange={(lines) => patch({ lines })}
					/>
				</>
			);
		}
		case "terminal": {
			const p = params as InnerParamsMap["terminal"];
			// Blinking cursor locked on - toggle removed.
			return (
				<Segmented
					label="Scheme"
					value={p.scheme}
					options={[
						{ value: "midnight", label: "Midnight" },
						{ value: "matrix", label: "Matrix" },
						{ value: "amber", label: "Amber" },
						{ value: "ice", label: "Ice" },
					]}
					onChange={(scheme) => patch({ scheme })}
				/>
			);
		}
		case "polaroid": {
			const p = params as InnerParamsMap["polaroid"];
			return (
				<>
					<Segmented
						label="Tilt"
						value={p.tilt}
						options={[
							{ value: "left", label: "Left" },
							{ value: "straight", label: "Straight" },
							{ value: "right", label: "Right" },
						]}
						onChange={(tilt) => patch({ tilt })}
					/>
					<Toggle
						label="Washi tape"
						checked={p.tape}
						onChange={(tape) => patch({ tape })}
					/>
				</>
			);
		}
		case "collectible": {
			const p = params as InnerParamsMap["collectible"];
			return (
				<>
					<Segmented
						label="Rarity"
						value={p.rarity}
						options={[
							{ value: "common", label: "Common" },
							{ value: "rare", label: "Rare" },
							{ value: "legendary", label: "Legend" },
						]}
						onChange={(rarity) => patch({ rarity })}
					/>
					<Toggle
						label="Foil gem"
						checked={p.gem}
						onChange={(gem) => patch({ gem })}
					/>
				</>
			);
		}
		case "comic": {
			const p = params as InnerParamsMap["comic"];
			return (
				<>
					<Segmented
						label="Palette"
						value={p.palette}
						options={[
							{ value: "classic", label: "Classic" },
							{ value: "noir", label: "Noir" },
							{ value: "pop", label: "Pop" },
						]}
						onChange={(palette) => patch({ palette })}
					/>
					<Toggle
						label="Halftone wash"
						checked={p.halftone}
						onChange={(halftone) => patch({ halftone })}
					/>
				</>
			);
		}
		case "ticket-stub": {
			const p = params as InnerParamsMap["ticket-stub"];
			// Ticket color locked to crimson - segmented removed.
			return (
				<Toggle
					label="Perforation"
					checked={p.perforation}
					onChange={(perforation) => patch({ perforation })}
				/>
			);
		}
		case "blueprint": {
			const p = params as InnerParamsMap["blueprint"];
			return (
				<>
					<Segmented
						label="Print"
						value={p.paper}
						options={[
							{ value: "cyanotype", label: "Cyan" },
							{ value: "slate", label: "Slate" },
							{ value: "charcoal", label: "Charcoal" },
						]}
						onChange={(paper) => patch({ paper })}
					/>
					<Toggle
						label="Grid"
						checked={p.grid}
						onChange={(grid) => patch({ grid })}
					/>
				</>
			);
		}
		case "circuit-board": {
			const p = params as InnerParamsMap["circuit-board"];
			return (
				<>
					<Segmented
						label="Soldermask"
						value={p.mask}
						options={[
							{ value: "green", label: "Green" },
							{ value: "blue", label: "Blue" },
							{ value: "black", label: "Black" },
							{ value: "purple", label: "Purple" },
						]}
						onChange={(mask) => patch({ mask })}
					/>
					<Toggle
						label="Copper traces"
						checked={p.traces}
						onChange={(traces) => patch({ traces })}
					/>
				</>
			);
		}
		case "arcade-hud": {
			const p = params as InnerParamsMap["arcade-hud"];
			return (
				<>
					<Segmented
						label="Phosphor"
						value={p.palette}
						options={[
							{ value: "green", label: "Green" },
							{ value: "amber", label: "Amber" },
							{ value: "ice", label: "Ice" },
							{ value: "magenta", label: "Magenta" },
						]}
						onChange={(palette) => patch({ palette })}
					/>
					<Toggle
						label="CRT scanlines"
						checked={p.scanlines}
						onChange={(scanlines) => patch({ scanlines })}
					/>
				</>
			);
		}
		case "neon-sign": {
			const p = params as InnerParamsMap["neon-sign"];
			return (
				<>
					<Segmented
						label="Neon color"
						value={p.color}
						options={[
							{ value: "pink", label: "Pink" },
							{ value: "cyan", label: "Cyan" },
							{ value: "lime", label: "Lime" },
							{ value: "gold", label: "Gold" },
						]}
						onChange={(color) => patch({ color })}
					/>
					<Toggle
						label="Glow flicker"
						checked={p.flicker}
						onChange={(flicker) => patch({ flicker })}
					/>
				</>
			);
		}
		case "chalkboard": {
			const p = params as InnerParamsMap["chalkboard"];
			return (
				<>
					<Segmented
						label="Chalk"
						value={p.chalk}
						options={[
							{ value: "white", label: "White" },
							{ value: "yellow", label: "Yellow" },
							{ value: "pastel", label: "Pastel" },
						]}
						onChange={(chalk) => patch({ chalk })}
					/>
					<Toggle
						label="Chalk dust"
						checked={p.dust}
						onChange={(dust) => patch({ dust })}
					/>
				</>
			);
		}
		case "topo-map": {
			const p = params as InnerParamsMap["topo-map"];
			return (
				<>
					<Segmented
						label="Terrain"
						value={p.terrain}
						options={[
							{ value: "forest", label: "Forest" },
							{ value: "desert", label: "Desert" },
							{ value: "alpine", label: "Alpine" },
						]}
						onChange={(terrain) => patch({ terrain })}
					/>
					<Toggle
						label="Contour lines"
						checked={p.contours}
						onChange={(contours) => patch({ contours })}
					/>
				</>
			);
		}
		case "seed-packet": {
			const p = params as InnerParamsMap["seed-packet"];
			return (
				<>
					<Segmented
						label="Stock"
						value={p.stock}
						options={[
							{ value: "cream", label: "Cream" },
							{ value: "kraft", label: "Kraft" },
							{ value: "sage", label: "Sage" },
						]}
						onChange={(stock) => patch({ stock })}
					/>
					<Toggle
						label="Illustration"
						checked={p.illustration}
						onChange={(illustration) => patch({ illustration })}
					/>
				</>
			);
		}
		case "timecard": {
			const p = params as InnerParamsMap["timecard"];
			return (
				<>
					<Segmented
						label="Stock"
						value={p.stock}
						options={[
							{ value: "manila", label: "Manila" },
							{ value: "buff", label: "Buff" },
							{ value: "ledger", label: "Ledger" },
						]}
						onChange={(stock) => patch({ stock })}
					/>
					<Toggle
						label="Time stamps"
						checked={p.stamps}
						onChange={(stamps) => patch({ stamps })}
					/>
				</>
			);
		}
		case "nameplate": {
			const p = params as InnerParamsMap["nameplate"];
			return (
				<>
					<Segmented
						label="Role"
						value={p.role}
						options={[
							{ value: "title", label: "Title" },
							{ value: "tenure", label: "Tenure" },
							{ value: "focus", label: "Focus" },
						]}
						onChange={(role) => patch({ role })}
					/>
					<Toggle
						label="Screws"
						checked={p.screws}
						onChange={(screws) => patch({ screws })}
					/>
				</>
			);
		}
		case "punch-card": {
			const p = params as InnerParamsMap["punch-card"];
			return (
				<>
					<Segmented
						label="Stock"
						value={p.stock}
						options={[
							{ value: "manila", label: "Manila" },
							{ value: "salmon", label: "Salmon" },
							{ value: "mint", label: "Mint" },
						]}
						onChange={(stock) => patch({ stock })}
					/>
					<Toggle
						label="Punched holes"
						checked={p.holes}
						onChange={(holes) => patch({ holes })}
					/>
				</>
			);
		}
		case "offer-letter": {
			const p = params as InnerParamsMap["offer-letter"];
			return (
				<>
					<Segmented
						label="Stock"
						value={p.stock}
						options={[
							{ value: "cream", label: "Cream" },
							{ value: "ivory", label: "Ivory" },
							{ value: "dove", label: "Dove" },
						]}
						onChange={(stock) => patch({ stock })}
					/>
					<Toggle
						label="Signature"
						checked={p.scrawl}
						onChange={(scrawl) => patch({ scrawl })}
					/>
				</>
			);
		}
		case "aurora": {
			const p = params as InnerParamsMap["aurora"];
			return (
				<>
					<Segmented
						label="Hue"
						value={p.hue}
						options={[
							{ value: "emerald", label: "Emerald" },
							{ value: "violet", label: "Violet" },
							{ value: "teal", label: "Teal" },
						]}
						onChange={(hue) => patch({ hue })}
					/>
					<Toggle
						label="Stars"
						checked={p.stars}
						onChange={(stars) => patch({ stars })}
					/>
				</>
			);
		}
		case "moonrise": {
			const p = params as InnerParamsMap["moonrise"];
			return (
				<>
					<Segmented
						label="Phase"
						value={p.phase}
						options={[
							{ value: "crescent", label: "Crescent" },
							{ value: "gibbous", label: "Gibbous" },
							{ value: "full", label: "Full" },
						]}
						onChange={(phase) => patch({ phase })}
					/>
					<Toggle
						label="Stars"
						checked={p.stars}
						onChange={(stars) => patch({ stars })}
					/>
				</>
			);
		}
		case "daybreak": {
			const p = params as InnerParamsMap["daybreak"];
			return (
				<>
					<Segmented
						label="Sky"
						value={p.sky}
						options={[
							{ value: "dawn", label: "Dawn" },
							{ value: "golden", label: "Golden" },
							{ value: "dusk", label: "Dusk" },
						]}
						onChange={(sky) => patch({ sky })}
					/>
					<Toggle
						label="Sun rays"
						checked={p.rays}
						onChange={(rays) => patch({ rays })}
					/>
				</>
			);
		}
		case "summit": {
			const p = params as InnerParamsMap["summit"];
			return (
				<>
					<Segmented
						label="Range"
						value={p.range}
						options={[
							{ value: "dawn", label: "Dawn" },
							{ value: "dusk", label: "Dusk" },
							{ value: "night", label: "Night" },
						]}
						onChange={(range) => patch({ range })}
					/>
					<Toggle
						label="Snow caps"
						checked={p.snow}
						onChange={(snow) => patch({ snow })}
					/>
				</>
			);
		}
		case "skyline": {
			const p = params as InnerParamsMap["skyline"];
			return (
				<>
					<Segmented
						label="Element"
						value={p.motif}
						options={[
							{ value: "birds", label: "Birds" },
							{ value: "clouds", label: "Clouds" },
							{ value: "plane", label: "Plane" },
							{ value: "kite", label: "Kite" },
							{ value: "balloon", label: "Balloon" },
						]}
						onChange={(motif) => patch({ motif })}
					/>
					<Segmented
						label="Prominence"
						value={p.prominence}
						options={[
							{ value: "whisper", label: "Whisper" },
							{ value: "subtle", label: "Subtle" },
							{ value: "present", label: "Present" },
							{ value: "bold", label: "Bold" },
						]}
						onChange={(prominence) => patch({ prominence })}
					/>
					<Segmented
						label="Placement"
						value={p.placement}
						options={[
							{ value: "corner", label: "Corner" },
							{ value: "cluster", label: "Cluster" },
							{ value: "scatter", label: "Scatter" },
							{ value: "edges", label: "Edges" },
						]}
						onChange={(placement) => patch({ placement })}
					/>
					{SKYLINE_HAS_VARIETY[p.motif] && (
						<Segmented
							label="Variety"
							value={p.variety}
							options={[
								{ value: "uniform", label: "Uniform" },
								{ value: "mixed", label: "Mixed" },
							]}
							onChange={(variety) => patch({ variety })}
						/>
					)}
					<Segmented
						label="Color"
						value={p.color}
						options={SKYLINE_COLOR_OPTS[p.motif].map((co) => ({
							value: co,
							label: co.charAt(0).toUpperCase() + co.slice(1),
						}))}
						onChange={(color) => patch({ color })}
					/>
					<Toggle
						label="Drift"
						checked={p.drift}
						onChange={(drift) => patch({ drift })}
					/>
				</>
			);
		}
		case "parallax-depth": {
			const p = params as InnerParamsMap["parallax-depth"];
			// Backdrop shape (flourish) + layers (3) are locked - knobs removed.
			return (
				<Slider
					label="Drift depth"
					value={p.depth}
					min={0}
					max={100}
					onChange={(depth) => patch({ depth })}
				/>
			);
		}
		case "floating-island": {
			const p = params as InnerParamsMap["floating-island"];
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
		default:
			return null;
	}
}

function InnerParamsBlock({
	id,
	params,
	patch,
}: {
	id: InnerId;
	params: AnyInnerParams;
	patch: InnerPatch;
}) {
	return (
		<>
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
			<InsideSpecificControls id={id} params={params} patch={patch} />
		</>
	);
}

type LinkPatch = (p: Partial<AnyLinkParams>) => void;

/* Each connector's signature params (curve + its own knobs). `params` is the
 * union; the selected connector's id matches the live params, so the per-case
 * cast is sound. `none` has no params and isn't shown (→ default). */
function LinkSpecificControls({
	id,
	params,
	patch,
}: {
	id: LinkId;
	params: AnyLinkParams;
	patch: LinkPatch;
}) {
	switch (id) {
		case "ruled-seam": {
			const p = params as LinkParamsMap["ruled-seam"];
			return (
				<>
					<Segmented
						label="End caps"
						value={p.caps}
						options={[
							{ value: "round", label: "Round" },
							{ value: "bar", label: "Bar" },
							{ value: "none", label: "None" },
						]}
						onChange={(caps) => patch({ caps })}
					/>
					<Toggle
						label="Double rule"
						checked={p.double}
						onChange={(double) => patch({ double })}
					/>
				</>
			);
		}
		case "flowing-curve": {
			const p = params as LinkParamsMap["flowing-curve"];
			return (
				<>
					<Slider
						label="Curve amount"
						value={p.curve}
						min={0}
						max={100}
						onChange={(curve) => patch({ curve })}
					/>
					<Segmented
						label="Weave"
						value={p.weave}
						options={[
							{ value: "single", label: "Single" },
							{ value: "double", label: "Double" },
							{ value: "triple", label: "Triple" },
						]}
						onChange={(weave) => patch({ weave })}
					/>
				</>
			);
		}
		case "botanical-vine": {
			const p = params as LinkParamsMap["botanical-vine"];
			return (
				<>
					<Slider
						label="Curve amount"
						value={p.curve}
						min={0}
						max={100}
						onChange={(curve) => patch({ curve })}
					/>
					<Segmented
						label="Foliage"
						value={p.foliage}
						options={[
							{ value: "sparse", label: "Sparse" },
							{ value: "lush", label: "Lush" },
						]}
						onChange={(foliage) => patch({ foliage })}
					/>
					<Toggle
						label="Flower bud"
						checked={p.bud}
						onChange={(bud) => patch({ bud })}
					/>
				</>
			);
		}
		case "trail-dashes": {
			const p = params as LinkParamsMap["trail-dashes"];
			return (
				<>
					<Slider
						label="Curve amount"
						value={p.curve}
						min={0}
						max={100}
						onChange={(curve) => patch({ curve })}
					/>
					<Segmented
						label="Dash"
						value={p.dash}
						options={[
							{ value: "fine", label: "Fine" },
							{ value: "standard", label: "Standard" },
							{ value: "bold", label: "Bold" },
						]}
						onChange={(dash) => patch({ dash })}
					/>
					<Toggle
						label="Footprints"
						checked={p.footprints}
						onChange={(footprints) => patch({ footprints })}
					/>
				</>
			);
		}
		default: {
			const p = params as LinkParamsMap["constellation-starline"];
			return (
				<>
					<Slider
						label="Curve amount"
						value={p.curve}
						min={0}
						max={100}
						onChange={(curve) => patch({ curve })}
					/>
					<Segmented
						label="Stars"
						value={p.stars}
						options={[
							{ value: "few", label: "Few" },
							{ value: "many", label: "Many" },
						]}
						onChange={(stars) => patch({ stars })}
					/>
					<Segmented
						label="Glow"
						value={p.glow}
						options={[
							{ value: "soft", label: "Soft" },
							{ value: "bright", label: "Bright" },
						]}
						onChange={(glow) => patch({ glow })}
					/>
				</>
			);
		}
	}
}

function LinkParamsBlock({
	id,
	params,
	patch,
}: {
	id: LinkId;
	params: AnyLinkParams;
	patch: LinkPatch;
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
			<LinkSpecificControls id={id} params={params} patch={patch} />
			<Slider
				label="Rail height"
				value={params.height}
				min={20}
				max={150}
				unit="vh"
				onChange={(height) => patch({ height })}
			/>
			<Slider
				label="Blend into landscape"
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

type LayerTab = "inner" | "link";

const TABS: { id: LayerTab; label: string; feel: string }[] = [
	{ id: "inner", label: "Inside", feel: "Per topic" },
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

/** The common inside pick across every topic, or null when they differ. */
function uniformInner(clusters: ComposerState["clusters"]): InnerId | null {
	const ids = TOPICS.map((t) => clusters[t.id].id);
	const first = ids[0];
	return first && ids.every((id) => id === first) ? first : null;
}

const TOPIC_CHIP = (selected: boolean) =>
	`px-2 py-1 text-[10px] font-black uppercase tracking-wider border-2 transition-colors ${
		selected
			? "bg-slate-900 text-white border-slate-900"
			: "bg-white text-slate-700 border-slate-300 hover:border-slate-900"
	}`;

/* Inside is per-topic, so its tab edits ONE topic at a time - or every topic
 * at once via the All chip. `isCustom`/`subtitle` reflect the per-topic
 * picks. */
function TopicSelector({
	label,
	active,
	isCustom,
	subtitle,
	onSelect,
}: {
	label: string;
	active: TopicId | "all";
	isCustom: (id: TopicId) => boolean;
	subtitle: (id: TopicId) => string;
	onSelect: (id: TopicId | "all") => void;
}) {
	return (
		<div>
			<div className="text-[9px] uppercase font-bold tracking-[0.18em] opacity-55 mb-1.5">
				{label}
			</div>
			<div className="flex flex-wrap gap-1">
				<button
					type="button"
					onClick={() => onSelect("all")}
					aria-pressed={active === "all"}
					title="Apply one pick to every topic"
					className={TOPIC_CHIP(active === "all")}
				>
					◆ All
				</button>
				{TOPICS.map((t) => {
					const selected = t.id === active;
					return (
						<button
							key={t.id}
							type="button"
							onClick={() => onSelect(t.id)}
							aria-pressed={selected}
							title={`${t.heading} - ${subtitle(t.id)}`}
							className={TOPIC_CHIP(selected)}
						>
							{t.heading}
							{isCustom(t.id) && (
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
	setInner,
	setAllInners,
	setLink,
	patchInnerParams,
	patchAllInnerParams,
	patchLinkParams,
	reset,
	onClose,
}: DesignPanelProps) {
	const [copied, setCopied] = useState(false);
	const [tab, setTab] = useState<LayerTab>("inner");
	// Scope for the per-topic Inside tab. "all" edits every topic at once; a
	// TopicId edits just that one.
	const [activeTopic, setActiveTopic] = useState<TopicId | "all">("all");
	const spec = buildComposerSpec(state);
	const disabled = state.baseline;

	// Resolve the per-topic list's selection + write handlers for the active
	// scope. In "all" mode the list keys off a representative topic and writes to
	// every topic; the highlighted row reflects the common pick (none if mixed).
	const repTopic: TopicId = TOPICS[0]?.id ?? "career";
	const activeCluster =
		activeTopic === "all"
			? state.clusters[repTopic]
			: state.clusters[activeTopic];
	const selectedInner =
		activeTopic === "all" ? uniformInner(state.clusters) : activeCluster.id;
	const pickInner = (id: InnerId) => {
		if (activeTopic === "all") setAllInners(id);
		else setInner(activeTopic, id);
	};
	const patchInner = (p: Partial<AnyInnerParams>) => {
		if (activeTopic === "all") patchAllInnerParams(p);
		else patchInnerParams(activeTopic, p);
	};

	const copySpec = async () => {
		try {
			await navigator.clipboard.writeText(spec);
			setCopied(true);
			setTimeout(() => setCopied(false), 1500);
		} catch {
			// clipboard unavailable - user can still read the spec line below
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
					A per-topic inside style × a global connector. Tune each layer's
					params, then scroll the page to judge it against the live landscape,
					day → night.
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

					{tab === "inner" && (
						<div className="flex flex-col gap-3">
							<TopicSelector
								label="Editing inside for"
								active={activeTopic}
								isCustom={(t) =>
									state.clusters[t].id !== IDENTITIES[t].inner.id
								}
								subtitle={(t) => INNERS[state.clusters[t].id].label}
								onSelect={setActiveTopic}
							/>
							<div className="flex flex-col gap-2">
								{INNER_ORDER.map((id) => (
									<LayerRow
										key={id}
										label={INNERS[id].label}
										feel={INNERS[id].feel}
										selected={id === selectedInner}
										onSelect={() => pickInner(id)}
									>
										<InnerParamsBlock
											id={id}
											params={activeCluster.params}
											patch={patchInner}
										/>
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
