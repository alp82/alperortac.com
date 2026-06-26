import { useEffect, useReducer, useState } from "react";
import {
	type CycleConfig,
	cycleNext,
	delayFor,
	makeInitial,
} from "./typewriterCycle";

export function useTypewriterCycle(config: CycleConfig): {
	role: string;
	phrase: string;
	text: string;
	active: boolean;
	leftIndex: number;
} {
	const [state, dispatch] = useReducer(
		(s: ReturnType<typeof makeInitial>) => cycleNext(s, config),
		makeInitial(config),
	);
	const [active, setActive] = useState(false);

	useEffect(() => {
		if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
			return;
		}
		setActive(true);
	}, []);

	useEffect(() => {
		if (!active) return;
		const t = setTimeout(() => dispatch(), delayFor(state, config));
		return () => clearTimeout(t);
	}, [state, active, config]);

	const role = config.roles[state.leftIndex] ?? config.roles[0] ?? "";
	const phrase = config.phrases[state.rightIndex] ?? config.phrases[0] ?? "";
	const text = active ? state.typed : phrase;

	return { role, phrase, text, active, leftIndex: state.leftIndex };
}
