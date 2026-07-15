import type { Topic, TopicId } from "../../../data/topics";

/*
 * 2-layer composer contract.
 *
 * A composition stacks two independent axes over a single topic:
 *   INNER STYLE       the CENTERED CONTENT CLUSTER inside the topic's
 *                     neutral `<article id>` wrapper (owned by
 *                     TopicComposition)
 *   LINK (connector)  the seam rendered BETWEEN consecutive topics
 *
 * Each layer has its own registry (inner/, links/) keyed by id, and each item
 * carries a small set of FOCUSED params the panel exposes as controls. The
 * dispatcher reads the selected ids + params to render the composition; the
 * shared tokens/helpers below are also used by the `current` baseline path.
 */

/* ── INNER STYLE ────────────────────────────────────────────────────────── */

export type InnerId =
	| "parallax-depth"
	| "floating-island"
	| "minimal"
	| "trail-signpost"
	| "field-journal"
	| "constellation"
	| "terminal"
	| "polaroid"
	| "collectible"
	| "comic"
	| "ticket-stub"
	| "blueprint"
	| "circuit-board"
	| "arcade-hud"
	| "neon-sign"
	| "chalkboard"
	| "topo-map"
	| "seed-packet"
	| "aurora"
	| "moonrise"
	| "daybreak"
	| "summit"
	| "skyline"
	| "timecard"
	| "nameplate"
	| "punch-card"
	| "offer-letter"
	| "code-editor"
	| "pull-request"
	| "commit-graph"
	| "man-page"
	| "keycaps";

/** Shared by every inside style - cluster scale / breathing room. */
export type InnerBase = {
	density: "cozy" | "comfortable" | "roomy";
};

/* Shared look-&-feel controls for the skyline decoration inner. */
export type DecoProminence = "whisper" | "subtle" | "present" | "bold";
export type DecoPlacement = "corner" | "cluster" | "scatter" | "edges";
export type DecoColor = "ink" | "tinted" | "vivid";

/*
 * Per-inside-style params: the shared density plus THAT style's signature
 * toggle and one theming knob, so every style's controls move its own identity
 * - no generic color/motif grab-bag. Theming is data-driven in the components
 * (inline), so these enums carry the whole look.
 */

export type MinimalParams = InnerBase & {
	underline: boolean;
	align: "center" | "left";
};
export type TrailSignpostParams = InnerBase & {
	marker: boolean;
	wood: "pine" | "walnut" | "weathered";
};
export type FieldJournalParams = InnerBase & {
	tape: boolean;
	paper: "kraft" | "graph" | "aged";
};
export type ConstellationParams = InnerBase & {
	lines: boolean;
	tint: "indigo" | "cyan" | "violet";
	figure: "wing" | "crown" | "river";
};
export type TerminalParams = InnerBase & {
	cursor: boolean;
	scheme: "midnight" | "matrix" | "amber" | "ice";
};
export type PolaroidParams = InnerBase & {
	tape: boolean;
	tilt: "left" | "straight" | "right";
};
export type CollectibleParams = InnerBase & {
	gem: boolean;
	rarity: "common" | "rare" | "legendary";
};
export type ComicParams = InnerBase & {
	halftone: boolean;
	palette: "classic" | "noir" | "pop";
};
export type TicketStubParams = InnerBase & {
	perforation: boolean;
	color: "crimson" | "indigo" | "gold";
};
export type BlueprintParams = InnerBase & {
	grid: boolean;
	paper: "cyanotype" | "slate" | "charcoal";
};
export type CircuitBoardParams = InnerBase & {
	traces: boolean;
	mask: "green" | "blue" | "black" | "purple";
};
export type ArcadeHudParams = InnerBase & {
	scanlines: boolean;
	palette: "green" | "amber" | "ice" | "magenta";
};
export type NeonSignParams = InnerBase & {
	flicker: boolean;
	color: "pink" | "cyan" | "lime" | "gold";
};
export type ChalkboardParams = InnerBase & {
	dust: boolean;
	chalk: "white" | "yellow" | "pastel";
};
export type TopoMapParams = InnerBase & {
	contours: boolean;
	terrain: "forest" | "desert" | "alpine";
};
export type SeedPacketParams = InnerBase & {
	illustration: boolean;
	stock: "cream" | "kraft" | "sage";
};
export type TimecardParams = InnerBase & {
	stamps: boolean;
	stock: "manila" | "buff" | "ledger";
};
export type NameplateParams = InnerBase & {
	screws: boolean;
	role: "title" | "tenure" | "focus";
};
export type PunchCardParams = InnerBase & {
	holes: boolean;
	stock: "manila" | "salmon" | "mint";
};
export type OfferLetterParams = InnerBase & {
	scrawl: boolean;
	stock: "cream" | "ivory" | "dove";
};
export type CodeEditorParams = InnerBase & {
	gutter: boolean;
	theme: "onedark" | "nord" | "monokai";
};
export type PullRequestParams = InnerBase & {
	checks: boolean;
	state: "open" | "merged" | "draft";
};
export type CommitGraphParams = InnerBase & {
	refs: boolean;
	stock: "white" | "cream" | "mist";
};
export type ManPageParams = InnerBase & {
	tractor: boolean;
	stock: "white" | "greenbar" | "aged";
};
export type KeycapsParams = InnerBase & {
	backlight: boolean;
	colorway: "beige" | "graphite" | "milkshake";
};
export type AuroraParams = InnerBase & {
	stars: boolean;
	hue: "emerald" | "violet" | "teal";
};
export type MoonriseParams = InnerBase & {
	stars: boolean;
	phase: "full" | "gibbous" | "crescent";
};
export type DaybreakParams = InnerBase & {
	rays: boolean;
	sky: "dawn" | "golden" | "dusk";
};
export type SummitParams = InnerBase & {
	snow: boolean;
	range: "dawn" | "dusk" | "night";
};
export type SkylineParams = InnerBase & {
	motif: "birds" | "clouds" | "plane" | "kite" | "balloon";
	prominence: DecoProminence;
	placement: DecoPlacement;
	variety: "uniform" | "mixed";
	color: DecoColor;
	drift: boolean;
};
/** parallax-depth - layered backdrop drifting under the cluster (ported stage). */
export type ParallaxDepthParams = InnerBase & {
	/** Which backdrop shape drifts behind the cluster. */
	shape: "flourish" | "blob" | "rings" | "grid" | "strata";
	/** Drift separation between planes, 0..100. */
	depth: number;
	/** How many drifting planes behind the cluster. */
	layers: 2 | 3;
};
/** floating-island - cluster on a floating slab (ported stage). */
export type FloatingIslandParams = InnerBase & {
	/** Shadow throw + lift, 0..100. */
	floatHeight: number;
	/** Idle bob amount on scroll, 0..100 (0 = still). */
	bob: number;
	/** Slab corner radius. */
	corners: "sharp" | "soft" | "pill";
	/** Slab surface opacity, 0..100 (glassy → solid). */
	tint: number;
};

/** id → that inside style's param shape. */
export type InnerParamsMap = {
	"parallax-depth": ParallaxDepthParams;
	"floating-island": FloatingIslandParams;
	minimal: MinimalParams;
	"trail-signpost": TrailSignpostParams;
	"field-journal": FieldJournalParams;
	constellation: ConstellationParams;
	terminal: TerminalParams;
	polaroid: PolaroidParams;
	collectible: CollectibleParams;
	comic: ComicParams;
	"ticket-stub": TicketStubParams;
	blueprint: BlueprintParams;
	"circuit-board": CircuitBoardParams;
	"arcade-hud": ArcadeHudParams;
	"neon-sign": NeonSignParams;
	chalkboard: ChalkboardParams;
	"topo-map": TopoMapParams;
	"seed-packet": SeedPacketParams;
	timecard: TimecardParams;
	nameplate: NameplateParams;
	"punch-card": PunchCardParams;
	"offer-letter": OfferLetterParams;
	"code-editor": CodeEditorParams;
	"pull-request": PullRequestParams;
	"commit-graph": CommitGraphParams;
	"man-page": ManPageParams;
	keycaps: KeycapsParams;
	aurora: AuroraParams;
	moonrise: MoonriseParams;
	daybreak: DaybreakParams;
	summit: SummitParams;
	skyline: SkylineParams;
};

/** The union of every inside style's params (what composer state holds). */
export type AnyInnerParams = InnerParamsMap[InnerId];

/**
 * How the topic body sits inside an inner frame. `plate` keeps the frosted
 * voice surface (translucent bg + left accent border - the production look, and
 * fine for frames that sit straight on the landscape). `light` / `dark` render the
 * body BARE - transparent, no border, text tuned for a light or dark frame - so
 * the prose blends into the frame's own surface instead of floating in a card.
 */
export type InnerSurface = "plate" | "light" | "dark";

/* ── LINK (between-topic connector) ─────────────────────────────────────── */

export type LinkId =
	| "none"
	| "ruled-seam"
	| "flowing-curve"
	| "botanical-vine"
	| "trail-dashes"
	| "constellation-starline";

/**
 * Universal connector params - every connector is a stroked vertical rail, so
 * these line/rail knobs apply across the board. Each connector's signature
 * params extend this below.
 */
export type LinkBase = {
	/** Connector stroke color source. */
	color: "ink" | "sky" | "earth" | "accent";
	/** Stroke weight in px, 1..8. */
	weight: number;
	/** Rail vertical extent in vh, 20..150 (drives `--rail-h`). */
	height: number;
	/** End-fade 0..100; melts the ends into the surrounding landscape (drives `--rail-fade`). */
	blend: number;
	/** Animate the draw-in on scroll. */
	animate: boolean;
};

/* Per-connector signature params on top of LinkBase. */

/** none renders nothing - base only (unused). */
export type NoneLinkParams = LinkBase;
export type RuledSeamParams = LinkBase & {
	/** End-cap shape. */
	caps: "round" | "bar" | "none";
	/** A double parallel rule vs a single rule. */
	double: boolean;
};
export type FlowingCurveParams = LinkBase & {
	/** Horizontal meander amplitude 0..100. */
	curve: number;
	/** How many S-bends down the descent. */
	weave: "single" | "double" | "triple";
};
export type BotanicalVineParams = LinkBase & {
	curve: number;
	/** Leaf density along the vine. */
	foliage: "sparse" | "lush";
	/** A flower bud at the growing tip. */
	bud: boolean;
};
export type TrailDashesParams = LinkBase & {
	curve: number;
	/** Dash rhythm. */
	dash: "fine" | "standard" | "bold";
	/** Footprint markers along the path. */
	footprints: boolean;
};
export type StarlineParams = LinkBase & {
	curve: number;
	/** Star-node count. */
	stars: "few" | "many";
	/** Node glow intensity. */
	glow: "soft" | "bright";
};

/** id → that connector's param shape. */
export type LinkParamsMap = {
	none: NoneLinkParams;
	"ruled-seam": RuledSeamParams;
	"flowing-curve": FlowingCurveParams;
	"botanical-vine": BotanicalVineParams;
	"trail-dashes": TrailDashesParams;
	"constellation-starline": StarlineParams;
};

/** The union of every connector's params (what composer state holds). */
export type AnyLinkParams = LinkParamsMap[LinkId];

/* ── Render contracts ───────────────────────────────────────────────────── */

/**
 * Inner contract: a frame is a CONTAINER - it renders its themed heading +
 * decoration and the topic's REAL body (`children`, the shared `TopicBody`)
 * inside it. No section framing, no own vertical padding - TopicComposition's
 * neutral centered `<article id>` wrapper owns height/anchor and renders this
 * inside it.
 */
export type InnerRenderProps<Id extends InnerId = InnerId> = {
	topic: Topic;
	index: number;
	isNight: boolean;
	lastTriggerRef: React.RefObject<HTMLElement | null>;
	params: InnerParamsMap[Id];
	/** Resolved accent for this topic (the cluster decides whether to use it). */
	accent: string;
	/** The topic's REAL body (shared `TopicBody`), rendered inside the frame. */
	children: React.ReactNode;
};

/** Link contract: a connector rendered at the seam between two topics. */
export type LinkRenderProps<Id extends LinkId = LinkId> = {
	/** Zero-based index of the topic ABOVE this seam (drives alternation). */
	index: number;
	isNight: boolean;
	params: LinkParamsMap[Id];
	/** Resolved accent of the topic above (for the "accent" color source). */
	accent: string;
};

/* ── Registry entry shapes ──────────────────────────────────────────────── */

export type InnerDef<Id extends InnerId = InnerId> = {
	id: Id;
	label: string;
	feel: string;
	/** How the body should sit inside this frame (see InnerSurface). */
	surface: InnerSurface;
	defaults: InnerParamsMap[Id];
	Component: React.ComponentType<InnerRenderProps<Id>>;
};

export type LinkDef<Id extends LinkId = LinkId> = {
	id: Id;
	label: string;
	feel: string;
	defaults: LinkParamsMap[Id];
	Component: React.ComponentType<LinkRenderProps<Id>> | null;
};

/* ── Shared tokens / helpers (also used by the `current` baseline) ──────── */

/** Per-topic pastel accent - shared by every layer that wants color. */
export const TOPIC_ACCENT: Record<TopicId, string> = {
	coding: "#a7f3d0",
	career: "#cbd5e1",
	ai: "#bfdbfe",
	"tech-stack": "#e0e7ff",
	finance: "#d9f99d",
	"movies-tv": "#fecaca",
	family: "#fecdd3",
	travel: "#fde68a",
	music: "#c7d2fe",
	games: "#e9d5ff",
};

export function flourishSrc(topicId: TopicId): string {
	return `/icons/topics/${topicId}.svg`;
}

/** Connector color source → concrete stroke color (night-aware). */
export function linkStroke(
	source: LinkBase["color"],
	accent: string,
	isNight: boolean,
): string {
	switch (source) {
		case "sky":
			return isNight ? "#c7d2fe" : "#7dd3fc";
		case "earth":
			return "#8a5a28";
		case "accent":
			return accent;
		default:
			return isNight ? "rgba(248,250,252,0.55)" : "#0f172a";
	}
}
