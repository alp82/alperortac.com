import { ArcadeHudCluster } from "./inner/arcade-hud";
import { BlueprintCluster } from "./inner/blueprint";
import { ChalkboardCluster } from "./inner/chalkboard";
import { CircuitBoardCluster } from "./inner/circuit-board";
import { CollectibleCluster } from "./inner/collectible";
import { ComicCluster } from "./inner/comic";
import { ConstellationCluster } from "./inner/constellation";
import { FieldJournalCluster } from "./inner/field-journal";
import { MinimalCluster } from "./inner/minimal";
import { NeonSignCluster } from "./inner/neon-sign";
import { PolaroidCluster } from "./inner/polaroid";
import { RichCardCluster } from "./inner/rich-card";
import { SeedPacketCluster } from "./inner/seed-packet";
import { TerminalCluster } from "./inner/terminal";
import { TicketStubCluster } from "./inner/ticket-stub";
import { TopoMapCluster } from "./inner/topo-map";
import { TrailSignpostCluster } from "./inner/trail-signpost";
import { BotanicalVineLink } from "./links/botanical-vine";
import { ConstellationStarlineLink } from "./links/constellation-starline";
import { FlowingCurveLink } from "./links/flowing-curve";
import { RuledSeamLink } from "./links/ruled-seam";
import { TrailDashesLink } from "./links/trail-dashes";
import { CenteredMonolithStage } from "./sections/centered-monolith";
import { FloatingIslandStage } from "./sections/floating-island";
import { MarqueeScrollStage } from "./sections/marquee-scroll";
import { ParallaxDepthStage } from "./sections/parallax-depth";
import { SplitStageStage } from "./sections/split-stage";
import { ZoomFocusStage } from "./sections/zoom-focus";
import type {
	InnerDef,
	InnerId,
	LinkDef,
	LinkId,
	SectionDef,
	SectionId,
} from "./types";

/*
 * DEV-ONLY composer registries — the single source of truth for the three
 * layers (section / inner / link). The panel reads these to build its radio
 * lists + per-item param controls; the dispatcher reads them to render the
 * selected composition.
 *
 * Production never imports this module (every importer is gated behind a folded
 * import.meta.env.DEV literal), so Rollup tree-shakes the whole registry + all
 * section/inner/link modules out of the prod client bundle. Verified by dist
 * grep — see CLEANUP_NEEDED.
 *
 * Planner: removed wholesale once a composition is locked.
 */

export type {
	InnerId,
	LinkId,
	SectionId,
} from "./types";

/* ── Layer 1: SECTION STYLES (the cinematic stage) ──────────────────────── */

export const SECTIONS: { [Id in SectionId]: SectionDef<Id> } = {
	"centered-monolith": {
		id: "centered-monolith",
		label: "Centered Monolith",
		feel: "Huge centered type over a radial scrim; the landscape glows at the edges. Title-card energy.",
		baseHeight: 100,
		heightRange: [70, 130],
		defaults: {
			accent: "topic",
			height: 100,
			vignette: 45,
			edgeGlow: 60,
			titleScale: "bold",
			indexTag: true,
		},
		Component: CenteredMonolithStage,
	},
	"split-stage": {
		id: "split-stage",
		label: "Split Stage",
		feel: "Asymmetric viewport split: type one side, negative space + ghost flourish the other.",
		baseHeight: 90,
		heightRange: [70, 115],
		defaults: {
			accent: "topic",
			height: 90,
			ratio: 58,
			side: "left",
			flourish: 16,
			spine: true,
		},
		Component: SplitStageStage,
	},
	"parallax-depth": {
		id: "parallax-depth",
		label: "Parallax Depth",
		feel: "Layered fore/background drift on scroll; the cluster floats over a slow ghost flourish. Tallest stage.",
		baseHeight: 110,
		heightRange: [90, 140],
		defaults: {
			accent: "topic",
			height: 110,
			shape: "flourish",
			depth: 50,
			layers: 3,
		},
		Component: ParallaxDepthStage,
	},
	"marquee-scroll": {
		id: "marquee-scroll",
		label: "Marquee Scroll",
		feel: "Giant repeating heading strips drift horizontally on scroll behind the cluster. Freezes under reduced motion.",
		baseHeight: 90,
		heightRange: [70, 115],
		defaults: {
			accent: "topic",
			height: 90,
			strips: 2,
			speed: 50,
			textStyle: "filled",
			mirrored: true,
		},
		Component: MarqueeScrollStage,
	},
	"floating-island": {
		id: "floating-island",
		label: "Floating Island",
		feel: "Cluster on a floating slab with a soft drop shadow, landscape all around; the slab bobs gently on scroll (reduced-motion safe).",
		baseHeight: 90,
		heightRange: [72, 115],
		defaults: {
			accent: "topic",
			height: 90,
			floatHeight: 50,
			bob: 50,
			corners: "soft",
			tint: 35,
		},
		Component: FloatingIslandStage,
	},
	"zoom-focus": {
		id: "zoom-focus",
		label: "Zoom Focus",
		feel: "Ken Burns: a ghost flourish slowly scales while the cluster grows understated→dominant on enter (reduced-motion safe).",
		baseHeight: 95,
		heightRange: [78, 122],
		defaults: {
			accent: "topic",
			height: 95,
			enterZoom: 45,
			speed: 50,
			drift: "up-right",
		},
		Component: ZoomFocusStage,
	},
};

export const SECTION_ORDER: SectionId[] = [
	"centered-monolith",
	"split-stage",
	"parallax-depth",
	"marquee-scroll",
	"floating-island",
	"zoom-focus",
];

/* ── Layer 2: INNER STYLES (the centered cluster) ───────────────────────── */

export const INNERS: { [Id in InnerId]: InnerDef<Id> } = {
	"rich-card": {
		id: "rich-card",
		label: "Rich Card",
		feel: "The live shipped section card — flourish, per-section layout, and content exactly as the site renders it. The default.",
		surface: "plate",
		defaults: { density: "roomy" },
		Component: RichCardCluster,
	},
	minimal: {
		id: "minimal",
		label: "Minimal",
		feel: "Clean cluster: a styled heading + optional accent underline, content below. Lets the stage do the talking.",
		surface: "plate",
		defaults: { density: "roomy", underline: true, align: "center" },
		Component: MinimalCluster,
	},
	"trail-signpost": {
		id: "trail-signpost",
		label: "Trail Signpost",
		feel: "Trail waypoint: a wooden signpost-board heading over a kraft trail-note. Pick the wood.",
		surface: "light",
		defaults: { density: "roomy", marker: true, wood: "walnut" },
		Component: TrailSignpostCluster,
	},
	"field-journal": {
		id: "field-journal",
		label: "Field Journal",
		feel: "Kraft journal spread: a handwritten field-note title with a fig. number on a chosen paper stock.",
		surface: "light",
		defaults: { density: "roomy", tape: true, paper: "kraft" },
		Component: FieldJournalCluster,
	},
	constellation: {
		id: "constellation",
		label: "Constellation",
		feel: "Among the stars: a star field + connecting lines in a chosen tint. Ties to the sky easter egg.",
		surface: "dark",
		defaults: { density: "roomy", lines: true, tint: "indigo" },
		Component: ConstellationCluster,
	},
	terminal: {
		id: "terminal",
		label: "Terminal",
		feel: "Terminal window: traffic dots + `❯ cat` prompt in a chosen color scheme. Techy clash.",
		surface: "dark",
		defaults: { density: "roomy", cursor: true, scheme: "midnight" },
		Component: TerminalCluster,
	},
	polaroid: {
		id: "polaroid",
		label: "Polaroid",
		feel: "Scrapbook page: a kraft board with a corner-pinned, tilt-able polaroid + handwritten caption.",
		surface: "light",
		defaults: { density: "roomy", tape: true, tilt: "left" },
		Component: PolaroidCluster,
	},
	collectible: {
		id: "collectible",
		label: "Collectible",
		feel: "Trading card: a foil rarity border + name banner; the rarity tier sets the chrome.",
		surface: "light",
		defaults: { density: "roomy", gem: true, rarity: "rare" },
		Component: CollectibleCluster,
	},
	comic: {
		id: "comic",
		label: "Comic",
		feel: "Comic page: a jagged caption banner over a paneled halftone wash in a chosen palette.",
		surface: "light",
		defaults: { density: "roomy", halftone: true, palette: "classic" },
		Component: ComicCluster,
	},
	"ticket-stub": {
		id: "ticket-stub",
		label: "Ticket Stub",
		feel: "Wide ticket: a perforated ADMIT ONE stub + barcode in a chosen ticket color.",
		surface: "light",
		defaults: { density: "roomy", perforation: true, color: "crimson" },
		Component: TicketStubCluster,
	},
	blueprint: {
		id: "blueprint",
		label: "Blueprint",
		feel: "Drafting sheet: a dimension-lined heading + grid; pick the print — cyanotype / white / charcoal.",
		surface: "dark",
		defaults: { density: "roomy", grid: true, paper: "cyanotype" },
		Component: BlueprintCluster,
	},
	"circuit-board": {
		id: "circuit-board",
		label: "Circuit Board",
		feel: "PCB panel: copper traces + solder pads on a chosen soldermask color. Fits AI.",
		surface: "dark",
		defaults: { density: "roomy", traces: true, mask: "green" },
		Component: CircuitBoardCluster,
	},
	"arcade-hud": {
		id: "arcade-hud",
		label: "Arcade HUD",
		feel: "HUD-framed panel: SCORE/HP/LEVEL chrome + scanlines in a chosen phosphor palette.",
		surface: "dark",
		defaults: { density: "roomy", scanlines: true, palette: "green" },
		Component: ArcadeHudCluster,
	},
	"neon-sign": {
		id: "neon-sign",
		label: "Neon Sign",
		feel: "Neon board: a glowing neon-tube heading in a chosen color, content below.",
		surface: "dark",
		defaults: { density: "roomy", flicker: true, color: "pink" },
		Component: NeonSignCluster,
	},
	chalkboard: {
		id: "chalkboard",
		label: "Chalkboard",
		feel: "Wood-framed slate: a chalk-hand heading written in a chosen chalk color.",
		surface: "dark",
		defaults: { density: "roomy", dust: true, chalk: "white" },
		Component: ChalkboardCluster,
	},
	"topo-map": {
		id: "topo-map",
		label: "Topo Map",
		feel: "Topographic survey: elevation contour lines + a benchmark, tinted to a chosen terrain. Ties to the journey.",
		surface: "light",
		defaults: { density: "roomy", contours: true, terrain: "forest" },
		Component: TopoMapCluster,
	},
	"seed-packet": {
		id: "seed-packet",
		label: "Seed Packet",
		feel: "Garden seed packet: an illustrated header + sow-by strip on a chosen paper stock. Whimsical, nature.",
		surface: "light",
		defaults: { density: "roomy", illustration: true, stock: "cream" },
		Component: SeedPacketCluster,
	},
};

export const INNER_ORDER: InnerId[] = [
	"rich-card",
	"minimal",
	"trail-signpost",
	"field-journal",
	"constellation",
	"terminal",
	"polaroid",
	"collectible",
	"comic",
	"ticket-stub",
	"blueprint",
	"circuit-board",
	"arcade-hud",
	"neon-sign",
	"chalkboard",
	"topo-map",
	"seed-packet",
];

/* ── Layer 3: LINKS (between-topic connectors) ──────────────────────────── */

// Shared rail defaults (color + signature params set per connector).
const LINK_BASE = { weight: 2, height: 90, blend: 90, animate: true } as const;

export const LINKS: { [Id in LinkId]: LinkDef<Id> } = {
	none: {
		id: "none",
		label: "None",
		feel: "No connector — topics sit on their own with the natural seam.",
		defaults: { ...LINK_BASE, color: "ink" },
		Component: null,
	},
	"ruled-seam": {
		id: "ruled-seam",
		label: "Ruled Seam",
		feel: "A clean straight rule descending the seam. Pick the end-caps; double it for a rail. Editorial.",
		defaults: {
			...LINK_BASE,
			color: "ink",
			weight: 3,
			caps: "round",
			double: false,
		},
		Component: RuledSeamLink,
	},
	"flowing-curve": {
		id: "flowing-curve",
		label: "Flowing Curve",
		feel: "A smooth S-curve sweeping down the page; `weave` adds more bends.",
		defaults: { ...LINK_BASE, color: "ink", curve: 50, weave: "single" },
		Component: FlowingCurveLink,
	},
	"botanical-vine": {
		id: "botanical-vine",
		label: "Botanical Vine",
		feel: "An organic vine with leaves budding off it. `foliage` sets leaf density; `bud` flowers the tip.",
		defaults: {
			...LINK_BASE,
			color: "accent",
			curve: 50,
			foliage: "sparse",
			bud: true,
		},
		Component: BotanicalVineLink,
	},
	"trail-dashes": {
		id: "trail-dashes",
		label: "Trail Dashes",
		feel: "A dashed footpath descending between topics. `dash` sets the rhythm; add footprints.",
		defaults: {
			...LINK_BASE,
			color: "earth",
			curve: 50,
			dash: "standard",
			footprints: false,
		},
		Component: TrailDashesLink,
	},
	"constellation-starline": {
		id: "constellation-starline",
		label: "Star Line",
		feel: "A faint dotted star-path with twinkling nodes. `stars` sets the count; `glow` their shine.",
		defaults: {
			...LINK_BASE,
			color: "sky",
			curve: 50,
			stars: "few",
			glow: "soft",
		},
		Component: ConstellationStarlineLink,
	},
};

export const LINK_ORDER: LinkId[] = [
	"none",
	"ruled-seam",
	"flowing-curve",
	"botanical-vine",
	"trail-dashes",
	"constellation-starline",
];
