import {
	FOOTER_PHRASES,
	FOOTER_ROLES,
	FOOTER_TIMING,
} from "../../../data/footer";
import type { CycleConfig } from "../typewriterCycle";
import { useTypewriterCycle } from "../useTypewriterCycle";

const FOOTER_CONFIG: CycleConfig = {
	roles: FOOTER_ROLES,
	phrases: FOOTER_PHRASES,
	timing: FOOTER_TIMING,
};

export function FooterHeadline() {
	const { role, phrase, text, active } = useTypewriterCycle(FOOTER_CONFIG);

	return (
		<div
			role="img"
			aria-label={`${role} ${phrase}`}
			className="flex flex-wrap items-baseline gap-x-3 text-3xl md:text-5xl lg:text-6xl leading-tight"
		>
			<span
				aria-hidden="true"
				className="font-black uppercase tracking-tighter bg-gradient-to-b from-white to-slate-300 bg-clip-text text-transparent"
			>
				{role}
			</span>
			<span aria-hidden="true" className="font-light lowercase text-slate-200">
				{text}
				{active && <span className="footer-cursor" aria-hidden="true" />}
			</span>
		</div>
	);
}
