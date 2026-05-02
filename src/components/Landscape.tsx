/**
 * Landscape: mid-parallax band that carries us through the journey.
 *
 * Layout maths: parallax-mid factor 0.5, document is ~5 viewports tall
 * (max scroll-px ~400vh). An element of height H placed at top T centres
 * in viewport at scroll fraction k = (T + H/2 - 50vh) / 200vh.
 *
 *   mountains    top  30vh, h 110vh  peak k ~ 0.20  (tall, dominates)
 *   river        top  85vh, h 130vh  peak k ~ 0.50  (flows from mountains)
 *   tree canopy  top 130vh, h  90vh  peak k ~ 0.625 (dense, no sky bleed)
 *   tree trunks  top 175vh, h  85vh  peak k ~ 0.83  (between the trees)
 *   forest floor top 200vh, h 110vh  peak k ~ 1.025 (large grass area)
 *
 * The dig zone (section 5, opaque) covers the floor's last ~10% of
 * scroll, providing a clean handoff to the underground.
 */

const MOUNTAIN_VIEWBOX = "0 0 1600 700";
const RIVER_VIEWBOX = "0 0 800 1300";
const CANOPY_VIEWBOX = "0 0 1600 600";
const TRUNKS_VIEWBOX = "0 0 1600 600";
const FLOOR_VIEWBOX = "0 0 1600 700";

function Mountains(): React.ReactElement {
	return (
		<div
			className="absolute inset-x-0"
			style={{ top: "30vh", height: "110vh" }}
		>
			<svg
				viewBox={MOUNTAIN_VIEWBOX}
				preserveAspectRatio="none"
				width="100%"
				height="100%"
			>
				<title>Mountain ridge</title>
				{/* far ridge — softer, lighter, sits behind the main range */}
				<path
					d="M 0 480 L 80 360 L 180 410 L 290 280 L 420 380 L 560 290 L 700 390 L 850 300 L 990 400 L 1140 300 L 1290 380 L 1440 340 L 1600 420 L 1600 700 L 0 700 Z"
					fill="var(--mountain-near)"
					opacity="0.55"
				/>
				{/* main range — full height, dominates the viewport at peak */}
				<path
					d="M 0 700 L 0 540 L 90 290 L 180 470 L 290 130 L 420 400 L 560 220 L 700 410 L 850 180 L 990 430 L 1140 200 L 1290 400 L 1440 320 L 1600 460 L 1600 700 Z"
					fill="var(--mountain-near)"
				/>
				{/* snow on the highest peaks */}
				<path
					d="M 290 130 L 245 240 L 340 240 Z"
					fill="rgba(255,255,255,0.22)"
				/>
				<path
					d="M 850 180 L 800 290 L 900 290 Z"
					fill="rgba(255,255,255,0.18)"
				/>
				<path
					d="M 1140 200 L 1095 290 L 1185 290 Z"
					fill="rgba(255,255,255,0.16)"
				/>
				{/* ridge shadow on lee sides for depth */}
				<path d="M 290 130 L 420 400 L 350 400 Z" fill="rgba(0,0,0,0.18)" />
				<path d="M 850 180 L 990 430 L 920 430 Z" fill="rgba(0,0,0,0.16)" />
				<path d="M 1140 200 L 1290 400 L 1210 400 Z" fill="rgba(0,0,0,0.16)" />
			</svg>
		</div>
	);
}

/* River: flows top-to-bottom, originates from mountain area with foam. */
function FlowingRiver(): React.ReactElement {
	const RIVER_PATH =
		"M 400 60 Q 540 200 400 340 Q 240 480 420 620 Q 600 760 360 900 Q 200 1040 400 1180 Q 540 1280 400 1340";

	return (
		<div
			className="absolute inset-x-0"
			style={{ top: "85vh", height: "130vh" }}
		>
			<svg
				viewBox={RIVER_VIEWBOX}
				preserveAspectRatio="xMidYMid meet"
				width="100%"
				height="100%"
				style={{ display: "block" }}
			>
				<title>River flowing downward from the mountains</title>
				<defs>
					<linearGradient id="river-grad" x1="0" y1="0" x2="0" y2="1">
						<stop offset="0%" stopColor="var(--water-shallow)" />
						<stop offset="100%" stopColor="var(--water-deep)" />
					</linearGradient>
					<radialGradient id="foam-grad" cx="0.5" cy="0.5" r="0.5">
						<stop offset="0%" stopColor="rgba(255,255,255,0.95)" />
						<stop offset="60%" stopColor="rgba(255,255,255,0.55)" />
						<stop offset="100%" stopColor="rgba(255,255,255,0)" />
					</radialGradient>
				</defs>
				{/* Source foam: the river emerging out of the mountain face */}
				<ellipse cx="400" cy="40" rx="160" ry="55" fill="url(#foam-grad)" />
				<ellipse cx="380" cy="80" rx="120" ry="36" fill="url(#foam-grad)" />
				<ellipse cx="420" cy="120" rx="90" ry="22" fill="url(#foam-grad)" />
				{/* deep water body */}
				<path
					d={RIVER_PATH}
					stroke="var(--water-deep)"
					strokeWidth="120"
					fill="none"
					strokeLinecap="round"
				/>
				{/* shallow surface */}
				<path
					d={RIVER_PATH}
					stroke="url(#river-grad)"
					strokeWidth="68"
					fill="none"
					strokeLinecap="round"
					opacity="0.85"
				/>
				{/* foam patches at switchbacks where water hits banks */}
				<ellipse cx="240" cy="480" rx="38" ry="14" fill="url(#foam-grad)" />
				<ellipse cx="600" cy="760" rx="36" ry="14" fill="url(#foam-grad)" />
				<ellipse cx="200" cy="1040" rx="34" ry="12" fill="url(#foam-grad)" />
				{/* flow streaks - dashed pattern animated downstream */}
				<path
					className="river-flow-anim"
					d={RIVER_PATH}
					stroke="rgba(255,255,255,0.45)"
					strokeWidth="14"
					fill="none"
					strokeLinecap="round"
					strokeDasharray="40 90"
				/>
			</svg>
		</div>
	);
}

type Canopy = {
	cx: number;
	cy: number;
	r: number;
	tone: "near" | "far";
};

const CANOPIES: ReadonlyArray<Canopy> = [
	{ cx: 60, cy: 140, r: 130, tone: "near" },
	{ cx: 180, cy: 380, r: 140, tone: "near" },
	{ cx: 300, cy: 200, r: 145, tone: "far" },
	{ cx: 420, cy: 450, r: 130, tone: "near" },
	{ cx: 540, cy: 280, r: 155, tone: "near" },
	{ cx: 660, cy: 480, r: 135, tone: "far" },
	{ cx: 790, cy: 220, r: 150, tone: "near" },
	{ cx: 910, cy: 440, r: 140, tone: "near" },
	{ cx: 1030, cy: 200, r: 145, tone: "far" },
	{ cx: 1160, cy: 460, r: 150, tone: "near" },
	{ cx: 1290, cy: 240, r: 140, tone: "near" },
	{ cx: 1420, cy: 440, r: 145, tone: "far" },
	{ cx: 1540, cy: 200, r: 135, tone: "near" },
	{ cx: 130, cy: 540, r: 110, tone: "near" },
	{ cx: 380, cy: 80, r: 105, tone: "near" },
	{ cx: 730, cy: 540, r: 110, tone: "near" },
	{ cx: 1100, cy: 80, r: 105, tone: "far" },
	{ cx: 1480, cy: 540, r: 100, tone: "near" },
];

function TreeCanopy(): React.ReactElement {
	return (
		<div
			className="absolute inset-x-0"
			style={{ top: "130vh", height: "90vh" }}
		>
			<svg
				viewBox={CANOPY_VIEWBOX}
				preserveAspectRatio="xMidYMid slice"
				width="100%"
				height="100%"
			>
				<title>Dense forest canopy from above</title>
				{/* solid green base layer — fills any sky bleed between canopy circles */}
				<rect
					x="0"
					y="0"
					width="1600"
					height="600"
					fill="var(--tree-far)"
					opacity="0.9"
				/>
				<rect
					x="0"
					y="0"
					width="1600"
					height="600"
					fill="var(--tree-near)"
					opacity="0.55"
				/>
				{/* canopy globes — packed tight with overlapping radii */}
				{CANOPIES.map((c) => {
					const base =
						c.tone === "near" ? "var(--tree-near)" : "var(--tree-far)";
					const inner =
						c.tone === "near" ? "var(--tree-far)" : "var(--tree-near)";
					return (
						<g key={`${c.cx}-${c.cy}`}>
							<circle cx={c.cx} cy={c.cy} r={c.r} fill={base} />
							<circle
								cx={c.cx - c.r * 0.18}
								cy={c.cy - c.r * 0.18}
								r={c.r * 0.78}
								fill={inner}
								opacity="0.55"
							/>
							<circle
								cx={c.cx - c.r * 0.32}
								cy={c.cy - c.r * 0.32}
								r={c.r * 0.4}
								fill="rgba(255,255,255,0.1)"
							/>
						</g>
					);
				})}
			</svg>
		</div>
	);
}

/* Tree trunks: vertical bands on either side, the camera between them. */
function TreeTrunks(): React.ReactElement {
	return (
		<div
			className="absolute inset-x-0"
			style={{ top: "175vh", height: "85vh" }}
		>
			<svg
				viewBox={TRUNKS_VIEWBOX}
				preserveAspectRatio="none"
				width="100%"
				height="100%"
			>
				<title>Tree trunks lining the path</title>
				{/* near-left trunk - large, closest */}
				<rect x="-20" y="0" width="180" height="600" fill="var(--tree-trunk)" />
				{/* mid-left trunk pair */}
				<rect
					x="140"
					y="0"
					width="90"
					height="600"
					fill="var(--tree-trunk)"
					opacity="0.9"
				/>
				<rect
					x="240"
					y="0"
					width="50"
					height="600"
					fill="var(--tree-trunk)"
					opacity="0.75"
				/>
				{/* far-left distant trunk */}
				<rect
					x="320"
					y="0"
					width="55"
					height="600"
					fill="var(--tree-trunk)"
					opacity="0.6"
				/>
				{/* near-right trunk - large */}
				<rect
					x="1460"
					y="0"
					width="200"
					height="600"
					fill="var(--tree-trunk)"
				/>
				{/* mid-right trunk pair */}
				<rect
					x="1360"
					y="0"
					width="90"
					height="600"
					fill="var(--tree-trunk)"
					opacity="0.9"
				/>
				<rect
					x="1300"
					y="0"
					width="50"
					height="600"
					fill="var(--tree-trunk)"
					opacity="0.75"
				/>
				{/* far-right distant trunk */}
				<rect
					x="1220"
					y="0"
					width="55"
					height="600"
					fill="var(--tree-trunk)"
					opacity="0.6"
				/>
				{/* deep middle distance trunks */}
				<rect
					x="780"
					y="80"
					width="22"
					height="520"
					fill="var(--tree-trunk)"
					opacity="0.4"
				/>
				<rect
					x="900"
					y="120"
					width="18"
					height="480"
					fill="var(--tree-trunk)"
					opacity="0.35"
				/>
				<rect
					x="500"
					y="100"
					width="16"
					height="500"
					fill="var(--tree-trunk)"
					opacity="0.3"
				/>
				<rect
					x="1080"
					y="90"
					width="20"
					height="510"
					fill="var(--tree-trunk)"
					opacity="0.32"
				/>
				{/* dense foliage drape from above on each side */}
				<path
					d="M 0 0 Q 130 90 280 30 Q 420 80 560 0 L 560 0 L 0 0 Z"
					fill="var(--tree-near)"
				/>
				<path
					d="M 1040 0 Q 1180 90 1320 30 Q 1480 80 1600 0 L 1600 0 L 1040 0 Z"
					fill="var(--tree-near)"
				/>
				{/* shaft of light through the gap between near trunks */}
				<rect
					x="600"
					y="0"
					width="400"
					height="600"
					fill="rgba(255,240,180,0.1)"
				/>
			</svg>
		</div>
	);
}

type Flower = {
	id: string;
	x: number;
	y: number;
	color: string;
	r: number;
};

const FLOWER_PALETTE = [
	"var(--flower-yellow)",
	"var(--flower-pink)",
	"var(--flower-white)",
] as const;

const FLOWERS: ReadonlyArray<Flower> = Array.from({ length: 60 }, (_, i) => {
	const x = 30 + ((i * 197) % 1540);
	const y = 140 + ((i * 73) % 240);
	const color = FLOWER_PALETTE[i % FLOWER_PALETTE.length] ?? FLOWER_PALETTE[0];
	const r = 5 + ((i * 13) % 5);
	return { id: `f-${x}-${y}`, x, y, color, r };
});

function ForestFloor(): React.ReactElement {
	return (
		<div
			className="absolute inset-x-0"
			style={{ top: "200vh", height: "110vh" }}
		>
			<svg
				viewBox={FLOOR_VIEWBOX}
				preserveAspectRatio="none"
				width="100%"
				height="100%"
			>
				<title>Grassy forest floor with wildflowers</title>
				{/* deep soil that fades into the dig zone below */}
				<rect x="0" y="430" width="1600" height="270" fill="var(--soil)" />
				<rect
					x="0"
					y="540"
					width="1600"
					height="160"
					fill="var(--soil-rim)"
					opacity="0.35"
				/>
				{/* grass body: large vertical band */}
				<rect x="0" y="100" width="1600" height="340" fill="var(--grass)" />
				{/* lighter grass on top portion */}
				<rect
					x="0"
					y="100"
					width="1600"
					height="120"
					fill="var(--grass-light)"
					opacity="0.6"
				/>
				{/* uneven grass tips on top edge */}
				<path
					d="M 0 100 L 0 88 L 28 100 L 56 82 L 84 100 L 112 90 L 148 100 L 186 76 L 224 100 L 262 88 L 300 100 L 338 82 L 376 100 L 414 92 L 452 100 L 490 80 L 528 100 L 566 88 L 604 100 L 642 76 L 680 100 L 718 92 L 756 100 L 794 84 L 832 100 L 870 88 L 908 100 L 946 76 L 984 100 L 1022 90 L 1060 100 L 1098 84 L 1136 100 L 1174 90 L 1212 100 L 1250 76 L 1288 100 L 1326 92 L 1364 100 L 1402 86 L 1440 100 L 1478 90 L 1516 100 L 1554 82 L 1600 100 Z"
					fill="var(--grass-light)"
				/>
				{/* secondary grass blades scattered through the body */}
				<path
					d="M 0 220 L 22 200 L 44 220 L 68 204 L 92 220 L 122 200 L 152 220 L 184 198 L 220 220 L 256 206 L 296 220 L 336 198 L 380 220 L 422 208 L 466 220 L 510 200 L 558 220 L 606 206 L 658 220 L 712 200 L 770 220 L 832 208 L 894 220 L 960 200 L 1028 220 L 1098 208 L 1170 220 L 1244 200 L 1320 220 L 1398 208 L 1480 220 L 1564 200 L 1600 220 L 1600 230 L 0 230 Z"
					fill="var(--grass-light)"
					opacity="0.7"
				/>
				{/* flowers */}
				{FLOWERS.map((f) => (
					<g key={f.id}>
						<circle cx={f.x} cy={f.y} r={f.r} fill={f.color} />
						<circle
							cx={f.x}
							cy={f.y}
							r={f.r * 0.4}
							fill="var(--flower-white)"
							opacity="0.85"
						/>
					</g>
				))}
			</svg>
		</div>
	);
}

export function Landscape(): React.ReactElement {
	return (
		<div className="parallax-layer parallax-mid z-[25]" aria-hidden="true">
			<Mountains />
			<FlowingRiver />
			<TreeCanopy />
			<TreeTrunks />
			<ForestFloor />
		</div>
	);
}
