import { memo, useRef } from "react";
import { HeroSubtitle } from "./HeroSubtitle";
import { useSectionNightPhase } from "./SectionTitle";

// No bottom padding: RhythmGap is the ONLY thing that separates sections, so
// gapVh alone controls every boundary (ticket #51). pt-24 stays - it clears the
// fixed nav, it is not boundary spacing.
//
// The hero sits at the top of the journey, so under live scroll it is always
// day; the night phase only ever flips via the atmosphere toy's time-slice
// override (NightOverrideContext through useSectionNightPhase).
function HeroSectionInner() {
	const sectionRef = useRef<HTMLElement>(null);
	const night = useSectionNightPhase(sectionRef);
	return (
		<section
			ref={sectionRef}
			className="min-h-[80vh] flex flex-col items-center justify-center px-6 pt-24 text-center"
		>
			<img
				src="/alper-avatar.webp"
				alt="Alp portrait"
				className={`w-28 h-28 md:w-32 md:h-32 rounded-full border-4 mb-8 object-cover ${night ? "border-white shadow-[6px_6px_0px_0px_rgba(255,255,255,0.35)]" : "border-slate-900 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]"}`}
			/>
			<h1
				className={`text-6xl md:text-8xl font-black mb-6 leading-[0.9] tracking-tighter drop-shadow-sm ${night ? "text-white" : "text-slate-900"}`}
			>
				HEY, I'M ALPER.
			</h1>
			<HeroSubtitle night={night} />
		</section>
	);
}

// Memoised: LayoutHost holds state that changes for reasons unrelated to this
// section (the About dropdown, the settled scroll position, a dive). Without
// this, every one of those re-rendered the whole page - the About-menu open was
// a ~150ms main-thread task on its own. The night-override context still
// reaches through the memo (context updates bypass props).
export const HeroSection = memo(HeroSectionInner);
