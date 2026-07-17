import type { InnerRenderProps } from "../types";
import { DENSITY_MAXW } from "./shared";

/*
 * Inner: trading-app - "brokerage app card."
 *
 * A dark-mode brokerage app screen is the frame: a header with the heading as
 * the position name + a delta chip, a sparkline area chart (fixed SVG path per
 * trend - no randomness, SSR-stable), a timeframe pill row with 1Y active, the
 * topic's REAL body as the position notes, and a decorative BUY / SELL action
 * row along the bottom. Signature toggle (params.chart) = the sparkline +
 * timeframe chrome; theming knob (trend) = the market mood (bull / bear /
 * crab), driving the chart path, line color and the delta chip - green up,
 * red down, slate sideways. The app surface itself never changes with trend;
 * the active timeframe pill reads the accent prop only.
 */

/** trend → { line, delta, path } - chart ink, chip text, fixed sparkline. */
const TRENDS: Record<
	InnerRenderProps<"trading-app">["params"]["trend"],
	{ line: string; delta: string; path: string }
> = {
	bull: {
		line: "#34d399",
		delta: "+12.4%",
		path: "M0 44 L14 40 L26 42 L38 33 L52 35 L66 26 L78 29 L92 18 L106 21 L120 12 L134 15 L148 6",
	},
	bear: {
		line: "#f87171",
		delta: "-8.2%",
		path: "M0 10 L14 14 L26 12 L38 21 L52 18 L66 27 L78 24 L92 34 L106 31 L120 40 L134 37 L148 46",
	},
	crab: {
		line: "#94a3b8",
		delta: "+0.3%",
		path: "M0 27 L14 24 L26 30 L38 25 L52 31 L66 26 L78 30 L92 24 L106 29 L120 25 L134 30 L148 27",
	},
};

const TIMEFRAMES = ["1D", "1W", "1M", "1Y", "MAX"] as const;

export function TradingAppCluster({
	topic,
	params,
	accent,
	children,
}: InnerRenderProps<"trading-app">) {
	const t = TRENDS[params.trend];

	return (
		<div className={`w-full ${DENSITY_MAXW[params.density]}`}>
			<div
				className="tapp relative text-left"
				style={{ "--tapp-accent": accent } as React.CSSProperties}
			>
				{/* header: position name + delta chip */}
				<div className="relative px-6 md:px-8 pt-6 flex flex-wrap items-center justify-between gap-x-6 gap-y-2">
					<h2 className="tapp-label font-bold tracking-tight text-3xl md:text-5xl leading-none">
						{topic.heading}
					</h2>
					<span
						className={`tapp-chip font-mono text-xs md:text-sm ${
							params.trend === "bear" ? "tapp-chip--down" : "tapp-chip--up"
						}`}
						style={{ color: t.line }}
						aria-hidden="true"
					>
						{t.delta}
					</span>
				</div>

				{/* sparkline + timeframe pills */}
				{params.chart && (
					<div className="relative px-6 md:px-8 pt-4" aria-hidden="true">
						<svg
							className="tapp-chart w-full h-14 md:h-16"
							viewBox="0 0 148 52"
							preserveAspectRatio="none"
							fill="none"
							aria-hidden="true"
						>
							<path
								d={`${t.path} L148 52 L0 52 Z`}
								fill={t.line}
								opacity={0.12}
							/>
							<path
								d={t.path}
								stroke={t.line}
								strokeWidth={2}
								strokeLinejoin="round"
								strokeLinecap="round"
							/>
						</svg>
						<div className="tapp-frames mt-3 flex items-center gap-2 font-mono text-[10px]">
							{TIMEFRAMES.map((tf) => (
								<span
									key={tf}
									className={`tapp-frame ${tf === "1Y" ? "tapp-frame--on" : ""}`}
								>
									{tf}
								</span>
							))}
						</div>
					</div>
				)}

				{/* position notes - the topic body on the app surface */}
				<div className="relative px-6 md:px-8 py-6">{children}</div>

				{/* decorative order row */}
				<div
					className="tapp-orders relative flex items-center gap-3 px-6 md:px-8 pb-6"
					aria-hidden="true"
				>
					<span className="tapp-btn tapp-btn--buy font-mono">buy</span>
					<span className="tapp-btn tapp-btn--sell font-mono">sell</span>
					<span className="tapp-zen ml-auto font-mono text-[10px] uppercase tracking-[0.25em]">
						no fomo · no fud
					</span>
				</div>
			</div>
		</div>
	);
}
