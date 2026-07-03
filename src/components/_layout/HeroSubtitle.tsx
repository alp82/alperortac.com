import { ChevronDown } from "lucide-react";
import { useEffect, useState } from "react";
import { HERO_CTA, HERO_SUMMARY } from "../../data/hero";
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

export function HeroSubtitle() {
	const [lineOne, lineTwo = ""] = HERO_SUMMARY;
	const [beforeWord, afterWord] = lineTwo.split(SERIF_WORD);
	return (
		<div className="hero-type mx-auto mt-12 flex w-fit flex-col items-center gap-y-4 sm:gap-y-5 tracking-[0.04em] text-[#0a0a0a] text-xl sm:text-2xl md:text-3xl text-center">
			<div className="my-8 flex flex-col gap-6">
				<p
					data-line={1}
					className="max-w-[760px] mb-8 font-bold text-2xl sm:text-3xl md:text-4xl"
				>
					{lineOne}
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
