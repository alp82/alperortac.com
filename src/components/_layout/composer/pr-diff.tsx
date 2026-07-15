import { createContext, type ReactNode, useContext } from "react";
import type { PrDiffReplacement } from "../../../data/topics";
import { Paragraph } from "../topics/primitives";

/*
 * Pure word-diff engine for the pull-request frame.
 *
 * The frame provides a topic's `prDiff.replacements` through `PrDiffContext`;
 * `DiffedParagraphs` renders a topic body with each matched anchor prefixed
 * by its struck-out joke. All wording lives in `src/data/topics.ts` - this
 * file carries no content strings.
 *
 * Matching contract (ORDER-INDEPENDENT): each anchor is searched over the
 * WHOLE text minus already-consumed ranges. Replacements resolve in data
 * order, but this is never a monotonic forward scan - data order in
 * `topics.ts` is NOT text order in the topic body, so a forward cursor would
 * silently drop anchors that appear earlier than a previously matched one.
 * First unconsumed word-boundary occurrence wins; unmatched anchors are
 * silently dropped.
 */

type Match = {
	paragraphIndex: number;
	start: number;
	replacement: PrDiffReplacement;
};

export const PrDiffContext = createContext<PrDiffReplacement[] | null>(null);

/* Unicode-aware word classifier: JS `\b` (and `\w`) are ASCII-only even
 * under the `u` flag, so "über" adjacent to "ö" would read as a boundary.
 * Widened per the plan's rider; ALL boundary checks route through this. */
const WORD_CHAR = /[\p{L}\d_]/u;

function overlapsConsumed(
	consumed: Array<[number, number]>,
	start: number,
	length: number,
): boolean {
	return consumed.some(([s, e]) => start < e && start + length > s);
}

/**
 * First occurrence of `anchor` in `paragraph` that sits on word boundaries
 * and does not overlap a consumed range; -1 when none. Regex `\b` is unsound
 * both adjacent to non-word chars AND next to non-ASCII letters (it stays
 * ASCII-only under the `u` flag), so every anchor scans via `indexOf` with
 * manual neighbor-char checks against the unicode-aware WORD_CHAR - a check
 * applies only on whichever ends of the anchor ARE word chars.
 */
function findOccurrence(
	paragraph: string,
	anchor: string,
	consumed: Array<[number, number]>,
): number {
	if (anchor.length === 0) {
		return -1;
	}
	const startsWord = WORD_CHAR.test(anchor[0] ?? "");
	const endsWord = WORD_CHAR.test(anchor[anchor.length - 1] ?? "");
	let from = 0;
	while (from <= paragraph.length) {
		const idx = paragraph.indexOf(anchor, from);
		if (idx === -1) {
			return -1;
		}
		const before = paragraph[idx - 1];
		const after = paragraph[idx + anchor.length];
		const beforeOk =
			!startsWord || before === undefined || !WORD_CHAR.test(before);
		const afterOk = !endsWord || after === undefined || !WORD_CHAR.test(after);
		if (
			beforeOk &&
			afterOk &&
			!overlapsConsumed(consumed, idx, anchor.length)
		) {
			return idx;
		}
		from = idx + 1;
	}
	return -1;
}

/**
 * Resolves each replacement's anchor to a paragraph + char offset per the
 * order-independence contract above. Duplicate anchors consume successive
 * occurrences; a duplicate with no occurrence left is dropped.
 */
export function matchAnchors(
	paragraphs: string[],
	replacements: PrDiffReplacement[],
): Match[] {
	const consumed: Array<Array<[number, number]>> = paragraphs.map(() => []);
	const matches: Match[] = [];
	for (const replacement of replacements) {
		for (let p = 0; p < paragraphs.length; p++) {
			const idx = findOccurrence(
				paragraphs[p] ?? "",
				replacement.anchor,
				consumed[p] ?? [],
			);
			if (idx !== -1) {
				matches.push({ paragraphIndex: p, start: idx, replacement });
				consumed[p]?.push([idx, idx + replacement.anchor.length]);
				break;
			}
		}
	}
	return matches;
}

function nonWhitespaceLength(s: string): number {
	return s.replace(/\s+/g, "").length;
}

/**
 * Honest stat-bar counts: only MATCHED replacements count, as non-whitespace
 * chars (`adds` from anchors, `dels` from strikes).
 */
export function countDiffChars(
	bodyText: string,
	replacements: PrDiffReplacement[],
): { adds: number; dels: number } {
	const matches = matchAnchors(bodyText.split("\n\n"), replacements);
	let adds = 0;
	let dels = 0;
	for (const m of matches) {
		adds += nonWhitespaceLength(m.replacement.anchor);
		dels += nonWhitespaceLength(m.replacement.strike);
	}
	return { adds, dels };
}

function clamp(v: number, lo: number, hi: number): number {
	return Math.min(Math.max(v, lo), hi);
}

/**
 * Five-square stat meter. Zero-side guard BEFORE the clamp floors: a side
 * with count 0 gets 0 squares of that color (the data is hand-mangled by
 * design, so dels === 0 must not render a red square); 0/0 is all neutral
 * (guards the NaN the ratio math would produce). Otherwise the prototype
 * math with clamp floors so both non-zero sides stay visible.
 */
export function statSquares(
	adds: number,
	dels: number,
): ("add" | "del" | "neutral")[] {
	const total = adds + dels;
	if (total === 0) {
		return ["neutral", "neutral", "neutral", "neutral", "neutral"];
	}
	const g = adds === 0 ? 0 : clamp(Math.round((5 * adds) / total), 1, 4);
	const r = dels === 0 ? 0 : clamp(Math.round((5 * dels) / total), 1, 5 - g);
	const squares: ("add" | "del" | "neutral")[] = [];
	for (let i = 0; i < 5; i++) {
		squares.push(i < g ? "add" : i < g + r ? "del" : "neutral");
	}
	return squares;
}

function diffParagraph(paragraph: string, matches: Match[]): ReactNode {
	if (matches.length === 0) {
		return paragraph;
	}
	const ordered = [...matches].sort((a, b) => a.start - b.start);
	const nodes: ReactNode[] = [];
	let cursor = 0;
	for (const m of ordered) {
		nodes.push(paragraph.slice(cursor, m.start));
		nodes.push(
			<span key={`del-${m.start}`} className="pr-wd-del" aria-hidden="true">
				{m.replacement.strike}
			</span>,
		);
		nodes.push(" ");
		nodes.push(
			<span key={`add-${m.start}`} className="pr-wd-add">
				{m.replacement.anchor}
			</span>,
		);
		cursor = m.start + m.replacement.anchor.length;
	}
	nodes.push(paragraph.slice(cursor));
	return nodes;
}

/**
 * Diff-aware drop-in for the plain `split("\n\n").map(Paragraph)` body
 * render. With no provider (or empty/null replacements) the output is
 * byte-identical to the plain path; inside a pull-request frame each match
 * renders its aria-hidden strike immediately before the tinted anchor.
 */
/**
 * Collision-proof paragraph keys: two paragraphs sharing a 24-char prefix
 * (e.g. multi-paragraph topics with a repeated opener) would otherwise clash
 * on `para.slice(0, 24)` alone. An occurrence counter (keyed by the prefix,
 * bumped per repeat) disambiguates without touching the map index - biome's
 * noArrayIndexKey flags any key expression that references the loop index,
 * even embedded in a template literal, so the counter lives in its own
 * closure instead.
 */
function makePrefixKeyer() {
	const seen = new Map<string, number>();
	return (para: string) => {
		const prefix = para.slice(0, 24);
		const n = (seen.get(prefix) ?? 0) + 1;
		seen.set(prefix, n);
		return `${prefix}-${n}`;
	};
}

export function DiffedParagraphs({ text }: { text: string }) {
	const replacements = useContext(PrDiffContext);
	const paragraphs = text.split("\n\n");
	if (!replacements || replacements.length === 0) {
		const keyOf = makePrefixKeyer();
		return (
			<>
				{paragraphs.map((para) => (
					<Paragraph key={keyOf(para)}>{para}</Paragraph>
				))}
			</>
		);
	}
	const matches = matchAnchors(paragraphs, replacements);
	const keyOf = makePrefixKeyer();
	return (
		<>
			{paragraphs.map((para, i) => (
				<Paragraph key={keyOf(para)}>
					{diffParagraph(
						para,
						matches.filter((m) => m.paragraphIndex === i),
					)}
				</Paragraph>
			))}
		</>
	);
}
