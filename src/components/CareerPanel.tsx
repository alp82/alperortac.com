import { useLayoutEffect, useRef, useState } from "react";
import { CAREER_TIMELINE } from "../data/career";
import { SubpageClose } from "./_layout/SubpageClose";

export const CAREER_PANEL_TITLE_ID = "career-panel-title";

/*
 * The "center spine" Work History subpage. Split layout locked in
 * .prototypes/career-subpage-lanes.html (variant B), mobile layout locked in
 * .prototypes/career-mobile-proportion.html (variant B, tenure gauge).
 *
 * Split (lg and up) - three lanes, none of them overlapping:
 *   1. A linear year axis on the far left. Ticks sit at true year positions
 *      and never move, so the scale stays honest.
 *   2. A trail lane down the middle of the remaining field. A gold diamond
 *      waypoint per entry sits in it - no connecting line between them.
 *   3. Cards alternating left and right of the trail. Each card spans its
 *      true tenure band: the top edge sits at the tenure end year and the
 *      min-height is proportional to the years worked, so a long stint gets
 *      a tall box. Content wins when a short stint cannot fit its text.
 *
 * Waypoints sit at the TRUE year position and never move. Only the cards get
 * nudged: where tenures cluster (2019-2021) the proportional bands
 * overlap, so a top-down relax pass pushes them apart, one lane per side.
 * That keeps the waypoints a function of the data, not of the layout.
 *
 * Below lg the proportional bands cannot work: one column, and the shortest
 * tenure's content is taller than its band, so relaxing detaches every card
 * from the axis anyway. Instead the cards stack in normal flow and the
 * proportion moves into a gold tenure gauge on each card's left edge, drawn
 * at a fixed pixel-per-year scale with one notch per year. The gauge renders
 * on the split cards too, so both layouts carry the same honest measure.
 *
 * Card and axis geometry is pure CSS (see the calc() widths below), so SSR
 * renders the real layout. Only the trail, the connectors and the relax pass
 * are client-side, and all three run in split mode only.
 */

const AXIS_TOP = 2026.6;
const AXIS_BOTTOM = 2004.4;
const AXIS_SPAN = AXIS_TOP - AXIS_BOTTOM;
const yPct = (yr: number) => ((AXIS_TOP - yr) / AXIS_SPAN) * 100;
const midYear = (e: { start: number; end: number }) => (e.start + e.end) / 2;

const MONO = '"VT323", "Courier New", monospace';
const GOLD = "251,191,36";

/* Below this width the timeline collapses to the flowed gauge stack. Mirrors
   Tailwind's `lg:` prefix on the layout classes - keep the two in step. */
const SINGLE_COLUMN_MAX = 1023;

/* Pixels per year on the split axis. Sets how much the relax pass has to
   nudge: higher means less drift off the tick and a longer page. The host's
   `lg:h-[2042px]` class is Math.round(AXIS_SPAN * PPY) - keep them in step. */
const PPY = 92;
const RELAX_GAP = 22;

/* Pixels per year on the tenure gauge. The split layout has taller cards, so
   it runs at double scale. */
const GAUGE_PPY = 17;
const GAUGE_PPY_LG = GAUGE_PPY * 2;

type Pt = [number, number];

/*
 * Push overlapping cards apart, top-down, one lane per side - a left card and
 * a right card never collide, so they relax independently. Tops end up in px
 * rather than percent: a percent top would shift again if the host grows
 * below, which would leave the connectors pointing at nothing. Returns the
 * bottom edge of the lowest card so the host can grow to fit.
 */
function relaxCards(host: HTMLElement, minGap: number): number {
	const hostTop = host.getBoundingClientRect().top;
	const lanes = [Number.NEGATIVE_INFINITY, Number.NEGATIVE_INFINITY];
	let bottom = Number.NEGATIVE_INFINITY;
	for (const item of host.querySelectorAll<HTMLElement>("[data-trail-stop]")) {
		const card = item.firstElementChild as HTMLElement | null;
		if (!card) continue;
		const lane = card.dataset.card === "1" ? 1 : 0;
		const rect = card.getBoundingClientRect();
		const top = Math.max(
			rect.top - hostTop,
			(lanes[lane] ?? Number.NEGATIVE_INFINITY) + minGap,
		);
		item.style.top = `${top.toFixed(1)}px`;
		lanes[lane] = top + rect.height;
		bottom = Math.max(bottom, top + rect.height);
	}
	return bottom;
}

function drawTrail(host: HTMLElement, svg: SVGSVGElement) {
	const W = host.clientWidth;
	const H = host.clientHeight;
	const cards = Array.from(host.querySelectorAll<HTMLElement>("[data-card]"));

	/* The trail lane is the empty channel the CSS already leaves between the
	   two card columns, so read it back off the layout instead of repeating
	   the calc() here. */
	const left = cards.find((c) => c.dataset.card === "0");
	const right = cards.find((c) => c.dataset.card === "1");
	if (!left || !right) return;
	const lo = left.offsetLeft + left.offsetWidth;
	const hi = right.offsetLeft;
	const cx = (lo + hi) / 2;
	const swing = (hi - lo) * 0.22;

	// Waypoints stay on the true year position. Even entries lean left, odd
	// entries lean right, each toward the card it belongs to.
	const way: Pt[] = CAREER_TIMELINE.map((entry, i) => [
		i % 2 ? cx + swing : cx - swing,
		(yPct(midYear(entry)) / 100) * H,
	]);

	svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
	svg.innerHTML = "";

	let out = "";
	const k = 6;
	for (const [x, y] of way) {
		out +=
			`<rect x="${(x - k).toFixed(1)}" y="${(y - k).toFixed(1)}" width="${k * 2}" height="${k * 2}" ` +
			`transform="rotate(45 ${x.toFixed(1)} ${y.toFixed(1)})" fill="#fbbf24" stroke="#0f172a" stroke-width="2"/>`;
	}
	svg.innerHTML = out;
}

/* The gold tenure gauge: a fill at GAUGE_PPY on a faint rail, one dark notch
   per full year. The split cards are proportional bands with room to spare,
   so the fill doubles there (GAUGE_PPY_LG). Inline px cannot respond to a
   breakpoint, so each scale renders its own fill and notch set and Tailwind
   shows one of them. Purely decorative - the years already read as text. */
function TenureGauge({ start, end }: { start: number; end: number }) {
	const years = end - start;
	const notches: number[] = [];
	for (let k = 1; k < Math.floor(years); k++) notches.push(k);
	const fill =
		"absolute left-[7px] top-1 w-[8px] bg-[#fbbf24] shadow-[0_0_10px_rgba(251,191,36,0.35)]";
	const notch = "absolute left-[7px] w-[8px] h-px bg-slate-900";
	return (
		<div aria-hidden="true" className="relative w-[26px] shrink-0">
			<span className="absolute left-[10px] top-1 bottom-1 w-[2px] bg-[rgba(148,180,220,0.15)]" />
			<span
				className={`${fill} lg:hidden`}
				style={{ height: `${(years * GAUGE_PPY).toFixed(1)}px` }}
			/>
			<span
				className={`${fill} hidden lg:block`}
				style={{ height: `${(years * GAUGE_PPY_LG).toFixed(1)}px` }}
			/>
			{notches.map((k) => (
				<span key={k}>
					<span
						className={`${notch} lg:hidden`}
						style={{ top: `${4 + k * GAUGE_PPY}px` }}
					/>
					<span
						className={`${notch} hidden lg:block`}
						style={{ top: `${4 + k * GAUGE_PPY_LG}px` }}
					/>
				</span>
			))}
		</div>
	);
}

type CareerPanelProps = {
	onClose: () => void;
};

export function CareerPanel({ onClose }: CareerPanelProps) {
	const hostRef = useRef<HTMLDivElement>(null);
	const svgRef = useRef<SVGSVGElement>(null);
	const [single, setSingle] = useState(false);

	useLayoutEffect(() => {
		if (typeof window.matchMedia !== "function") return;
		const mq = window.matchMedia(`(max-width: ${SINGLE_COLUMN_MAX}px)`);
		const apply = () => setSingle(mq.matches);
		apply();
		mq.addEventListener("change", apply);
		return () => mq.removeEventListener("change", apply);
	}, []);

	useLayoutEffect(() => {
		const host = hostRef.current;
		const svg = svgRef.current;
		if (!host || !svg) return;

		if (single) {
			/* Flow layout: the cards stack in document order, so drop every px
			   the split pass may have left behind and draw nothing. */
			host.style.height = "";
			svg.innerHTML = "";
			for (const item of host.querySelectorAll<HTMLElement>(
				"[data-trail-stop]",
			)) {
				item.style.top = "";
			}
			return;
		}

		let cancelled = false;
		let lastWidth = 0;

		const layout = () => {
			/* The panel lives in a <dialog> that stays mounted while closed, and
			   a closed dialog is display:none. So the mount-time pass usually
			   measures a zero-width box. Bail here and let the ResizeObserver
			   below pick the layout up the moment the dialog is shown. */
			if (cancelled || host.clientWidth === 0) return;
			lastWidth = host.clientWidth;

			// Reset every card to its true year position, then relax. Run the
			// pass again if the host had to grow, so the second measure sees
			// the final height.
			const place = () => {
				for (const item of host.querySelectorAll<HTMLElement>(
					"[data-trail-stop]",
				)) {
					item.style.top = `${item.dataset.trailStop}%`;
				}
				return relaxCards(host, RELAX_GAP);
			};
			host.style.height = `${Math.round(AXIS_SPAN * PPY)}px`;
			const bottom = place();
			if (bottom + 12 > host.clientHeight) {
				host.style.height = `${Math.ceil(bottom + 12)}px`;
				place();
			}
			drawTrail(host, svg);
		};

		let raf = 0;
		const schedule = () => {
			if (cancelled) return;
			cancelAnimationFrame(raf);
			raf = requestAnimationFrame(layout);
		};

		layout();

		/* Width is the only thing allowed to re-trigger this. layout() sets the
		   host height itself, so reacting to height would loop forever. */
		const observer =
			typeof ResizeObserver === "function"
				? new ResizeObserver(() => {
						if (host.clientWidth !== lastWidth) schedule();
					})
				: null;
		observer?.observe(host);

		// Webfonts land after the first measure and change every card height.
		document.fonts?.ready?.then(schedule);

		window.addEventListener("resize", schedule);
		return () => {
			cancelled = true;
			cancelAnimationFrame(raf);
			observer?.disconnect();
			window.removeEventListener("resize", schedule);
		};
	}, [single]);

	const years: number[] = [];
	for (let yr = 2005; yr <= 2026; yr++) years.push(yr);

	return (
		<>
			<SubpageClose onClose={onClose} />
			<div className="subpage-column relative w-full max-w-[1140px] mx-auto my-[8vh] text-slate-100">
				<div className="px-4 sm:px-10 pt-12 pb-16">
					<header className="mb-10 lg:mb-14">
						<p
							className="text-[19px] leading-none tracking-[0.28em] uppercase mb-3"
							style={{ fontFamily: MONO, color: `rgb(${GOLD})` }}
						>
							2005 - today
						</p>
						<h2
							id={CAREER_PANEL_TITLE_ID}
							className="text-5xl md:text-7xl font-black uppercase tracking-tighter leading-[0.9]"
						>
							Work
							<br />
							History
						</h2>
						<p className="text-sm opacity-70 mt-5 max-w-[46ch] leading-relaxed">
							A short trail of where I have been employed.
						</p>
					</header>

					<div ref={hostRef} className="relative lg:h-[2042px]">
						{/* year axis - ticks stay at true year positions, split only */}
						<div className="hidden lg:block absolute left-0 top-0 bottom-0 w-[66px] border-r border-[rgba(148,180,220,0.22)]">
							{years.map((yr) => {
								const major = CAREER_TIMELINE.some((e) => e.start === yr);
								return (
									<span key={yr}>
										<span
											className={`absolute right-0 h-px ${major ? "w-[15px] bg-[rgba(251,191,36,0.6)]" : "w-[7px] bg-[rgba(148,180,220,0.3)]"}`}
											style={{ top: `${yPct(yr).toFixed(2)}%` }}
										/>
										{(major || yr === 2026) && (
											<span
												className="absolute -translate-y-1/2 right-[22px] text-[17px] leading-none text-[#9fb4cd]"
												style={{
													top: `${yPct(yr).toFixed(2)}%`,
													fontFamily: MONO,
												}}
											>
												{yr}
											</span>
										)}
									</span>
								);
							})}
						</div>

						{/* trail - drawn client-side down the lane between the columns */}
						<svg
							ref={svgRef}
							aria-hidden="true"
							className="hidden lg:block absolute inset-0 w-full h-full pointer-events-none"
						/>

						<ol className="lg:absolute lg:inset-0 list-none m-0 p-0">
							{CAREER_TIMELINE.map((entry, i) => {
								/* Split: the band spans the true tenure - top edge at the
								   end year, height proportional to the years worked. Flow
								   ignores both (static position, auto-height parent). */
								const top = yPct(entry.end).toFixed(2);
								const band = (
									((entry.end - entry.start) / AXIS_SPAN) *
									100
								).toFixed(2);
								const side =
									i % 2
										? "lg:left-[calc(50%+96px)] lg:w-[calc(50%-96px)]"
										: "lg:left-[86px] lg:w-[calc(50%-96px)]";
								const tenure = Math.round((entry.end - entry.start) * 10) / 10;
								return (
									<li
										key={`${entry.year}-${entry.company}`}
										data-trail-stop={top}
										className="mb-7 last:mb-0 lg:mb-0 lg:absolute lg:left-0 lg:right-0"
										style={{ top: `${top}%`, height: `${band}%` }}
									>
										<div
											data-card={i % 2 ? "1" : "0"}
											className={`flex items-stretch lg:absolute lg:top-0 lg:min-h-full ${side}`}
										>
											<TenureGauge start={entry.start} end={entry.end} />
											<div className="flex-1 min-w-0 flex flex-col">
												<div className="flex-1 bg-white/5 border-4 border-white/15 shadow-[6px_6px_0_0_rgba(255,255,255,0.12)] px-5 pt-[18px] pb-[14px]">
													<div
														className="text-xl leading-none tracking-[0.06em] mb-2"
														style={{ fontFamily: MONO, color: `rgb(${GOLD})` }}
													>
														{entry.year}
													</div>
													<div className="text-2xl font-black uppercase leading-none tracking-tight mb-1.5">
														{entry.role}
													</div>
													<div className="text-[11.5px] font-bold uppercase tracking-[0.13em] opacity-70 mb-2.5">
														{entry.company}
													</div>
													<p className="text-sm leading-relaxed mb-2">
														{entry.desc}
													</p>
													{entry.highlight && (
														<p className="font-['Instrument_Serif'] italic text-base leading-snug opacity-85 mb-3">
															{entry.highlight.story}
														</p>
													)}
													<ul className="flex flex-wrap gap-1.5 list-none m-0 p-0">
														{entry.stack.map((tech) => (
															<li
																key={tech}
																className="text-[10px] font-black uppercase tracking-wider px-2 py-1 bg-slate-900 text-slate-100 border-2 border-white/20"
															>
																{tech}
															</li>
														))}
													</ul>
												</div>
												<div
													className="mt-2 text-[14px] leading-none"
													style={{
														fontFamily: MONO,
														color: `rgba(${GOLD},0.9)`,
													}}
												>
													{tenure} {tenure === 1 ? "yr" : "yrs"} &#9670;
												</div>
											</div>
										</div>
									</li>
								);
							})}
						</ol>
					</div>
				</div>
			</div>
		</>
	);
}
