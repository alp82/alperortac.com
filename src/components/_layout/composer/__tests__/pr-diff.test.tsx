// @vitest-environment jsdom

/*
 * pr-diff engine (wayfinder plan-pr-frame-spec) - Milestone 1 slice: sections
 * A (the pure diff engine, `pr-diff.tsx`) and F (the coding topic's `prDiff`
 * data row in `topics.ts`) of the test-plan artifact. Frame-spec wiring
 * (`pull-request.tsx` stat bar/stages) and prose wiring (`CodingContent`) are
 * later milestones and are not covered here.
 *
 * Authored red: `src/components/_layout/composer/pr-diff.tsx` does not exist
 * yet, so every import below fails and every test in this file fails on
 * that missing module - same authored-red convention as EphemeraFrames.test.tsx
 * (a whole not-yet-created unit, not a partial regression). `PrDiffReplacement`
 * / `PrDiff` / `Topic.prDiff` also do not exist on `data/topics` yet, so this
 * typechecks red under `tsc` too, but RUNS under vitest (which strips types)
 * once the module import itself is satisfied - the coding row's `prDiff`
 * field is what section F below exercises.
 *
 * Match shape assumed for `matchAnchors`: the plan pins the signature
 * `matchAnchors(paragraphs: string[], replacements: PrDiffReplacement[]):
 * Match[]` without pinning `Match`'s fields. Tests below assume the minimal
 * contract `DiffedParagraphs` needs to place a strike+anchor pair inline:
 * `{ paragraphIndex: number; start: number; replacement: PrDiffReplacement }`
 * - `paragraphIndex` says which paragraph, `start` is the anchor's char
 * offset within that paragraph, `replacement` is the matched `{strike,
 * anchor}` pair. The implementer must satisfy this shape.
 */

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { cleanup, render } from "@testing-library/react";
import { createRef } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { type PrDiffReplacement, TOPICS } from "../../../../data/topics";
import { CodingContent } from "../../topics/CodingContent";
import { Paragraph } from "../../topics/primitives";
import { INNERS } from "../index";
import { PullRequestCluster } from "../inner/pull-request";
import {
	countDiffChars,
	DiffedParagraphs,
	matchAnchors,
	PrDiffContext,
	statSquares,
} from "../pr-diff";
import { TOPIC_ACCENT } from "../types";

// The M3 integration block below renders the real CodingContent, whose
// TriggerCard calls useNavigate unconditionally - mocked per
// TopicComposition.test.tsx's pattern (../../composer/__tests__/TopicComposition.test.tsx:40).
vi.mock("@tanstack/react-router", () => ({
	useNavigate: () => vi.fn(),
}));

afterEach(() => {
	cleanup();
});

/** Non-whitespace char count, matching the plan's honesty-math contract. */
function nonWs(s: string): number {
	return s.replace(/\s+/g, "").length;
}

/** Strings TC-DATA-4 asserts do NOT leak into component source (they must
 * live solely in `topics.ts`). These are fixed sentinel literals for that
 * static-scan check only - not pinned against live data, so a content edit
 * in topics.ts cannot turn them red. */
const CODING_STRIKES = [
	"jQuery",
	"leveraging synergies",
	"// TODO: fix later",
	"10x rockstar ninja",
];

/** clamp helper mirroring the plan's square-count formula, used to derive
 * expected values against the real coding data without hardcoding drifted
 * literals. */
function clamp(v: number, lo: number, hi: number): number {
	return Math.min(Math.max(v, lo), hi);
}

describe("ENGINE - matchAnchors", () => {
	it("TC-ENGINE-1: order-independent - an anchor from an earlier paragraph still resolves when replacement list-order and document order diverge", () => {
		const paragraphs = [
			"Paragraph zero has the word alpha in it.",
			"Paragraph one has the word beta and also the word gamma in it.",
		];
		// List order: beta (para 1) first, then alpha (para 0, textually
		// EARLIER than beta) - a monotonic forward-scanning cursor that only
		// advances past beta's position would never find alpha again.
		const replacements: PrDiffReplacement[] = [
			{ strike: "s-beta", anchor: "beta" },
			{ strike: "s-alpha", anchor: "alpha" },
			{ strike: "s-gamma", anchor: "gamma" },
		];
		const matches = matchAnchors(paragraphs, replacements);
		expect(matches.length).toBe(3);
		const byAnchor = Object.fromEntries(
			matches.map((m) => [m.replacement.anchor, m]),
		);
		expect(byAnchor.alpha?.paragraphIndex).toBe(0);
		expect(byAnchor.beta?.paragraphIndex).toBe(1);
		expect(byAnchor.gamma?.paragraphIndex).toBe(1);
	});

	it("TC-ENGINE-2: all-matched case returns one match per replacement, with correct paragraph index and char position", () => {
		const paragraphs = [
			"Zero paragraph mentions alpha here.",
			"One paragraph mentions beta and gamma here.",
		];
		const replacements: PrDiffReplacement[] = [
			{ strike: "s1", anchor: "alpha" },
			{ strike: "s2", anchor: "beta" },
			{ strike: "s3", anchor: "gamma" },
		];
		const matches = matchAnchors(paragraphs, replacements);
		expect(matches.length).toBe(3);
		for (const m of matches) {
			const para = paragraphs[m.paragraphIndex] ?? "";
			expect(para.slice(m.start, m.start + m.replacement.anchor.length)).toBe(
				m.replacement.anchor,
			);
		}
	});

	it("TC-ENGINE-3 (edge): an anchor absent from every paragraph is silently dropped, matches shrink by one, no throw", () => {
		const paragraphs = ["hello world"];
		const replacements: PrDiffReplacement[] = [
			{ strike: "s1", anchor: "hello" },
			{ strike: "s2", anchor: "missing" },
		];
		let matches: ReturnType<typeof matchAnchors> = [];
		expect(() => {
			matches = matchAnchors(paragraphs, replacements);
		}).not.toThrow();
		expect(matches.length).toBe(1);
		expect(matches[0]?.replacement.anchor).toBe("hello");
	});

	it("TC-ENGINE-4 (edge, challenger rider): two replacements share the identical anchor word which appears twice - the second replacement consumes the SECOND occurrence", () => {
		const paragraphs = ["test test other words here."];
		const replacements: PrDiffReplacement[] = [
			{ strike: "a", anchor: "test" },
			{ strike: "b", anchor: "test" },
		];
		const matches = matchAnchors(paragraphs, replacements);
		expect(matches.length).toBe(2);
		const first = matches.find((m) => m.replacement.strike === "a");
		const second = matches.find((m) => m.replacement.strike === "b");
		expect(first?.start).toBe(0);
		expect(second?.start).toBeGreaterThan(first?.start ?? -1);
	});

	it("TC-ENGINE-4b (edge): same anchor word twice-shared but the word only appears once - the second replacement is dropped, no double-match, no throw", () => {
		const paragraphs = ["only one test here."];
		const replacements: PrDiffReplacement[] = [
			{ strike: "a", anchor: "test" },
			{ strike: "b", anchor: "test" },
		];
		let matches: ReturnType<typeof matchAnchors> = [];
		expect(() => {
			matches = matchAnchors(paragraphs, replacements);
		}).not.toThrow();
		expect(matches.length).toBe(1);
		expect(matches[0]?.replacement.strike).toBe("a");
	});

	it('TC-ENGINE-5 (edge): substring never matches - "ship" inside "relationship" is not a word-boundary hit', () => {
		const paragraphs = ["I value every relationship I build."];
		const replacements: PrDiffReplacement[] = [{ strike: "s", anchor: "ship" }];
		const matches = matchAnchors(paragraphs, replacements);
		expect(matches.length).toBe(0);
	});

	it("TC-ENGINE-5b (challenger correction 3): punctuation-adjacent anchors match, and anchors containing regex metacharacters neither throw nor mis-match", () => {
		const paragraphs = ["I love C++. It compiles fast, trust me."];
		const replacements: PrDiffReplacement[] = [
			{ strike: "s1", anchor: "C++" },
			{ strike: "s2", anchor: "fast" },
		];
		let matches: ReturnType<typeof matchAnchors> = [];
		expect(() => {
			matches = matchAnchors(paragraphs, replacements);
		}).not.toThrow();
		expect(matches.length).toBe(2);
		const cpp = matches.find((m) => m.replacement.anchor === "C++");
		const fast = matches.find((m) => m.replacement.anchor === "fast");
		expect(cpp).toBeDefined();
		expect(fast).toBeDefined();
		expect(paragraphs[0]?.slice(cpp?.start ?? 0, (cpp?.start ?? 0) + 3)).toBe(
			"C++",
		);
		expect(paragraphs[0]?.slice(fast?.start ?? 0, (fast?.start ?? 0) + 4)).toBe(
			"fast",
		);
	});

	it('RIDER-1 (correctness, EARLY-review): unicode word-boundary - anchor "über" in a text where the FIRST substring occurrence sits inside a larger unicode word ("überöse", followed by non-ASCII "ö") must be REJECTED as a false boundary, resolving instead to the later standalone "über". Pins the WORD_CHAR unicode widening (/\\p{L}|\\d|_/u) the implementer must apply. Fixture note: a plain "über ... überall" pair (ASCII "a" trailing the embedded prefix) is already correctly rejected by the CURRENT ASCII-only WORD_CHAR, because ASCII \\w recognizes "a" as a word char - it does NOT expose the bug. The bug only surfaces when the char immediately following the embedded substring is ITSELF a non-ASCII letter ("ö"), which ASCII \\w misclassifies as non-word, so the current implementation wrongly treats it as a legal boundary. RED against the current ASCII-only WORD_CHAR is intended (TDD for the widening).', () => {
		const text = "Das ist überöse Sache, obwohl über allem steht.";
		const paragraphs = [text];
		const replacements: PrDiffReplacement[] = [
			{ strike: "s1", anchor: "über" },
		];
		const matches = matchAnchors(paragraphs, replacements);
		expect(matches.length).toBe(1);
		const match = matches[0];
		expect(match).toBeDefined();
		// The embedded prefix inside "überöse" sits at index 8 (WRONG - "ö"
		// right after it continues the same word); the standalone "über"
		// sits later, at index 30 (CORRECT).
		expect(match?.start).toBe(30);
		expect(text.slice(match?.start ?? 0, (match?.start ?? 0) + 4)).toBe("über");
		// The char immediately after the correct match must not be a word
		// char (a real boundary), unlike the rejected embedded occurrence.
		const after = text[(match?.start ?? 0) + 4];
		expect(after).toBe(" ");
	});

	it("RIDER-2 (smoke, EARLY-review): partial-overlap of DIFFERENT anchors - a shorter anchor's only non-overlapping occurrence sits later in the text than a longer, already-consumed anchor's range; the shorter anchor resolves to that later occurrence, never the overlapping one", () => {
		const paragraphs = ["The well-oiled machine runs well before noon."];
		// Data order: the longer anchor consumes "well-oiled" (0..10) first;
		// "well" then finds its boundary-legal occurrence inside that range
		// blocked by the consumed range, and must resolve to the later,
		// standalone "well" instead of dropping or double-matching.
		const replacements: PrDiffReplacement[] = [
			{ strike: "s1", anchor: "well-oiled" },
			{ strike: "s2", anchor: "well" },
		];
		const matches = matchAnchors(paragraphs, replacements);
		expect(matches.length).toBe(2);
		const long = matches.find((m) => m.replacement.anchor === "well-oiled");
		const short = matches.find((m) => m.replacement.anchor === "well");
		expect(long?.start).toBe(4);
		// The standalone "well" occurs later in the sentence, after "runs ".
		const standaloneIdx = paragraphs[0]?.indexOf(
			"well",
			(long?.start ?? 0) + "well-oiled".length,
		);
		expect(short?.start).toBe(standaloneIdx);
		expect(short?.start).toBeGreaterThan((long?.start ?? 0) + 10);
	});
});

describe("ENGINE - countDiffChars", () => {
	it("TC-ENGINE-6: sums only MATCHED replacements", () => {
		const bodyText = "hello world example";
		const replacements: PrDiffReplacement[] = [
			{ strike: "aaa", anchor: "hello" },
			{ strike: "bbb", anchor: "missing" },
		];
		expect(countDiffChars(bodyText, replacements)).toEqual({
			adds: nonWs("hello"),
			dels: nonWs("aaa"),
		});
	});

	it("TC-ENGINE-7 (edge): multi-word strikes counted as non-whitespace chars only - exact expected number against a synthetic fixture", () => {
		// Synthetic fixture (not live coding data): the exact-count pin must
		// survive the user hand-editing topics.ts, so it lives entirely here.
		const anchors = ["Typescript", "elegant", "self-hosting", "ship"];
		const strikes = [
			"jQuery",
			"leveraging synergies",
			"// TODO: fix later",
			"10x rockstar ninja",
		];
		const replacements: PrDiffReplacement[] = anchors.map((anchor, i) => ({
			strike: strikes[i] ?? "",
			anchor,
		}));
		const bodyText = `This paragraph mentions ${anchors.join(" and ")} in prose.`;
		const { adds, dels } = countDiffChars(bodyText, replacements);
		const expectedAdds = anchors.reduce((n, a) => n + nonWs(a), 0);
		const expectedDels = strikes.reduce((n, s) => n + nonWs(s), 0);
		expect(adds).toBe(expectedAdds);
		expect(dels).toBe(expectedDels);
	});

	it("TC-ENGINE-8 (edge): empty replacements / empty bodyText produce {adds:0, dels:0}, no throw", () => {
		expect(() => countDiffChars("", [])).not.toThrow();
		expect(countDiffChars("", [])).toEqual({ adds: 0, dels: 0 });
		expect(countDiffChars("something here", [])).toEqual({
			adds: 0,
			dels: 0,
		});
		expect(countDiffChars("", [{ strike: "a", anchor: "b" }])).toEqual({
			adds: 0,
			dels: 0,
		});
	});
});

describe("ENGINE - statSquares", () => {
	it("TC-ENGINE-9: always length 5", () => {
		const cases: Array<[number, number]> = [
			[0, 0],
			[1, 0],
			[0, 1],
			[33, 56],
			[1000, 1],
			[1, 1000],
		];
		for (const [adds, dels] of cases) {
			expect(statSquares(adds, dels).length).toBe(5);
		}
	});

	it("TC-ENGINE-10: clamp math matches the plan's formula - exact green/red/neutral counts against a synthetic fixture", () => {
		// Synthetic fixture (not live coding data): the exact-count pin must
		// survive the user hand-editing topics.ts, so it lives entirely here.
		const anchors = ["Typescript", "elegant", "self-hosting", "ship"];
		const strikes = [
			"jQuery",
			"leveraging synergies",
			"// TODO: fix later",
			"10x rockstar ninja",
		];
		const replacements: PrDiffReplacement[] = anchors.map((anchor, i) => ({
			strike: strikes[i] ?? "",
			anchor,
		}));
		const bodyText = `This paragraph mentions ${anchors.join(" and ")} in prose.`;
		const { adds, dels } = countDiffChars(bodyText, replacements);
		const squares = statSquares(adds, dels);
		const green = squares.filter((s) => s === "add").length;
		const red = squares.filter((s) => s === "del").length;
		const neutral = squares.filter((s) => s === "neutral").length;

		const expectedAdds = anchors.reduce((n, a) => n + nonWs(a), 0);
		const expectedDels = strikes.reduce((n, s) => n + nonWs(s), 0);
		const a = expectedAdds;
		const d = expectedDels;
		const g = clamp(Math.round((5 * a) / (a + d)), 1, 4);
		const r = clamp(Math.round((5 * d) / (a + d)), 1, 5 - g);

		expect(adds).toBe(expectedAdds);
		expect(dels).toBe(expectedDels);
		expect(green).toBe(g);
		expect(red).toBe(r);
		expect(neutral).toBe(5 - g - r);
	});

	it("TC-ENGINE-10b (consistency, live data): coding topic's real teaser/replacements still produce a structurally honest diff - adds/dels positive, five squares fully accounted for", () => {
		const coding = TOPICS.find((t) => t.id === "coding");
		const codingTeaser = coding?.teaser ?? "";
		const codingReplacements = coding?.prDiff?.replacements ?? [];
		const { adds, dels } = countDiffChars(codingTeaser, codingReplacements);
		expect(adds).toBeGreaterThan(0);
		expect(dels).toBeGreaterThan(0);
		const squares = statSquares(adds, dels);
		expect(squares.length).toBe(5);
		const green = squares.filter((s) => s === "add").length;
		const red = squares.filter((s) => s === "del").length;
		const neutral = squares.filter((s) => s === "neutral").length;
		expect(green + red + neutral).toBe(5);
	});

	it("TC-ENGINE-11 (edge): adds=0 && dels=0 -> all 5 neutral (NaN guard)", () => {
		const squares = statSquares(0, 0);
		expect(squares).toEqual([
			"neutral",
			"neutral",
			"neutral",
			"neutral",
			"neutral",
		]);
	});

	it("TC-ENGINE-11b (plan v2 correction 6): zero-side guard - dels=0 with adds>0 yields ZERO red squares (not the clamp-floor 1); symmetric for adds=0", () => {
		const delsZero = statSquares(10, 0);
		expect(delsZero.filter((s) => s === "del").length).toBe(0);
		expect(delsZero.filter((s) => s === "add").length).toBeGreaterThan(0);

		const addsZero = statSquares(0, 10);
		expect(addsZero.filter((s) => s === "add").length).toBe(0);
		expect(addsZero.filter((s) => s === "del").length).toBeGreaterThan(0);
	});

	it("TC-ENGINE-12 (edge): extreme ratios hit the clamp floor/ceiling", () => {
		const heavyAdds = statSquares(1000, 1);
		expect(heavyAdds.filter((s) => s === "add").length).toBe(4);
		expect(heavyAdds.filter((s) => s === "del").length).toBe(1);

		const heavyDels = statSquares(1, 1000);
		expect(heavyDels.filter((s) => s === "add").length).toBe(1);
		expect(heavyDels.filter((s) => s === "del").length).toBe(4);
	});
});

describe("ENGINE - DiffedParagraphs", () => {
	const SAMPLE_TEXT = "Para one is right here.\n\nPara two follows after.";

	function renderPlain(text: string) {
		return render(
			<div>
				{text.split("\n\n").map((para) => (
					<Paragraph key={para.slice(0, 24)}>{para}</Paragraph>
				))}
			</div>,
		);
	}

	it('TC-ENGINE-13: with NO provider, renders byte-identical to the current split("\\n\\n").map(Paragraph) output', () => {
		const { container: plain } = renderPlain(SAMPLE_TEXT);
		const plainHtml = plain.innerHTML;
		cleanup();
		const { container: diffed } = render(
			<div>
				<DiffedParagraphs text={SAMPLE_TEXT} />
			</div>,
		);
		expect(diffed.innerHTML).toBe(plainHtml);
	});

	it("TC-ENGINE-14: provider present but empty/null replacements still renders byte-identical plain output", () => {
		const { container: plain } = renderPlain(SAMPLE_TEXT);
		const plainHtml = plain.innerHTML;
		cleanup();

		const { container: withEmpty } = render(
			<PrDiffContext.Provider value={[]}>
				<div>
					<DiffedParagraphs text={SAMPLE_TEXT} />
				</div>
			</PrDiffContext.Provider>,
		);
		expect(withEmpty.innerHTML).toBe(plainHtml);
		cleanup();

		const { container: withNull } = render(
			<PrDiffContext.Provider value={null}>
				<div>
					<DiffedParagraphs text={SAMPLE_TEXT} />
				</div>
			</PrDiffContext.Provider>,
		);
		expect(withNull.innerHTML).toBe(plainHtml);
	});

	it("TC-ENGINE-15: with real replacements, each match renders a strike span immediately before the tinted anchor span, inline in the paragraph, original text fully preserved", () => {
		const text = "The quick brown fox jumps over the lazy dog.";
		const replacements: PrDiffReplacement[] = [
			{ strike: "slow", anchor: "quick" },
		];
		const { container } = render(
			<PrDiffContext.Provider value={replacements}>
				<div>
					<DiffedParagraphs text={text} />
				</div>
			</PrDiffContext.Provider>,
		);
		const del = container.querySelector(".pr-wd-del");
		const add = container.querySelector(".pr-wd-add");
		expect(del).not.toBeNull();
		expect(add).not.toBeNull();
		expect(del?.getAttribute("aria-hidden")).toBe("true");
		expect(del?.textContent).toBe("slow");
		expect(add?.textContent).toBe("quick");

		// del sits immediately before add, inline in the same paragraph.
		const p = del?.closest("p");
		expect(p).not.toBeNull();
		expect(p?.contains(add as Node)).toBe(true);
		const walk = Array.from(
			p?.querySelectorAll(".pr-wd-del, .pr-wd-add") ?? [],
		);
		expect(walk[0]).toBe(del);
		expect(walk[1]).toBe(add);

		// stripping the injected strike (and its trailing separator) reproduces
		// the original prose.
		const clone = p?.cloneNode(true) as HTMLElement;
		for (const node of Array.from(clone.querySelectorAll(".pr-wd-del"))) {
			node.remove();
		}
		const reconstructed = (clone.textContent ?? "").replace(/\s+/g, " ").trim();
		expect(reconstructed).toBe(text.replace(/\s+/g, " ").trim());
	});

	it("TC-ENGINE-16 (edge): all .pr-wd-del spans are aria-hidden; accessible text (ignoring aria-hidden nodes) reproduces the original prose exactly", () => {
		const text =
			"One clause leads to a second clause, then a third clause follows.";
		const replacements: PrDiffReplacement[] = [
			{ strike: "first-strike", anchor: "second" },
			{ strike: "second-strike", anchor: "third" },
		];
		const { container } = render(
			<PrDiffContext.Provider value={replacements}>
				<div>
					<DiffedParagraphs text={text} />
				</div>
			</PrDiffContext.Provider>,
		);
		const dels = container.querySelectorAll(".pr-wd-del");
		expect(dels.length).toBe(2);
		for (const del of Array.from(dels)) {
			expect(del.getAttribute("aria-hidden")).toBe("true");
		}
		const clone = container.cloneNode(true) as HTMLElement;
		for (const node of Array.from(
			clone.querySelectorAll('[aria-hidden="true"]'),
		)) {
			node.remove();
		}
		const accessible = (clone.textContent ?? "").replace(/\s+/g, " ").trim();
		expect(accessible).toBe(text.replace(/\s+/g, " ").trim());
	});

	it('TC-ENGINE-17: paragraph split on "\\n\\n" - a 2-paragraph fixture produces exactly 2 Paragraph wrappers, matches attributed to the right paragraph', () => {
		const text =
			"First paragraph mentions alpha in it.\n\nSecond paragraph mentions beta in it.";
		const replacements: PrDiffReplacement[] = [
			{ strike: "s-alpha", anchor: "alpha" },
			{ strike: "s-beta", anchor: "beta" },
		];
		const { container } = render(
			<PrDiffContext.Provider value={replacements}>
				<div>
					<DiffedParagraphs text={text} />
				</div>
			</PrDiffContext.Provider>,
		);
		const paragraphs = container.querySelectorAll("p");
		expect(paragraphs.length).toBe(2);
		expect(paragraphs[0]?.querySelector(".pr-wd-add")?.textContent).toBe(
			"alpha",
		);
		expect(paragraphs[0]?.querySelector(".pr-wd-del")).not.toBeNull();
		expect(paragraphs[1]?.querySelector(".pr-wd-add")?.textContent).toBe(
			"beta",
		);
		expect(paragraphs[1]?.querySelector(".pr-wd-del")).not.toBeNull();
	});

	it("RIDER-3 (smoke, EARLY-review, render-level): an anchor that is the very LAST word of a paragraph renders correctly (slice-to-end edge, no trailing crash/garbage)", () => {
		const text = "This paragraph ends with anchor";
		const replacements: PrDiffReplacement[] = [
			{ strike: "tail", anchor: "anchor" },
		];
		const { container } = render(
			<PrDiffContext.Provider value={replacements}>
				<div>
					<DiffedParagraphs text={text} />
				</div>
			</PrDiffContext.Provider>,
		);
		const del = container.querySelector(".pr-wd-del");
		const add = container.querySelector(".pr-wd-add");
		expect(del?.textContent).toBe("tail");
		expect(add?.textContent).toBe("anchor");
		const p = add?.closest("p");
		expect(p).not.toBeNull();
		// nothing trails the anchor - it was the last word.
		const lastChild = p?.lastElementChild;
		expect(lastChild).toBe(add);
		expect((p?.textContent ?? "").endsWith("anchor")).toBe(true);
	});
});

describe("DATA - coding topic prDiff row", () => {
	const coding = TOPICS.find((t) => t.id === "coding");

	it("TC-DATA-2: coding row's prDiff.replacements has exactly 4 one-line {strike, anchor} entries; prDiff.number === 7", () => {
		expect(coding?.prDiff?.number).toBe(7);
		const replacements = coding?.prDiff?.replacements ?? [];
		expect(replacements.length).toBe(4);
		for (const r of replacements) {
			expect(typeof r.strike).toBe("string");
			expect(typeof r.anchor).toBe("string");
			expect(r.strike.length).toBeGreaterThan(0);
			expect(r.anchor.length).toBeGreaterThan(0);
		}
	});

	// Derived from live data (not a hardcoded literal list): whatever anchors
	// the user hand-edits into topics.ts, each one must still be findable as
	// a whole word in that same topic's own teaser prose.
	const codingTeaser = coding?.teaser ?? "";
	const codingAnchors = (coding?.prDiff?.replacements ?? []).map(
		(r) => r.anchor,
	);

	it.each(
		codingAnchors,
	)('TC-DATA-3 (load-bearing): anchor "%s" is present as a whole word in the coding topic\'s actual teaser', (anchor) => {
		const escaped = anchor.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
		const pattern =
			/^[\w]/.test(anchor) && /[\w]$/.test(anchor)
				? new RegExp(`\\b${escaped}\\b`)
				: new RegExp(escaped);
		expect(
			pattern.test(codingTeaser),
			`expected the coding topic's teaser to contain anchor "${anchor}" as a whole word, but it did not: ${codingTeaser}`,
		).toBe(true);
	});

	it("TC-DATA-4 (static): neither pull-request.tsx nor pr-diff.tsx source text contains the literal joke/strike strings - wording lives solely in topics.ts", () => {
		const pullRequestSrc = readFileSync(
			join(import.meta.dirname, "..", "inner", "pull-request.tsx"),
			"utf-8",
		);
		const prDiffSrc = readFileSync(
			join(import.meta.dirname, "..", "pr-diff.tsx"),
			"utf-8",
		);
		for (const strike of CODING_STRIKES) {
			expect(pullRequestSrc).not.toContain(strike);
			expect(prDiffSrc).not.toContain(strike);
		}
	});
});

/*
 * PROSE - Milestone 3 prose wiring (wayfinder plan-pr-frame-spec, section C
 * of the test-plan artifact). `CodingContent` still does the manual
 * `CODING_TEASER.split("\n\n").map(Paragraph)` render and never reads
 * `PrDiffContext` - so TC-PROSE-2/3/5/6 below (which require the word-diff
 * markup to actually appear) are authored red until `CodingContent` is
 * swapped to `<DiffedParagraphs text={CODING_TEASER} />`. TC-PROSE-1/4 assert
 * invariants that already hold on the CURRENT plain render too (byte-identity
 * with no provider, full prose preserved) - they stay green as regression
 * pins across the swap, proving the "no provider = today's output" and
 * "prose fully intact" guarantees survive the M3 change.
 */

const lastTriggerRef = createRef<HTMLElement>();
const CODING_TOPIC = TOPICS.find((t) => t.id === "coding");
if (!CODING_TOPIC) {
	throw new Error("fixture setup: TOPICS has no coding entry");
}
const LIVE_TEASER = CODING_TOPIC.teaser ?? "";
const LIVE_REPLACEMENTS = CODING_TOPIC.prDiff?.replacements ?? [];

function renderPlainCodingContent() {
	return render(
		<div className="space-y-5">
			{LIVE_TEASER.split("\n\n").map((para) => (
				<Paragraph key={para.slice(0, 24)}>{para}</Paragraph>
			))}
		</div>,
	);
}

function renderCodingContentDirect() {
	return render(
		<CodingContent
			lastTriggerRef={lastTriggerRef}
			isNight={false}
			accent={TOPIC_ACCENT.coding}
		/>,
	);
}

function renderCodingInPullRequestCluster() {
	return render(
		<PullRequestCluster
			topic={CODING_TOPIC as NonNullable<typeof CODING_TOPIC>}
			index={0}
			isNight={false}
			lastTriggerRef={lastTriggerRef}
			params={INNERS["pull-request"].defaults}
			accent={TOPIC_ACCENT.coding}
		>
			<CodingContent
				lastTriggerRef={lastTriggerRef}
				isNight={false}
				accent={TOPIC_ACCENT.coding}
			/>
		</PullRequestCluster>,
	);
}

describe("PROSE - CodingContent renders through DiffedParagraphs (Milestone 3 wiring)", () => {
	it("TC-PROSE-1: CodingContent WITHOUT a PrDiffContext provider renders byte-identical to today's plain split-and-map output", () => {
		const { container: plain } = renderPlainCodingContent();
		const paragraphHtml = Array.from(plain.querySelectorAll("p"))
			.map((p) => p.outerHTML)
			.join("");
		cleanup();

		const { container: direct } = renderCodingContentDirect();
		const directParagraphHtml = Array.from(direct.querySelectorAll("p"))
			.map((p) => p.outerHTML)
			.join("");
		expect(directParagraphHtml).toBe(paragraphHtml);
	});

	it("TC-PROSE-2 (integration, real data): PullRequestCluster wrapping the real coding topic's content renders exactly N .pr-wd-del and N .pr-wd-add spans, where N is derived from the LIVE prDiff.replacements + matchAnchors result (not a hardcoded literal)", () => {
		const expectedMatches = matchAnchors(
			LIVE_TEASER.split("\n\n"),
			LIVE_REPLACEMENTS,
		);
		expect(expectedMatches.length).toBeGreaterThan(0);
		const { container } = renderCodingInPullRequestCluster();
		expect(container.querySelectorAll(".pr-wd-del").length).toBe(
			expectedMatches.length,
		);
		expect(container.querySelectorAll(".pr-wd-add").length).toBe(
			expectedMatches.length,
		);
	});

	it("TC-PROSE-3: each .pr-wd-del immediately precedes its .pr-wd-add in DOM order", () => {
		const expectedMatches = matchAnchors(
			LIVE_TEASER.split("\n\n"),
			LIVE_REPLACEMENTS,
		);
		expect(expectedMatches.length).toBeGreaterThan(0);
		const { container } = renderCodingInPullRequestCluster();
		const nodes = Array.from(
			container.querySelectorAll(".pr-wd-del, .pr-wd-add"),
		);
		expect(nodes.length).toBe(expectedMatches.length * 2);
		for (let i = 0; i < nodes.length; i += 2) {
			expect(nodes[i]?.className).toContain("pr-wd-del");
			expect(nodes[i + 1]?.className).toContain("pr-wd-add");
		}
	});

	it("TC-PROSE-4 (load-bearing): the full unmodified teaser text is still present - clone the teaser's own <p> paragraphs, strip .pr-wd-del nodes + injected separator, whitespace-normalize, compare against CODING_TEASER", () => {
		const { container } = renderCodingInPullRequestCluster();
		// scope to the teaser's own paragraph shells (Paragraph renders <p>),
		// not the whole card - the card also carries chrome text (branch
		// chip, state badge, number, stage labels) that CODING_TEASER never
		// contained.
		const paragraphs = Array.from(container.querySelectorAll("p"));
		expect(paragraphs.length).toBeGreaterThan(0);
		// each <p> is a separate paragraph shell (no whitespace text node
		// BETWEEN sibling <p> elements, mirroring the original "\n\n" split) -
		// reconstruct each paragraph's text independently, then rejoin with a
		// single space so the comparison matches CODING_TEASER's own
		// whitespace-normalized form.
		const paragraphTexts = paragraphs.map((p) => {
			const clone = p.cloneNode(true) as HTMLElement;
			for (const node of Array.from(clone.querySelectorAll(".pr-wd-del"))) {
				// the injected separator is a literal space text node right
				// after the strike span - remove it alongside the strike
				// itself so the reconstructed text has no double-space.
				const next = node.nextSibling;
				if (next?.nodeType === Node.TEXT_NODE && next.textContent === " ") {
					next.remove();
				}
				node.remove();
			}
			return (clone.textContent ?? "").trim();
		});
		const reconstructed = paragraphTexts.join(" ").replace(/\s+/g, " ").trim();
		const expected = LIVE_TEASER.replace(/\s+/g, " ").trim();
		expect(reconstructed).toBe(expected);
	});

	it("TC-PROSE-5: every .pr-wd-del is aria-hidden; no .pr-wd-add is aria-hidden", () => {
		const expectedMatches = matchAnchors(
			LIVE_TEASER.split("\n\n"),
			LIVE_REPLACEMENTS,
		);
		expect(expectedMatches.length).toBeGreaterThan(0);
		const { container } = renderCodingInPullRequestCluster();
		const dels = container.querySelectorAll(".pr-wd-del");
		const adds = container.querySelectorAll(".pr-wd-add");
		expect(dels.length).toBe(expectedMatches.length);
		for (const del of Array.from(dels)) {
			expect(del.getAttribute("aria-hidden")).toBe("true");
		}
		for (const add of Array.from(adds)) {
			expect(add.getAttribute("aria-hidden")).not.toBe("true");
		}
	});

	it("TC-PROSE-6: the rendered +adds -dels stat-bar values match countDiffChars(liveTeaser, liveReplacements)", () => {
		const { adds, dels } = countDiffChars(LIVE_TEASER, LIVE_REPLACEMENTS);
		expect(adds).toBeGreaterThan(0);
		expect(dels).toBeGreaterThan(0);
		const { container } = renderCodingInPullRequestCluster();
		const bar = container.querySelector(".pr-stat-bar");
		expect(bar?.querySelector(".pr-stat-count--add")?.textContent).toBe(
			`+${adds}`,
		);
		expect(bar?.querySelector(".pr-stat-count--del")?.textContent).toBe(
			`-${dels}`,
		);
	});
});
