import { useCallback, useRef, useState } from "react";
import {
	ageInYear,
	CODING_RAILS,
	CODING_STOP_YEARS,
	CODING_STOPS,
	CODING_Y0,
	CODING_Y1,
	CODING_YEARS,
	type CodingStop,
	type CodingUnit,
	stopIndexAt,
	type ToolGroup,
	unitCountsAt,
	unitStateAt,
	unitYears,
} from "../data/coding";
import type { Story } from "../data/stories";
import { SubpageClose } from "./_layout/SubpageClose";
import { toolIcon } from "./codingIcons";
import { useIsomorphicLayoutEffect } from "./useIsomorphicLayoutEffect";

export const getStoryPanelTitleId = (slug: string) => `story-${slug}-title`;

/*
 * The coding subpage. Design locked in .prototypes/coding-subpage-years.html
 * (iteration 8). Data and prose sources: src/data/coding.ts.
 *
 * TWO MECHANICS, ONE PER BREAKPOINT. They are not the same thing:
 *
 * DESKTOP is a plain linear timeline. Every card sits at its own year on the
 * axis and scrolls with the page, one to one. No strip, no mask, no drift - the
 * card at a year IS the entry for that year. The step stays TIGHT, because a
 * step tall enough to clear every one-year pair would spend most of the page on
 * empty years. The few cards a one-year gap cannot hold are nudged down, with a
 * dotted connector back to their tick. The TICK never moves, so the axis stays
 * an honest linear scale - the same rule the career subpage follows.
 *
 * PHONE keeps a drifting strip, because one screen has no room to place
 * seventeen cards. All cards live in ONE CONTINUOUS STRIP pinned to the
 * viewport. The strip slides as you scroll, and the layer holding it carries a
 * soft mask, so a card fades out through the top as the next rises through the
 * bottom. The fade is a function of WHERE a card is, never of when something
 * happened, so there is nothing to time and nothing to sequence.
 *
 * Speed comes out of the data. The strip is anchored so card k is exactly
 * centred when the scroll reaches year k on the axis, and it eases between
 * anchors. A four-year gap crawls, a one-year gap hurries.
 *
 * The rack is the second half of the page: it shows what was running in the
 * year you are standing in. Side column on desktop, bottom sheet on the phone.
 *
 * The rack card carries the Tech Stack hardware chrome inherited from the
 * retired main-page band: the "Tech Stack" label with the pwr/net/dsk LED
 * strip in the head, tech icons on every rail, and a thin ethernet-ports
 * footer with two patched cables. Delicate-strip treatment locked in
 * .prototypes/coding-subpage-rack-chrome.html (variant C).
 */

/** The head LED strip: pwr steady green, net blinking gold, dsk dim - fixed
 * hardware chrome, same order as the retired server-rack band frame. */
const RACK_LEDS = ["pwr", "net", "dsk"] as const;

/** The ports footer: 6 RJ45 jacks, two patched (gold + green cables) - fixed
 * positions by design. */
const RACK_PORTS: readonly ("net" | "green" | null)[] = [
	null,
	"net",
	null,
	null,
	"green",
	null,
];

/* Pixels per year. The two mechanics take separate steps - see the note above. */
const PPY_DESKTOP = 150;
const PPY_PHONE = 260;
/* Space between two cards on the phone strip. */
const STRIP_GAP = 110;
/* How much of the phone window each fade takes, top and bottom. */
const MASK_PCT = 34;
/* Breathing room under a desktop card before the next year's card may start. */
const DESK_GAP = 34;
/* The phone window is everything above the rack sheet. */
const WINDOW_FRAC = 0.66;
/* The desktop reading line - it only decides which year is current. */
const DESK_READ_FRAC = 0.38;
/* Below this width the page switches to the phone mechanic. Mirrors the
   `.coding-mobile` styles in styles.css - keep the two in step. */
const MOBILE_MAX = 900;
/* Sheet height is clamped to this band, as a percentage of the surface. */
const SHEET_MIN_PCT = 16;
const SHEET_MAX_PCT = 48;

/* Which bay each group sits in on the phone sheet. Fixed, never rebalanced per
   year, so a group does not jump columns as the rack fills. */
const BAYS: readonly (readonly ToolGroup[])[] = [
	["language", "markup", "framework"],
	["data", "infra", "elsewhere"],
];

const clamp01 = (x: number) => (x < 0 ? 0 : x > 1 ? 1 : x);
const smooth = (x: number) => x * x * (3 - 2 * x);

function StopBody({ stop }: { stop: CodingStop }) {
	const changes = stop.rack.length + stop.dark.length;
	return (
		<>
			<span className="sr-only">
				{stop.year}, age {ageInYear(stop.year)}
			</span>
			<span className="coding-age" aria-hidden="true">
				age {ageInYear(stop.year)}
			</span>
			<div className="coding-cap">{stop.cap}</div>
			{stop.beats.map((beat) => (
				<p key={beat} className="coding-beat">
					{beat}
				</p>
			))}
			{stop.op && <p className="coding-op">{stop.op}</p>}
			{changes > 0 && (
				<div className="coding-change">
					{stop.rack.map((name) => (
						<span key={name} className="coding-tag coding-tag-racked">
							racked {name}
						</span>
					))}
					{stop.dark.map((name) => (
						<span key={name} className="coding-tag coding-tag-gone">
							{name} went dark
						</span>
					))}
				</div>
			)}
		</>
	);
}

function unitRowClass(unit: CodingUnit, year: number) {
	const state = unitStateAt(unit, year);
	const just = unit.from === year || unit.to === year;
	return `coding-unit coding-unit-${state}${just ? " coding-unit-just" : ""}`;
}

function Rail({
	group,
	units,
	year,
}: {
	group: ToolGroup;
	units: CodingUnit[];
	year: number;
}) {
	const live = units.some((u) => unitStateAt(u, year) === "live");
	const dark = units.some((u) => unitStateAt(u, year) === "dark");
	if (!live && !dark) return null;
	return (
		<div className={`coding-grp${live ? "" : " coding-grp-nolive"}`}>
			<h4>{group}</h4>
			<ul className="coding-rails">
				{units.map((unit) => {
					const state = unitStateAt(unit, year);
					if (state === "empty") return null;
					const Icon = toolIcon(unit.name);
					return (
						<li key={unit.name} className={unitRowClass(unit, year)}>
							<span className="coding-ico" aria-hidden="true">
								<Icon className="coding-ico-svg" />
							</span>
							<span className="coding-nm">{unit.name}</span>
							<span className="coding-yrs">{unitYears(unit)}</span>
							<span className="sr-only">
								{state === "live" ? "running" : "dark"}
							</span>
						</li>
					);
				})}
			</ul>
		</div>
	);
}

function Rails({
	year,
	groups,
}: {
	year: number;
	groups?: readonly ToolGroup[];
}) {
	return (
		<>
			{CODING_RAILS.filter(
				(rail) => !groups || groups.includes(rail.group),
			).map((rail) => (
				<Rail
					key={rail.group}
					group={rail.group}
					units={rail.units}
					year={year}
				/>
			))}
		</>
	);
}

type CodingLadderPanelProps = {
	story: Story;
	onClose: () => void;
};

export function CodingLadderPanel({ story, onClose }: CodingLadderPanelProps) {
	const hostRef = useRef<HTMLDivElement>(null);
	const fieldRef = useRef<HTMLDivElement>(null);
	const laneRef = useRef<HTMLOListElement>(null);
	const connRef = useRef<HTMLDivElement>(null);
	const proseWrapRef = useRef<HTMLDivElement>(null);
	const windowRef = useRef<HTMLDivElement>(null);
	const stripRef = useRef<HTMLDivElement>(null);
	const sheetRef = useRef<HTMLDivElement>(null);
	const sheetHeadRef = useRef<HTMLDivElement>(null);
	const sheetFitRef = useRef<HTMLDivElement>(null);

	const [mobile, setMobile] = useState(false);
	const [year, setYear] = useState(CODING_Y0);
	const [hideDark, setHideDark] = useState(true);

	const ppy = mobile ? PPY_PHONE : PPY_DESKTOP;
	const yearTop = useCallback((y: number) => (y - CODING_Y0) * ppy, [ppy]);

	useIsomorphicLayoutEffect(() => {
		if (typeof window.matchMedia !== "function") return;
		const mq = window.matchMedia(`(max-width: ${MOBILE_MAX}px)`);
		const apply = () => setMobile(mq.matches);
		apply();
		mq.addEventListener("change", apply);
		return () => mq.removeEventListener("change", apply);
	}, []);

	/* ------------------------------------------------------------------ *
	 * Layout + scroll. One effect per breakpoint, torn down on the flip.
	 * ------------------------------------------------------------------ */
	useIsomorphicLayoutEffect(() => {
		const host = hostRef.current;
		const field = fieldRef.current;
		if (!host || !field) return;
		/* The panel lives in a <dialog class="panel-surface">, and that dialog is
		   the page's scroll container while a subpage is open. Without it there
		   is nothing to read a scroll position off, so the page renders as a
		   plain document and the mechanics stay inert. */
		const surface = host.closest<HTMLElement>(".panel-surface");
		if (!surface) return;

		let cancelled = false;
		let lastWidth = 0;
		let centers: number[] = [];
		let leadIn = 0;
		let firstH = 0;
		/* Geometry CACHED by layout(). The scroll handler runs every frame, and a
		   rect read there lands right after the strip transform write - a forced
		   reflow per frame, which is what made the page lag. The handler must read
		   nothing from the DOM except surface.scrollTop. */
		let surfaceH = 0;
		let fieldOff = 0;
		/* Mirrors the `year` state so the handler does not enter React per frame. */
		let shownYear = Number.NaN;

		const winH = () => Math.round(surfaceH * WINDOW_FRAC);
		const readPx = () =>
			mobile ? Math.round(winH() / 2) : Math.round(surfaceH * DESK_READ_FRAC);
		const scrollLine = () => surface.scrollTop + readPx() - fieldOff;

		const stopTops = CODING_STOPS.map((stop) => (stop.year - CODING_Y0) * ppy);
		const stopTop = (i: number) => stopTops[i] ?? 0;

		/*
		 * Where the first card's CENTRE sits, in viewport pixels, when the page is
		 * scrolled all the way up: just below the heading, clamped so it always
		 * fits above the rack sheet.
		 */
		const restTop = () => {
			const headBottom = fieldOff - leadIn;
			const want = headBottom + 22 + firstH / 2;
			return Math.min(want, winH() - firstH / 2 - 12);
		};

		/*
		 * The strip position for a scroll line. Card k sits exactly on the reading
		 * line when the scroll reaches year k, and the strip eases in between - so
		 * the speed between two cards is their strip distance over their scroll
		 * distance, and the length of the period is what sets it.
		 */
		const stripPosAt = (line: number): number => {
			const n = CODING_STOPS.length;
			const firstC = centers[0] ?? 0;
			const lastC = centers[n - 1] ?? 0;
			/* THE LEAD-IN SEGMENT. Above the first year the page is still showing
			   its heading, so the first card does not sit on the reading line. It
			   sits just under the heading and rises to the line as the heading
			   leaves. Park it on the line instead and the top of the page has no
			   card on it at all. */
			if (line <= stopTop(0)) {
				const line0 = readPx() - fieldOff;
				const from = firstC + readPx() - restTop();
				if (line <= line0) return from;
				const t = smooth(clamp01((line - line0) / (stopTop(0) - line0)));
				return from + t * (firstC - from);
			}
			if (line >= stopTop(n - 1)) return lastC;
			let k = 0;
			for (let i = 0; i < n; i++) if (stopTop(i) <= line) k = i;
			const a = stopTop(k);
			const b = stopTop(k + 1);
			const e = smooth(clamp01((line - a) / (b - a)));
			const ca = centers[k] ?? 0;
			const cb = centers[k + 1] ?? ca;
			return ca + e * (cb - ca);
		};

		const updateStrip = () => {
			const strip = stripRef.current;
			if (!mobile || !strip || centers.length === 0) return;
			const pos = stripPosAt(scrollLine());
			strip.style.transform = `translate3d(0,${(readPx() - pos).toFixed(1)}px,0)`;
		};

		const yearAtScroll = () => {
			const line = scrollLine();
			let y = CODING_Y0;
			for (const candidate of CODING_YEARS) {
				if ((candidate - CODING_Y0) * ppy <= line) y = candidate;
			}
			return y;
		};

		/* setState only when the year flips - not once per frame. */
		const applyYear = () => {
			const y = yearAtScroll();
			if (y === shownYear) return;
			shownYear = y;
			setYear(y);
		};

		const layout = () => {
			/* A closed dialog is display:none, so the mount-time pass usually
			   measures a zero-width box. Bail and let the ResizeObserver pick the
			   layout up the moment the dialog is shown. */
			if (cancelled || host.clientWidth === 0) return;
			lastWidth = host.clientWidth;
			surfaceH = surface.clientHeight;

			let lastBottom = 0;

			/* ---- desktop card placement, with a relax pass ---------------------
			   Every card starts at its true year. Where a one-year gap cannot hold
			   the card above it, only the LOWER card is nudged down, and a dotted
			   connector ties it back to its tick. Ticks never move, so the axis
			   stays an honest linear scale and the page does not have to be sized
			   by its worst pair. */
			const cards = Array.from(
				laneRef.current?.children ?? [],
			) as HTMLElement[];
			const conns = Array.from(
				connRef.current?.children ?? [],
			) as HTMLElement[];
			if (!mobile && cards.length > 0) {
				for (const card of cards) card.style.top = "0px";
				const heights = cards.map((c) => c.getBoundingClientRect().height);
				let cursor = Number.NEGATIVE_INFINITY;
				CODING_STOPS.forEach((stop, i) => {
					const card = cards[i];
					const conn = conns[i];
					if (!card) return;
					const want = (stop.year - CODING_Y0) * ppy;
					const got = Math.max(want, cursor);
					card.style.top = `${got}px`;
					const drift = Math.round(got - want);
					if (conn) {
						if (drift > 4) {
							conn.style.display = "block";
							conn.style.top = `${want}px`;
							conn.style.height = `${drift}px`;
						} else {
							conn.style.display = "none";
						}
					}
					cursor = got + (heights[i] ?? 0) + DESK_GAP;
					lastBottom = cursor;
				});
			}

			if (mobile) {
				/* The window takes its horizontal geometry from a zero-height marker
				   inside the field, so the strip lines up with the axis without
				   repeating the field's own offsets here. */
				const win = windowRef.current;
				const strip = stripRef.current;
				const marker = proseWrapRef.current;
				if (win && strip && marker) {
					const m = marker.getBoundingClientRect();
					win.style.left = `${m.left}px`;
					win.style.width = `${m.width}px`;
					win.style.height = `${winH()}px`;

					/* Measure the strip AFTER the width is in place. A card's CENTRE
					   is what gets anchored - that is what stops the strip reading
					   bottom-heavy, with every card dangling below the line. */
					const kids = Array.from(strip.children) as HTMLElement[];
					centers = kids.map((el) => el.offsetTop + el.offsetHeight / 2);

					/* LEAD-IN. The strip is pinned to the viewport, so without this
					   the first card floats over the heading. Only the FIRST card can
					   ever collide with it, so half of that card is the whole
					   requirement. */
					firstH = kids[0]?.offsetHeight ?? 0;
					leadIn = Math.round(firstH / 2 + 26);
				}
			} else {
				/* Desktop cards live in the scroll flow, so nothing can reach the
				   heading and no lead-in is needed. */
				leadIn = 0;
				firstH = 0;
				centers = [];
			}
			field.style.marginTop = `${leadIn}px`;
			/* Measure AFTER the margin is in place - the margin moves the field.
			   This is the one rect read, and it happens per layout, not per frame. */
			fieldOff =
				field.getBoundingClientRect().top -
				surface.getBoundingClientRect().top +
				surface.scrollTop;

			const last = (CODING_Y1 - CODING_Y0) * ppy;
			const tail = Math.max(surfaceH - readPx(), 320);
			/* A nudged last card can end below its own tick, so the page has to
			   reach it. */
			field.style.height = `${Math.max(last, lastBottom) + tail}px`;

			updateStrip();
			applyYear();
		};

		let raf = 0;
		const schedule = () => {
			if (cancelled) return;
			cancelAnimationFrame(raf);
			raf = requestAnimationFrame(layout);
		};

		layout();

		let queued = false;
		const onScroll = () => {
			if (queued) return;
			queued = true;
			requestAnimationFrame(() => {
				queued = false;
				if (cancelled) return;
				updateStrip();
				applyYear();
			});
		};
		surface.addEventListener("scroll", onScroll, { passive: true });

		/* Width is the only thing allowed to re-trigger the layout. layout() sets
		   the field height itself, so reacting to height would loop forever. */
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
			surface.removeEventListener("scroll", onScroll);
			window.removeEventListener("resize", schedule);
		};
	}, [mobile, ppy]);

	/*
	 * THE SHEET GROWS WITH THE RACK. At 2026 the rack holds every running unit,
	 * which is more rows than a fixed sheet shows, and the last stop then needed
	 * an internal scroll. The sheet height follows the row count instead, so the
	 * early years give the prose more room and the final years get the height
	 * they need. The reading line does NOT move with it: the window stays a fixed
	 * fraction of the surface and a card simply slides under the sheet, which is
	 * already inside the bottom fade. That keeps the year at the reading line
	 * independent of the rack, so the two cannot chase each other.
	 *
	 * MEASURE, do not estimate. Counting rows and multiplying by a row height
	 * runs short - group headings, their margins and the padding are not
	 * row-sized - and a few pixels short is still a scrollbar. Measure the inner
	 * block, never the scroll container: a scroll container's scrollHeight cannot
	 * report less than its own height, which would make the sheet a one-way
	 * ratchet that grows and never shrinks again.
	 */
	useIsomorphicLayoutEffect(() => {
		const sheet = sheetRef.current;
		const head = sheetHeadRef.current;
		const fit = sheetFitRef.current;
		const host = hostRef.current;
		if (!mobile || !sheet || !head || !fit || !host) return;
		const surface = host.closest<HTMLElement>(".panel-surface");
		const surfaceH = surface?.clientHeight ?? window.innerHeight;
		if (surfaceH === 0) return;
		const px = head.offsetHeight + fit.offsetHeight + 3;
		const pct = Math.max(
			SHEET_MIN_PCT,
			Math.min(SHEET_MAX_PCT, (px / surfaceH) * 100),
		);
		sheet.style.height = `${pct.toFixed(2)}%`;
	}, [mobile, year, hideDark]);

	const counts = unitCountsAt(year);
	const activeStop = stopIndexAt(year);

	return (
		<>
			<SubpageClose onClose={onClose} />
			<div
				ref={hostRef}
				className={`coding-panel${mobile ? " coding-mobile" : ""}`}
				style={
					{
						/* The two walked phone settings. Written from here so the
						   constants above stay the single source for them. */
						"--coding-card-gap": `${STRIP_GAP}px`,
						"--coding-mask-1": `${MASK_PCT}%`,
						"--coding-mask-2": `${100 - MASK_PCT}%`,
					} as React.CSSProperties
				}
			>
				<div className="subpage-column coding-column">
					<div className="coding-inner">
						<header className="coding-head">
							<p className="coding-kicker">Coding</p>
							<h2
								id={getStoryPanelTitleId(story.slug)}
								className="coding-title"
							>
								Everything
								<br />I have run
							</h2>
							<p className="coding-sub">
								Three decades of tools, one year at a time. The rack shows what
								was running in the year you are standing in.
							</p>
						</header>

						<div className="coding-shell">
							<div ref={fieldRef} className="coding-field">
								<div className="coding-axis" aria-hidden="true">
									{CODING_YEARS.map((y) => {
										const has = CODING_STOP_YEARS.has(y);
										const state =
											y === year
												? " coding-yr-now"
												: y < year
													? " coding-yr-past"
													: " coding-yr-ahead";
										return (
											<div
												key={y}
												className={`coding-yr${has ? " coding-yr-has" : ""}${state}`}
												style={{ top: `${yearTop(y)}px` }}
											>
												<span className="coding-yr-lbl">{y}</span>
												<span className="coding-yr-tk" />
											</div>
										);
									})}
								</div>

								{/* Dotted connectors back to a nudged card's real tick. Sized
								    by the relax pass; hidden where a card sits on its tick. */}
								<div ref={connRef} aria-hidden="true">
									{CODING_STOPS.map((stop) => (
										<div
											key={stop.year}
											className="coding-conn"
											style={{ display: "none" }}
										/>
									))}
								</div>

								{!mobile && (
									<ol ref={laneRef} className="coding-lane">
										{CODING_STOPS.map((stop, i) => (
											<li
												key={stop.year}
												className={`coding-card${i === activeStop ? " coding-card-active" : ""}`}
												style={{ top: `${yearTop(stop.year)}px` }}
											>
												<StopBody stop={stop} />
											</li>
										))}
									</ol>
								)}

								{/* Zero-height marker: it only says where the strip lane sits
								    horizontally. */}
								<div ref={proseWrapRef} className="coding-prosewrap" />
							</div>

							{!mobile && (
								<aside className="coding-rack">
									<div className="coding-rack-head">
										<span className="coding-rack-label">Tech Stack</span>
										<span className="coding-rack-now">{year}</span>
										<span className="coding-rack-leds" aria-hidden="true">
											{RACK_LEDS.map((led) => (
												<span key={led} className="coding-rled-group">
													<span className={`coding-rled coding-rled--${led}`} />
													<span className="coding-rled-lbl">{led}</span>
												</span>
											))}
										</span>
									</div>
									<div className="coding-rack-bay">
										<Rails year={year} />
									</div>
									{/* One footer row: the running count on the left, the
									    decorative patch strip on the right. */}
									<div className="coding-ports">
										<span className="coding-rack-count">
											<b>{counts.live}</b> running
										</span>
										<span className="coding-ports-row" aria-hidden="true">
											{RACK_PORTS.map((plug, i) => (
												<span
													// biome-ignore lint/suspicious/noArrayIndexKey: fixed decorative port row
													key={i}
													className="coding-jack"
												>
													<span className="coding-jack-pins" />
													{plug && (
														<>
															<span
																className={`coding-plug coding-plug--${plug}`}
															/>
															<span
																className={`coding-cable coding-cable--${plug}`}
															/>
															<span
																className={`coding-link coding-link--${plug}`}
															/>
														</>
													)}
												</span>
											))}
										</span>
									</div>
								</aside>
							)}
						</div>

					</div>
				</div>

				{/* The drifting window is a PHONE mechanic. Desktop never builds it.
				    Both this and the sheet sit OUTSIDE .subpage-column on purpose:
				    the column carries a backdrop-filter, which makes it the
				    containing block for any fixed descendant. */}
				{mobile && (
					<div ref={windowRef} className="coding-window">
						<div ref={stripRef} className="coding-strip">
							{CODING_STOPS.map((stop) => (
								<article key={stop.year} className="coding-prose">
									<StopBody stop={stop} />
								</article>
							))}
						</div>
					</div>
				)}

				{mobile && (
					<div
						ref={sheetRef}
						className={`coding-sheet${hideDark ? " coding-hide-dark" : ""}`}
					>
						<div ref={sheetHeadRef} className="coding-sheet-head">
							<span className="coding-sheet-year">{year}</span>
							<span className="coding-sheet-count">
								<b>{counts.live}</b> running
							</span>
							<button
								type="button"
								onClick={() => setHideDark((v) => !v)}
								className={`coding-sheet-btn${hideDark ? "" : " coding-sheet-btn-on"}`}
							>
								{hideDark ? `+${counts.dark} dark` : "hide dark"}
							</button>
						</div>
						<div className="coding-sheet-body">
							<div ref={sheetFitRef} className="coding-sheet-fit">
								{BAYS.map((groups) => (
									<div key={groups.join()} className="coding-bay">
										<Rails year={year} groups={groups} />
									</div>
								))}
							</div>
						</div>
					</div>
				)}
			</div>
		</>
	);
}
