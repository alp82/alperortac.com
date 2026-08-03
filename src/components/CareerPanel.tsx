import { useLayoutEffect, useRef, useState } from "react";
import { CAREER_TIMELINE } from "../data/career";
import { SubpageClose } from "./_layout/SubpageClose";

export const CAREER_PANEL_TITLE_ID = "career-panel-title";

/*
 * The "center spine" Work History subpage. Design locked in
 * .prototypes/career-subpage-lanes.html (variant B).
 *
 * Three lanes, none of them overlapping:
 *   1. A linear year axis on the far left. Ticks sit at true year positions
 *      and never move, so the scale stays honest.
 *   2. A trail lane down the middle of the remaining field. A gold dotted
 *      meander runs through it with a diamond waypoint per entry.
 *   3. Cards alternating left and right of the trail, anchored at their
 *      tenure midpoint.
 *
 * The earlier pass drew the trail ACROSS the axis, so dots collided with the
 * ticks and labels. Separating the lanes is the whole point of this layout.
 *
 * Waypoints sit at the TRUE year position and never move. Only the cards get
 * nudged: where tenures cluster (2019-2021) the proportional positions
 * overlap, so a top-down relax pass pushes them apart, one lane per side. A
 * dotted connector then links each waypoint to its card, so a nudged card
 * still reads against its real year. That keeps the trail a function of the
 * data, not of the layout.
 *
 * Card and axis geometry is pure CSS (see the calc() widths below), so SSR
 * renders the real layout. Only the trail, the connectors and the relax pass
 * are client-side, and all three no-op when clientWidth is 0.
 *
 * Below 1024px the alternating field collapses to one column right of the
 * rail, and the trail meanders in the gutter between them.
 */

const AXIS_TOP = 2026.6;
const AXIS_BOTTOM = 2004.4;
const AXIS_SPAN = AXIS_TOP - AXIS_BOTTOM;
const yPct = (yr: number) => ((AXIS_TOP - yr) / AXIS_SPAN) * 100;
const midYear = (e: { start: number; end: number }) => (e.start + e.end) / 2;

const MONO = '"VT323", "Courier New", monospace';
const GOLD = "251,191,36";

/* Below this width the two card columns collapse into one. Mirrors Tailwind's
   `lg:` prefix on the card and axis classes - keep the two in step. */
const SINGLE_COLUMN_MAX = 1023;

/* Axis lane width. Mirrors `w-[38px] lg:w-[66px]` on the axis element. */
const AXIS_W = { single: 38, split: 66 };
/* Pixels per year. Sets how much the relax pass has to nudge: higher means
   less drift off the tick and a longer page. */
const PPY = { single: 130, split: 92 };
const RELAX_GAP = { single: 16, split: 22 };

type Pt = [number, number];

// Catmull-Rom spline through the points -> cubic bezier path.
function smoothPath(pts: Pt[], tension = 1): string {
	const first = pts[0];
	if (!first) return "";
	let d = `M ${first[0]} ${first[1]}`;
	for (let i = 0; i < pts.length - 1; i++) {
		const p1 = pts[i];
		const p2 = pts[i + 1];
		if (!p1 || !p2) break;
		const p0 = pts[i - 1] ?? p1;
		const p3 = pts[i + 2] ?? p2;
		const c1x = p1[0] + ((p2[0] - p0[0]) / 6) * tension;
		const c1y = p1[1] + ((p2[1] - p0[1]) / 6) * tension;
		const c2x = p2[0] - ((p3[0] - p1[0]) / 6) * tension;
		const c2y = p2[1] - ((p3[1] - p1[1]) / 6) * tension;
		d += ` C ${c1x.toFixed(2)} ${c1y.toFixed(2)}, ${c2x.toFixed(2)} ${c2y.toFixed(2)}, ${p2[0].toFixed(2)} ${p2[1].toFixed(2)}`;
	}
	return d;
}

// Meander: a mirrored midpoint between consecutive stops makes the trail
// counter-swing past the lane centre, one continuous curve.
function meanderPath(pts: Pt[], cx: number, factor: number): string {
	const first = pts[0];
	if (!first) return "";
	const out: Pt[] = [first];
	for (let i = 1; i < pts.length; i++) {
		const prev = pts[i - 1];
		const cur = pts[i];
		if (!prev || !cur) break;
		if (i > 1 && i < pts.length - 1) {
			const mx = cx + (cx - (prev[0] + cur[0]) / 2) * factor;
			out.push([mx, (prev[1] + cur[1]) / 2]);
		}
		out.push(cur);
	}
	return smoothPath(out, 1);
}

// Walk a path and emit evenly spaced dots along it. The probe has to be in the
// live SVG for getTotalLength, so it is appended and removed again.
function sampleDots(
	svg: SVGSVGElement,
	d: string,
	{ r, gap, alpha }: { r: number; gap: number; alpha: number },
): string {
	const probe = document.createElementNS("http://www.w3.org/2000/svg", "path");
	probe.setAttribute("d", d);
	svg.appendChild(probe);
	if (typeof probe.getTotalLength !== "function") {
		probe.remove();
		return "";
	}
	const len = probe.getTotalLength();
	let out = "";
	for (let l = 0; l <= len; l += gap) {
		const p = probe.getPointAtLength(l);
		out += `<circle cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="${r}" fill="rgba(${GOLD},${alpha})"/>`;
	}
	probe.remove();
	return out;
}

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
		const half = rect.height / 2;
		const center = Math.max(
			rect.top - hostTop + half,
			(lanes[lane] ?? Number.NEGATIVE_INFINITY) + minGap + half,
		);
		item.style.top = `${center.toFixed(1)}px`;
		lanes[lane] = center + half;
		bottom = Math.max(bottom, center + half);
	}
	return bottom;
}

function drawTrail(host: HTMLElement, svg: SVGSVGElement, single: boolean) {
	const W = host.clientWidth;
	const H = host.clientHeight;
	const cards = Array.from(host.querySelectorAll<HTMLElement>("[data-card]"));
	const first = cards[0];
	if (!first) return;

	/* The trail lane is the empty channel the CSS already leaves between the
	   axis and the cards, so read it back off the layout instead of repeating
	   the calc() here. Split: the channel between the two card columns. */
	let lo: number;
	let hi: number;
	if (single) {
		lo = AXIS_W.single;
		hi = first.offsetLeft;
	} else {
		const left = cards.find((c) => c.dataset.card === "0");
		const right = cards.find((c) => c.dataset.card === "1");
		if (!left || !right) return;
		lo = left.offsetLeft + left.offsetWidth;
		hi = right.offsetLeft;
	}
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

	const pts: Pt[] = [[cx, 2], ...way, [cx, H - 2]];
	let out = sampleDots(svg, meanderPath(pts, cx, 0.6), {
		r: single ? 1.9 : 2.3,
		gap: single ? 11 : 14,
		alpha: 0.5,
	});

	// Connector from each waypoint to the edge of its card that faces the lane.
	const hostTop = host.getBoundingClientRect().top;
	cards.forEach((card, i) => {
		const stop = way[i];
		if (!stop) return;
		const rect = card.getBoundingClientRect();
		const cy = rect.top - hostTop + rect.height / 2;
		const facesRight = !single && card.dataset.card === "0";
		const ex = facesRight
			? card.offsetLeft + card.offsetWidth + 3
			: card.offsetLeft - 3;
		const midX = (stop[0] + ex) / 2;
		out += sampleDots(
			svg,
			`M ${stop[0].toFixed(2)} ${stop[1].toFixed(2)} C ${midX.toFixed(2)} ${stop[1].toFixed(2)}, ${midX.toFixed(2)} ${cy.toFixed(2)}, ${ex.toFixed(2)} ${cy.toFixed(2)}`,
			{ r: 1.5, gap: 8, alpha: 0.4 },
		);
	});

	// Waypoint diamonds last, so they sit on top of the dots.
	const k = single ? 4.5 : 6;
	for (const [x, y] of way) {
		out +=
			`<rect x="${(x - k).toFixed(1)}" y="${(y - k).toFixed(1)}" width="${k * 2}" height="${k * 2}" ` +
			`transform="rotate(45 ${x.toFixed(1)} ${y.toFixed(1)})" fill="#fbbf24" stroke="#0f172a" stroke-width="2"/>`;
	}
	svg.innerHTML = out;
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

		const key = single ? "single" : "split";
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
				return relaxCards(host, RELAX_GAP[key]);
			};
			host.style.height = `${Math.round(AXIS_SPAN * PPY[key])}px`;
			const bottom = place();
			if (bottom + 12 > host.clientHeight) {
				host.style.height = `${Math.ceil(bottom + 12)}px`;
				place();
			}
			drawTrail(host, svg, single);
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

					<div
						ref={hostRef}
						className="relative"
						style={{ height: Math.round(AXIS_SPAN * PPY.split) }}
					>
						{/* year axis - ticks stay at true year positions */}
						<div className="absolute left-0 top-0 bottom-0 w-[38px] lg:w-[66px] border-r border-[rgba(148,180,220,0.22)]">
							{years.map((yr) => {
								const major = CAREER_TIMELINE.some((e) => e.start === yr);
								return (
									<span key={yr}>
										<span
											className={`absolute right-0 h-px ${major ? "w-[12px] lg:w-[15px] bg-[rgba(251,191,36,0.6)]" : "w-[6px] lg:w-[7px] bg-[rgba(148,180,220,0.3)]"}`}
											style={{ top: `${yPct(yr).toFixed(2)}%` }}
										/>
										{(major || yr === 2026) && (
											<span
												className="absolute -translate-y-1/2 right-[10px] lg:right-[22px] text-[13px] lg:text-[17px] leading-none text-[#9fb4cd]"
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
							className="absolute inset-0 w-full h-full pointer-events-none"
						/>

						<ol className="absolute inset-0 list-none m-0 p-0">
							{CAREER_TIMELINE.map((entry, i) => {
								const top = yPct(midYear(entry)).toFixed(2);
								/* One column below lg, alternating above. Both keep the
								   86px offset, so only the split changes at the break. */
								const side =
									i % 2
										? "left-[86px] w-[calc(100%-86px)] lg:left-[calc(50%+96px)] lg:w-[calc(50%-96px)]"
										: "left-[86px] w-[calc(100%-86px)] lg:w-[calc(50%-96px)]";
								return (
									<li
										key={`${entry.year}-${entry.company}`}
										data-trail-stop={top}
										className="absolute left-0 right-0"
										style={{ top: `${top}%` }}
									>
										<div
											data-card={i % 2 ? "1" : "0"}
											className={`absolute -translate-y-1/2 bg-white/5 border-4 border-white/15 shadow-[6px_6px_0_0_rgba(255,255,255,0.12)] px-5 pt-[18px] pb-[14px] ${side}`}
										>
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
