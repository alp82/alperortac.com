/*
 * alperortac.com subpage artwork (wayfinder #50).
 *
 * The site IS the identity, so the artwork is the site's own journey minimap,
 * frozen: the whole scroll from noon to night in one column, the sun arc
 * setting, the moon arc rising, and the section waypoints laddered down the
 * side with a "you are here" on Projects - the band the visitor clicked to
 * open this very panel.
 *
 * Faithful by derivation, not by transcription. Every colour and coordinate
 * comes from the same modules the live sky and Minimap read (`skyAt` +
 * `DEFAULT_CELESTIAL` + the minimap's `celestialPosition` / window / opacity
 * helpers), so a sky-curve retune (e.g. ticket #53) moves this drawing too
 * instead of leaving it quietly lying.
 *
 * The vertical axis is scroll progress, so a body's height on the column is
 * its time through the journey. In the live minimap a body also rides inside
 * the travelling viewport window; there is no viewport here, so the arcs read
 * as trails across time.
 *
 * The waypoint ladder is MEASURED, not evenly spaced (#55). It used to mark
 * section order at 25% steps, which put the you-are-here mark beside dusk when
 * the Projects band actually sits in flat noon. Section geometry is the one
 * thing this drawing cannot derive - it depends on rendered heights - so
 * SECTION_SPANS below is transcribed from the running app and says so.
 *
 * Static by design: nothing animates, so reduced-motion needs no special
 * casing.
 */

import { DEFAULT_CELESTIAL } from "../../../data/celestial";
import { MINIMAP_BOUNDARIES, SECTION_IDS } from "../../../data/sections";
import { skyAt } from "../../../data/skyCurve";
import {
	celestialPosition,
	MOON_WINDOW,
	moonOpacityAt,
	SUN_WINDOW,
	sunOpacityAt,
	windowedProgress,
} from "../../minimap/helpers";

// The journey's waypoints, in order. Hero is the page top (no anchor of its
// own); the rest are the minimap's own boundary list, so a label rename there
// lands here too. Exported for the ordering pin in tests.
export const JOURNEY_WAYPOINTS = [
	{ id: "hero", label: "Hero" },
	...MINIMAP_BOUNDARIES,
] as const;

/*
 * Where each section sits in the scroll, as [start, end] in progress. Measured
 * in the running app at 1440x900 on 2026-07-27 (#55).
 *
 * These are transcribed numbers in a drawing that otherwise derives everything
 * (the #50 rule). They have to be: a section's span depends on its rendered
 * height, which no static drawing can compute. The alternative was the evenly
 * spaced ladder, and that was not a simplification - it was wrong. Craft is
 * 75.5% of the journey on its own, so 25% steps put every other waypoint in
 * the wrong sky.
 *
 * The drawing commits to desktop. Mobile runs a little earlier (Projects
 * 0.105 rather than 0.144) and one static picture cannot hold both.
 *
 * Re-measure if section heights change materially. The invariant that matters
 * is Craft dominating; the exact decimals are decoration.
 */
export const SECTION_SPANS: Record<string, readonly [number, number]> = {
	hero: [0, 0.065],
	socials: [0.065, 0.1282],
	projects: [0.1443, 0.2185],
	craft: [0.2346, 0.9896],
	contact: [0.9896, 1],
};

// Craft is the one section long enough to read as a range rather than a point,
// so it alone carries the bracket. The rest stay quiet ticks.
const BRACKETED = "craft";

// The waypoint the visitor is standing on: they opened this panel from the
// Projects band.
export const YOU_ARE_HERE = SECTION_IDS.projects;

// The band's signature accent (ticket #45), reused for the one mark that has to
// pop off the sky.
const ACCENT = "#b4531f";

const CURVE = DEFAULT_CELESTIAL.curve;

// Same 48-stop sampling the live Minimap uses, against the same curve.
const GRADIENT_STOPS = 48;

function skyGradient(): string {
	const parts: string[] = [];
	for (let i = 0; i < GRADIENT_STOPS; i++) {
		const p = i / (GRADIENT_STOPS - 1);
		parts.push(`${skyAt(p, CURVE)} ${(p * 100).toFixed(2)}%`);
	}
	return `linear-gradient(to bottom, ${parts.join(", ")})`;
}

type Body = { p: number; x: number; o: number };

// A body's trail: its horizontal drift and opacity sampled across the journey,
// dropping the samples where it is not in the sky at all.
function trail(
	kind: "sun" | "moon",
	samples: number,
	minOpacity = 0.06,
): Body[] {
	const params =
		kind === "sun" ? DEFAULT_CELESTIAL.sun : DEFAULT_CELESTIAL.moon;
	const win = kind === "sun" ? SUN_WINDOW : MOON_WINDOW;
	const opacityAt = kind === "sun" ? sunOpacityAt : moonOpacityAt;
	const out: Body[] = [];
	for (let i = 0; i < samples; i++) {
		const p = i / (samples - 1);
		const o = opacityAt(p);
		if (o <= minOpacity) continue;
		out.push({
			p,
			x: celestialPosition(windowedProgress(p, win), params).x,
			o,
		});
	}
	return out;
}

export const SUN_TRAIL = trail("sun", 13);

/*
 * Moon floor 0.45, not the sun's 0.06 (#55). At progress 0.583 the sun still
 * draws at 0.33 and the moon comes in at 0.42, so both bodies landed in one
 * frame ten pixels apart and read as a smudge rather than a handover. The
 * higher floor drops that sample: the frame is the sun alone, and the moon
 * starts on the next one.
 */
export const MOON_TRAIL = trail("moon", 13, 0.45);

// The curve's own phase anchors, labelled on the column's left edge. `phase1`
// ends where the dusk plateau begins; `phase2` ends where full night lands.
const PHASE_MARKS = [
	{ label: "Noon", p: 0 },
	{ label: "Dusk", p: CURVE.phase1[1] },
	{ label: "Night", p: CURVE.phase2[1] },
] as const;

// The column's rendered height. The ladder needs it in px, because the bracket
// is positioned against label edges rather than against band boundaries.
const COLUMN_H = 320;

/*
 * Sections are contiguous, so one band ends on the exact row where the next
 * begins. The bracket therefore has to hold its neighbours' labels off, and by
 * the SAME amount at both ends - a bracket that hugs the label below it while
 * leaving air above reads as misaligned. The gap is measured from the
 * neighbouring LABEL edge, not from the band boundary, because the labels are
 * what the eye reads the spacing against.
 */
const LABEL_GAP_PX = 12;
const LABEL_HALF_PX = 7;

/** A band's midpoint in px down the column: where its label and tick sit. */
function midpoint(id: string): number {
	const span = SECTION_SPANS[id];
	if (!span) return 0;
	return ((span[0] + span[1]) / 2) * COLUMN_H;
}

/*
 * Bracket ends in px, held off both neighbouring labels by the same gap.
 * Clamped so the bracket never grows past the band it names: it may stop short
 * of the true edge to buy the gap, never run long. Craft gives up ~17px at the
 * bottom this way, which costs nothing because no scale is printed beside it.
 */
function bracketEnds(id: string, index: number) {
	const span = SECTION_SPANS[id];
	if (!span) return { top: 0, height: 0 };
	const previous = JOURNEY_WAYPOINTS[index - 1];
	const next = JOURNEY_WAYPOINTS[index + 1];
	const held = (mid: number, direction: 1 | -1) =>
		mid + direction * (LABEL_HALF_PX + LABEL_GAP_PX);
	const top = Math.max(
		span[0] * COLUMN_H,
		previous ? held(midpoint(previous.id), 1) : 0,
	);
	const bottom = Math.min(
		span[1] * COLUMN_H,
		next ? held(midpoint(next.id), -1) : COLUMN_H,
	);
	return { top, height: Math.max(bottom - top, 1) };
}

export function JourneyColumn() {
	return (
		<div
			role="img"
			aria-label={
				"The site's own journey minimap, frozen: one column running from the " +
				"noon sky at the top through dusk to full night at the bottom, with " +
				"the sun arc setting as it fades out, the moon arc rising as it fades " +
				"in, and the section waypoints marked down the side at the point of " +
				`the journey each one occupies (${JOURNEY_WAYPOINTS.map(
					(w) => w.label,
				).join(", ")}), Craft bracketed because it spans three quarters of ` +
				"the scroll, with a you-are-here mark on Projects."
			}
			className="mb-6 flex justify-center"
		>
			<div aria-hidden="true" className="flex items-stretch gap-3">
				{/* Phase labels, positioned from the live sky curve. */}
				<div className="relative w-12 shrink-0">
					{PHASE_MARKS.map((mark) => (
						<div
							key={mark.label}
							className="absolute right-0 flex -translate-y-1/2 items-center gap-1.5 text-[9px] font-black uppercase tracking-[0.18em] text-white/45"
							style={{ top: `${mark.p * 100}%` }}
						>
							{mark.label}
							<span className="h-px w-2 bg-white/25" />
						</div>
					))}
				</div>

				{/* The column: the whole journey, top (noon) to bottom (night). */}
				<div
					className="relative h-80 w-16 shrink-0 overflow-hidden rounded-sm border border-white/20 shadow-[0_6px_24px_rgba(0,0,0,0.35)]"
					style={{ background: skyGradient() }}
				>
					{/*
					 * No stars (#55). Five 1px dots at this size did not read as stars,
					 * they read as dirt on the drawing - and they were the same pale
					 * speckle as the moon trail beside them. The sun and the moon carry
					 * the day-to-night story on their own.
					 */}
					{SUN_TRAIL.map((body) => (
						<span
							key={`sun-${body.p}`}
							data-journey-sun=""
							className="absolute h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full border border-yellow-400 bg-yellow-200"
							style={{
								left: `${body.x}%`,
								top: `${body.p * 100}%`,
								opacity: body.o,
							}}
						/>
					))}
					{MOON_TRAIL.map((body) => (
						<span
							key={`moon-${body.p}`}
							data-journey-moon=""
							className="absolute h-1 w-1 -translate-x-1/2 -translate-y-1/2 rounded-full border border-slate-300 bg-slate-100"
							style={{
								left: `${body.x}%`,
								top: `${body.p * 100}%`,
								opacity: body.o,
							}}
						/>
					))}
				</div>

				{/*
				 * Waypoint ladder, measured (#55). Every mark sits at the midpoint of
				 * the band it names, so a tick and a bracket mean the same thing at
				 * different lengths. Craft alone is long enough to be a range, so it
				 * alone gets the bracket: stem on the right, caps opening left toward
				 * the band it points at.
				 *
				 * Marks are absolutely positioned, so the container carries an
				 * explicit width - without one the row measures narrower than its
				 * content and the you-are-here pill spills past the artwork's box.
				 */}
				<ol className="relative shrink-0" style={{ width: 180 }}>
					{JOURNEY_WAYPOINTS.map((waypoint, index) => {
						const here = waypoint.id === YOU_ARE_HERE;
						const color = here ? ACCENT : "rgba(255,255,255,0.3)";
						const mid = midpoint(waypoint.id);
						const bracket =
							waypoint.id === BRACKETED
								? bracketEnds(waypoint.id, index)
								: null;
						return (
							<li key={waypoint.id} data-journey-waypoint={waypoint.id}>
								{bracket ? (
									<span
										className="absolute left-0 w-[7px]"
										style={{
											top: bracket.top,
											height: bracket.height,
											borderRight: `1px solid ${color}`,
											borderTop: `1px solid ${color}`,
											borderBottom: `1px solid ${color}`,
										}}
									/>
								) : (
									<span
										className="absolute left-0 h-px w-3"
										style={{ top: mid, backgroundColor: color }}
									/>
								)}
								<span
									className="absolute flex -translate-y-1/2 items-center gap-2 whitespace-nowrap"
									style={{ top: mid, left: bracket ? 16 : 20 }}
								>
									<span
										className={`text-[10px] font-black uppercase tracking-[0.18em] ${
											here ? "text-white" : "text-white/60"
										}`}
									>
										{waypoint.label}
									</span>
									{here ? (
										<span
											className="rounded-full px-1.5 py-0.5 text-[8px] font-black uppercase tracking-[0.14em] text-white"
											style={{ backgroundColor: ACCENT }}
										>
											You are here
										</span>
									) : null}
								</span>
							</li>
						);
					})}
				</ol>
			</div>
		</div>
	);
}
