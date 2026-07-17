import { TAPE_AS_OF, TAPE_QUOTES } from "../../../../data/quotes";
import type { InnerRenderProps } from "../types";
import { DENSITY_MAXW } from "./shared";

/*
 * Inner: ticker-tape - "exchange board."
 *
 * A dark exchange board is the frame: a scrolling ticker strip runs across
 * the top on an LED dot-matrix surface (REAL quotes from src/data/quotes.ts,
 * captured at build time by generate:quotes - duplicated ×2 for a seamless
 * CSS loop, pausable on hover, SSR-stable), the heading reads as the board's
 * listing name with a LIVE lamp, a BTC day-stats row (h/l/vol - also real)
 * runs under it, the topic's REAL body sits on the board below, and a mono
 * as-of + exchange-hours line closes the bottom. Individual quotes flash
 * their backdrop green/red on staggered CSS phases (i % 4 - deterministic,
 * stilled under reduced motion) like a board catching updates. Signature
 * toggle (params.tape) = the whole ticker strip; theming knob (board) = the
 * board surface (onyx / navy / pit), handed to the `.ticker-*` classes as
 * --ticker-board / --ticker-edge / --ticker-ink inline vars (the rack
 * --rack-* convention). Up-moves are always green, down-moves always red -
 * market color is chrome, not theme. The LIVE lamp reads the accent prop
 * only.
 */

/** board → { board, edge, ink } - board surface, frame edge, label ink. */
const BOARDS: Record<
	InnerRenderProps<"ticker-tape">["params"]["board"],
	{ board: string; edge: string; ink: string }
> = {
	onyx: { board: "#0b0e13", edge: "#1c222d", ink: "#e2e8f0" },
	navy: { board: "#0c1426", edge: "#1e2a46", ink: "#dbe4f3" },
	pit: { board: "#0a1a14", edge: "#1b3329", ink: "#d9f2e5" },
};

/** +1.76 → "+1.76", -2.4 → "-2.40" - the tape always shows sign + 2dp. */
const fmtDelta = (d: number) => `${d >= 0 ? "+" : ""}${d.toFixed(2)}`;

/** Price levels: thousands get grouped and rounded, small levels keep 2dp. */
const fmtLevel = (n: number) =>
	n >= 1000 ? Math.round(n).toLocaleString("en-US") : n.toFixed(2);

/** Volumes compact: 27927222272 → "27.9b", 62673782 → "62.7m". */
const fmtVol = (n: number) => {
	if (n >= 1e9) return `${(n / 1e9).toFixed(1)}b`;
	if (n >= 1e6) return `${(n / 1e6).toFixed(1)}m`;
	if (n >= 1e3) return `${(n / 1e3).toFixed(1)}k`;
	return String(n);
};

/** The day-stats row tracks BTC (the tape's liveliest instrument). */
const STATS_QUOTE = TAPE_QUOTES.find((q) => q.sym === "BTC") ?? TAPE_QUOTES[0];

export function TickerTapeCluster({
	topic,
	params,
	accent,
	children,
}: InnerRenderProps<"ticker-tape">) {
	const b = BOARDS[params.board];

	return (
		<div className={`w-full ${DENSITY_MAXW[params.density]}`}>
			<div
				className="ticker relative text-left"
				style={
					{
						"--ticker-board": b.board,
						"--ticker-edge": b.edge,
						"--ticker-ink": b.ink,
						"--ticker-live": accent,
					} as React.CSSProperties
				}
			>
				{/* the tape - one strip, content doubled for a seamless loop */}
				{params.tape && (
					<div className="ticker-strip" aria-hidden="true">
						<div className="ticker-track font-mono">
							{[0, 1].map((pass) => (
								<span key={pass} className="ticker-run">
									{TAPE_QUOTES.map((q, i) => {
										const up = q.deltaPct >= 0;
										return (
											<span
												key={`${pass}-${q.sym}`}
												className={`ticker-quote ticker-quote--${
													up ? "up" : "down"
												} ticker-quote--ph${i % 4}`}
											>
												<span className="ticker-sym">{q.sym}</span>
												<span
													className={`ticker-delta ${
														up ? "ticker-delta--up" : "ticker-delta--down"
													}`}
												>
													{up ? "▲" : "▼"} {fmtDelta(q.deltaPct)}%
												</span>
											</span>
										);
									})}
								</span>
							))}
						</div>
					</div>
				)}

				{/* listing row: heading as the board's listing + LIVE lamp */}
				<div className="ticker-head relative px-6 md:px-9 pt-6 flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
					<h2 className="ticker-label font-mono font-bold uppercase tracking-tight text-3xl md:text-5xl leading-none">
						{topic.heading}
					</h2>
					<span
						className="ticker-live inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.3em]"
						aria-hidden="true"
					>
						<span className="ticker-live-dot" />
						live
					</span>
				</div>

				{/* day-stats row - real BTC session numbers */}
				{STATS_QUOTE && (
					<div
						className="ticker-stats relative px-6 md:px-9 pt-2 font-mono text-[10px] uppercase tracking-[0.2em]"
						aria-hidden="true"
					>
						{STATS_QUOTE.sym.toLowerCase()} h {fmtLevel(STATS_QUOTE.high)} · l{" "}
						{fmtLevel(STATS_QUOTE.low)} · vol {fmtVol(STATS_QUOTE.volume)}
					</div>
				)}

				{/* the body sits clear on the board */}
				<div className="relative px-6 md:px-9 py-6">{children}</div>

				{/* as-of + exchange-hours line */}
				<div
					className="ticker-hours relative px-6 md:px-9 pb-4 font-mono text-[10px] uppercase tracking-[0.25em]"
					aria-hidden="true"
				>
					as of {TAPE_AS_OF} · xetra 09:00-17:30 · crypto 24/7
				</div>
			</div>
		</div>
	);
}
