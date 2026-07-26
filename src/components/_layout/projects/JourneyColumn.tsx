/*
 * alperortac.com subpage artwork (wayfinder #50).
 *
 * The site IS the identity, so the artwork is the site's own journey minimap,
 * frozen: the whole scroll from noon to night in one column, the sun arc
 * setting, the moon arc rising, the stars coming up, and the section waypoints
 * laddered down the side with a "you are here" on Projects - the band the
 * visitor clicked to open this very panel.
 *
 * Faithful by derivation, not by transcription. Every colour and coordinate
 * comes from the same modules the live sky and Minimap read (`skyAt` +
 * `DEFAULT_CELESTIAL` + the minimap's `celestialPosition` / window / opacity
 * helpers), so a sky-curve retune (e.g. ticket #53) moves this drawing too
 * instead of leaving it quietly lying.
 *
 * Two things here are schematic rather than measured, on purpose:
 * - The waypoint ladder marks section ORDER, evenly spaced. Real section
 *   offsets depend on rendered heights, which no static drawing can know
 *   (#51 measured the band at progress 0.17 desktop / 0.124 mobile - live
 *   numbers, not constants).
 * - The vertical axis is scroll progress, so a body's height on the column is
 *   its time through the journey. In the live minimap a body also rides inside
 *   the travelling viewport window; there is no viewport here, so the arcs read
 *   as trails across time.
 *
 * Static by design: nothing animates, so reduced-motion needs no special
 * casing.
 */

import { DEFAULT_CELESTIAL } from "../../../data/celestial";
import { MINIMAP_BOUNDARIES, SECTION_IDS } from "../../../data/sections";
import { clamp01, skyAt } from "../../../data/skyCurve";
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
export const MOON_TRAIL = trail("moon", 13);

// Fixed star positions (never random - a drawing that shuffles per render
// breaks SSR/client parity). Opacity follows the live stars ramp: they come up
// across the curve's second phase.
const STARS: { p: number; x: number }[] = [
	{ p: 0.62, x: 62 },
	{ p: 0.71, x: 38 },
	{ p: 0.79, x: 78 },
	{ p: 0.85, x: 22 },
	{ p: 0.92, x: 55 },
];

function starOpacity(p: number): number {
	const [start, end] = CURVE.phase2;
	return clamp01((p - start) / Math.max(end - start, 0.001)) * 0.9;
}

// The curve's own phase anchors, labelled on the column's left edge. `phase1`
// ends where the dusk plateau begins; `phase2` ends where full night lands.
const PHASE_MARKS = [
	{ label: "Noon", p: 0 },
	{ label: "Dusk", p: CURVE.phase1[1] },
	{ label: "Night", p: CURVE.phase2[1] },
] as const;

export function JourneyColumn() {
	return (
		<div
			role="img"
			aria-label={
				"The site's own journey minimap, frozen: one column running from the " +
				"noon sky at the top through dusk to full night at the bottom, with " +
				"the sun arc setting as it fades out, the moon arc rising as it fades " +
				"in, stars coming up over the night half, and the section waypoints " +
				`listed down the side in order (${JOURNEY_WAYPOINTS.map(
					(w) => w.label,
				).join(", ")}) with a you-are-here mark on Projects.`
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
					{STARS.map((star) => (
						<span
							key={`${star.p}-${star.x}`}
							className="absolute h-px w-px rounded-full bg-white"
							style={{
								left: `${star.x}%`,
								top: `${star.p * 100}%`,
								opacity: starOpacity(star.p),
							}}
						/>
					))}
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

				{/* Waypoint ladder: order down the journey, not measured offsets. */}
				<ol className="flex min-w-0 flex-col justify-between py-0.5">
					{JOURNEY_WAYPOINTS.map((waypoint) => {
						const here = waypoint.id === YOU_ARE_HERE;
						return (
							<li
								key={waypoint.id}
								data-journey-waypoint={waypoint.id}
								className="flex items-center gap-2"
							>
								<span
									className="h-px w-3"
									style={{
										backgroundColor: here ? ACCENT : "rgba(255,255,255,0.3)",
									}}
								/>
								<span
									className={`text-[10px] font-black uppercase tracking-[0.18em] ${
										here ? "text-white" : "text-white/60"
									}`}
								>
									{waypoint.label}
								</span>
								{here ? (
									<span
										className="whitespace-nowrap rounded-full px-1.5 py-0.5 text-[8px] font-black uppercase tracking-[0.14em] text-white"
										style={{ backgroundColor: ACCENT }}
									>
										You are here
									</span>
								) : null}
							</li>
						);
					})}
				</ol>
			</div>
		</div>
	);
}
