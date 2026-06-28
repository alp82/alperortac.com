import { ChevronDown } from "lucide-react";
import {
	HERO_CTA,
	HERO_CURIOUS,
	HERO_LEAD,
	HERO_OUTCOME,
	HERO_TIMING,
} from "../../data/hero";
import { SECTION_IDS } from "../../data/sections";
import type { SeqConfig } from "./sequentialCycle";
import { PROSE, useSequentialCycle } from "./useSequentialCycle";

const HERO_SEQ_CONFIG: SeqConfig = {
	curious: HERO_CURIOUS,
	outcome: HERO_OUTCOME,
	timing: HERO_TIMING,
};

// Longest pool word — sizes the invisible ghost chip so the centered block locks
// to a constant width (the visible overlay never jitters as the live word adapts).
function longest(pool: readonly string[]): string {
	return pool.reduce((a, b) => (b.length > a.length ? b : a), "");
}

// Softened chip treatment: faint ink tint + rounded corners, dark ink text shared
// on both slots (continuous with the prose color); typeface differentiates them.
const BLOCK_BASE =
	"inline-flex items-center px-2.5 py-0.5 rounded-lg text-[#0a0a0a] bg-[#0a0a0a]/[0.09]";
const BLOCK_CURIOUS = "font-black"; // Inter heavy
const BLOCK_OUTCOME =
	"font-['Instrument_Serif'] italic font-semibold text-[1.12em]"; // Instrument Serif italic (semibold is synthesized — the face ships 400 only)
const LIVE_WORD = "whitespace-nowrap";
// Sentence-case prose connectors — semibold, close to hero body size.
const PROSE_PREFIX = "font-semibold text-[#0a0a0a] text-[0.9em]";
// Each row: prose and its block inline on a shared midline, horizontally centered.
const ROW = "flex items-center justify-center gap-x-2";

// Outer wrapper: font, spacing, centering, base size/color. The role=img block
// inside inherits these and adds only its own layout (relative, w-fit, line-height).
export function HeroSubtitle() {
	const {
		curiousText,
		outcomeText,
		showCuriousCursor,
		showOutcomeCursor,
		label,
	} = useSequentialCycle(HERO_SEQ_CONFIG);

	return (
		<div className="hero-type mx-auto mt-8 flex w-fit flex-col items-center gap-y-4 sm:gap-y-5 tracking-[0.04em] text-[#0a0a0a] text-xl sm:text-2xl md:text-3xl text-center">
			<p className="font-semibold">{HERO_LEAD}</p>

			<div
				role="img"
				aria-label={label}
				className="relative my-8 w-fit leading-[1.7]"
			>
				{/* Width/height reservation: an invisible mirror of the 2 rows holding each
				    pool's LONGEST word. It sits in normal flow so the container's w-fit
				    locks to a CONSTANT width — the visible overlay below then re-centers
				    never (no jitter as the live chips adapt). It carries NO data-* hooks
				    so the test queries resolve only to the visible rows. */}
				<span
					aria-hidden="true"
					className="invisible flex flex-col gap-3 text-left"
				>
					<span aria-hidden="true" className={ROW}>
						<span aria-hidden="true" className={PROSE_PREFIX}>
							{PROSE.curiousPrefix.trimEnd()}
						</span>
						<span
							aria-hidden="true"
							className={`${BLOCK_BASE} ${BLOCK_CURIOUS}`}
						>
							<span aria-hidden="true" className={LIVE_WORD}>
								{longest(HERO_CURIOUS)}
							</span>
						</span>
					</span>
					<span aria-hidden="true" className={ROW}>
						<span aria-hidden="true" className={PROSE_PREFIX}>
							{PROSE.outcomePrefix.trimEnd()}
						</span>
						<span
							aria-hidden="true"
							className={`${BLOCK_BASE} ${BLOCK_OUTCOME}`}
						>
							<span aria-hidden="true" className={LIVE_WORD}>
								{longest(HERO_OUTCOME)}
							</span>
						</span>
					</span>
				</span>
				{/* Visible centered rows overlaying the ghost. */}
				<span
					aria-hidden="true"
					className="absolute inset-0 flex flex-col gap-3 text-left"
				>
					<span aria-hidden="true" className={ROW} data-line="1">
						<span aria-hidden="true" className={PROSE_PREFIX}>
							{PROSE.curiousPrefix.trimEnd()}
						</span>
						<span
							aria-hidden="true"
							className={`${BLOCK_BASE} ${BLOCK_CURIOUS}`}
							data-slot="curious"
						>
							<span aria-hidden="true" className={LIVE_WORD}>
								{curiousText}
								{showCuriousCursor && (
									<span className="hero-cursor" aria-hidden="true" />
								)}
							</span>
						</span>
					</span>
					<span aria-hidden="true" className={ROW} data-line="2">
						<span aria-hidden="true" className={PROSE_PREFIX}>
							{PROSE.outcomePrefix.trimEnd()}
						</span>
						<span
							aria-hidden="true"
							className={`${BLOCK_BASE} ${BLOCK_OUTCOME}`}
							data-slot="outcome"
						>
							<span aria-hidden="true" className={LIVE_WORD}>
								{outcomeText}
								{showOutcomeCursor && (
									<span className="hero-cursor" aria-hidden="true" />
								)}
							</span>
						</span>
					</span>
				</span>
			</div>

			<a
				href={`#${SECTION_IDS.findMe}`}
				className="mt-1 inline-flex flex-col items-center gap-1 text-sm sm:text-base font-medium text-slate-700 transition hover:opacity-70"
			>
				{HERO_CTA}
				<ChevronDown
					className="hero-scroll-arrow"
					size={22}
					strokeWidth={2.5}
					aria-hidden="true"
				/>
			</a>
		</div>
	);
}
