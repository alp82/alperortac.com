import { ChevronDown } from "lucide-react";
import { HERO_CTA, HERO_SUMMARY } from "../../data/hero";
import { SECTION_IDS } from "../../data/sections";

const SERIF_WORD = "passion";

export function HeroSubtitle() {
	const [lineOne, lineTwo = ""] = HERO_SUMMARY;
	const [beforeWord, afterWord] = lineTwo.split(SERIF_WORD);
	return (
		<div className="hero-type mx-auto mt-12 flex w-fit flex-col items-center gap-y-4 sm:gap-y-5 tracking-[0.04em] text-[#0a0a0a] text-xl sm:text-2xl md:text-3xl text-center">
			<div className="my-8 flex flex-col gap-6">
				<p data-line={1} className="font-bold text-2xl sm:text-3xl md:text-4xl">
					{lineOne}
				</p>
				<p data-line={2} className="font-medium">
					{beforeWord}
					<span className="font-['Instrument_Serif'] italic font-extrabold text-[1.1em] tracking-[0.08em] inline-block bg-clip-text text-transparent bg-[linear-gradient(100deg,#dc2626,#ea580c,#d97706,#16a34a,#2563eb,#7c3aed)]">
						{SERIF_WORD}
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
