import { AgentConsoleCluster } from "./inner/agent-console";
import { ArcadeHudCluster } from "./inner/arcade-hud";
import { AuroraCluster } from "./inner/aurora";
import { BlueprintCluster } from "./inner/blueprint";
import { CandlestickCluster } from "./inner/candlestick";
import { CargoContainerCluster } from "./inner/cargo-container";
import { ChalkboardCluster } from "./inner/chalkboard";
import { ChatThreadCluster } from "./inner/chat-thread";
import { CircuitBoardCluster } from "./inner/circuit-board";
import { CodeEditorCluster } from "./inner/code-editor";
import { CollectibleCluster } from "./inner/collectible";
import { ComicCluster } from "./inner/comic";
import { CommitGraphCluster } from "./inner/commit-graph";
import { ConstellationCluster } from "./inner/constellation";
import { DaybreakCluster } from "./inner/daybreak";
import { FieldJournalCluster } from "./inner/field-journal";
import { FloatingIslandCluster } from "./inner/floating-island";
import { KeycapsCluster } from "./inner/keycaps";
import { ManPageCluster } from "./inner/man-page";
import { MinimalCluster } from "./inner/minimal";
import { ModelCardCluster } from "./inner/model-card";
import { MoonriseCluster } from "./inner/moonrise";
import { NameplateCluster } from "./inner/nameplate";
import { NeonSignCluster } from "./inner/neon-sign";
import { NeuralNetCluster } from "./inner/neural-net";
import { OfferLetterCluster } from "./inner/offer-letter";
import { ParallaxDepthCluster } from "./inner/parallax-depth";
import { PolaroidCluster } from "./inner/polaroid";
import { PullRequestCluster } from "./inner/pull-request";
import { PunchCardCluster } from "./inner/punch-card";
import { SeedPacketCluster } from "./inner/seed-packet";
import { ServerRackCluster } from "./inner/server-rack";
import { SkylineCluster } from "./inner/skyline";
import { StatusPageCluster } from "./inner/status-page";
import { SummitCluster } from "./inner/summit";
import { TerminalCluster } from "./inner/terminal";
import { TickerTapeCluster } from "./inner/ticker-tape";
import { TicketStubCluster } from "./inner/ticket-stub";
import { TimecardCluster } from "./inner/timecard";
import { TokenStreamCluster } from "./inner/token-stream";
import { TopoMapCluster } from "./inner/topo-map";
import { TradingAppCluster } from "./inner/trading-app";
import { TrailSignpostCluster } from "./inner/trail-signpost";
import { BotanicalVineLink } from "./links/botanical-vine";
import { ConstellationStarlineLink } from "./links/constellation-starline";
import { FlowingCurveLink } from "./links/flowing-curve";
import { RuledSeamLink } from "./links/ruled-seam";
import { TrailDashesLink } from "./links/trail-dashes";
import type { InnerDef, InnerId, LinkDef, LinkId } from "./types";

/*
 * Composer registries - the single source of truth for the two layers
 * (inner / link). The panel reads these to build its radio lists + per-item
 * param controls; the dispatcher reads them to render the selected
 * composition.
 */

export type { InnerId, LinkId } from "./types";

/* ── INNER STYLES (the centered cluster) ────────────────────────────────── */

export const INNERS: { [Id in InnerId]: InnerDef<Id> } = {
	"parallax-depth": {
		id: "parallax-depth",
		label: "Parallax Depth",
		feel: "Layered fore/background drift on scroll; the cluster floats over a slow ghost flourish with big Minimal-style chrome.",
		surface: "plate",
		defaults: { density: "roomy", shape: "flourish", depth: 50, layers: 3 },
		Component: ParallaxDepthCluster,
	},
	"floating-island": {
		id: "floating-island",
		label: "Floating Island",
		feel: "Cluster on a floating slab with a soft drop shadow, landscape all around; the slab bobs gently on scroll (reduced-motion safe).",
		surface: "dark",
		defaults: {
			density: "roomy",
			floatHeight: 50,
			bob: 50,
			corners: "soft",
			tint: 35,
		},
		Component: FloatingIslandCluster,
	},
	minimal: {
		id: "minimal",
		label: "Minimal",
		feel: "Clean cluster: a styled heading + optional accent underline, content below. Lets the landscape do the talking.",
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
		feel: "Night sky: a faint star field with a low connecting figure - delicate, the natural fit as the journey reaches night.",
		surface: "dark",
		defaults: {
			density: "roomy",
			lines: true,
			tint: "indigo",
			figure: "wing",
		},
		Component: ConstellationCluster,
	},
	aurora: {
		id: "aurora",
		label: "Aurora",
		feel: "Night sky: soft northern-lights curtains drifting over a blur-edged dark veil. A natural fit deep into the night.",
		surface: "dark",
		defaults: { density: "roomy", stars: true, hue: "emerald" },
		Component: AuroraCluster,
	},
	moonrise: {
		id: "moonrise",
		label: "Moonrise",
		feel: "Night sky: a glowing moon + halo with a scatter of stars. Calm, late in the journey.",
		surface: "dark",
		defaults: { density: "roomy", stars: true, phase: "crescent" },
		Component: MoonriseCluster,
	},
	daybreak: {
		id: "daybreak",
		label: "Daybreak",
		feel: "Time of day: a warm sky with a low sun + rays - dawn, golden hour or dusk via the sky knob.",
		surface: "light",
		defaults: { density: "roomy", rays: true, sky: "golden" },
		Component: DaybreakCluster,
	},
	summit: {
		id: "summit",
		label: "Summit",
		feel: "Nature: layered mountain-ridge silhouettes under a graded sky. Fits the journey's high points.",
		surface: "dark",
		defaults: { density: "roomy", snow: false, range: "dusk" },
		Component: SummitCluster,
	},
	skyline: {
		id: "skyline",
		label: "Skyline",
		feel: "Sky elements (birds / clouds / plane / kite / balloon) as light line-art over the existing sky - tune prominence, placement, variety + colour per element. No background of its own.",
		surface: "plate",
		defaults: {
			density: "roomy",
			motif: "birds",
			prominence: "subtle",
			placement: "scatter",
			variety: "mixed",
			color: "ink",
			drift: true,
		},
		Component: SkylineCluster,
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
		feel: "Scrapbook page: a kraft board with a glossy Kodak-era print floated in the prose (text wraps around it) - date stamp, washi tape, handwritten caption.",
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
		feel: "Drafting sheet: a dimension-lined heading + grid; pick the print - cyanotype / white / charcoal.",
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
	timecard: {
		id: "timecard",
		label: "Timecard",
		feel: "Punch-clock card: an EMPLOYEE NO. eyebrow, printed rows and inked IN / OUT stamps on a chosen paper stock. Workday ephemera.",
		surface: "light",
		defaults: { density: "roomy", stamps: true, stock: "manila" },
		Component: TimecardCluster,
	},
	nameplate: {
		id: "nameplate",
		label: "Nameplate",
		feel: "Engraved door plate: an accent-tinted band with a big engraved title over a dark role line, held by four corner screws.",
		surface: "light",
		defaults: { density: "roomy", screws: true, role: "title" },
		Component: NameplateCluster,
	},
	"punch-card": {
		id: "punch-card",
		label: "Punch Card",
		feel: "80-column IBM card: a clipped corner, printed digit bands and a row of punched holes on a chosen card stock.",
		surface: "light",
		defaults: { density: "roomy", holes: true, stock: "manila" },
		Component: PunchCardCluster,
	},
	"offer-letter": {
		id: "offer-letter",
		label: "Offer Letter",
		feel: "Cream letterhead: an embossed monogram, a dated subject line and a signed-off scrawl at the foot. Quietly formal.",
		surface: "light",
		defaults: { density: "roomy", scrawl: true, stock: "cream" },
		Component: OfferLetterCluster,
	},
	"code-editor": {
		id: "code-editor",
		label: "Code Editor",
		feel: "Editor window: tab bar, line-number gutter and a markdown H1 heading in a chosen syntax theme. Modern IDE.",
		surface: "dark",
		defaults: { density: "roomy", gutter: true, theme: "onedark" },
		Component: CodeEditorCluster,
	},
	"pull-request": {
		id: "pull-request",
		label: "Pull Request",
		feel: "Review card: mono branch chips, a state badge, an honest +/- stat bar and connected pipeline stage bubbles framing the heading as a PR title. Delicate and clear.",
		surface: "light",
		defaults: { density: "roomy", checks: true, state: "merged" },
		Component: PullRequestCluster,
	},
	"commit-graph": {
		id: "commit-graph",
		label: "Commit Graph",
		feel: "Commit-log card: an SVG lane graph + fake short SHAs framing the heading as the HEAD commit subject, with optional ref chips. Version control.",
		surface: "light",
		defaults: { density: "roomy", refs: true, stock: "white" },
		Component: CommitGraphCluster,
	},
	"man-page": {
		id: "man-page",
		label: "Man Page",
		feel: "Dot-matrix manual page: a mono NAME / DESCRIPTION layout with sprocket-hole tractor edges on a chosen printout stock. Retro hacker.",
		surface: "light",
		defaults: { density: "roomy", tractor: true, stock: "greenbar" },
		Component: ManPageCluster,
	},
	keycaps: {
		id: "keycaps",
		label: "Keycaps",
		feel: "Mechanical keyboard: the heading spelled in rounded keycap tiles with an optional accent backlight, closed by a slim spacebar rule. Tactile hardware.",
		surface: "plate",
		defaults: { density: "roomy", backlight: true, colorway: "beige" },
		Component: KeycapsCluster,
	},
	"server-rack": {
		id: "server-rack",
		label: "Server Rack",
		feel: "Rack unit: slotted rack screws flank a metal faceplate with the heading as the unit label, winking status + activity lamps, vent slits and a patched ethernet row along the bottom. Homelab hardware.",
		surface: "dark",
		defaults: { density: "roomy", leds: true, finish: "midnight" },
		Component: ServerRackCluster,
	},
	"status-page": {
		id: "status-page",
		label: "Status Page",
		feel: "SaaS status card: a live status pill, the heading as the monitored service, a 90-day uptime tick row and a checked-just-now footer. Modern ops.",
		surface: "light",
		defaults: { density: "roomy", bars: true, status: "operational" },
		Component: StatusPageCluster,
	},
	"cargo-container": {
		id: "cargo-container",
		label: "Container",
		feel: "Shipping container: a corrugated painted wall with corner castings, a stenciled heading + ALPU registration, and the body on a door placard. Everything ships in containers.",
		surface: "light",
		defaults: { density: "roomy", corrugation: true, livery: "rust" },
		Component: CargoContainerCluster,
	},
	"chat-thread": {
		id: "chat-thread",
		label: "Chat Thread",
		feel: "Assistant conversation (ai-sdk Elements patterns): model-chip header, prompt as a user bubble, a collapsed reasoning strip, the body full-width as the reply, actions row + prompt-input footer.",
		surface: "dark",
		defaults: {
			density: "roomy",
			reasoning: true,
			input: true,
			tone: "midnight",
		},
		Component: ChatThreadCluster,
	},
	"agent-console": {
		id: "agent-console",
		label: "Agent Console",
		feel: "A coding-agent run à la Claude Code: mono console header, the heading as the task line, reasoning pill + tool-call steps, the body as the final answer, actions + follow-up input, status footer.",
		surface: "dark",
		defaults: {
			density: "roomy",
			steps: true,
			input: true,
			finish: "obsidian",
		},
		Component: AgentConsoleCluster,
	},
	"model-card": {
		id: "model-card",
		label: "Model Card",
		feel: "Printed model release card: MODEL CARD eyebrow + version chip, the heading as the model name, a playful three-cell spec strip. Ephemera lineage.",
		surface: "light",
		defaults: { density: "roomy", specs: true, stock: "paper" },
		Component: ModelCardCluster,
	},
	"token-stream": {
		id: "token-stream",
		label: "Token Stream",
		feel: "The heading tokenized: each word on a translucent tokenizer chip with cycling hues and a streaming caret still generating. Floats over the landscape.",
		surface: "dark",
		defaults: { density: "roomy", caret: true, palette: "candy" },
		Component: TokenStreamCluster,
	},
	"neural-net": {
		id: "neural-net",
		label: "Neural Net",
		feel: "A layered network figure under the title - hairline edges, node dots, travelling signal pulses. The constellation's structured sibling.",
		surface: "dark",
		defaults: { density: "roomy", pulse: true, tint: "cyan" },
		Component: NeuralNetCluster,
	},
	"ticker-tape": {
		id: "ticker-tape",
		label: "Ticker Tape",
		feel: "Exchange board: a scrolling quote tape across the top, the heading as the listing with a LIVE lamp, mono exchange-hours footer.",
		surface: "dark",
		defaults: { density: "roomy", tape: true, board: "onyx" },
		Component: TickerTapeCluster,
	},
	"trading-app": {
		id: "trading-app",
		label: "Trading App",
		feel: "Dark-mode brokerage screen: delta chip, sparkline chart in a chosen market mood, timeframe pills, decorative BUY/SELL row.",
		surface: "dark",
		defaults: { density: "roomy", chart: true, trend: "bull" },
		Component: TradingAppCluster,
	},
	candlestick: {
		id: "candlestick",
		label: "Candlestick",
		feel: "Broker research sheet: instrument heading + mono OHLC readout, a fixed candlestick chart on a chosen paper stock, session footer.",
		surface: "light",
		defaults: { density: "roomy", grid: true, stock: "white" },
		Component: CandlestickCluster,
	},
};

export const INNER_ORDER: InnerId[] = [
	"parallax-depth",
	"floating-island",
	"constellation",
	"skyline",
	"terminal",
	"ticket-stub",
	"arcade-hud",
	"seed-packet",
	"timecard",
	"nameplate",
	"punch-card",
	"offer-letter",
	"code-editor",
	"pull-request",
	"commit-graph",
	"man-page",
	"keycaps",
	// wayfinder #13 (tech-stack candidates): the two shortlisted frames
	// restored to the picker + three new infra frames, appended per the
	// growth convention (never interleaved).
	"blueprint",
	"circuit-board",
	"server-rack",
	"status-page",
	"cargo-container",
	// wayfinder #14 (AI candidates): aurora restored from the pruned list -
	// it is a shortlisted alternate for the AI identity walk, appended per
	// the growth convention (never interleaved).
	"aurora",
	// wayfinder #14 round two: four new AI-native frames built after the
	// aurora lock was rejected on the live walk, appended per the growth
	// convention.
	"chat-thread",
	"model-card",
	"token-stream",
	"neural-net",
	// wayfinder #14 round three: the chat concept won; agent-console is its
	// CLI-flavored sibling variation, appended per the growth convention.
	"agent-console",
	// wayfinder #15 (finance candidates): the two shortlisted frames restored
	// from the pruned list + three new trading frames, appended per the
	// growth convention (never interleaved).
	"chalkboard",
	"topo-map",
	"ticker-tape",
	"trading-app",
	"candlestick",
	// wayfinder #16 (family candidates): polaroid (the shortlisted primary)
	// restored from the pruned list, appended per the growth convention
	// (never interleaved); seed-packet (the alternate) is already pickable.
	"polaroid",
	// wayfinder #17 (travel candidates): field-journal (a shortlisted
	// alternate) restored from the pruned list, appended per the growth
	// convention (never interleaved); ticket-stub (the primary) and topo-map
	// are already pickable.
	"field-journal",
];

/* ── LINKS (between-topic connectors) ───────────────────────────────────── */

// Shared rail defaults (color + signature params set per connector).
const LINK_BASE = { weight: 2, height: 90, blend: 90, animate: true } as const;

export const LINKS: { [Id in LinkId]: LinkDef<Id> } = {
	none: {
		id: "none",
		label: "None",
		feel: "No connector - topics sit on their own with the natural seam.",
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
