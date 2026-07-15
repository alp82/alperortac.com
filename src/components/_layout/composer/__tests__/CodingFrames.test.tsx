// @vitest-environment jsdom

/*
 * Coding frames (wayfinder plan-coding-frames) - Milestone 1 slice: the
 * terminal restyle (section 2 of the test plan) plus the composer.css
 * pre-cleanup dead-code removal (section 9). The five brand-new frames
 * (code-editor, pull-request, commit-graph, man-page, keycaps) land in later
 * milestones and are not covered here.
 *
 * Harness (renderFrame + WCAG contrast helpers) is copied verbatim from
 * EphemeraFrames.test.tsx per the plan's structural note, so future
 * milestones can append their own frame blocks without re-deriving it.
 *
 * Authored red: the TM block below targets the RESTYLED terminal.tsx (scheme
 * `glow`, `--term-*` inline vars, `alp@site:~/topics/<id>` + `❯ cat <id>.md`
 * prompt lines, display-scale heading, dim rule, vignette/raster chrome,
 * glass traffic lights) - none of that exists in the current terminal.tsx, so
 * every test below that asserts on it fails until the restyle lands. TC-TM-1,
 * TC-TM-2, TC-TM-7, TC-TM-12 and TC-TM-13 are regression pins on behavior the
 * restyle must NOT touch (the `TerminalParams` contract, the 4 schemes, the
 * cursor toggle, the terminal-blink reduced-motion coverage, and index
 * independence) - they are expected to already pass. The CLEAN block targets
 * the CURRENT (not yet cleaned) composer.css, so it is red until the
 * pre-cleanup step runs.
 */

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { cleanup, render } from "@testing-library/react";
import { createRef } from "react";
import { afterEach, describe, expect, it } from "vitest";
import type { Topic } from "../../../../data/topics";
import { INNERS } from "../index";
import { countDiffChars, statSquares } from "../pr-diff";
import type { InnerId, InnerRenderProps } from "../types";

/* "tech-stack" is TopicId's own hyphenated id (TC-TM-3/TC-TM-4's edge case:
 * prove no hyphen->underscore transform is applied), reused here purely as a
 * render fixture - unrelated to the reserved tech-stack/circuit-board frame
 * (plan v2's Out of Scope). */
const topic: Topic = {
	id: "tech-stack",
	heading: "Tech Stack",
	teaser: "ignored",
	triggers: [],
};

const lastTriggerRef = createRef<HTMLElement>();
const BODY_TEXT = "real body";

const TERMINAL_SCHEMES = ["midnight", "matrix", "amber", "ice"] as const;

/** Parses a CSS color that jsdom/cssstyle may hand back as "#rrggbb" OR as the
 * normalized "rgb(r, g, b)" form on inline-style read-back. */
function parseColor(value: string): [number, number, number] {
	const v = value.trim();
	const rgb = v.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/i);
	if (rgb) {
		return [Number(rgb[1]), Number(rgb[2]), Number(rgb[3])];
	}
	const hex = v.replace("#", "");
	const full =
		hex.length === 3
			? hex
					.split("")
					.map((c) => c + c)
					.join("")
			: hex;
	return [
		Number.parseInt(full.slice(0, 2), 16),
		Number.parseInt(full.slice(2, 4), 16),
		Number.parseInt(full.slice(4, 6), 16),
	];
}

/** sRGB channel (0..255) to its linearized value. */
function linearizeChannel(c: number): number {
	const s = c / 255;
	return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
}

/** WCAG relative luminance of an sRGB triple. */
function relativeLuminance([r, g, b]: [number, number, number]): number {
	return (
		0.2126 * linearizeChannel(r) +
		0.7152 * linearizeChannel(g) +
		0.0722 * linearizeChannel(b)
	);
}

/** WCAG contrast ratio (L_light + 0.05) / (L_dark + 0.05) for two CSS colors. */
function contrastRatio(a: string, b: string): number {
	const la = relativeLuminance(parseColor(a));
	const lb = relativeLuminance(parseColor(b));
	return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

/** Renders one coding cluster straight off the INNERS registry, merging
 * `overrides.params` onto that id's own registry defaults. */
function renderFrame<Id extends InnerId>(
	id: Id,
	overrides: {
		params?: Partial<InnerRenderProps<Id>["params"]>;
		topic?: Topic;
		index?: number;
		accent?: string;
	} = {},
) {
	const def = INNERS[id];
	const Cluster = def.Component as React.ComponentType<InnerRenderProps<Id>>;
	const params = {
		...def.defaults,
		...overrides.params,
	} as InnerRenderProps<Id>["params"];
	return render(
		<Cluster
			topic={overrides.topic ?? topic}
			index={overrides.index ?? 0}
			isNight={false}
			lastTriggerRef={lastTriggerRef}
			params={params}
			accent={overrides.accent ?? "#a7f3d0"}
		>
			<p data-testid="body">{BODY_TEXT}</p>
		</Cluster>,
	);
}

afterEach(() => {
	cleanup();
});

describe("TM - Terminal restyle", () => {
	it("TC-TM-1 (regression): INNERS.terminal.defaults is unchanged (TerminalParams contract untouched)", () => {
		expect(INNERS.terminal.defaults).toEqual({
			density: "roomy",
			cursor: true,
			scheme: "midnight",
		});
	});

	it("TC-TM-2 (regression): exactly the 4 named schemes (midnight/matrix/amber/ice) render without error - no scheme added or removed", () => {
		for (const scheme of TERMINAL_SCHEMES) {
			expect(() => {
				renderFrame("terminal", { params: { scheme } });
				cleanup();
			}).not.toThrow();
		}
	});

	it("TC-TM-3: the content pane's first line renders alp@site:~/topics/<id> using the raw hyphenated id verbatim", () => {
		const { container } = renderFrame("terminal");
		expect(container.textContent ?? "").toContain(
			"alp@site:~/topics/tech-stack",
		);
	});

	it("TC-TM-4: the content pane's second line renders ❯ cat <id>.md using the raw id (no hyphen→underscore transform)", () => {
		const { container } = renderFrame("terminal");
		expect(container.textContent ?? "").toContain("cat tech-stack.md");
	});

	it("TC-TM-5: the heading renders at display scale (text-2xl/md:text-4xl) in accent color, not the prior body-sized class", () => {
		const { container } = renderFrame("terminal", { accent: "#a7f3d0" });
		const heading = container.querySelector("h2") as HTMLElement | null;
		expect(heading).toBeDefined();
		expect(heading?.className ?? "").toContain("text-2xl");
		expect(heading?.className ?? "").toContain("md:text-4xl");
		expect(heading?.style.color).toBeTruthy();
	});

	it("TC-TM-6: a dim ──── rule renders immediately after the heading line, before children", () => {
		const { container } = renderFrame("terminal");
		const text = container.textContent ?? "";
		const headingIdx = text.indexOf(`# ${topic.heading}`);
		const ruleIdx = text.indexOf("────");
		const bodyIdx = text.indexOf(BODY_TEXT);
		expect(headingIdx).toBeGreaterThan(-1);
		expect(ruleIdx).toBeGreaterThan(headingIdx);
		expect(bodyIdx).toBeGreaterThan(ruleIdx);
	});

	it("TC-TM-7 (regression): cursor:true renders the blinking cursor element; cursor:false removes it from the DOM entirely", () => {
		const { container: on } = renderFrame("terminal", {
			params: { cursor: true },
		});
		expect(on.querySelector(".terminal-cursor")).not.toBeNull();
		cleanup();

		const { container: off } = renderFrame("terminal", {
			params: { cursor: false },
		});
		expect(off.querySelector(".terminal-cursor")).toBeNull();
	});

	it("TC-TM-8: root/pane element carries --term-bg/--term-ink/--term-glyph/--term-glow as inline custom properties", () => {
		const { container } = renderFrame("terminal");
		const root = container.querySelector(
			'[style*="--term-bg"]',
		) as HTMLElement | null;
		expect(root).not.toBeNull();
		expect(root?.style.getPropertyValue("--term-bg")).toBeTruthy();
		expect(root?.style.getPropertyValue("--term-ink")).toBeTruthy();
		expect(root?.style.getPropertyValue("--term-glyph")).toBeTruthy();
		expect(root?.style.getPropertyValue("--term-glow")).toBeTruthy();
	});

	it("TC-TM-9: each of the 4 schemes produces a distinct render (--term-* values differ pairwise)", () => {
		const outputs = TERMINAL_SCHEMES.map((scheme) => {
			const { container } = renderFrame("terminal", { params: { scheme } });
			const html = container.innerHTML;
			cleanup();
			return html;
		});
		expect(new Set(outputs).size).toBe(4);
	});

	it("TC-TM-9b: the 4 schemes' --term-bg values are pairwise distinct", () => {
		const bgs = TERMINAL_SCHEMES.map((scheme) => {
			const { container } = renderFrame("terminal", { params: { scheme } });
			const root = container.querySelector(
				'[style*="--term-bg"]',
			) as HTMLElement | null;
			const value = root?.style.getPropertyValue("--term-bg") ?? "";
			cleanup();
			return value;
		});
		expect(new Set(bgs).size).toBe(4);
	});

	it("TC-TM-10: exactly 3 traffic-light dots render and each carries an inset (glass) box-shadow", () => {
		const { container } = renderFrame("terminal");
		const dots = container.querySelectorAll(".terminal-dot");
		expect(dots.length).toBe(3);
		for (const dot of Array.from(dots)) {
			expect((dot as HTMLElement).style.boxShadow).toMatch(/inset/);
		}
	});

	it("TC-TM-11: the vignette and raster-texture decoration are aria-hidden, non-interactive, and never a DOM ancestor of children", () => {
		const { container, getByTestId } = renderFrame("terminal");
		const body = getByTestId("body");
		const vignette = container.querySelector(
			".terminal-vignette",
		) as HTMLElement | null;
		const raster = container.querySelector(
			".terminal-raster",
		) as HTMLElement | null;
		expect(vignette).not.toBeNull();
		expect(raster).not.toBeNull();
		for (const el of [vignette, raster]) {
			expect(el?.getAttribute("aria-hidden")).toBe("true");
			expect(el?.style.pointerEvents).toBe("none");
			expect(el?.contains(body)).toBe(false);
		}
		expect(body.closest(".terminal-vignette")).toBeNull();
		expect(body.closest(".terminal-raster")).toBeNull();
	});

	it("TC-TM-12 (regression): terminal-blink keyframe usage is untouched - the @keyframes exists and the reduced-motion block still lists .terminal-cursor", () => {
		const cssPath = join(import.meta.dirname, "..", "composer.css");
		const css = readFileSync(cssPath, "utf-8");
		expect(css).toContain("@keyframes terminal-blink");
		const mediaIdx = css.indexOf("@media (prefers-reduced-motion: reduce)");
		expect(mediaIdx).toBeGreaterThan(-1);
		const cursorIdx = css.indexOf(".terminal-cursor", mediaIdx);
		expect(cursorIdx).toBeGreaterThan(mediaIdx);
		const animationNoneIdx = css.indexOf("animation: none", cursorIdx);
		expect(animationNoneIdx).toBeGreaterThan(cursorIdx);
	});

	it("TC-TM-13 (edge case, regression): rendering at index 0 vs a later index (9) does not change prompt/heading content", () => {
		const { container: first } = renderFrame("terminal", { index: 0 });
		const text0 = first.textContent ?? "";
		cleanup();
		const { container: later } = renderFrame("terminal", { index: 9 });
		const text9 = later.textContent ?? "";
		expect(text0).toBe(text9);
	});

	it("TC-TM-contrast (load-bearing): --term-ink clears WCAG AA 4.5:1 against --term-bg for all 4 schemes", () => {
		for (const scheme of TERMINAL_SCHEMES) {
			const { container } = renderFrame("terminal", { params: { scheme } });
			const root = container.querySelector(
				'[style*="--term-bg"]',
			) as HTMLElement | null;
			expect(root).not.toBeNull();
			const bg = root?.style.getPropertyValue("--term-bg") ?? "";
			const ink = root?.style.getPropertyValue("--term-ink") ?? "";
			expect(bg.length).toBeGreaterThan(0);
			expect(ink.length).toBeGreaterThan(0);
			expect(contrastRatio(bg, ink)).toBeGreaterThanOrEqual(4.5);
			cleanup();
		}
	});
});

describe("CLEAN - composer.css pre-cleanup (dead-code removal)", () => {
	const cssPath = join(import.meta.dirname, "..", "composer.css");
	const css = readFileSync(cssPath, "utf-8");

	it("TC-CLEAN-1: .cmp-cta, .cmp-cta:hover and .cmp-cta:focus-visible no longer appear anywhere in composer.css", () => {
		expect(css).not.toContain(".cmp-cta {");
		expect(css).not.toContain(".cmp-cta:hover");
		expect(css).not.toContain(".cmp-cta:focus-visible");
	});

	it("TC-CLEAN-2: .cmp-cta-bg no longer appears anywhere in composer.css", () => {
		expect(css).not.toContain(".cmp-cta-bg");
		expect(css).not.toContain("--cmp-cta-bg");
	});

	it("TC-CLEAN-3: .cmp-cta is removed from the prefers-reduced-motion selector list, and the list still parses (no dangling comma, no empty selector)", () => {
		const mediaIdx = css.indexOf("@media (prefers-reduced-motion: reduce)");
		expect(mediaIdx).toBeGreaterThan(-1);
		const braceStart = css.indexOf("{", mediaIdx) + 1;
		const nextBrace = css.indexOf("{", braceStart);
		const selectorList = css.slice(braceStart, nextBrace);
		expect(selectorList).not.toContain(".cmp-cta");
		const selectors = selectorList
			.split(",")
			.map((s) => s.trim())
			.filter((s) => s.length > 0 || true);
		for (const selector of selectors) {
			expect(selector.length).toBeGreaterThan(0);
		}
	});

	it("TC-CLEAN-4: .repl-run:focus-visible no longer appears anywhere in composer.css", () => {
		expect(css).not.toContain(".repl-run:focus-visible");
	});

	it("TC-CLEAN-5 (regression guard against over-deletion): cmp-sun-spin and cmp-sun-rays are still present (daybreak.tsx:46 depends on them)", () => {
		expect(css).toContain("cmp-sun-spin");
		expect(css).toContain("cmp-sun-rays");
	});
});

/*
 * Milestone 2 slice - the two IDE frames (code-editor, pull-request), section
 * B-analog registry, section 4 (code-editor) and section 5 (pull-request)
 * component blocks, per the test-plan artifact.
 *
 * Authored red: neither "code-editor" nor "pull-request" exist in `INNERS`
 * yet, so every `INNERS[id]` lookup below is `undefined` and every render
 * throws reading `.Component`/`.defaults` off it (same authored-red
 * convention as EphemeraFrames.test.tsx's Section B/E-H blocks - the two ids
 * don't exist in the InnerId union yet either, so this typechecks red under
 * `tsc` but RUNS (and fails for the right reason) under vitest, which strips
 * types rather than checking them).
 */

const CODING_IDS = ["code-editor", "pull-request"] as const;

describe("REG - code-editor & pull-request registry", () => {
	it.each(CODING_IDS)("TC-REG-1: INNERS[%s].id === %s", (id) => {
		expect(INNERS[id]?.id).toBe(id);
	});

	it.each([
		["code-editor", "Code Editor"],
		["pull-request", "Pull Request"],
	] as const)("TC-REG-2: %s has a non-empty human-readable label", (id, label) => {
		const def = INNERS[id];
		expect(def.label.length).toBeGreaterThan(0);
		expect(def.label).toBe(label);
	});

	it.each(
		CODING_IDS,
	)("TC-REG-3: %s's .feel is non-empty and contains no em dash", (id) => {
		const def = INNERS[id];
		expect(def.feel.length).toBeGreaterThan(0);
		expect(def.feel).not.toContain("—");
	});

	it('TC-REG-4: INNERS["code-editor"].surface === "dark"', () => {
		expect(INNERS["code-editor"].surface).toBe("dark");
	});

	it('TC-REG-5: INNERS["pull-request"].surface === "light"', () => {
		expect(INNERS["pull-request"].surface).toBe("light");
	});

	it("TC-REG-7: code-editor defaults deep-equal { density: roomy, gutter: true, theme: onedark }", () => {
		expect(INNERS["code-editor"].defaults).toEqual({
			density: "roomy",
			gutter: true,
			theme: "onedark",
		});
	});

	it("TC-REG-8: pull-request defaults deep-equal { density: roomy, checks: true, state: merged }", () => {
		expect(INNERS["pull-request"].defaults).toEqual({
			density: "roomy",
			checks: true,
			state: "merged",
		});
	});

	it.each(CODING_IDS)("TC-REG-12: %s's .Component is defined", (id) => {
		expect(INNERS[id].Component).toBeDefined();
	});
});

describe("CE - Code Editor", () => {
	it("TC-CE-1: renders exactly one active tab '<topic-id>.md' and exactly one dim ghost tab", () => {
		const { container } = renderFrame("code-editor");
		const tabs = container.querySelectorAll(".editor-tab");
		expect(tabs.length).toBe(2);
		const active = container.querySelector(".editor-tab-active");
		expect(active).not.toBeNull();
		expect(active?.textContent ?? "").toContain(`${topic.id}.md`);
		const ghost = container.querySelector(".editor-tab-ghost");
		expect(ghost).not.toBeNull();
		expect(ghost).not.toBe(active);
	});

	it("TC-CE-2: gutter:true renders a left gutter column of line-number elements beside the chrome AND a continuing thin gutter rule beside the body", () => {
		const { container } = renderFrame("code-editor", {
			params: { gutter: true },
		});
		const gutter = container.querySelector(".editor-gutter");
		expect(gutter).not.toBeNull();
		expect(
			gutter?.querySelectorAll(".editor-gutter-line").length ?? 0,
		).toBeGreaterThan(0);
		expect(container.querySelector(".editor-gutter-rule")).not.toBeNull();
	});

	it("TC-CE-3: gutter:false removes the gutter column and gutter rule from the DOM entirely (not merely hidden)", () => {
		const { container } = renderFrame("code-editor", {
			params: { gutter: false },
		});
		expect(container.querySelector(".editor-gutter")).toBeNull();
		expect(container.querySelector(".editor-gutter-rule")).toBeNull();
	});

	it("TC-CE-4 (edge case, load-bearing): with gutter:true, no gutter/line-number element is a DOM ancestor of, or interleaved inside, the children container", () => {
		const { container, getByTestId } = renderFrame("code-editor", {
			params: { gutter: true },
		});
		const body = getByTestId("body");
		const gutter = container.querySelector(".editor-gutter");
		const rule = container.querySelector(".editor-gutter-rule");
		expect(gutter?.contains(body)).toBe(false);
		expect(rule?.contains(body)).toBe(false);
		expect(body.closest(".editor-gutter")).toBeNull();
		expect(body.closest(".editor-gutter-rule")).toBeNull();
	});

	it("TC-CE-5: the heading line renders as two distinguishable tokens - a # glyph in the theme's keyword color and the heading text in accent, not a single flat string", () => {
		const { container } = renderFrame("code-editor", { accent: "#a7f3d0" });
		const hash = container.querySelector(
			".editor-heading-hash",
		) as HTMLElement | null;
		const text = container.querySelector(
			".editor-heading-text",
		) as HTMLElement | null;
		expect(hash).not.toBeNull();
		expect(text).not.toBeNull();
		expect(hash?.textContent).toBe("#");
		expect(hash?.style.color).toBeTruthy();
		expect(text?.style.color).toBeTruthy();
		expect(hash?.style.color).not.toBe(text?.style.color);
	});

	it("TC-CE-6: heading text equals topic.heading", () => {
		const { container } = renderFrame("code-editor");
		expect(container.querySelector(".editor-heading-text")?.textContent).toBe(
			topic.heading,
		);
	});

	it("TC-CE-7: footer status bar renders the exact literal main* · UTF-8 · Ln 1, Col 1", () => {
		const { container } = renderFrame("code-editor");
		expect(container.textContent ?? "").toContain(
			"main* · UTF-8 · Ln 1, Col 1",
		);
	});

	it("TC-CE-8: each of the 3 themes (onedark/nord/monokai) sets distinct --ed-bg/--ed-ink/--ed-muted/--ed-keyword inline values (pairwise distinct across the 3 renders)", () => {
		const THEMES = ["onedark", "nord", "monokai"] as const;
		const VARS = ["--ed-bg", "--ed-ink", "--ed-muted", "--ed-keyword"];
		const values: Record<string, string[]> = {
			"--ed-bg": [],
			"--ed-ink": [],
			"--ed-muted": [],
			"--ed-keyword": [],
		};
		for (const theme of THEMES) {
			const { container } = renderFrame("code-editor", { params: { theme } });
			const root = container.querySelector(
				'[style*="--ed-bg"]',
			) as HTMLElement | null;
			expect(root).not.toBeNull();
			for (const key of VARS) {
				values[key]?.push(root?.style.getPropertyValue(key) ?? "");
			}
			cleanup();
		}
		for (const key of VARS) {
			expect(new Set(values[key]).size).toBe(3);
		}
	});

	it("TC-CE-9: density flows to the DENSITY_MAXW wrapper class - cozy vs roomy differ", () => {
		const { container: cozy } = renderFrame("code-editor", {
			params: { density: "cozy" },
		});
		const cozyClass = (cozy.firstElementChild as HTMLElement | null)?.className;
		cleanup();
		const { container: roomy } = renderFrame("code-editor", {
			params: { density: "roomy" },
		});
		const roomyClass = (roomy.firstElementChild as HTMLElement | null)
			?.className;
		expect(cozyClass).toContain("max-w-xl");
		expect(roomyClass).toContain("max-w-3xl");
		expect(cozyClass).not.toBe(roomyClass);
	});

	it("TC-CE-contrast (load-bearing): --ed-ink clears WCAG AA 4.5:1 against --ed-bg for all 3 themes (onedark/nord/monokai)", () => {
		const THEMES = ["onedark", "nord", "monokai"] as const;
		for (const theme of THEMES) {
			const { container } = renderFrame("code-editor", { params: { theme } });
			const root = container.querySelector(
				'[style*="--ed-bg"]',
			) as HTMLElement | null;
			expect(root).not.toBeNull();
			const bg = root?.style.getPropertyValue("--ed-bg") ?? "";
			const ink = root?.style.getPropertyValue("--ed-ink") ?? "";
			expect(bg.length).toBeGreaterThan(0);
			expect(ink.length).toBeGreaterThan(0);
			expect(contrastRatio(bg, ink)).toBeGreaterThanOrEqual(4.5);
			cleanup();
		}
	});

	it("TC-CE-10 (edge case): children render unchanged whether gutter is true or false", () => {
		const { getByTestId: getOn } = renderFrame("code-editor", {
			params: { gutter: true },
		});
		expect(getOn("body").textContent).toBe(BODY_TEXT);
		cleanup();
		const { getByTestId: getOff } = renderFrame("code-editor", {
			params: { gutter: false },
		});
		expect(getOff("body").textContent).toBe(BODY_TEXT);
	});
});

/*
 * PR block re-pins (wayfinder plan-pr-frame-spec, M2+M3) - the github-style
 * stat bar (honest +adds -dels counts + 5-square meter), the lucky-number
 * fallback, and the connected stage-bubble footer replace the plain
 * placeholder chrome TC-PR-3/4/5/7 originally pinned. TC-PR-1/2/6/6b/8/9/
 * contrast are UNCHANGED regression pins - the chrome contract around the
 * re-pinned pieces must survive untouched.
 *
 * Authored red: `pull-request.tsx` still renders the OLD chrome (plain
 * index+1 number always, `.pr-stat-add`/`.pr-stat-del` color-block bar with
 * no counts, `✓ ci · ✓ lint · ✓ tests` footer literal, no --pr-add/--pr-del
 * vars) - so every re-pinned/new assertion below fails until the frame spec
 * lands. `countDiffChars`/`statSquares` import from `../pr-diff` (which DOES
 * exist, M1 already shipped) so the helpers themselves are green; only the
 * component's use of them is missing.
 */

/** No-prDiff fixture (the module-level `topic` const) doubles as the
 * fallback-path fixture per the plan's reuse note - reused via renderFrame's
 * default `topic` param throughout this block. */

const PR_LUCKY_TOPIC: Topic = {
	...topic,
	prDiff: {
		number: 7,
		replacements: [{ strike: "old", anchor: "real body" }],
	},
};

const PR_NO_NUMBER_TOPIC: Topic = {
	...topic,
	prDiff: {
		replacements: [{ strike: "old", anchor: "real body" }],
	},
};

/** Teaser + matching replacements, so countDiffChars/statSquares produce
 * genuine non-zero counts to assert the rendered `+adds -dels` and squares
 * against the imported helpers (not hardcoded literals). */
const PR_MATCHED_TEASER =
	"This project uses quick fixes and clever solutions to solve hard problems fast.";
const PR_MATCHED_REPLACEMENTS = [
	{ strike: "slow", anchor: "quick" },
	{ strike: "boring", anchor: "clever" },
];
const PR_MATCHED_TOPIC: Topic = {
	...topic,
	teaser: PR_MATCHED_TEASER,
	prDiff: { number: 7, replacements: PR_MATCHED_REPLACEMENTS },
};

/** Replacements present but the teaser contains none of the anchors -
 * TC-PR-4c's edge: must degrade to +0 -0 / 5 neutral, no throw. */
const PR_UNMATCHED_TOPIC: Topic = {
	...topic,
	teaser: "Nothing here relates to any of the replacement anchors at all.",
	prDiff: {
		number: 7,
		replacements: [{ strike: "old", anchor: "nonexistent-anchor-word" }],
	},
};

describe("PR - Pull Request", () => {
	it("TC-PR-1: header band renders the exact branch-chip text alp:feat/<topic-id> → main (mono)", () => {
		const { container } = renderFrame("pull-request");
		const chip = container.querySelector(
			".pr-branch-chip",
		) as HTMLElement | null;
		expect(chip).not.toBeNull();
		expect(chip?.textContent ?? "").toContain(`alp:feat/${topic.id} → main`);
		expect(chip?.className ?? "").toContain("font-mono");
	});

	it("TC-PR-2: state badge text/color differs across all 3 states (open/merged/draft) - pairwise distinct renders", () => {
		const STATES = ["open", "merged", "draft"] as const;
		const pairs = STATES.map((state) => {
			const { container } = renderFrame("pull-request", { params: { state } });
			const badge = container.querySelector(
				".pr-state-badge",
			) as HTMLElement | null;
			const text = badge?.textContent ?? "";
			const color = badge?.style.backgroundColor || badge?.style.color || "";
			cleanup();
			return `${text}|${color}`;
		});
		expect(new Set(pairs).size).toBe(3);
	});

	it.each([
		[0, "#1"],
		[9, "#10"],
	] as const)("TC-PR-3: no-prDiff fixture - heading renders the PR title text === topic.heading, with a dim sibling #<index+1> (index %s -> %s)", (index, expected) => {
		const { container } = renderFrame("pull-request", { index });
		const heading = container.querySelector(".pr-heading");
		expect(heading?.textContent).toBe(topic.heading);
		const number = container.querySelector(".pr-number");
		expect(number?.textContent).toBe(expected);
	});

	it.each([
		[0, "#7"],
		[9, "#7"],
	] as const)("TC-PR-3b: topic with prDiff.number:7 renders #7 regardless of index (index %s -> %s)", (index, expected) => {
		const { container } = renderFrame("pull-request", {
			topic: PR_LUCKY_TOPIC,
			index,
		});
		const number = container.querySelector(".pr-number");
		expect(number?.textContent).toBe(expected);
	});

	it.each([
		[0, "#1"],
		[9, "#10"],
	] as const)("TC-PR-3c (edge): prDiff present but number omitted falls back to #<index+1> (index %s -> %s)", (index, expected) => {
		const { container } = renderFrame("pull-request", {
			topic: PR_NO_NUMBER_TOPIC,
			index,
		});
		const number = container.querySelector(".pr-number");
		expect(number?.textContent).toBe(expected);
	});

	it("TC-PR-4 (re-pin): .pr-stat-bar renders +0/-0 and exactly 5 neutral squares for a no-prDiff fixture, for both checks values (stat bar independent of checks)", () => {
		for (const checks of [true, false]) {
			const { container } = renderFrame("pull-request", {
				params: { checks },
			});
			const bar = container.querySelector(".pr-stat-bar");
			expect(bar).not.toBeNull();
			expect(bar?.querySelector(".pr-stat-count--add")?.textContent).toBe("+0");
			expect(bar?.querySelector(".pr-stat-count--del")?.textContent).toBe("-0");
			const squares = bar?.querySelectorAll(".pr-stat-sq") ?? [];
			expect(squares.length).toBe(5);
			for (const sq of Array.from(squares)) {
				expect(sq.className).toContain("pr-stat-sq--neutral");
			}
			cleanup();
		}
	});

	it("TC-PR-4b: a topic fixture with teaser + matching replacements renders +adds -dels and square-kind counts that EXACTLY match countDiffChars/statSquares, not hardcoded literals", () => {
		const { adds, dels } = countDiffChars(
			PR_MATCHED_TEASER,
			PR_MATCHED_REPLACEMENTS,
		);
		const expectedSquares = statSquares(adds, dels);
		const { container } = renderFrame("pull-request", {
			topic: PR_MATCHED_TOPIC,
		});
		const bar = container.querySelector(".pr-stat-bar");
		expect(bar?.querySelector(".pr-stat-count--add")?.textContent).toBe(
			`+${adds}`,
		);
		expect(bar?.querySelector(".pr-stat-count--del")?.textContent).toBe(
			`-${dels}`,
		);
		const squares = Array.from(bar?.querySelectorAll(".pr-stat-sq") ?? []);
		expect(squares.length).toBe(5);
		const renderedKinds = squares.map((sq) => {
			if (sq.className.includes("pr-stat-sq--add")) return "add";
			if (sq.className.includes("pr-stat-sq--del")) return "del";
			return "neutral";
		});
		expect(renderedKinds).toEqual(expectedSquares);
	});

	it("TC-PR-4c (edge): prDiff.replacements present but none match the fixture teaser -> +0 -0, 5 neutral, no throw", () => {
		expect(() => {
			renderFrame("pull-request", { topic: PR_UNMATCHED_TOPIC });
		}).not.toThrow();
		const { container } = renderFrame("pull-request", {
			topic: PR_UNMATCHED_TOPIC,
		});
		const bar = container.querySelector(".pr-stat-bar");
		expect(bar?.querySelector(".pr-stat-count--add")?.textContent).toBe("+0");
		expect(bar?.querySelector(".pr-stat-count--del")?.textContent).toBe("-0");
		const squares = bar?.querySelectorAll(".pr-stat-sq") ?? [];
		expect(squares.length).toBe(5);
		for (const sq of Array.from(squares)) {
			expect(sq.className).toContain("pr-stat-sq--neutral");
		}
	});

	it("TC-PR-5 (re-pin): checks:true renders exactly 3 .pr-stage-bubble nodes (each with a tick) with .pr-stage-lbl ci/lint/tests IN ORDER, and exactly 2 .pr-stage-connector nodes between them", () => {
		const { container } = renderFrame("pull-request", {
			params: { checks: true },
		});
		const bubbles = container.querySelectorAll(".pr-stage-bubble");
		expect(bubbles.length).toBe(3);
		for (const bubble of Array.from(bubbles)) {
			expect(bubble.textContent ?? "").toContain("✓");
		}
		const labels = Array.from(container.querySelectorAll(".pr-stage-lbl")).map(
			(el) => el.textContent,
		);
		expect(labels).toEqual(["ci", "lint", "tests"]);
		const connectors = container.querySelectorAll(".pr-stage-connector");
		expect(connectors.length).toBe(2);
	});

	it("TC-PR-5b (negative): the old literal ✓ ci · ✓ lint · ✓ tests is ABSENT when checks:true", () => {
		const { container } = renderFrame("pull-request", {
			params: { checks: true },
		});
		expect(container.textContent ?? "").not.toContain(
			"✓ ci · ✓ lint · ✓ tests",
		);
	});

	it("TC-PR-6: checks:false removes the entire footer checks row from the DOM entirely (not merely hidden)", () => {
		const { container } = renderFrame("pull-request", {
			params: { checks: false },
		});
		expect(container.querySelector(".pr-checks")).toBeNull();
		expect(container.textContent ?? "").not.toContain("✓ ci");
	});

	it("TC-PR-6b: nothing else besides the checks row is gated by checks", () => {
		const { container } = renderFrame("pull-request", {
			params: { checks: false },
		});
		expect(container.querySelector(".pr-branch-chip")).not.toBeNull();
		expect(container.querySelector(".pr-state-badge")).not.toBeNull();
		expect(container.querySelector(".pr-stat-bar")).not.toBeNull();
		expect(container.querySelector(".pr-heading")?.textContent).toBe(
			topic.heading,
		);
	});

	it("TC-PR-7 (re-pin): --pr-paper/--pr-ink AND the new --pr-add/--pr-del vars are set inline and IDENTICAL across all 3 state values (fixed constants, deliberately state-independent)", () => {
		const STATES = ["open", "merged", "draft"] as const;
		const papers: string[] = [];
		const inks: string[] = [];
		const adds: string[] = [];
		const dels: string[] = [];
		for (const state of STATES) {
			const { container } = renderFrame("pull-request", { params: { state } });
			const root = container.querySelector(
				'[style*="--pr-paper"]',
			) as HTMLElement | null;
			expect(root).not.toBeNull();
			papers.push(root?.style.getPropertyValue("--pr-paper") ?? "");
			inks.push(root?.style.getPropertyValue("--pr-ink") ?? "");
			adds.push(root?.style.getPropertyValue("--pr-add") ?? "");
			dels.push(root?.style.getPropertyValue("--pr-del") ?? "");
			cleanup();
		}
		expect(papers[0]).toBeTruthy();
		expect(inks[0]).toBeTruthy();
		expect(adds[0]).toBeTruthy();
		expect(dels[0]).toBeTruthy();
		expect(new Set(papers).size).toBe(1);
		expect(new Set(inks).size).toBe(1);
		expect(new Set(adds).size).toBe(1);
		expect(new Set(dels).size).toBe(1);
	});

	it("TC-PR-8: body/children sit clear in the middle, siblings of (not inside) the header band, stat bar, and footer decoration", () => {
		const { container, getByTestId } = renderFrame("pull-request");
		const body = getByTestId("body");
		expect(container.querySelector(".pr-branch-chip")?.contains(body)).toBe(
			false,
		);
		expect(container.querySelector(".pr-stat-bar")?.contains(body)).toBe(false);
		expect(container.querySelector(".pr-checks")?.contains(body)).toBe(false);
	});

	it("TC-PR-contrast (load-bearing): --pr-ink clears WCAG AA 4.5:1 against --pr-paper", () => {
		const { container } = renderFrame("pull-request");
		const root = container.querySelector(
			'[style*="--pr-paper"]',
		) as HTMLElement | null;
		expect(root).not.toBeNull();
		const paper = root?.style.getPropertyValue("--pr-paper") ?? "";
		const ink = root?.style.getPropertyValue("--pr-ink") ?? "";
		expect(paper.length).toBeGreaterThan(0);
		expect(ink.length).toBeGreaterThan(0);
		expect(contrastRatio(paper, ink)).toBeGreaterThanOrEqual(4.5);
	});

	it("TC-PR-9: heading === topic.heading", () => {
		const { container } = renderFrame("pull-request");
		expect(container.querySelector(".pr-heading")?.textContent).toBe(
			topic.heading,
		);
	});
});

/*
 * Milestone 3 slice - the version-control/retro pair (commit-graph,
 * man-page), section 6 (commit-graph) and section 7 (man-page) of the
 * test-plan artifact.
 *
 * Authored red: neither "commit-graph" nor "man-page" exist in `INNERS` yet
 * (same authored-red convention as the M2 block above) - every
 * `INNERS[id]` lookup below is `undefined`, so registry assertions fail on
 * `undefined` and renders throw reading `.Component`/`.defaults` off it. This
 * typechecks red under `tsc` (the two ids aren't in the `InnerId` union yet
 * either) but RUNS under vitest, which strips types.
 */

const CODING_IDS_M3 = ["commit-graph", "man-page"] as const;

describe("REG - commit-graph & man-page registry", () => {
	it.each(CODING_IDS_M3)("TC-REG-1: INNERS[%s].id === %s", (id) => {
		expect(INNERS[id]?.id).toBe(id);
	});

	it.each([
		["commit-graph", "Commit Graph"],
		["man-page", "Man Page"],
	] as const)("TC-REG-2: %s has a non-empty human-readable label", (id, label) => {
		const def = INNERS[id];
		expect(def.label.length).toBeGreaterThan(0);
		expect(def.label).toBe(label);
	});

	it.each(
		CODING_IDS_M3,
	)("TC-REG-3: %s's .feel is non-empty and contains no em dash", (id) => {
		const def = INNERS[id];
		expect(def.feel.length).toBeGreaterThan(0);
		expect(def.feel).not.toContain("—");
	});

	it('TC-REG-5: INNERS["commit-graph"].surface === "light"', () => {
		expect(INNERS["commit-graph"].surface).toBe("light");
	});

	it('TC-REG-5: INNERS["man-page"].surface === "light"', () => {
		expect(INNERS["man-page"].surface).toBe("light");
	});

	it("TC-REG-9: commit-graph defaults deep-equal { density: roomy, refs: true, stock: white }", () => {
		expect(INNERS["commit-graph"].defaults).toEqual({
			density: "roomy",
			refs: true,
			stock: "white",
		});
	});

	it("TC-REG-10: man-page defaults deep-equal { density: roomy, tractor: true, stock: greenbar }", () => {
		expect(INNERS["man-page"].defaults).toEqual({
			density: "roomy",
			tractor: true,
			stock: "greenbar",
		});
	});

	it.each(CODING_IDS_M3)("TC-REG-12: %s's .Component is defined", (id) => {
		expect(INNERS[id].Component).toBeDefined();
	});
});

describe("CG - Commit Graph", () => {
	it("TC-CG-1: header band renders an inline SVG lane graph (2-3 lanes, a curving branch, dot nodes) as a distinct element from the SHA column", () => {
		const { container } = renderFrame("commit-graph");
		const svg = container.querySelector(".cg-lanes svg");
		expect(svg).not.toBeNull();
		const lanes = svg?.querySelectorAll("path, line") ?? [];
		expect(lanes.length).toBeGreaterThanOrEqual(2);
		expect(lanes.length).toBeLessThanOrEqual(3);
		const nodes = svg?.querySelectorAll("circle") ?? [];
		expect(nodes.length).toBeGreaterThan(0);
		const shaCol = container.querySelector(".cg-sha-col");
		expect(shaCol).not.toBeNull();
		expect(shaCol?.contains(svg as Node)).toBe(false);
		expect(container.querySelector(".cg-lanes")?.contains(shaCol as Node)).toBe(
			false,
		);
	});

	it("TC-CG-2: a mono column of fake short SHAs renders, each matching a 7-hex-char pattern", () => {
		const { container } = renderFrame("commit-graph");
		const shaCol = container.querySelector(".cg-sha-col");
		expect(shaCol).not.toBeNull();
		expect(shaCol?.className ?? "").toContain("font-mono");
		const shas = container.querySelectorAll(".cg-sha");
		expect(shas.length).toBeGreaterThan(0);
		for (const sha of Array.from(shas)) {
			expect(sha.textContent ?? "").toMatch(/^[0-9a-f]{7}$/);
		}
	});

	it("TC-CG-3 (determinism): two renders at the same index produce byte-identical SHA text", () => {
		const { container: a } = renderFrame("commit-graph", { index: 4 });
		const textA = a.querySelector(".cg-sha-col")?.textContent ?? "";
		cleanup();
		const { container: b } = renderFrame("commit-graph", { index: 4 });
		const textB = b.querySelector(".cg-sha-col")?.textContent ?? "";
		expect(textA.length).toBeGreaterThan(0);
		expect(textA).toBe(textB);
	});

	it("TC-CG-4: index 3 and index 7 produce DIFFERENT SHA text (derived from index, not wall-clock/random)", () => {
		const { container: a } = renderFrame("commit-graph", { index: 3 });
		const textA = a.querySelector(".cg-sha-col")?.textContent ?? "";
		cleanup();
		const { container: b } = renderFrame("commit-graph", { index: 7 });
		const textB = b.querySelector(".cg-sha-col")?.textContent ?? "";
		expect(textA).not.toBe(textB);
	});

	it("TC-CG-5: heading renders the exact literal feat: <heading> in bold display type, using topic.heading verbatim after the prefix", () => {
		const { container } = renderFrame("commit-graph");
		const heading = container.querySelector(".cg-heading");
		expect(heading).not.toBeNull();
		expect(heading?.textContent).toBe(`feat: ${topic.heading}`);
		expect(heading?.className ?? "").toContain("font-bold");
	});

	it("TC-CG-6: refs:true renders footer ref chips HEAD -> main and tag: v1.<index> (edge case: index 3 -> tag: v1.3)", () => {
		const { container } = renderFrame("commit-graph", {
			params: { refs: true },
			index: 3,
		});
		const headChip = container.querySelector(".cg-ref-head");
		const tagChip = container.querySelector(".cg-ref-tag");
		expect(headChip?.textContent ?? "").toBe("HEAD -> main");
		expect(tagChip?.textContent ?? "").toBe("tag: v1.3");
	});

	it("TC-CG-7: refs:false removes both ref chips from the DOM entirely", () => {
		const { container } = renderFrame("commit-graph", {
			params: { refs: false },
		});
		expect(container.querySelector(".cg-ref-head")).toBeNull();
		expect(container.querySelector(".cg-ref-tag")).toBeNull();
	});

	it("TC-CG-8: each of the 3 stocks (white/cream/mist) sets distinct --cg-paper/--cg-ink inline values", () => {
		const STOCKS = ["white", "cream", "mist"] as const;
		const papers: string[] = [];
		const inks: string[] = [];
		for (const stock of STOCKS) {
			const { container } = renderFrame("commit-graph", { params: { stock } });
			const root = container.querySelector(
				'[style*="--cg-paper"]',
			) as HTMLElement | null;
			expect(root).not.toBeNull();
			papers.push(root?.style.getPropertyValue("--cg-paper") ?? "");
			inks.push(root?.style.getPropertyValue("--cg-ink") ?? "");
			cleanup();
		}
		expect(new Set(papers).size).toBe(3);
		expect(new Set(inks).size).toBe(3);
	});

	it("TC-CG-contrast (load-bearing): --cg-ink clears WCAG AA 4.5:1 against --cg-paper for all 3 stocks (white/cream/mist)", () => {
		const STOCKS = ["white", "cream", "mist"] as const;
		for (const stock of STOCKS) {
			const { container } = renderFrame("commit-graph", { params: { stock } });
			const root = container.querySelector(
				'[style*="--cg-paper"]',
			) as HTMLElement | null;
			expect(root).not.toBeNull();
			const paper = root?.style.getPropertyValue("--cg-paper") ?? "";
			const ink = root?.style.getPropertyValue("--cg-ink") ?? "";
			expect(paper.length).toBeGreaterThan(0);
			expect(ink.length).toBeGreaterThan(0);
			expect(contrastRatio(paper, ink)).toBeGreaterThanOrEqual(4.5);
			cleanup();
		}
	});

	it("TC-CG-9 (edge case): children render unchanged as the commit body clear below the heading, regardless of the refs toggle", () => {
		for (const refs of [true, false]) {
			const { getByTestId } = renderFrame("commit-graph", { params: { refs } });
			expect(getByTestId("body").textContent).toBe(BODY_TEXT);
			cleanup();
		}
	});

	it("TC-CG-10: nodes in the lane SVG use the accent color and lanes stroke --cg-ink at low opacity - two different accent values produce visibly different lane-graph markup", () => {
		const { container: a } = renderFrame("commit-graph", { accent: "#a7f3d0" });
		const htmlA = a.querySelector(".cg-lanes")?.innerHTML ?? "";
		cleanup();
		const { container: b } = renderFrame("commit-graph", { accent: "#f472b6" });
		const htmlB = b.querySelector(".cg-lanes")?.innerHTML ?? "";
		expect(htmlA.length).toBeGreaterThan(0);
		expect(htmlA).not.toBe(htmlB);
	});
});

describe("MP - Man Page", () => {
	it("TC-MP-1: top header line renders the exact pattern <HEADING>(1)   User Commands   <HEADING>(1) in mono caps", () => {
		const { container } = renderFrame("man-page");
		const line = container.querySelector(".manpage-header-line");
		expect(line).not.toBeNull();
		const HEADING = topic.heading.toUpperCase();
		expect(line?.textContent).toBe(
			`${HEADING}(1)   User Commands   ${HEADING}(1)`,
		);
		expect(line?.className ?? "").toContain("font-mono");
	});

	it("TC-MP-2 (edge case, load-bearing): a mixed-case heading fixture is UPPERCASED on both sides of the header line, proving a real transform", () => {
		const mixedTopic: Topic = {
			...topic,
			id: "tech-stack",
			heading: "Tech Stack",
		};
		const { container } = renderFrame("man-page", { topic: mixedTopic });
		const line = container.querySelector(".manpage-header-line");
		expect(line?.textContent).toBe(
			"TECH STACK(1)   User Commands   TECH STACK(1)",
		);
		expect(line?.textContent ?? "").not.toContain("Tech Stack(1)");
	});

	it("TC-MP-3: a NAME eyebrow renders above the heading rendered big/mono/bold as the name line", () => {
		const { container } = renderFrame("man-page");
		const eyebrow = container.querySelector(".manpage-name-eyebrow");
		const nameLine = container.querySelector(".manpage-name-line");
		expect(eyebrow?.textContent).toBe("NAME");
		expect(nameLine).not.toBeNull();
		expect(nameLine?.textContent).toBe(topic.heading);
		expect(nameLine?.className ?? "").toContain("font-mono");
		expect(nameLine?.className ?? "").toContain("font-bold");
		const all = Array.from(container.querySelectorAll("*"));
		expect(all.indexOf(eyebrow as Element)).toBeLessThan(
			all.indexOf(nameLine as Element),
		);
	});

	it("TC-MP-4: a DESCRIPTION eyebrow renders above children, and is never a DOM ancestor of children", () => {
		const { container, getByTestId } = renderFrame("man-page");
		const body = getByTestId("body");
		const eyebrow = container.querySelector(".manpage-description-eyebrow");
		expect(eyebrow?.textContent).toBe("DESCRIPTION");
		expect(eyebrow?.contains(body)).toBe(false);
		expect(body.closest(".manpage-description-eyebrow")).toBeNull();
		const text = container.textContent ?? "";
		expect(text.indexOf("DESCRIPTION")).toBeLessThan(text.indexOf(BODY_TEXT));
	});

	it("TC-MP-5: footer renders the exact literal alper 1.0   July 2026   <HEADING>(1) with <HEADING> uppercased", () => {
		const { container } = renderFrame("man-page");
		const footer = container.querySelector(".manpage-footer");
		const HEADING = topic.heading.toUpperCase();
		expect(footer?.textContent).toBe(`alper 1.0   July 2026   ${HEADING}(1)`);
	});

	it("TC-MP-6: tractor:true renders both left and right sprocket-hole edge strips (2 elements)", () => {
		const { container } = renderFrame("man-page", {
			params: { tractor: true },
		});
		expect(container.querySelector(".manpage-tractor-left")).not.toBeNull();
		expect(container.querySelector(".manpage-tractor-right")).not.toBeNull();
	});

	it("TC-MP-7: tractor:false removes BOTH edge strips from the DOM entirely", () => {
		const { container } = renderFrame("man-page", {
			params: { tractor: false },
		});
		expect(container.querySelector(".manpage-tractor-left")).toBeNull();
		expect(container.querySelector(".manpage-tractor-right")).toBeNull();
	});

	it("TC-MP-8: only the greenbar stock renders the alternating-band decoration; white and aged do not", () => {
		const { container: gb } = renderFrame("man-page", {
			params: { stock: "greenbar" },
		});
		expect(gb.querySelector(".manpage-greenbar")).not.toBeNull();
		cleanup();
		const { container: white } = renderFrame("man-page", {
			params: { stock: "white" },
		});
		expect(white.querySelector(".manpage-greenbar")).toBeNull();
		cleanup();
		const { container: aged } = renderFrame("man-page", {
			params: { stock: "aged" },
		});
		expect(aged.querySelector(".manpage-greenbar")).toBeNull();
	});

	it("TC-MP-9: each of the 3 stocks sets distinct --mp-paper/--mp-ink inline values", () => {
		const STOCKS = ["white", "greenbar", "aged"] as const;
		const papers: string[] = [];
		const inks: string[] = [];
		for (const stock of STOCKS) {
			const { container } = renderFrame("man-page", { params: { stock } });
			const root = container.querySelector(
				'[style*="--mp-paper"]',
			) as HTMLElement | null;
			expect(root).not.toBeNull();
			papers.push(root?.style.getPropertyValue("--mp-paper") ?? "");
			inks.push(root?.style.getPropertyValue("--mp-ink") ?? "");
			cleanup();
		}
		expect(new Set(papers).size).toBe(3);
		expect(new Set(inks).size).toBe(3);
	});

	it("TC-MP-10: accent appears only on a single thin rule under the header line; header/name/footer text uses --mp-ink (two renders with different accent values are identical except that rule)", () => {
		const { container: a } = renderFrame("man-page", { accent: "#a7f3d0" });
		const ruleA = a.querySelector(".manpage-accent-rule") as HTMLElement | null;
		expect(ruleA).not.toBeNull();
		const colorA =
			ruleA?.style.backgroundColor ||
			ruleA?.style.borderColor ||
			ruleA?.style.color ||
			"";
		const headerA = a.querySelector(
			".manpage-header-line",
		) as HTMLElement | null;
		const headerHtmlA = (headerA?.outerHTML ?? "").replace(/#a7f3d0/g, "");
		cleanup();

		const { container: b } = renderFrame("man-page", { accent: "#f472b6" });
		const ruleB = b.querySelector(".manpage-accent-rule") as HTMLElement | null;
		const colorB =
			ruleB?.style.backgroundColor ||
			ruleB?.style.borderColor ||
			ruleB?.style.color ||
			"";
		const headerB = b.querySelector(
			".manpage-header-line",
		) as HTMLElement | null;
		const headerHtmlB = (headerB?.outerHTML ?? "").replace(/#f472b6/g, "");

		expect(colorA).toBeTruthy();
		expect(colorA).not.toBe(colorB);
		expect(headerHtmlA).toBe(headerHtmlB);
	});

	it("TC-MP-contrast (load-bearing): --mp-ink clears WCAG AA 4.5:1 against --mp-paper for all 3 stocks (white/greenbar/aged)", () => {
		const STOCKS = ["white", "greenbar", "aged"] as const;
		for (const stock of STOCKS) {
			const { container } = renderFrame("man-page", { params: { stock } });
			const root = container.querySelector(
				'[style*="--mp-paper"]',
			) as HTMLElement | null;
			expect(root).not.toBeNull();
			const paper = root?.style.getPropertyValue("--mp-paper") ?? "";
			const ink = root?.style.getPropertyValue("--mp-ink") ?? "";
			expect(paper.length).toBeGreaterThan(0);
			expect(ink.length).toBeGreaterThan(0);
			expect(contrastRatio(paper, ink)).toBeGreaterThanOrEqual(4.5);
			cleanup();
		}
	});

	it("TC-MP-11: heading === topic.heading (pre-transform, distinct from the uppercased header-line copy)", () => {
		const { container } = renderFrame("man-page");
		const nameLine = container.querySelector(".manpage-name-line");
		expect(nameLine?.textContent).toBe(topic.heading);
		expect(nameLine?.textContent).not.toBe(topic.heading.toUpperCase());
	});
});

/*
 * Milestone 4 slice (final) - keycaps, the last coding frame, section 8 of
 * the test-plan artifact.
 *
 * Authored red: "keycaps" does not exist in `INNERS` yet - every
 * `INNERS["keycaps"]` lookup below is `undefined`, so registry assertions
 * fail on `undefined` and renders throw reading `.Component`/`.defaults` off
 * it (same authored-red convention as the M2/M3 blocks above). "keycaps"
 * isn't in the `InnerId` union yet either, so this typechecks red under
 * `tsc` but RUNS (and fails for the right reason) under vitest, which strips
 * types rather than checking them.
 *
 * The `topic` fixture at the top of this file ("Tech Stack") already has a
 * heading with a space - reused verbatim here as this build's fixture
 * convention for the spacer edge case (TC-KC-2/TC-KC-3), rather than
 * introducing a second topic fixture.
 */

describe("REG - keycaps registry (final coding frame)", () => {
	it('TC-REG-1: INNERS["keycaps"].id === "keycaps"', () => {
		expect(INNERS.keycaps?.id).toBe("keycaps");
	});

	it("TC-REG-2: label is exactly 'Keycaps'", () => {
		expect(INNERS.keycaps.label).toBe("Keycaps");
	});

	it("TC-REG-3: .feel is non-empty and contains no em dash", () => {
		expect(INNERS.keycaps.feel.length).toBeGreaterThan(0);
		expect(INNERS.keycaps.feel).not.toContain("—");
	});

	it('TC-REG-6: INNERS["keycaps"].surface === "plate"', () => {
		expect(INNERS.keycaps.surface).toBe("plate");
	});

	it('TC-REG-11: INNERS["keycaps"].defaults deep-equals { density: roomy, backlight: true, colorway: beige }', () => {
		expect(INNERS.keycaps.defaults).toEqual({
			density: "roomy",
			backlight: true,
			colorway: "beige",
		});
	});

	it("TC-REG-12: Component is defined", () => {
		expect(INNERS.keycaps.Component).toBeDefined();
	});

	it("TC-REG-13 (final negative-registry guard): the rejected crt-terminal sibling never made it into INNERS - the retro-CRT flavor stayed with arcade-hud/man-page, per the plan's reuse note", () => {
		expect(Object.keys(INNERS)).not.toContain("crt-terminal");
	});
});

describe("KC - Keycaps", () => {
	it("TC-KC-1: renders one keycap tile per non-space character of topic.heading, each carrying a single-character legend", () => {
		const { container } = renderFrame("keycaps");
		const nonSpaceChars = topic.heading.replace(/\s/g, "").split("");
		const tiles = container.querySelectorAll(".keycap-tile");
		expect(tiles.length).toBe(nonSpaceChars.length);
		Array.from(tiles).forEach((tile, i) => {
			const legend = tile.querySelector(".keycap-legend");
			expect(legend?.textContent).toBe(nonSpaceChars[i]);
		});
	});

	it("TC-KC-2 (edge case): a space in the heading becomes a spacer element, never an empty/blank keycap tile", () => {
		const { container } = renderFrame("keycaps");
		expect(topic.heading).toContain(" ");
		const spacers = container.querySelectorAll(".keycap-spacer");
		expect(spacers.length).toBe((topic.heading.match(/ /g) ?? []).length);
		const tiles = container.querySelectorAll(".keycap-tile");
		for (const tile of Array.from(tiles)) {
			const legend = tile.querySelector(".keycap-legend");
			expect((legend?.textContent ?? "").trim().length).toBeGreaterThan(0);
			expect(legend?.textContent).not.toBe(" ");
		}
	});

	it("TC-KC-3: concatenating every keycap's legend text, in DOM order, reconstructs topic.heading with spaces removed", () => {
		const { container } = renderFrame("keycaps");
		const legends = Array.from(container.querySelectorAll(".keycap-legend"));
		const reconstructed = legends.map((l) => l.textContent ?? "").join("");
		expect(reconstructed).toBe(topic.heading.replace(/\s/g, ""));
	});

	it("TC-KC-4: backlight:true gives every keycap a glow style sourced from --kc-glow (set inline from the accent prop)", () => {
		const { container } = renderFrame("keycaps", {
			params: { backlight: true },
			accent: "#a7f3d0",
		});
		const root = container.querySelector(
			'[style*="--kc-glow"]',
		) as HTMLElement | null;
		expect(root).not.toBeNull();
		expect(root?.style.getPropertyValue("--kc-glow")).toBeTruthy();
		const tiles = container.querySelectorAll(".keycap-tile");
		expect(tiles.length).toBeGreaterThan(0);
		for (const tile of Array.from(tiles)) {
			expect((tile as HTMLElement).style.boxShadow).toMatch(/var\(--kc-glow/);
		}
	});

	it("TC-KC-5: backlight:false removes the glow styling from every keycap entirely, while the caps themselves and their legends remain", () => {
		const { container } = renderFrame("keycaps", {
			params: { backlight: false },
		});
		const root = container.querySelector(
			'[style*="--kc-glow"]',
		) as HTMLElement | null;
		expect(root).toBeNull();
		const tiles = container.querySelectorAll(".keycap-tile");
		expect(tiles.length).toBeGreaterThan(0);
		for (const tile of Array.from(tiles)) {
			expect((tile as HTMLElement).style.boxShadow ?? "").not.toMatch(
				/var\(--kc-glow/,
			);
			expect(tile.querySelector(".keycap-legend")).not.toBeNull();
		}
	});

	it("TC-KC-6: a slim spacebar-shaped rule renders below the caps regardless of backlight value", () => {
		for (const backlight of [true, false]) {
			const { container } = renderFrame("keycaps", { params: { backlight } });
			const rule = container.querySelector(".keycap-rule");
			expect(rule).not.toBeNull();
			const row = container.querySelector(".keycap-row");
			const all = Array.from(container.querySelectorAll("*"));
			expect(all.indexOf(row as Element)).toBeLessThan(
				all.indexOf(rule as Element),
			);
			cleanup();
		}
	});

	it("TC-KC-7: each of the 3 colorways (beige/graphite/milkshake) sets distinct --kc-cap/--kc-ink inline values", () => {
		const COLORWAYS = ["beige", "graphite", "milkshake"] as const;
		const caps: string[] = [];
		const inks: string[] = [];
		for (const colorway of COLORWAYS) {
			const { container } = renderFrame("keycaps", { params: { colorway } });
			const root = container.querySelector(
				'[style*="--kc-cap"]',
			) as HTMLElement | null;
			expect(root).not.toBeNull();
			caps.push(root?.style.getPropertyValue("--kc-cap") ?? "");
			inks.push(root?.style.getPropertyValue("--kc-ink") ?? "");
			cleanup();
		}
		expect(new Set(caps).size).toBe(3);
		expect(new Set(inks).size).toBe(3);
	});

	it("TC-KC-8 (edge case): changing colorway does NOT change --kc-glow's color source - glow always tracks the accent prop independent of colorway", () => {
		const COLORWAYS = ["beige", "graphite", "milkshake"] as const;
		const glows: string[] = [];
		for (const colorway of COLORWAYS) {
			const { container } = renderFrame("keycaps", {
				params: { colorway },
				accent: "#a7f3d0",
			});
			const root = container.querySelector(
				'[style*="--kc-glow"]',
			) as HTMLElement | null;
			expect(root).not.toBeNull();
			glows.push(root?.style.getPropertyValue("--kc-glow") ?? "");
			cleanup();
		}
		expect(glows[0]).toBeTruthy();
		expect(new Set(glows).size).toBe(1);
	});

	it("TC-KC-contrast (load-bearing): --kc-ink clears WCAG AA 4.5:1 against --kc-cap (the legend-on-cap pair) for all 3 colorways (beige/graphite/milkshake)", () => {
		const COLORWAYS = ["beige", "graphite", "milkshake"] as const;
		for (const colorway of COLORWAYS) {
			const { container } = renderFrame("keycaps", { params: { colorway } });
			const root = container.querySelector(
				'[style*="--kc-cap"]',
			) as HTMLElement | null;
			expect(root).not.toBeNull();
			const cap = root?.style.getPropertyValue("--kc-cap") ?? "";
			const ink = root?.style.getPropertyValue("--kc-ink") ?? "";
			expect(cap.length).toBeGreaterThan(0);
			expect(ink.length).toBeGreaterThan(0);
			expect(contrastRatio(cap, ink)).toBeGreaterThanOrEqual(4.5);
			cleanup();
		}
	});

	it("TC-KC-9: cap size differs between density: cozy and density: roomy", () => {
		const { container: cozy } = renderFrame("keycaps", {
			params: { density: "cozy" },
		});
		const cozyTile = cozy.querySelector(".keycap-tile") as HTMLElement | null;
		const cozyClass = cozyTile?.className ?? "";
		cleanup();
		const { container: roomy } = renderFrame("keycaps", {
			params: { density: "roomy" },
		});
		const roomyTile = roomy.querySelector(".keycap-tile") as HTMLElement | null;
		const roomyClass = roomyTile?.className ?? "";
		expect(cozyClass).toBeTruthy();
		expect(roomyClass).toBeTruthy();
		expect(cozyClass).not.toBe(roomyClass);
	});

	it("TC-KC-10: body/children sit clear on the plate surface with no keycap or bevel decoration overlapping them (ancestor check)", () => {
		const { container, getByTestId } = renderFrame("keycaps");
		const body = getByTestId("body");
		const row = container.querySelector(".keycap-row");
		const rule = container.querySelector(".keycap-rule");
		expect(row?.contains(body)).toBe(false);
		expect(rule?.contains(body)).toBe(false);
		expect(body.closest(".keycap-row")).toBeNull();
		expect(body.closest(".keycap-tile")).toBeNull();
		expect(body.closest(".keycap-rule")).toBeNull();
	});
});
