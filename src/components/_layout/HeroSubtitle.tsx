import { ChevronDown } from "lucide-react";
import { type ReactNode, useEffect, useId, useRef, useState } from "react";
import {
	HERO_CTA,
	HERO_SUMMARY,
	HERO_TERMS,
	type HeroTerm,
} from "../../data/hero";
import { SECTION_IDS } from "../../data/sections";
import { useReducedMotion } from "./dive/useReducedMotion";

const SERIF_WORD = "passion";

// Hand-drawn underline beneath the "passion" word; geometry + colors per the
// LOCKED_DESIGN_SPEC (.prototypes/design-hero-passion-explorer.html).
// Ambient accents (dusk crossfade overlay + breathing underline) per
// .prototypes/design-hero-passion-accent-v2.html.
function SunsetUnderline() {
	const reduced = useReducedMotion();
	const [drawn, setDrawn] = useState(false);
	useEffect(() => {
		const id = requestAnimationFrame(() => setDrawn(true));
		return () => cancelAnimationFrame(id);
	}, []);
	return (
		<svg
			className="pointer-events-none absolute bottom-[-0.14em] left-[-2%] h-[0.3em] w-[104%] overflow-visible"
			viewBox="0 0 200 12"
			preserveAspectRatio="none"
			aria-hidden="true"
		>
			<path
				className="hero-underline-breathe"
				d="M3,7 C40,2 75,11 110,5 C140,0.5 170,10 197,6"
				fill="none"
				stroke="#C2410C"
				strokeWidth={5}
				strokeLinecap="round"
				pathLength={1}
				style={{
					strokeDasharray: 1,
					strokeDashoffset: reduced || drawn ? 0 : 1,
					transition: reduced ? undefined : "stroke-dashoffset 600ms ease-out",
				}}
			/>
		</svg>
	);
}

// Role-term gloss per the LOCKED_DESIGN_SPEC (.prototypes/hero-term-explainers.html,
// variant B "brutalist card", square corners): dashed underline + help cursor,
// card shows on hover / focus. On touch (no hover) a tap opens it and a tap
// anywhere else closes it - never pinned by mouse click.
// Card copy is aria-hidden and wired via aria-describedby so line 1's visible
// text stays exactly HERO_SUMMARY[0].
function TermGloss({ def }: { def: HeroTerm }) {
	const [open, setOpen] = useState(false);
	const ref = useRef<HTMLButtonElement>(null);
	const tipId = useId();

	useEffect(() => {
		if (!open) return;
		const close = (e: PointerEvent) => {
			if (!ref.current?.contains(e.target as Node)) setOpen(false);
		};
		document.addEventListener("pointerdown", close);
		return () => document.removeEventListener("pointerdown", close);
	}, [open]);

	const handleClick = () => {
		// Mouse users already have :hover; only hover-less devices toggle.
		if (window.matchMedia("(hover: none)").matches) setOpen((v) => !v);
	};

	return (
		// A real <button> (not a tabbable span) so keyboard + AT semantics come
		// for free; [font:inherit] etc. strip the UA button chrome so it reads
		// as part of the sentence.
		<button
			ref={ref}
			type="button"
			data-term={def.term}
			aria-describedby={tipId}
			onClick={handleClick}
			className="group relative inline cursor-help border-0 bg-transparent p-0 [font:inherit] [letter-spacing:inherit] text-inherit underline decoration-dashed decoration-2 decoration-slate-900/70 underline-offset-[5px] outline-none"
		>
			{def.term}
			<span
				id={tipId}
				role="tooltip"
				aria-hidden="true"
				data-open={open || undefined}
				className={`pointer-events-none absolute bottom-[calc(100%+12px)] left-1/2 z-10 w-max max-w-[270px] -translate-x-1/2 border-[2.5px] border-slate-900 bg-white px-3.5 py-2.5 text-left text-sm font-normal leading-[1.45] tracking-[0.01em] text-slate-900 shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] transition-[opacity,transform] duration-150 group-hover:translate-y-0 group-hover:opacity-100 group-focus-visible:translate-y-0 group-focus-visible:opacity-100 ${open ? "translate-y-0 opacity-100" : "translate-y-1 opacity-0"}`}
			>
				{def.tipPre}
				<b className="font-bold text-[#C2410C]">{def.tipBold}</b>
				{def.tipPost}
			</span>
		</button>
	);
}

// Split line 1 on the HERO_TERMS phrases so each gets a TermGloss; plain text
// segments pass through untouched. A term missing from the line is skipped.
function renderLineOne(line: string): ReactNode[] {
	const nodes: ReactNode[] = [];
	let rest = line;
	for (const def of HERO_TERMS) {
		const at = rest.indexOf(def.term);
		if (at === -1) continue;
		nodes.push(rest.slice(0, at));
		nodes.push(<TermGloss key={def.term} def={def} />);
		rest = rest.slice(at + def.term.length);
	}
	nodes.push(rest);
	return nodes;
}

export function HeroSubtitle() {
	const [lineOne = "", lineTwo = ""] = HERO_SUMMARY;
	const [beforeWord, afterWord] = lineTwo.split(SERIF_WORD);
	return (
		<div className="hero-type mx-auto mt-12 flex w-fit flex-col items-center gap-y-4 sm:gap-y-5 tracking-[0.04em] text-[#0a0a0a] text-xl sm:text-2xl md:text-3xl text-center">
			<div className="my-8 flex flex-col gap-6">
				<p
					data-line={1}
					className="max-w-[760px] mb-8 font-bold text-2xl sm:text-3xl md:text-4xl"
				>
					{renderLineOne(lineOne)}
				</p>
				<p data-line={2} className="max-w-[815px] px-12 font-medium">
					{beforeWord}
					{/* sunset micro-ramp per LOCKED_DESIGN_SPEC (#C2410C also in SunsetUnderline's stroke) */}
					<span className="relative font-['Instrument_Serif'] italic font-extrabold text-[1.25em] tracking-[0.08em] inline-block pb-[0.08em] bg-clip-text text-transparent bg-[linear-gradient(100deg,#D9530E,#C2410C,#A8380A)]">
						{SERIF_WORD}
						{/* dusk crossfade overlay per .prototypes/design-hero-passion-accent-v2.html (crossfade-dusk) */}
						<span
							aria-hidden="true"
							className="hero-passion-dusk pointer-events-none select-none absolute inset-0 bg-clip-text text-transparent bg-[linear-gradient(100deg,#B4441C,#8B2E12,#5C1607)]"
						>
							{SERIF_WORD}
						</span>
						<SunsetUnderline />
					</span>
					{afterWord}
				</p>
			</div>

			<a
				href={`#${SECTION_IDS.findMe}`}
				className="mt-12 inline-flex flex-col items-center gap-1 text-sm sm:text-base font-medium text-slate-700 transition opacity-90 hover:opacity-100"
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
