import {
	FOOTER_PHRASES,
	FOOTER_ROLES,
	FOOTER_TIMING,
} from "../../../data/footer";
import type { Ceiling, FitTextSpec } from "../fitText";
import type { CycleConfig } from "../typewriterCycle";
import { useFitText } from "../useFitText";
import { useTypewriterCycle } from "../useTypewriterCycle";

const FOOTER_CONFIG: CycleConfig = {
	roles: FOOTER_ROLES,
	phrases: FOOTER_PHRASES,
	timing: FOOTER_TIMING,
};

// Ceiling matches the old lg:text-6xl (3.75rem = 60px).
const CEILING_PX = 60;
const FIT_SPEC: FitTextSpec = {
	ceilingPx: CEILING_PX,
	fixedPx: 14, // gap-x-3 12px + role pr-0.5 2px
	allowancePx: 8, // footer-cursor ~6px + hairline
};

// Breakpoint-aware caps mirroring the old responsive scale; sorted descending
// by minWidth as resolveCeiling requires.
const FOOTER_CEILINGS: Ceiling[] = [
	{ minWidth: 1024, px: 60 }, // lg:text-6xl
	{ minWidth: 768, px: 48 }, // md:text-5xl
	{ minWidth: 0, px: 30 }, // text-3xl base
];

export function FooterHeadline() {
	const { role, phrase, text, active } = useTypewriterCycle(FOOTER_CONFIG);
	// Keyed on the FULL phrase, so the size is computed once per phrase and
	// held constant through typing/backspacing.
	const { containerRef, ghostRef, fontSizePx, ceilingPx } = useFitText(
		`${role} ${phrase}`,
		FIT_SPEC,
		FOOTER_CEILINGS,
	);

	return (
		<div
			ref={containerRef}
			role="img"
			aria-label={`${role} ${phrase}`}
			className="relative flex flex-nowrap items-baseline gap-x-3 leading-tight"
			style={{ fontSize: fontSizePx, minHeight: ceilingPx * 1.25 }}
		>
			{/* Ghost width marker: the full line at the ceiling size, replicating
			    only the metric-affecting classes of the visible spans. */}
			<span
				ref={ghostRef}
				aria-hidden="true"
				className="invisible absolute left-0 top-0 flex items-baseline gap-x-3 whitespace-nowrap"
				style={{ fontSize: CEILING_PX }}
			>
				<span
					aria-hidden="true"
					className="pr-0.5 font-black uppercase tracking-tighter"
				>
					{role}
				</span>
				<span aria-hidden="true" className="font-light lowercase">
					{phrase}
				</span>
			</span>
			<span
				aria-hidden="true"
				className="pr-0.5 font-black uppercase tracking-tighter bg-gradient-to-b from-white to-slate-300 bg-clip-text text-transparent"
			>
				{role}
			</span>
			<span
				aria-hidden="true"
				className="font-light lowercase text-slate-200 whitespace-nowrap"
			>
				{text}
				{active && <span className="footer-cursor" aria-hidden="true" />}
			</span>
		</div>
	);
}
