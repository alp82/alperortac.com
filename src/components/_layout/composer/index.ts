import { ArcadeHudCluster } from "./inner/arcade-hud";
import { BlueprintCluster } from "./inner/blueprint";
import { CassetteCluster } from "./inner/cassette";
import { ChalkboardCluster } from "./inner/chalkboard";
import { CircuitBoardCluster } from "./inner/circuit-board";
import { CollectibleCluster } from "./inner/collectible";
import { ComicCluster } from "./inner/comic";
import { ConstellationCluster } from "./inner/constellation";
import { EmbossedSealCluster } from "./inner/embossed-seal";
import { FieldJournalCluster } from "./inner/field-journal";
import { LuggageTagCluster } from "./inner/luggage-tag";
import { ManuscriptCluster } from "./inner/manuscript";
import { MarqueeBulbsCluster } from "./inner/marquee-bulbs";
import { MinimalCluster } from "./inner/minimal";
import { MuseumCluster } from "./inner/museum";
import { NeonSignCluster } from "./inner/neon-sign";
import { PolaroidCluster } from "./inner/polaroid";
import { PressedSpecimenCluster } from "./inner/pressed-specimen";
import { ReceiptCluster } from "./inner/receipt";
import { RichCardCluster } from "./inner/rich-card";
import { StampPostcardCluster } from "./inner/stamp-postcard";
import { StrataCoreCluster } from "./inner/strata-core";
import { TerminalCluster } from "./inner/terminal";
import { TicketStubCluster } from "./inner/ticket-stub";
import { TrailSignpostCluster } from "./inner/trail-signpost";
import { VinylLinerCluster } from "./inner/vinyl-liner";
import { WantedPosterCluster } from "./inner/wanted-poster";
import { BotanicalVineLink } from "./links/botanical-vine";
import { ConstellationStarlineLink } from "./links/constellation-starline";
import { DottedThreadLink } from "./links/dotted-thread";
import { FlowingCurveLink } from "./links/flowing-curve";
import { RiverRibbonLink } from "./links/river-ribbon";
import { RuledSeamLink } from "./links/ruled-seam";
import { StrataSeamLink } from "./links/strata-seam";
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

const INNER_DEFAULTS = {
	color: "accent",
	density: "comfortable",
	motif: true,
} as const;

export const INNERS: Record<InnerId, InnerDef> = {
	"rich-card": {
		id: "rich-card",
		label: "Rich Card",
		feel: "The live shipped section card — flourish, per-section layout, and content exactly as the site renders it. The default.",
		motifLabel: "Flourish",
		defaults: { ...INNER_DEFAULTS },
		Component: RichCardCluster,
	},
	minimal: {
		id: "minimal",
		label: "Minimal",
		feel: "Clean centered cluster: heading + accent underline, content below, no heavy chrome. Lets the stage do the talking.",
		motifLabel: "Accent underline",
		defaults: { ...INNER_DEFAULTS },
		Component: MinimalCluster,
	},
	"trail-signpost": {
		id: "trail-signpost",
		label: "Trail Signpost",
		feel: "Trail waypoint: a wooden signpost-board heading label, content as the note body below.",
		motifLabel: "Waypoint marker",
		defaults: { ...INNER_DEFAULTS },
		Component: TrailSignpostCluster,
	},
	"field-journal": {
		id: "field-journal",
		label: "Field Journal",
		feel: "Kraft journal spread: a handwritten field-note title with a fig. number, content as the entry on the page.",
		motifLabel: "Specimen tape",
		defaults: { ...INNER_DEFAULTS },
		Component: FieldJournalCluster,
	},
	museum: {
		id: "museum",
		label: "Museum",
		feel: "Framed gallery placard: a serif Exhibit number, content inside a mat border. Calm against the noise.",
		motifLabel: "Double frame",
		defaults: { ...INNER_DEFAULTS },
		Component: MuseumCluster,
	},
	"strata-core": {
		id: "strata-core",
		label: "Strata Core",
		feel: "Core-sample panel: an earthy core rail + vertical depth gauge, content in the side panel. Ties to the dig.",
		motifLabel: "Sediment striations",
		defaults: { ...INNER_DEFAULTS },
		Component: StrataCoreCluster,
	},
	constellation: {
		id: "constellation",
		label: "Constellation",
		feel: "Content panel among the stars: a centered content card over a full-bleed star field + dark scrim. Ties to the sky easter egg.",
		motifLabel: "Connecting lines",
		defaults: { ...INNER_DEFAULTS, color: "neutral" },
		Component: ConstellationCluster,
	},
	terminal: {
		id: "terminal",
		label: "Terminal",
		feel: "Terminal window: title bar + traffic dots + `❯ cat` prompt, content card in the window body. Techy clash.",
		motifLabel: "Blinking cursor",
		defaults: { ...INNER_DEFAULTS, color: "neutral" },
		Component: TerminalCluster,
	},
	polaroid: {
		id: "polaroid",
		label: "Polaroid",
		feel: "Scrapbook page: a kraft board with a corner-pinned polaroid + handwritten caption. Playful collage.",
		motifLabel: "Washi tape",
		defaults: { ...INNER_DEFAULTS },
		Component: PolaroidCluster,
	},
	collectible: {
		id: "collectible",
		label: "Collectible",
		feel: "Trading card: a gilt rarity border, name banner, type/rarity line, content seated in the card body.",
		motifLabel: "Foil rarity gem",
		defaults: { ...INNER_DEFAULTS },
		Component: CollectibleCluster,
	},
	comic: {
		id: "comic",
		label: "Comic",
		feel: "Comic page: a jagged caption banner over content in a wide panel on a halftone wash, speech-bubble tail in the corner.",
		motifLabel: "Halftone wash",
		defaults: { ...INNER_DEFAULTS },
		Component: ComicCluster,
	},
	"ticket-stub": {
		id: "ticket-stub",
		label: "Ticket Stub",
		feel: "Wide ticket: a perforated side-rail stub with ADMIT ONE + barcode, content on the ticket body.",
		motifLabel: "Perforation",
		defaults: { ...INNER_DEFAULTS },
		Component: TicketStubCluster,
	},
	receipt: {
		id: "receipt",
		label: "Receipt",
		feel: "Monospace statement sheet: thermal paper, dashed rules, a store-name header, thank-you footer.",
		motifLabel: "Torn edge",
		defaults: { ...INNER_DEFAULTS, color: "neutral" },
		Component: ReceiptCluster,
	},
	"stamp-postcard": {
		id: "stamp-postcard",
		label: "Stamp Postcard",
		feel: "Postcard: a picture/stamp + postmark side, content as the message-area body.",
		motifLabel: "Postmark ring",
		defaults: { ...INNER_DEFAULTS },
		Component: StampPostcardCluster,
	},
	manuscript: {
		id: "manuscript",
		label: "Manuscript",
		feel: "Illuminated vellum page: gold-flourish corners, an Incipit rubric, content as the manuscript body.",
		motifLabel: "Drop-cap",
		defaults: { ...INNER_DEFAULTS },
		Component: ManuscriptCluster,
	},
	blueprint: {
		id: "blueprint",
		label: "Blueprint",
		feel: "Drafting sheet: content card framed in a cyan-hairline drawing area over a grid, drafted heading with a dimension line.",
		motifLabel: "Grid",
		defaults: { ...INNER_DEFAULTS, color: "neutral" },
		Component: BlueprintCluster,
	},
	"circuit-board": {
		id: "circuit-board",
		label: "Circuit Board",
		feel: "PCB panel: copper traces + corner solder pads, a silkscreen heading, content in a routed area. Fits AI.",
		motifLabel: "Copper traces",
		defaults: { ...INNER_DEFAULTS, color: "neutral" },
		Component: CircuitBoardCluster,
	},
	"arcade-hud": {
		id: "arcade-hud",
		label: "Arcade HUD",
		feel: "HUD-framed panel: SCORE/HP/LEVEL bars, a STAGE heading, content in the play-area screen.",
		motifLabel: "CRT scanlines",
		defaults: { ...INNER_DEFAULTS, color: "neutral" },
		Component: ArcadeHudCluster,
	},
	"neon-sign": {
		id: "neon-sign",
		label: "Neon Sign",
		feel: "Neon board: a glowing neon-tube heading on a dark board, content card below.",
		motifLabel: "Glow flicker",
		defaults: { ...INNER_DEFAULTS, color: "neutral" },
		Component: NeonSignCluster,
	},
	"vinyl-liner": {
		id: "vinyl-liner",
		label: "Vinyl Liner",
		feel: "Record sleeve: a disc + album-art label accent column, content as the liner-notes body.",
		motifLabel: "Vinyl disc",
		defaults: { ...INNER_DEFAULTS, color: "neutral" },
		Component: VinylLinerCluster,
	},
	cassette: {
		id: "cassette",
		label: "Cassette",
		feel: "Cassette label: reels + a tape window, a hand-lettered heading, content on the label below.",
		motifLabel: "Tape reels",
		defaults: { ...INNER_DEFAULTS },
		Component: CassetteCluster,
	},
	chalkboard: {
		id: "chalkboard",
		label: "Chalkboard",
		feel: "Wood-framed slate: a chalk-hand heading, content card resting on the slate.",
		motifLabel: "Chalk dust",
		defaults: { ...INNER_DEFAULTS, color: "neutral" },
		Component: ChalkboardCluster,
	},
	"wanted-poster": {
		id: "wanted-poster",
		label: "Wanted Poster",
		feel: "Aged bill board: a WANTED banner + mugshot accent, name heading, content as the bill copy, reward number.",
		motifLabel: "Aged/torn edges",
		defaults: { ...INNER_DEFAULTS },
		Component: WantedPosterCluster,
	},
	"marquee-bulbs": {
		id: "marquee-bulbs",
		label: "Marquee Bulbs",
		feel: "Marquee signboard: a chasing-bulb border + now-showing line, content on the board below.",
		motifLabel: "Chasing bulbs",
		defaults: { ...INNER_DEFAULTS, color: "neutral" },
		Component: MarqueeBulbsCluster,
	},
	"luggage-tag": {
		id: "luggage-tag",
		label: "Luggage Tag",
		feel: "Luggage tag: clipped corners + a grommet + string, an airport-code label, content on the tag body.",
		motifLabel: "String + grommet",
		defaults: { ...INNER_DEFAULTS },
		Component: LuggageTagCluster,
	},
	"embossed-seal": {
		id: "embossed-seal",
		label: "Embossed Seal",
		feel: "Certificate sheet: a serif title, content as the certificate body, a wax-seal + ribbon footer and serial number.",
		motifLabel: "Wax seal",
		defaults: { ...INNER_DEFAULTS },
		Component: EmbossedSealCluster,
	},
	"pressed-specimen": {
		id: "pressed-specimen",
		label: "Pressed Specimen",
		feel: "Herbarium sheet: photo-corner mounts + a specimen label, content as the specimen-sheet body.",
		motifLabel: "Mounting corners",
		defaults: { ...INNER_DEFAULTS },
		Component: PressedSpecimenCluster,
	},
};

export const INNER_ORDER: InnerId[] = [
	"rich-card",
	"minimal",
	"trail-signpost",
	"field-journal",
	"museum",
	"strata-core",
	"constellation",
	"terminal",
	"polaroid",
	"collectible",
	"comic",
	"ticket-stub",
	"receipt",
	"stamp-postcard",
	"manuscript",
	"blueprint",
	"circuit-board",
	"arcade-hud",
	"neon-sign",
	"vinyl-liner",
	"cassette",
	"chalkboard",
	"wanted-poster",
	"marquee-bulbs",
	"luggage-tag",
	"embossed-seal",
	"pressed-specimen",
];

/* ── Layer 3: LINKS (between-topic connectors) ──────────────────────────── */

const LINK_DEFAULTS = {
	color: "ink",
	weight: 2,
	curve: 50,
	// height 90 → --rail-h: 90vh (a tall connector that spans most of a stage).
	height: 90,
	// blend 90 → --rail-fade: 45% (long, soft end-fades that melt deep into stages).
	blend: 90,
	animate: true,
} as const;

export const LINKS: Record<LinkId, LinkDef> = {
	none: {
		id: "none",
		label: "None",
		feel: "No connector — topics sit on their own with the natural seam.",
		hasCurve: false,
		defaults: { ...LINK_DEFAULTS },
		Component: null,
	},
	"ruled-seam": {
		id: "ruled-seam",
		label: "Ruled Seam",
		feel: "A clean straight rule with end-caps. Editorial divider.",
		hasCurve: false,
		defaults: { ...LINK_DEFAULTS, weight: 3 },
		Component: RuledSeamLink,
	},
	"flowing-curve": {
		id: "flowing-curve",
		label: "Flowing Curve",
		feel: "A smooth S-curve sweeping between topics, alternating direction down the page.",
		hasCurve: true,
		defaults: { ...LINK_DEFAULTS },
		Component: FlowingCurveLink,
	},
	"botanical-vine": {
		id: "botanical-vine",
		label: "Botanical Vine",
		feel: "An organic vine with leaves budding off it. Vine takes the color, leaves the accent.",
		hasCurve: true,
		defaults: { ...LINK_DEFAULTS, color: "accent" },
		Component: BotanicalVineLink,
	},
	"trail-dashes": {
		id: "trail-dashes",
		label: "Trail Dashes",
		feel: "A dashed footpath meandering between topics. The trail world's connective tissue.",
		hasCurve: true,
		defaults: { ...LINK_DEFAULTS, color: "earth" },
		Component: TrailDashesLink,
	},
	"constellation-starline": {
		id: "constellation-starline",
		label: "Star Line",
		feel: "A faint dotted star-path with twinkling nodes at the bends. Ties to the sky.",
		hasCurve: true,
		defaults: { ...LINK_DEFAULTS, color: "sky", weight: 2 },
		Component: ConstellationStarlineLink,
	},
	"river-ribbon": {
		id: "river-ribbon",
		label: "River Ribbon",
		feel: "A flowing water ribbon with a bright mid-current. Nods to the journey-down-a-river.",
		hasCurve: true,
		defaults: { ...LINK_DEFAULTS, color: "sky", weight: 3 },
		Component: RiverRibbonLink,
	},
	"strata-seam": {
		id: "strata-seam",
		label: "Strata Seam",
		feel: "A geological band of sediment stripes with a bright mineral vein running through. Straight; ties to the dig.",
		hasCurve: false,
		defaults: { ...LINK_DEFAULTS, color: "earth", weight: 3 },
		Component: StrataSeamLink,
	},
	"dotted-thread": {
		id: "dotted-thread",
		label: "Dotted Thread",
		feel: "A minimal dotted thread of round dots stitching topics together. The understated connector.",
		hasCurve: true,
		defaults: { ...LINK_DEFAULTS, color: "ink", weight: 3 },
		Component: DottedThreadLink,
	},
};

export const LINK_ORDER: LinkId[] = [
	"none",
	"ruled-seam",
	"flowing-curve",
	"botanical-vine",
	"trail-dashes",
	"constellation-starline",
	"river-ribbon",
	"strata-seam",
	"dotted-thread",
];
