import type { ComposerTopic, Topic, TopicId } from "../../../data/topics";

/*
 * DEV-ONLY 3-layer composer contract.
 *
 * A composition stacks three independent axes over a single topic:
 *   Layer 1 — SECTION STYLE   the full-bleed cinematic STAGE the topic sits on
 *   Layer 2 — INNER STYLE     the CENTERED CONTENT CLUSTER inside that stage
 *   Layer 3 — LINK (connector) the seam rendered BETWEEN consecutive topics
 *
 * Each layer has its own registry (sections/, inner/, links/) keyed by id, and
 * each item carries a small set of FOCUSED params the panel exposes as controls.
 *
 * Production never imports any of this: the composer host/panel/state + every
 * section/inner/link module are gated behind a folded `import.meta.env.DEV`
 * literal at the call sites, so Rollup tree-shakes the whole composer/ tree
 * (minus the `current` baseline + the two shared helpers below) out of the prod
 * client bundle. Verified with a dist grep — see CLEANUP_NEEDED.
 *
 * Planner: once a composition is locked, fold the chosen section+inner+link
 * render bodies into the real TopicArticle/CraftSection and delete the rest of
 * composer/ (see CLEANUP_NEEDED).
 */

/* ── Layer 1: SECTION STYLE ─────────────────────────────────────────────── */

export type SectionId =
	| "centered-monolith"
	| "edge-anchored"
	| "split-stage"
	| "letterbox"
	| "spotlight-vignette"
	| "parallax-depth"
	| "diagonal-cut"
	| "framed-window"
	| "marquee-scroll"
	| "stacked-cards"
	| "full-type"
	| "horizon-band"
	| "peek-reveal"
	| "triptych"
	| "oversized-number"
	| "floating-island"
	| "zoom-focus"
	| "curtain-reveal";

/** Where the accent color a stage/cluster uses comes from. */
export type AccentSource = "topic" | "fixed" | "none";

export type SectionParams = {
	/** Accent color source for the stage's grade / rules / CTA tint. */
	accent: AccentSource;
	/** Where the content cluster sits within the stage. */
	align: "center" | "left" | "right" | "bottom";
	/** Scrim/backdrop darkness behind the cluster, 0..80 (percent-ish). */
	scrim: number;
	/** Stage height fine-tune as a vh value; clamped per-style around its base. */
	height: number;
};

/* ── Layer 2: INNER STYLE ───────────────────────────────────────────────── */

export type InnerId =
	| "minimal"
	| "trail-signpost"
	| "field-journal"
	| "museum"
	| "strata-core"
	| "constellation"
	| "terminal"
	| "polaroid"
	| "collectible"
	| "comic"
	| "ticket-stub"
	| "receipt"
	| "stamp-postcard"
	| "manuscript"
	| "blueprint"
	| "circuit-board"
	| "arcade-hud"
	| "neon-sign"
	| "vinyl-liner"
	| "cassette"
	| "chalkboard"
	| "wanted-poster"
	| "marquee-bulbs"
	| "luggage-tag"
	| "embossed-seal"
	| "pressed-specimen";

export type InnerParams = {
	/** Cluster color treatment. */
	color: "accent" | "neutral" | "inverted";
	/** Cluster scale / breathing room. */
	density: "cozy" | "comfortable" | "roomy";
	/** Each inner style's one signature motif (meaning is per-style). */
	motif: boolean;
};

/* ── Layer 3: LINK (between-topic connector) ────────────────────────────── */

export type LinkId =
	| "none"
	| "ruled-seam"
	| "flowing-curve"
	| "botanical-vine"
	| "trail-dashes"
	| "constellation-starline"
	| "river-ribbon"
	| "strata-seam"
	| "dotted-thread";

export type LinkParams = {
	/** Connector stroke color source. */
	color: "ink" | "sky" | "earth" | "accent";
	/** Stroke weight in px, 1..8. */
	weight: number;
	/** Curve amount 0..100 (ignored by straight connectors). */
	curve: number;
	/**
	 * Rail vertical extent in vh, 20..150. Grows the connector to fill the gap
	 * between clusters (or span most of a stage for a continuous-thread feel).
	 * Drives `--rail-h` on the rail; default 45 reproduces today's look.
	 */
	height: number;
	/**
	 * End-fade length 0..100. Higher melts the connector deeper into the stages
	 * (longer/softer mask fade); lower gives crisper ends. Drives `--rail-fade`
	 * (mapped to a % of the rail length); default 24 reproduces today's ~12%.
	 */
	blend: number;
	/** Animate the draw-in on scroll. */
	animate: boolean;
};

/* ── Render contracts ───────────────────────────────────────────────────── */

/**
 * Layer-2 contract: render the heading + teaser + triggers as a CENTERED
 * CONTENT CLUSTER. No section framing, no own vertical padding — the Layer-1
 * stage owns height/backdrop/landscape and renders this inside it.
 */
export type InnerRenderProps = {
	topic: ComposerTopic;
	index: number;
	isNight: boolean;
	lastTriggerRef: React.RefObject<HTMLElement | null>;
	params: InnerParams;
	/** Resolved accent for this topic (the cluster decides whether to use it). */
	accent: string;
};

/**
 * Layer-1 contract: render the cinematic stage for one topic and render the
 * Layer-2 cluster (passed as children) inside it. Stages only read
 * `topic.id` + `topic.heading` (never teaser/triggers), so promoted topics
 * with their own custom content can also ride a stage.
 */
export type SectionRenderProps = {
	topic: Topic;
	index: number;
	isNight: boolean;
	params: SectionParams;
	/** Resolved accent for this topic (or null when accent source is "none"). */
	accent: string | null;
	/** The Layer-2 cluster, already constructed by the dispatcher. */
	children: React.ReactNode;
};

/** Layer-3 contract: a connector rendered at the seam between two topics. */
export type LinkRenderProps = {
	/** Zero-based index of the topic ABOVE this seam (drives alternation). */
	index: number;
	isNight: boolean;
	params: LinkParams;
	/** Resolved accent of the topic above (for the "accent" color source). */
	accent: string;
};

/* ── Registry entry shapes ──────────────────────────────────────────────── */

export type SectionDef = {
	id: SectionId;
	label: string;
	feel: string;
	/** Base stage height in vh; the height param fine-tunes around this. */
	baseHeight: number;
	/** Inclusive clamp range for the height param, in vh. */
	heightRange: [number, number];
	defaults: SectionParams;
	Component: React.ComponentType<SectionRenderProps>;
};

export type InnerDef = {
	id: InnerId;
	label: string;
	feel: string;
	/** Label shown above the signature-motif toggle for this style. */
	motifLabel: string;
	defaults: InnerParams;
	Component: React.ComponentType<InnerRenderProps>;
};

export type LinkDef = {
	id: LinkId;
	label: string;
	feel: string;
	/** False for `none` + `ruled-seam` (straight) — hides the curve slider. */
	hasCurve: boolean;
	defaults: LinkParams;
	Component: React.ComponentType<LinkRenderProps> | null;
};

/* ── Shared tokens / helpers (also used by the `current` baseline) ──────── */

/** Per-topic pastel accent — shared by every layer that wants color. */
export const TOPIC_ACCENT: Record<TopicId, string> = {
	coding: "#a7f3d0",
	career: "#cbd5e1",
	ai: "#bfdbfe",
	"tech-stack": "#e0e7ff",
	finance: "#d9f99d",
	"movies-tv": "#fecaca",
	family: "#fecdd3",
	music: "#c7d2fe",
	games: "#e9d5ff",
};

export function flourishSrc(topicId: TopicId): string {
	return `/icons/topics/${topicId}.svg`;
}

/** Connector color source → concrete stroke color (night-aware). */
export function linkStroke(
	source: LinkParams["color"],
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
