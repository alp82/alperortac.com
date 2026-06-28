import { useEffect, useReducer, useState } from "react";
import {
	cursorActive,
	delayForSeq,
	makeInitialSeq,
	type SeqConfig,
	type SeqState,
	seqNext,
	slotText,
} from "./sequentialCycle";

/** Prose connectors shared with HeroSubtitle for the ghost/visible text. */
export const PROSE = {
	curiousPrefix: "I'm a web enthusiast and I care about ",
	outcomePrefix: "and I create projects that come out ",
};

/** Build the full manifesto sentence from settled pool words. */
export function formatManifesto(curious: string, outcome: string): string {
	return `I'm a web enthusiast, endlessly curious about ${curious}, building side projects that come out ${outcome}.`;
}

export type SeqProjection = {
	curiousText: string;
	outcomeText: string;
	showCuriousCursor: boolean;
	showOutcomeCursor: boolean;
	label: string;
};

export function useSequentialCycle(config: SeqConfig): SeqProjection {
	const [state, dispatch] = useReducer(
		(s: SeqState) => seqNext(s, config),
		makeInitialSeq(),
	);
	const [animationActive, setAnimationActive] = useState(false);

	useEffect(() => {
		if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
			return;
		}
		setAnimationActive(true);
	}, []);

	useEffect(() => {
		if (!animationActive) return;
		const t = setTimeout(() => dispatch(), delayForSeq(state, config));
		return () => clearTimeout(t);
	}, [state, animationActive, config]);

	// animationActive gate: when animation is off, always show the settled pool word.
	const curiousText = animationActive
		? slotText(state, "curious", config)
		: (config.curious[state.indices.curious] ?? "");
	const outcomeText = animationActive
		? slotText(state, "outcome", config)
		: (config.outcome[state.indices.outcome] ?? "");

	const showCuriousCursor =
		animationActive && state.active === "curious" && cursorActive(state);
	const showOutcomeCursor =
		animationActive && state.active === "outcome" && cursorActive(state);

	// label always reflects the SETTLED pool words (never partial typed fragments).
	const label = formatManifesto(
		config.curious[state.indices.curious] ?? "",
		config.outcome[state.indices.outcome] ?? "",
	);

	return {
		curiousText,
		outcomeText,
		showCuriousCursor,
		showOutcomeCursor,
		label,
	};
}
