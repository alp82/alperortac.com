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
import { CurtainRevealStage } from "./sections/curtain-reveal";
import { DiagonalCutStage } from "./sections/diagonal-cut";
import { EdgeAnchoredStage } from "./sections/edge-anchored";
import { FloatingIslandStage } from "./sections/floating-island";
import { FramedWindowStage } from "./sections/framed-window";
import { FullTypeStage } from "./sections/full-type";
import { HorizonBandStage } from "./sections/horizon-band";
import { LetterboxStage } from "./sections/letterbox";
import { MarqueeScrollStage } from "./sections/marquee-scroll";
import { OversizedNumberStage } from "./sections/oversized-number";
import { ParallaxDepthStage } from "./sections/parallax-depth";
import { PeekRevealStage } from "./sections/peek-reveal";
import { SpotlightVignetteStage } from "./sections/spotlight-vignette";
import { SplitStageStage } from "./sections/split-stage";
import { StackedCardsStage } from "./sections/stacked-cards";
import { TriptychStage } from "./sections/triptych";
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

export const SECTIONS: Record<SectionId, SectionDef> = {
	"centered-monolith": {
		id: "centered-monolith",
		label: "Centered Monolith",
		feel: "Huge centered type over a radial scrim; the landscape glows at the edges. Title-card energy.",
		baseHeight: 100,
		heightRange: [70, 130],
		defaults: { accent: "topic", align: "center", scrim: 45, height: 100 },
		Component: CenteredMonolithStage,
	},
	"edge-anchored": {
		id: "edge-anchored",
		label: "Edge Anchored",
		feel: "Content pinned to a corner; the landscape dominates the open frame. A directional gradient anchors the type.",
		baseHeight: 85,
		heightRange: [65, 110],
		defaults: { accent: "topic", align: "bottom", scrim: 55, height: 85 },
		Component: EdgeAnchoredStage,
	},
	"split-stage": {
		id: "split-stage",
		label: "Split Stage",
		feel: "Asymmetric viewport split: type one side, negative space + ghost flourish the other.",
		baseHeight: 90,
		heightRange: [70, 115],
		defaults: { accent: "topic", align: "left", scrim: 50, height: 90 },
		Component: SplitStageStage,
	},
	letterbox: {
		id: "letterbox",
		label: "Letterbox",
		feel: "Cinematic bars top + bottom, a faint accent color-grade. Shorter, wider title-card band.",
		baseHeight: 70,
		heightRange: [55, 95],
		defaults: { accent: "topic", align: "center", scrim: 35, height: 70 },
		Component: LetterboxStage,
	},
	"spotlight-vignette": {
		id: "spotlight-vignette",
		label: "Spotlight Vignette",
		feel: "A radial spotlight pools light on the cluster; edges darken hard into the landscape.",
		baseHeight: 90,
		heightRange: [70, 115],
		defaults: { accent: "topic", align: "center", scrim: 55, height: 90 },
		Component: SpotlightVignetteStage,
	},
	"parallax-depth": {
		id: "parallax-depth",
		label: "Parallax Depth",
		feel: "Layered fore/background drift on scroll; the cluster floats over a slow ghost flourish. Tallest stage.",
		baseHeight: 110,
		heightRange: [90, 140],
		defaults: { accent: "topic", align: "center", scrim: 45, height: 110 },
		Component: ParallaxDepthStage,
	},
	"diagonal-cut": {
		id: "diagonal-cut",
		label: "Diagonal Cut",
		feel: "Viewport split by a bold diagonal: cluster in one wedge over a dark grade, landscape in the other, angled accent edge between.",
		baseHeight: 95,
		heightRange: [75, 120],
		defaults: { accent: "topic", align: "left", scrim: 50, height: 95 },
		Component: DiagonalCutStage,
	},
	"framed-window": {
		id: "framed-window",
		label: "Framed Window",
		feel: "Cluster seen through a thick matte cabin window — beveled frame, inner shadow, cross mullions, tinted glass onto the landscape.",
		baseHeight: 88,
		heightRange: [70, 115],
		defaults: { accent: "topic", align: "center", scrim: 40, height: 88 },
		Component: FramedWindowStage,
	},
	"marquee-scroll": {
		id: "marquee-scroll",
		label: "Marquee Scroll",
		feel: "Giant repeating heading strips drift horizontally on scroll behind the cluster. Freezes under reduced motion.",
		baseHeight: 90,
		heightRange: [70, 115],
		defaults: { accent: "topic", align: "center", scrim: 45, height: 90 },
		Component: MarqueeScrollStage,
	},
	"stacked-cards": {
		id: "stacked-cards",
		label: "Stacked Cards",
		feel: "Topic on a card atop a faux offset deck with layered shadows; the top card scales in on enter (reduced-motion safe).",
		baseHeight: 92,
		heightRange: [72, 118],
		defaults: { accent: "topic", align: "left", scrim: 35, height: 92 },
		Component: StackedCardsStage,
	},
	"full-type": {
		id: "full-type",
		label: "Full Type",
		feel: "The heading IS the stage — enormous viewport-filling cut-out type with the landscape through the glyphs; cluster overlaid in a corner.",
		baseHeight: 96,
		heightRange: [80, 125],
		defaults: { accent: "topic", align: "left", scrim: 30, height: 96 },
		Component: FullTypeStage,
	},
	"horizon-band": {
		id: "horizon-band",
		label: "Horizon Band",
		feel: "A horizon line crosses the viewport — luminous sky above, dark ground below — with the cluster sitting on the line. Echoes day→night.",
		baseHeight: 90,
		heightRange: [70, 115],
		defaults: { accent: "topic", align: "center", scrim: 45, height: 90 },
		Component: HorizonBandStage,
	},
	"peek-reveal": {
		id: "peek-reveal",
		label: "Peek Reveal",
		feel: "The next topic peeks in from the bottom edge with a rounded lip, so consecutive stages feel like they overlap as you scroll.",
		baseHeight: 94,
		heightRange: [78, 120],
		defaults: { accent: "topic", align: "center", scrim: 50, height: 94 },
		Component: PeekRevealStage,
	},
	triptych: {
		id: "triptych",
		label: "Triptych",
		feel: "Three vertical sub-panels with thin dividers — ghost flourish leaves frame the cluster in the wide center. Altarpiece feel.",
		baseHeight: 92,
		heightRange: [72, 118],
		defaults: { accent: "topic", align: "center", scrim: 50, height: 92 },
		Component: TriptychStage,
	},
	"oversized-number": {
		id: "oversized-number",
		label: "Oversized Number",
		feel: "A giant ghost index numeral (01–08) bleeds off an edge as an accent-tinted backdrop; the cluster layers over it.",
		baseHeight: 92,
		heightRange: [72, 118],
		defaults: { accent: "topic", align: "left", scrim: 45, height: 92 },
		Component: OversizedNumberStage,
	},
	"floating-island": {
		id: "floating-island",
		label: "Floating Island",
		feel: "Cluster on a floating slab with a soft drop shadow, landscape all around; the slab bobs gently on scroll (reduced-motion safe).",
		baseHeight: 90,
		heightRange: [72, 115],
		defaults: { accent: "topic", align: "center", scrim: 35, height: 90 },
		Component: FloatingIslandStage,
	},
	"zoom-focus": {
		id: "zoom-focus",
		label: "Zoom Focus",
		feel: "Ken Burns: a ghost flourish slowly scales while the cluster grows understated→dominant on enter (reduced-motion safe).",
		baseHeight: 95,
		heightRange: [78, 122],
		defaults: { accent: "topic", align: "center", scrim: 45, height: 95 },
		Component: ZoomFocusStage,
	},
	"curtain-reveal": {
		id: "curtain-reveal",
		label: "Curtain Reveal",
		feel: "Two scrim curtains part from center as the stage scrolls in, revealing the cluster. Theatrical (reduced-motion safe).",
		baseHeight: 92,
		heightRange: [72, 118],
		defaults: { accent: "topic", align: "center", scrim: 50, height: 92 },
		Component: CurtainRevealStage,
	},
};

export const SECTION_ORDER: SectionId[] = [
	"centered-monolith",
	"edge-anchored",
	"split-stage",
	"letterbox",
	"spotlight-vignette",
	"parallax-depth",
	"diagonal-cut",
	"framed-window",
	"marquee-scroll",
	"stacked-cards",
	"full-type",
	"horizon-band",
	"peek-reveal",
	"triptych",
	"oversized-number",
	"floating-island",
	"zoom-focus",
	"curtain-reveal",
];

/* ── Layer 2: INNER STYLES (the centered cluster) ───────────────────────── */

const INNER_DEFAULTS = {
	color: "accent",
	density: "comfortable",
	motif: true,
} as const;

export const INNERS: Record<InnerId, InnerDef> = {
	minimal: {
		id: "minimal",
		label: "Minimal",
		feel: "Clean cluster: styled heading + teaser + plain CTA. Lets the stage do the talking.",
		motifLabel: "Accent underline",
		defaults: { ...INNER_DEFAULTS },
		Component: MinimalCluster,
	},
	"trail-signpost": {
		id: "trail-signpost",
		label: "Trail Signpost",
		feel: "Waypoint diamond + kraft note; triggers are wooden signpost boards.",
		motifLabel: "Waypoint marker",
		defaults: { ...INNER_DEFAULTS },
		Component: TrailSignpostCluster,
	},
	"field-journal": {
		id: "field-journal",
		label: "Field Journal",
		feel: "Kraft journal page: handwritten heading, italic field note, taped specimen triggers.",
		motifLabel: "Specimen tape",
		defaults: { ...INNER_DEFAULTS },
		Component: FieldJournalCluster,
	},
	museum: {
		id: "museum",
		label: "Museum",
		feel: "Restrained serif inside a thin frame; quiet 'view' plate triggers. Calm against the noise.",
		motifLabel: "Double frame",
		defaults: { ...INNER_DEFAULTS },
		Component: MuseumCluster,
	},
	"strata-core": {
		id: "strata-core",
		label: "Strata Core",
		feel: "A vertical earthy core sample with a depth gauge, embossed heading, fossil triggers. Ties to the dig.",
		motifLabel: "Sediment striations",
		defaults: { ...INNER_DEFAULTS },
		Component: StrataCoreCluster,
	},
	constellation: {
		id: "constellation",
		label: "Constellation",
		feel: "Heading over a star field; triggers are bright clickable stars. Ties to the sky easter egg.",
		motifLabel: "Connecting lines",
		defaults: { ...INNER_DEFAULTS, color: "neutral" },
		Component: ConstellationCluster,
	},
	terminal: {
		id: "terminal",
		label: "Terminal",
		feel: "Dark monospace pane: heading as `cat`, teaser as stdout, triggers as run prompts. Techy clash.",
		motifLabel: "Blinking cursor",
		defaults: { ...INNER_DEFAULTS, color: "neutral" },
		Component: TerminalCluster,
	},
	polaroid: {
		id: "polaroid",
		label: "Polaroid",
		feel: "A hero polaroid + washi-taped sticky-note triggers. Playful scrapbook collage.",
		motifLabel: "Washi tape",
		defaults: { ...INNER_DEFAULTS },
		Component: PolaroidCluster,
	},
	collectible: {
		id: "collectible",
		label: "Collectible",
		feel: "One ornate trading card: name banner, accent art zone, flavor text, ability-button triggers.",
		motifLabel: "Foil sparkle",
		defaults: { ...INNER_DEFAULTS },
		Component: CollectibleCluster,
	},
	comic: {
		id: "comic",
		label: "Comic",
		feel: "Compact comic page: gutters, jagged caption, speech bubble, action-panel triggers.",
		motifLabel: "Halftone wash",
		defaults: { ...INNER_DEFAULTS },
		Component: ComicCluster,
	},
	"ticket-stub": {
		id: "ticket-stub",
		label: "Ticket Stub",
		feel: "Perforated event ticket: accent stub with the index, tear line, ADMIT-ONE tear-off triggers on the body.",
		motifLabel: "Perforation",
		defaults: { ...INNER_DEFAULTS },
		Component: TicketStubCluster,
	},
	receipt: {
		id: "receipt",
		label: "Receipt",
		feel: "Narrow thermal-receipt slip: monospace, dashed rules, triggers as line items, footed by a TOTAL.",
		motifLabel: "Torn edge",
		defaults: { ...INNER_DEFAULTS, color: "neutral" },
		Component: ReceiptCluster,
	},
	"stamp-postcard": {
		id: "stamp-postcard",
		label: "Stamp Postcard",
		feel: "Vintage postcard: flourish picture side, perforated postage stamp + postmark, triggers as ruled address lines.",
		motifLabel: "Postmark ring",
		defaults: { ...INNER_DEFAULTS },
		Component: StampPostcardCluster,
	},
	manuscript: {
		id: "manuscript",
		label: "Manuscript",
		feel: "Illuminated manuscript: ruled vellum, ornate accent drop-cap, gold corners, rubricated ❧ trigger lines.",
		motifLabel: "Drop-cap",
		defaults: { ...INNER_DEFAULTS },
		Component: ManuscriptCluster,
	},
	blueprint: {
		id: "blueprint",
		label: "Blueprint",
		feel: "Technical drawing: cyan grid, drafted heading with a dimension line, mono annotations, callout-bubble triggers.",
		motifLabel: "Grid + dimensions",
		defaults: { ...INNER_DEFAULTS, color: "neutral" },
		Component: BlueprintCluster,
	},
	"circuit-board": {
		id: "circuit-board",
		label: "Circuit Board",
		feel: "PCB: dark-green board, copper traces routing from a heading chip to component-pad triggers. Fits AI.",
		motifLabel: "Copper traces",
		defaults: { ...INNER_DEFAULTS, color: "neutral" },
		Component: CircuitBoardCluster,
	},
	"arcade-hud": {
		id: "arcade-hud",
		label: "Arcade HUD",
		feel: "Retro game HUD: SCORE + HP bar, pixel heading, PRESS-START menu triggers with a ► selector.",
		motifLabel: "CRT scanlines",
		defaults: { ...INNER_DEFAULTS, color: "neutral" },
		Component: ArcadeHudCluster,
	},
	"neon-sign": {
		id: "neon-sign",
		label: "Neon Sign",
		feel: "Glowing neon-tube heading on a dark board, dim sub-tube teaser, outlined neon-button triggers.",
		motifLabel: "Glow flicker",
		defaults: { ...INNER_DEFAULTS, color: "neutral" },
		Component: NeonSignCluster,
	},
	"vinyl-liner": {
		id: "vinyl-liner",
		label: "Vinyl Liner",
		feel: "Record sleeve with the disc peeking out; album art + heading, liner-note teaser, tracklist triggers.",
		motifLabel: "Vinyl disc",
		defaults: { ...INNER_DEFAULTS, color: "neutral" },
		Component: VinylLinerCluster,
	},
	cassette: {
		id: "cassette",
		label: "Cassette",
		feel: "Cassette label: two reels, hand-lettered label strip, triggers split across A/B sides.",
		motifLabel: "Tape reels",
		defaults: { ...INNER_DEFAULTS },
		Component: CassetteCluster,
	},
	chalkboard: {
		id: "chalkboard",
		label: "Chalkboard",
		feel: "Slate board in a wooden tray: chalk-hand heading, dusty teaser, chalk-outlined ✓ triggers.",
		motifLabel: "Chalk dust",
		defaults: { ...INNER_DEFAULTS, color: "neutral" },
		Component: ChalkboardCluster,
	},
	"wanted-poster": {
		id: "wanted-poster",
		label: "Wanted Poster",
		feel: "Old-west WANTED bill: woodtype banner, flourish mugshot, name heading, REWARD triggers on aged paper.",
		motifLabel: "Aged/torn edges",
		defaults: { ...INNER_DEFAULTS },
		Component: WantedPosterCluster,
	},
	"marquee-bulbs": {
		id: "marquee-bulbs",
		label: "Marquee Bulbs",
		feel: "Theater marquee signboard: heading framed by glowing bulbs, NOW SHOWING line, marquee-button triggers.",
		motifLabel: "Chasing bulbs",
		defaults: { ...INNER_DEFAULTS, color: "neutral" },
		Component: MarqueeBulbsCluster,
	},
	"luggage-tag": {
		id: "luggage-tag",
		label: "Luggage Tag",
		feel: "Travel tag tied with string through a grommet; stamped destination heading, routing-row triggers.",
		motifLabel: "String + grommet",
		defaults: { ...INNER_DEFAULTS },
		Component: LuggageTagCluster,
	},
	"embossed-seal": {
		id: "embossed-seal",
		label: "Embossed Seal",
		feel: "Formal certificate: foil wax-seal medallion + ribbon by the heading, serif type, bordered seal-button triggers.",
		motifLabel: "Wax seal",
		defaults: { ...INNER_DEFAULTS },
		Component: EmbossedSealCluster,
	},
	"pressed-specimen": {
		id: "pressed-specimen",
		label: "Pressed Specimen",
		feel: "Herbarium sheet: the flourish as a pressed plant in mounting corners, typed specimen label, classification triggers.",
		motifLabel: "Mounting corners",
		defaults: { ...INNER_DEFAULTS },
		Component: PressedSpecimenCluster,
	},
};

export const INNER_ORDER: InnerId[] = [
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
