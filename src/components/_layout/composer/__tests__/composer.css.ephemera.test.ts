/*
 * composer.css - Layer-2 coverage for the four ephemera frames' class
 * families (wayfinder plan-four-ephemera-frames, section J).
 *
 * No CSS parser lives in this repo, so this reads the raw stylesheet as text
 * and greps its Layer-2 section (below the "ADDED INNER STYLES (Layer 2)"
 * banner, where every existing inner's classes already live - .ticket-*,
 * .nameplate-*'s sibling families etc.) the same way a reviewer would.
 *
 * Authored red: none of the four class-family prefixes exist in the
 * stylesheet yet.
 */

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const CSS_PATH = join(import.meta.dirname, "..", "composer.css");

const css = readFileSync(CSS_PATH, "utf-8");

const LAYER_2_BANNER = "ADDED INNER STYLES (Layer 2)";
const layer2Start = css.indexOf(LAYER_2_BANNER);

const CLASS_PREFIXES = [
	{ family: "timecard", prefix: ".timecard-" },
	{ family: "nameplate", prefix: ".nameplate-" },
	{ family: "punch-card", prefix: ".punchcard-" },
	{ family: "offer-letter", prefix: ".letter-" },
] as const;

describe("J1 - the four class families exist in composer.css Layer-2", () => {
	it("the Layer-2 banner exists in composer.css", () => {
		expect(layer2Start).toBeGreaterThan(-1);
	});

	it.each(
		CLASS_PREFIXES,
	)("%s's class family ($prefix*) exists at/after the Layer-2 banner", ({
		prefix,
	}) => {
		const idx = css.indexOf(prefix, layer2Start === -1 ? 0 : layer2Start);
		expect(idx).toBeGreaterThan(-1);
	});
});

/*
 * Each frame's Layer-2 block is fenced by its own `/* ── <name> ── *​/` banner
 * comment, so slicing a sub-section means slicing on COMMENT TEXT: the prose is
 * a load-bearing, uncompiled interface. Guard rails, therefore:
 *
 *   - the opening banner MUST exist (else the frame has no sub-section), and
 *   - a TERMINATING banner must exist too. Without that second assertion a
 *     sub-section whose successor banner was renamed/deleted would silently
 *     swallow the rest of the stylesheet and drag unrelated @keyframes into
 *     J2's no-animation check (green J3, meaningless J2). Missing terminator =
 *     hard failure, never a silent over-slice.
 *
 * A terminator is the next sub-section banner (`/* ──`) OR the next top-level
 * section banner (`/* ══`) - the last ephemera block (offer-letter) is followed
 * by the ENVIRONMENT INNER STYLES `══` banner, not a `──` one.
 */
const NEXT_BANNER = /\/\* (?:──|══)/;

function sectionFor(marker: string): string {
	const start = css.indexOf(marker);
	expect(
		start,
		`composer.css has no "${marker}" banner comment`,
	).toBeGreaterThan(-1);
	const after = start + marker.length;
	const next = css.slice(after).search(NEXT_BANNER);
	expect(
		next,
		`the "${marker}" sub-section has no TERMINATING banner comment - it would ` +
			`silently swallow the rest of composer.css. Restore the next section's ` +
			`banner rather than relaxing this assertion.`,
	).toBeGreaterThan(-1);
	return css.slice(start, after + next);
}

describe("J3 - the three stock-driven sub-sections consume their OWN custom properties, never the global --paper/--ink (blocker 1 regression)", () => {
	/*
	 * A "color-bearing" declaration = one that paints a PAPER or INK surface
	 * (color / background / border color / outline / fill / stroke). Those must
	 * flow through the stock-driven custom properties, so any literal - hex,
	 * rgb(a) or hsl(a) - is banned there. A hex-only ban (what this guard used to
	 * be) let `background: rgba(237,223,192,.6)` sail through and print manila
	 * chrome on mint stock with a green test.
	 *
	 * Shadow declarations (box-shadow / text-shadow / drop-shadow) are NOT
	 * color-bearing: their rgba() literals are neutral black/white SHADING (the
	 * letterhead monogram's emboss, the punched holes' inset depth), which is
	 * stock-agnostic by design.
	 */
	const COLOR_BEARING =
		/(?:^|[;{])\s*(color|background|background-color|border(?:-(?:top|right|bottom|left))?(?:-color)?|outline|outline-color|fill|stroke)\s*:\s*([^;}]*)/g;
	const COLOR_LITERAL = /#[0-9a-fA-F]{3,8}\b|\brgba?\(|\bhsla?\(/;

	/* The ONE named exception: the timecard's clock stamps are inked in a fixed
	 * stamp-pad blue that reads on every stock, so .timecard-stamp's literals are
	 * deliberate. It is carved out BY RULE (not by loosening the pattern), and
	 * asserted to still exist so the carve-out can't quietly rot into a licence
	 * for arbitrary literals. */
	const STAMP_RULE = /\.timecard-stamp[^{]*\{[^}]*\}/g;

	// nameplate is accent-driven, not stock-driven (its sheen is legitimately a
	// hardcoded low-opacity white), so it is out of scope here - only the three
	// stock-driven frames are covered.
	it.each([
		{
			family: "timecard",
			marker: "timecard",
			paperVar: "--tc-paper",
			inkVar: "--tc-ink",
		},
		{
			family: "punch-card",
			marker: "punch-card",
			paperVar: "--pc-paper",
			inkVar: "--pc-ink",
		},
		{
			family: "offer-letter",
			marker: "offer-letter",
			paperVar: "--ol-paper",
			inkVar: "--ol-ink",
		},
	])("%s's Layer-2 sub-section reads var($paperVar)/var($inkVar), never the global var(--paper)/var(--ink), and paints no color literal (hex/rgb/hsl) on any paper-or-ink surface", ({
		marker,
		paperVar,
		inkVar,
	}) => {
		const section = sectionFor(`── ${marker} ──`);

		// Positive: the sub-section actually consumes its own custom
		// properties somewhere in a color-bearing declaration.
		expect(section).toContain(`var(${paperVar}`);
		expect(section).toContain(`var(${inkVar}`);

		// Negative: never falls back to reading the GLOBAL --paper/--ink
		// custom properties defined at composer.css :root (composer.css:21)
		// - that is the exact desync bug a verbatim .ticket-perf clone
		// would introduce (a constant off-white hole cutout regardless of
		// the selected stock).
		expect(section).not.toMatch(/var\(--paper\b/);
		expect(section).not.toMatch(/var\(--ink\b/);

		// Carve out the deliberately-fixed blue stamp ink, asserting first that
		// it is still there (timecard only) so the exception cannot outlive the
		// rule it exempts.
		let scanned = section;
		if (marker === "timecard") {
			expect(section).toMatch(STAMP_RULE);
			scanned = section.replace(STAMP_RULE, "");
		}

		// Negative: every paper/ink surface flows through the stock-driven
		// custom properties - no hex, no rgb(a), no hsl(a) literal.
		const offenders: string[] = [];
		for (const match of scanned.matchAll(COLOR_BEARING)) {
			const prop = match[1] ?? "";
			const value = match[2] ?? "";
			if (COLOR_LITERAL.test(value)) {
				offenders.push(`${prop}: ${value.trim()}`);
			}
		}
		expect(
			offenders,
			`hardcoded color literal on a paper/ink surface in the "${marker}" ` +
				`sub-section - route it through var(${paperVar}) / var(${inkVar}) ` +
				`(via color-mix for tints) so it tracks the selected stock`,
		).toEqual([]);
	});
});

describe("J2 - no new @keyframes/animation/transition on the four class families", () => {
	// Slices each new frame's OWN block (module-scope sectionFor) so the
	// assertion doesn't flag pre-existing @keyframes/animation/transition rules
	// belonging to other, already-shipped inners elsewhere in the same file -
	// and so a missing terminating banner fails loudly instead of over-slicing
	// those unrelated rules INTO this check.
	it.each([
		{ family: "timecard", marker: "timecard" },
		{ family: "nameplate", marker: "nameplate" },
		{ family: "punch-card", marker: "punch-card" },
		{ family: "offer-letter", marker: "offer-letter" },
	])("%s's Layer-2 sub-section has no @keyframes, animation, or transition", ({
		marker,
	}) => {
		const section = sectionFor(`── ${marker} ──`);
		expect(section).not.toMatch(/@keyframes/);
		expect(section).not.toMatch(/\banimation\s*:/);
		expect(section).not.toMatch(/\btransition\s*:/);
	});
});
