import { memo } from "react";
import { HeroSubtitle } from "./HeroSubtitle";

// No bottom padding: RhythmGap is the ONLY thing that separates sections, so
// gapVh alone controls every boundary (ticket #51). pt-24 stays - it clears the
// fixed nav, it is not boundary spacing.
function HeroSectionInner() {
	return (
		<section className="min-h-[80vh] flex flex-col items-center justify-center px-6 pt-24 text-center">
			<img
				src="/alper-avatar.webp"
				alt="Alp portrait"
				className="w-28 h-28 md:w-32 md:h-32 rounded-full border-4 border-slate-900 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] mb-8 object-cover"
			/>
			<h1 className="text-6xl md:text-8xl font-black mb-6 leading-[0.9] tracking-tighter drop-shadow-sm text-slate-900">
				HEY, I'M ALPER.
			</h1>
			<HeroSubtitle />
		</section>
	);
}

// Memoised: LayoutHost holds state that changes for reasons unrelated to this
// section (the About dropdown, the settled scroll position, a dive). Without
// this, every one of those re-rendered the whole page - the About-menu open was
// a ~150ms main-thread task on its own.
export const HeroSection = memo(HeroSectionInner);
