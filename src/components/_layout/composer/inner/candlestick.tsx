import type { InnerRenderProps } from "../types";
import { DENSITY_MAXW } from "./shared";

/*
 * Inner: candlestick - "chart sheet."
 *
 * A light broker research sheet is the frame: the heading reads as the
 * instrument name beside a mono OHLC readout, a candlestick chart (fixed
 * candle series - no randomness, SSR-stable) draws under it, then the topic's
 * REAL body (the shared plate) as the analyst notes, and a mono session
 * footer. Signature toggle (params.grid) = the horizontal price gridlines
 * behind the candles; theming knob (stock) = the sheet paper (white / cream /
 * mist). Candle color is market chrome, never theme: up-candles green,
 * down-candles red - the OHLC readout ink follows the paper's ink instead.
 */

/** stock → { paper, edge, ink } - sheet surface, rule lines, print ink. */
const STOCKS: Record<
	InnerRenderProps<"candlestick">["params"]["stock"],
	{ paper: string; edge: string; ink: string }
> = {
	white: { paper: "#ffffff", edge: "#d7dce4", ink: "#1e293b" },
	cream: { paper: "#faf6ec", edge: "#ddd3bc", ink: "#3d3426" },
	mist: { paper: "#eef1f5", edge: "#c9d2dd", ink: "#2a3441" },
};

const UP = "#16a34a";
const DOWN = "#dc2626";

/** The series: 12 fixed candles in a 148×52 box (x, wick top/bottom, body
 * top/height, direction) - a bumpy-but-up year, literal by design. */
const CANDLES = [
	{ x: 5, wy1: 30, wy2: 48, by: 34, bh: 10, up: false },
	{ x: 17, wy1: 28, wy2: 46, by: 31, bh: 11, up: true },
	{ x: 29, wy1: 24, wy2: 40, by: 27, bh: 9, up: true },
	{ x: 41, wy1: 22, wy2: 38, by: 25, bh: 11, up: false },
	{ x: 53, wy1: 26, wy2: 44, by: 30, bh: 10, up: false },
	{ x: 65, wy1: 20, wy2: 38, by: 23, bh: 12, up: true },
	{ x: 77, wy1: 16, wy2: 32, by: 19, bh: 10, up: true },
	{ x: 89, wy1: 14, wy2: 30, by: 17, bh: 11, up: false },
	{ x: 101, wy1: 18, wy2: 34, by: 21, bh: 10, up: true },
	{ x: 113, wy1: 10, wy2: 28, by: 13, bh: 12, up: true },
	{ x: 125, wy1: 8, wy2: 24, by: 11, bh: 9, up: false },
	{ x: 137, wy1: 4, wy2: 20, by: 7, bh: 11, up: true },
] as const;

const GRIDLINES = [10, 22, 34, 46] as const;

export function CandlestickCluster({
	topic,
	index,
	params,
	children,
}: InnerRenderProps<"candlestick">) {
	const s = STOCKS[params.stock];
	const base = 100 + index * 37;
	const ohlc = `O ${base} · H ${base + 24} · L ${base - 9} · C ${base + 18}`;

	return (
		<div className={`w-full ${DENSITY_MAXW[params.density]}`}>
			<div
				className="relative overflow-hidden rounded-xl px-6 md:px-9 py-8"
				style={{
					backgroundColor: s.paper,
					border: `1px solid ${s.edge}`,
					boxShadow: "2px 6px 20px -10px rgba(30,40,55,0.4)",
				}}
			>
				{/* instrument row: heading + OHLC readout */}
				<div className="relative flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
					<h2
						className="font-black uppercase tracking-tight text-3xl md:text-5xl leading-none"
						style={{ color: s.ink }}
					>
						{topic.heading}
					</h2>
					<span
						className="font-mono text-[11px] shrink-0 whitespace-nowrap"
						style={{ color: s.ink, opacity: 0.55 }}
						aria-hidden="true"
					>
						{ohlc}
					</span>
				</div>

				{/* the chart - fixed candles over optional gridlines */}
				<svg
					className="relative mt-4 w-full h-16 md:h-20"
					viewBox="0 0 148 52"
					preserveAspectRatio="none"
					fill="none"
					aria-hidden="true"
				>
					{params.grid &&
						GRIDLINES.map((y) => (
							<line
								key={y}
								x1={0}
								y1={y}
								x2={148}
								y2={y}
								stroke={s.edge}
								strokeWidth={0.75}
							/>
						))}
					{CANDLES.map((c) => {
						const tone = c.up ? UP : DOWN;
						return (
							<g key={c.x}>
								<line
									x1={c.x + 3}
									y1={c.wy1}
									x2={c.x + 3}
									y2={c.wy2}
									stroke={tone}
									strokeWidth={1}
								/>
								<rect
									x={c.x}
									y={c.by}
									width={6}
									height={c.bh}
									fill={c.up ? tone : s.paper}
									stroke={tone}
									strokeWidth={1}
								/>
							</g>
						);
					})}
				</svg>

				{/* analyst notes - the topic body */}
				<div className="relative mt-5">{children}</div>

				{/* session footer */}
				<div
					className="relative mt-6 font-mono text-[10px] uppercase tracking-[0.25em]"
					style={{ color: s.ink, opacity: 0.5 }}
				>
					fy since 2016 · long only · not financial advice
				</div>
			</div>
		</div>
	);
}
