import { useEffect, useReducer, useState } from "react";
import { HERO_PHRASES, HERO_ROLES, HERO_TIMING } from "../../data/hero";

export type Phase = "dwell" | "backspacing" | "typing" | "pushing";

export type HeroState = {
	leftIndex: number;
	rightIndex: number;
	turn: "right" | "left";
	phase: Phase;
	typed: string;
};

export const INITIAL: HeroState = {
	leftIndex: 0,
	rightIndex: 0,
	turn: "right",
	phase: "dwell",
	typed: HERO_PHRASES[0] ?? "",
};

export function heroNext(state: HeroState): HeroState {
	switch (state.phase) {
		case "dwell":
			if (state.turn === "right") return { ...state, phase: "backspacing" };
			return {
				...state,
				phase: "pushing",
				leftIndex: (state.leftIndex + 1) % HERO_ROLES.length,
				turn: "right",
			};
		case "backspacing": {
			if (state.typed.length === 0) {
				return {
					...state,
					rightIndex: (state.rightIndex + 1) % HERO_PHRASES.length,
					phase: "typing",
				};
			}
			return { ...state, typed: state.typed.slice(0, -1) };
		}
		case "typing": {
			const target = HERO_PHRASES[state.rightIndex] ?? "";
			if (state.typed.length >= target.length) {
				return { ...state, turn: "left", phase: "dwell" };
			}
			const nextTyped = target.slice(0, state.typed.length + 1);
			return nextTyped === target
				? { ...state, typed: nextTyped, turn: "left", phase: "dwell" }
				: { ...state, typed: nextTyped };
		}
		case "pushing":
			return { ...state, phase: "dwell" };
	}
}

export function delayFor(state: HeroState): number {
	switch (state.phase) {
		case "dwell":
			return HERO_TIMING.dwell;
		case "backspacing":
			return HERO_TIMING.backspace;
		case "typing":
			return HERO_TIMING.type;
		case "pushing":
			return HERO_TIMING.push;
	}
}

export function HeroSubtitle() {
	const [state, dispatch] = useReducer((s: HeroState) => heroNext(s), INITIAL);
	const [active, setActive] = useState(false);

	useEffect(() => {
		if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
			return;
		}
		setActive(true);
	}, []);

	useEffect(() => {
		if (!active) return;
		const t = setTimeout(() => dispatch(), delayFor(state));
		return () => clearTimeout(t);
	}, [state, active]);

	const role = HERO_ROLES[state.leftIndex] ?? HERO_ROLES[0] ?? "";
	const phrase = HERO_PHRASES[state.rightIndex] ?? HERO_PHRASES[0] ?? "";
	const rightText = active ? state.typed : phrase;

	return (
		<div
			role="img"
			aria-label={`${role} ${phrase}`}
			className="mt-8 grid w-full grid-cols-[1fr_auto_1fr] items-baseline text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl leading-relaxed"
		>
			<span
				key={state.leftIndex}
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
				{rightText}
				{active && <span className="hero-cursor" aria-hidden="true" />}
			</span>
		</div>
	);
}
