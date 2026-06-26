import { HERO_PHRASES, HERO_ROLES, HERO_TIMING } from "../../data/hero";
import type { CycleConfig } from "./typewriterCycle";
import { useTypewriterCycle } from "./useTypewriterCycle";

const HERO_CONFIG: CycleConfig = {
	roles: HERO_ROLES,
	phrases: HERO_PHRASES,
	timing: HERO_TIMING,
};

export function HeroSubtitle() {
	const { role, phrase, text, active, leftIndex } =
		useTypewriterCycle(HERO_CONFIG);

	return (
		<div
			role="img"
			aria-label={`${role} ${phrase}`}
			className="mt-8 grid w-full grid-cols-[1fr_auto_1fr] items-baseline text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl leading-relaxed"
		>
			<span
				key={leftIndex}
				aria-hidden="true"
				className="hero-role-in justify-self-end whitespace-nowrap bg-gradient-to-b from-slate-900 to-slate-600 bg-clip-text font-black uppercase text-transparent"
			>
				{role}
			</span>
			<span aria-hidden="true" className="px-2 md:px-3">
				{" "}
			</span>
			<span
				aria-hidden="true"
				className="justify-self-start whitespace-nowrap rounded-md bg-white/50 px-4 py-2 font-bold text-slate-900 backdrop-blur-md"
			>
				{text}
				{active && <span className="hero-cursor" aria-hidden="true" />}
			</span>
		</div>
	);
}
