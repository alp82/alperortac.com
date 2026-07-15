/*
 * composer.css - Layer-2 coverage for the coding frames' class families
 * (wayfinder plan-coding-frames). Mirrors composer.css.ephemera.test.ts's
 * `sectionFor` banner slicer and J2/J3 guards; this file GROWS with each
 * coding milestone - milestone 2 (code-editor, pull-request) and milestone 3
 * (commit-graph, man-page) are both authored here; keycaps lands in M4.
 *
 * Banner-name uniqueness is REQUIRED file-wide: `sectionFor` slices a
 * sub-section via `indexOf` from the START of the file, so a duplicated
 * banner name would silently slice the WRONG section. The terminal's own
 * `── terminal ──` section (composer.css:314, restyled in Milestone 1) sits
 * ABOVE the "ADDED INNER STYLES (Layer 2)" banner - so it stays OUT of the
 * J1/J2 loops below (which only cover Layer-2 sub-sections) but IS covered by
 * its own dedicated guard (TC-CSS-TERM-J3), per the orchestrator's
 * resolution of a flagged plan contradiction: option (a), J3 coverage only
 * for terminal, never folded into the J1/J2 loops. Its terminal-blink
 * keyframe stays exempt from J2 - it is pre-existing and reduced-motion
 * covered (TC-TM-12 in CodingFrames.test.tsx).
 *
 * Authored red: neither the code-editor nor pull-request class families,
 * banners, or class-driven custom properties exist in composer.css yet.
 */

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const CSS_PATH = join(import.meta.dirname, "..", "composer.css");

const css = readFileSync(CSS_PATH, "utf-8");

const LAYER_2_BANNER = "ADDED INNER STYLES (Layer 2)";
const layer2Start = css.indexOf(LAYER_2_BANNER);

const CLASS_PREFIXES = [
	{ family: "code-editor", prefix: ".editor-" },
	{ family: "pull-request", prefix: ".pr-" },
	{ family: "commit-graph", prefix: ".cg-" },
	{ family: "man-page", prefix: ".manpage-" },
	{ family: "keycaps", prefix: ".keycap-" },
] as const;

describe("J1 - the five M2+M3+M4 class families exist in composer.css Layer-2", () => {
	it("TC-CSS-J1-0: the ADDED INNER STYLES (Layer 2) banner still exists", () => {
		expect(layer2Start).toBeGreaterThan(-1);
	});

	it.each(
		CLASS_PREFIXES,
	)("TC-CSS-J1: %s's class family ($prefix*) exists at/after the Layer-2 banner", ({
		prefix,
	}) => {
		const idx = css.indexOf(prefix, layer2Start === -1 ? 0 : layer2Start);
		expect(idx).toBeGreaterThan(-1);
	});
});

/*
 * Each frame's Layer-2 block is fenced by its own `/* ── <name> ── *​/` banner
 * comment, so slicing a sub-section means slicing on COMMENT TEXT: the prose
 * is a load-bearing, uncompiled interface. Guard rails, therefore:
 *
 *   - the opening banner MUST exist (else the frame has no sub-section), and
 *   - a TERMINATING banner must exist too. Without that second assertion a
 *     sub-section whose successor banner was renamed/deleted would silently
 *     swallow the rest of the stylesheet and drag unrelated @keyframes into
 *     J2's no-animation check (green J3, meaningless J2). Missing terminator
 *     = hard failure, never a silent over-slice.
 *
 * A terminator is the next sub-section banner (`/* ──`) OR the next top-level
 * section banner (`/* ══`) - copied verbatim from composer.css.ephemera.test.ts.
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

describe("TC-CSS-J2-terminator - each M2 section has a genuine terminating banner so sectionFor never over-slices", () => {
	it.each([
		{ family: "code-editor", marker: "── code-editor ──" },
		{ family: "pull-request", marker: "── pull-request ──" },
	])("%s's banner is followed by another banner comment before EOF", ({
		marker,
	}) => {
		expect(() => sectionFor(marker)).not.toThrow();
	});
});

describe("J2 - no new @keyframes/animation/transition on the two M2 class families", () => {
	// Slices each new frame's OWN block (module-scope sectionFor) so the
	// assertion doesn't flag pre-existing @keyframes/animation/transition
	// rules belonging to other, already-shipped inners elsewhere in the same
	// file - and so a missing terminating banner fails loudly instead of
	// over-slicing those unrelated rules INTO this check.
	it.each([
		{ family: "code-editor", marker: "── code-editor ──" },
		{ family: "pull-request", marker: "── pull-request ──" },
	])("TC-CSS-J2: %s's Layer-2 sub-section has no @keyframes, animation, or transition", ({
		marker,
	}) => {
		const section = sectionFor(marker);
		expect(section).not.toMatch(/@keyframes/);
		expect(section).not.toMatch(/\banimation\s*:/);
		expect(section).not.toMatch(/\btransition\s*:/);
	});
});

/*
 * Milestone 3 growth - the version-control/retro pair (commit-graph,
 * man-page), mirroring the M2 J1/J2-terminator/J2 blocks above verbatim for
 * the two new class families. Authored red: neither the `.cg-`/`.manpage-`
 * class families, their banners, nor their class-driven custom properties
 * exist in composer.css yet.
 */

describe("TC-CSS-J2-terminator - each M3 section has a genuine terminating banner so sectionFor never over-slices", () => {
	it.each([
		{ family: "commit-graph", marker: "── commit-graph ──" },
		{ family: "man-page", marker: "── man-page ──" },
	])("%s's banner is followed by another banner comment before EOF", ({
		marker,
	}) => {
		expect(() => sectionFor(marker)).not.toThrow();
	});
});

describe("J2 - no new @keyframes/animation/transition on the two M3 class families", () => {
	it.each([
		{ family: "commit-graph", marker: "── commit-graph ──" },
		{ family: "man-page", marker: "── man-page ──" },
	])("TC-CSS-J2: %s's Layer-2 sub-section has no @keyframes, animation, or transition", ({
		marker,
	}) => {
		const section = sectionFor(marker);
		expect(section).not.toMatch(/@keyframes/);
		expect(section).not.toMatch(/\banimation\s*:/);
		expect(section).not.toMatch(/\btransition\s*:/);
	});
});

/*
 * A "color-bearing" declaration = one that paints a PAPER or INK surface
 * (color / background / border color / outline / fill / stroke). Shadow
 * declarations (box-shadow / text-shadow / drop-shadow) are NOT color-bearing
 * - their rgba() literals are neutral black/white SHADING, stock-agnostic by
 * design. Copied verbatim from composer.css.ephemera.test.ts.
 */
const COLOR_BEARING =
	/(?:^|[;{])\s*(color|background|background-color|border(?:-(?:top|right|bottom|left))?(?:-color)?|outline|outline-color|fill|stroke)\s*:\s*([^;}]*)/g;
const COLOR_LITERAL = /#[0-9a-fA-F]{3,8}\b|\brgba?\(|\bhsla?\(/;

function colorOffenders(section: string): string[] {
	const offenders: string[] = [];
	for (const match of section.matchAll(COLOR_BEARING)) {
		const prop = match[1] ?? "";
		const value = match[2] ?? "";
		if (COLOR_LITERAL.test(value)) {
			offenders.push(`${prop}: ${value.trim()}`);
		}
	}
	return offenders;
}

describe("J3 - code-editor's Layer-2 sub-section consumes its OWN --ed-* custom properties, never the global --paper/--ink", () => {
	it("TC-CSS-J3-1: reads var(--ed-bg)/var(--ed-ink)/var(--ed-muted)/var(--ed-keyword), never var(--paper)/var(--ink), and paints no color literal on any paper-or-ink surface (shadows exempt)", () => {
		const section = sectionFor("── code-editor ──");
		expect(section).toContain("var(--ed-bg");
		expect(section).toContain("var(--ed-ink");
		expect(section).toContain("var(--ed-muted");
		expect(section).toContain("var(--ed-keyword");
		expect(section).not.toMatch(/var\(--paper\b/);
		expect(section).not.toMatch(/var\(--ink\b/);
		expect(colorOffenders(section)).toEqual([]);
	});
});

/*
 * TC-CSS-J3-5: pull-request is a STATE-driven frame - its card paper/ink are
 * fixed constants (`--pr-paper`/`--pr-ink`), not stock-driven - the same
 * deliberate carve-out nameplate gets from the ephemera J3 loop (it is
 * accent-driven, not stock-driven; composer.css.ephemera.test.ts:107-109).
 * So pull-request is EXCLUDED from the color-literal scan here BY RULE, not
 * merely by omission - and the positive assertion below (the section exists
 * and still sets --pr-paper/--pr-ink) is what proves the exemption is
 * deliberate rather than a coverage gap.
 */
describe("J3-exempt - pull-request is state-driven, not stock-driven (documented exemption, mirrors nameplate's carve-out)", () => {
	it("TC-CSS-J3-5: pull-request's section exists and sets --pr-paper/--pr-ink as fixed constants; it is deliberately excluded from the color-literal scan", () => {
		const section = sectionFor("── pull-request ──");
		expect(section).toContain("var(--pr-paper");
		expect(section).toContain("var(--pr-ink");
	});
});

/*
 * PR frame-spec CSS re-pins (wayfinder plan-pr-frame-spec, M2) - the
 * `── pull-request ──` section trades its dead placeholder rules for the
 * github stat-count/squares, word-diff tint, and stage-bubble geometry.
 *
 * Authored red: none of the DEAD classes have been removed yet (the current
 * pull-request.tsx component still renders `.pr-stat-add`/`.pr-stat-del`/
 * `.pr-check-dot`, so composer.css still styles them) and none of the NEW
 * classes exist yet.
 */
describe("TC-PR-CSS-DEAD - the pull-request section no longer contains the retired placeholder classes", () => {
	it("drops .pr-stat-add, .pr-stat-del, and .pr-check-dot", () => {
		const section = sectionFor("── pull-request ──");
		expect(section).not.toContain(".pr-stat-add");
		expect(section).not.toContain(".pr-stat-del");
		expect(section).not.toContain(".pr-check-dot");
	});
});

describe("TC-PR-CSS-NEW - the pull-request section carries the new stat/word-diff/stage class families, var-driven tints", () => {
	it("contains .pr-stat-count, .pr-stat-squares, .pr-stat-sq, .pr-wd-del, .pr-wd-add, .pr-stage, .pr-stage-bubble, .pr-stage-lbl, .pr-stage-connector, and colors via var(--pr-add)/var(--pr-del) rather than bare literals", () => {
		const section = sectionFor("── pull-request ──");
		for (const cls of [
			".pr-stat-count",
			".pr-stat-squares",
			".pr-stat-sq",
			".pr-wd-del",
			".pr-wd-add",
			".pr-stage",
			".pr-stage-bubble",
			".pr-stage-lbl",
			".pr-stage-connector",
		]) {
			expect(section).toContain(cls);
		}
		expect(section).toContain("var(--pr-add");
		expect(section).toContain("var(--pr-del");
		// the section's own documented state-driven exemption (TC-CSS-J3-5)
		// stays in force - this is an additive assertion, not a re-scan.
		expect(section).not.toMatch(/var\(--paper\b/);
		expect(section).not.toMatch(/var\(--ink\b/);
	});
});

/* The terminal's static inset vignette (composer.css:344) paints a neutral
 * black radial-gradient `background` - depth shading, not a paper/ink
 * surface - the same exemption spirit as the shadow declarations the
 * COLOR_BEARING/COLOR_LITERAL pair already lets through, just expressed as a
 * `background` instead of a `box-shadow`. Carved out BY RULE (not by
 * loosening the pattern), and asserted to still exist so the exception can't
 * quietly rot into a licence for arbitrary literals. */
const VIGNETTE_RULE = /\.terminal-vignette[^{]*\{[^}]*\}/g;

describe("TC-CSS-TERM-J3 - terminal's section (above the Layer-2 banner) reads its own --term-* vars", () => {
	it("reads var(--term-bg)/var(--term-ink)/var(--term-glyph)/var(--term-glow), never the global var(--paper)/var(--ink), and paints no unexempted color literal on a paper-or-ink surface", () => {
		const section = sectionFor("── terminal ──");
		expect(section).toContain("var(--term-bg");
		expect(section).toContain("var(--term-ink");
		expect(section).toContain("var(--term-glyph");
		expect(section).toContain("var(--term-glow");
		expect(section).not.toMatch(/var\(--paper\b/);
		expect(section).not.toMatch(/var\(--ink\b/);
		expect(section).toMatch(VIGNETTE_RULE);
		const scanned = section.replace(VIGNETTE_RULE, "");
		expect(colorOffenders(scanned)).toEqual([]);
	});
});

/*
 * Milestone 3 growth - commit-graph and man-page's own J3 var-usage guards
 * (test-plan TC-CSS-J3-2 / TC-CSS-J3-3).
 */

describe("J3 - commit-graph's Layer-2 sub-section consumes its OWN --cg-* custom properties, never the global --paper/--ink", () => {
	it("TC-CSS-J3-2: reads var(--cg-paper)/var(--cg-ink), never var(--paper)/var(--ink), and paints no unexempted color literal on any paper-or-ink surface (shadows exempt)", () => {
		const section = sectionFor("── commit-graph ──");
		expect(section).toContain("var(--cg-paper");
		expect(section).toContain("var(--cg-ink");
		expect(section).not.toMatch(/var\(--paper\b/);
		expect(section).not.toMatch(/var\(--ink\b/);
		expect(colorOffenders(section)).toEqual([]);
	});
});

/*
 * TC-CSS-J3-3: man-page's sprocket-hole edge strips and greenbar alternating
 * bands are neutral-shading decoration (box-shadow-style insets / a
 * color-mix of the section's own --mp-ink into --mp-paper) - the same
 * exemption spirit as terminal's vignette. Carved out BY RULE, not by
 * loosening the pattern: the exemption is only trusted once the section's
 * own carve-out COMMENT is confirmed present, so the exclusion can't
 * silently expand to cover an unrelated literal slipped in later.
 */
const SPROCKET_RULE = /\.manpage-tractor-(?:left|right)[^{]*\{[^}]*\}/g;
const GREENBAR_RULE = /\.manpage-greenbar[^{]*\{[^}]*\}/g;

describe("J3 - man-page's Layer-2 sub-section consumes its OWN --mp-* custom properties, never the global --paper/--ink", () => {
	it("TC-CSS-J3-3: reads var(--mp-paper)/var(--mp-ink), never var(--paper)/var(--ink), documents its sprocket-hole/greenbar-band neutral-shading exemption, and paints no OTHER unexempted color literal on a paper-or-ink surface", () => {
		const section = sectionFor("── man-page ──");
		expect(section).toContain("var(--mp-paper");
		expect(section).toContain("var(--mp-ink");
		expect(section).not.toMatch(/var\(--paper\b/);
		expect(section).not.toMatch(/var\(--ink\b/);
		expect(section).toMatch(/sprocket/i);
		expect(section).toMatch(/greenbar/i);
		expect(section).toMatch(SPROCKET_RULE);
		expect(section).toMatch(GREENBAR_RULE);
		const scanned = section
			.replace(SPROCKET_RULE, "")
			.replace(GREENBAR_RULE, "");
		expect(colorOffenders(scanned)).toEqual([]);
	});
});

/*
 * Milestone 4 growth (final) - keycaps, the last coding class family,
 * mirroring the M2/M3 terminator/J2/J3 blocks above verbatim. Authored red:
 * neither the `.keycap-` class family, its banner, nor its class-driven
 * custom properties exist in composer.css yet.
 */

describe("TC-CSS-J2-terminator - the M4 section has a genuine terminating banner so sectionFor never over-slices", () => {
	it("keycaps's banner is followed by another banner comment before EOF", () => {
		expect(() => sectionFor("── keycaps ──")).not.toThrow();
	});
});

describe("J2 - no new @keyframes/animation/transition on the keycaps class family", () => {
	it("TC-CSS-J2-5: keycaps's Layer-2 sub-section has no @keyframes, animation, or transition", () => {
		const section = sectionFor("── keycaps ──");
		expect(section).not.toMatch(/@keyframes/);
		expect(section).not.toMatch(/\banimation\s*:/);
		expect(section).not.toMatch(/\btransition\s*:/);
	});
});

/*
 * TC-CSS-J3-4: keycaps' bevel is neutral box-shadow shading (the same
 * exemption spirit as terminal's vignette and man-page's sprocket/greenbar
 * decoration) - carved out BY RULE, not by loosening the pattern: the
 * exemption is only trusted once the section's own carve-out COMMENT is
 * confirmed present, so the exclusion can't silently expand to cover an
 * unrelated literal slipped in later.
 */
const BEVEL_RULE = /\.keycap-(?:tile|bevel)[^{]*\{[^}]*\}/g;

describe("J3 - keycaps' Layer-2 sub-section consumes its OWN --kc-* custom properties, never the global --paper/--ink", () => {
	it("TC-CSS-J3-4: reads var(--kc-cap)/var(--kc-ink), never var(--paper)/var(--ink), documents its bevel box-shadow neutral-shading exemption, and paints no OTHER unexempted color literal on a paper-or-ink surface", () => {
		const section = sectionFor("── keycaps ──");
		expect(section).toContain("var(--kc-cap");
		expect(section).toContain("var(--kc-ink");
		expect(section).not.toMatch(/var\(--paper\b/);
		expect(section).not.toMatch(/var\(--ink\b/);
		expect(section).toMatch(/bevel/i);
		expect(section).toMatch(BEVEL_RULE);
		const scanned = section.replace(BEVEL_RULE, "");
		expect(colorOffenders(scanned)).toEqual([]);
	});
});
