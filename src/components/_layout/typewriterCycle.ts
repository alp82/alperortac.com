export type CyclePhase = "dwell" | "backspacing" | "typing" | "pushing";

export type CycleState = {
	leftIndex: number;
	rightIndex: number;
	turn: "right" | "left";
	phase: CyclePhase;
	typed: string;
};

export type CycleConfig = {
	roles: readonly string[];
	phrases: readonly string[];
	timing: { type: number; backspace: number; dwell: number; push: number };
};

export function makeInitial(config: CycleConfig): CycleState {
	return {
		leftIndex: 0,
		rightIndex: 0,
		turn: "right",
		phase: "dwell",
		typed: config.phrases[0] ?? "",
	};
}

export function cycleNext(state: CycleState, config: CycleConfig): CycleState {
	switch (state.phase) {
		case "dwell":
			if (state.turn === "right") return { ...state, phase: "backspacing" };
			return {
				...state,
				phase: "pushing",
				leftIndex: (state.leftIndex + 1) % config.roles.length,
				turn: "right",
			};
		case "backspacing": {
			if (state.typed.length === 0) {
				return {
					...state,
					rightIndex: (state.rightIndex + 1) % config.phrases.length,
					phase: "typing",
				};
			}
			return { ...state, typed: state.typed.slice(0, -1) };
		}
		case "typing": {
			const target = config.phrases[state.rightIndex] ?? "";
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

export function delayFor(state: CycleState, config: CycleConfig): number {
	switch (state.phase) {
		case "dwell":
			return config.timing.dwell;
		case "backspacing":
			return config.timing.backspace;
		case "typing":
			return config.timing.type;
		case "pushing":
			return config.timing.push;
	}
}
