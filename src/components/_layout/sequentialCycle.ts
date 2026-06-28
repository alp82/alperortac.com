export type Slot = "curious" | "outcome";

export type SeqPhase = "dwell" | "backspacing" | "typing";

export type SeqState = {
	active: Slot;
	phase: SeqPhase;
	indices: { curious: number; outcome: number };
	typed: string;
};

export type SeqConfig = {
	curious: readonly string[];
	outcome: readonly string[];
	timing: { type: number; backspace: number; dwell: number; push: number };
};

const NEXT_SLOT: Record<Slot, Slot> = {
	curious: "outcome",
	outcome: "curious",
};

function poolFor(config: SeqConfig, slot: Slot): readonly string[] {
	if (slot === "curious") return config.curious;
	return config.outcome;
}

export function makeInitialSeq(): SeqState {
	return {
		active: "outcome",
		phase: "dwell",
		indices: { curious: 0, outcome: 0 },
		typed: "",
	};
}

export function seqNext(state: SeqState, config: SeqConfig): SeqState {
	switch (state.phase) {
		case "dwell": {
			const next = NEXT_SLOT[state.active];
			const pool = poolFor(config, next);
			return {
				...state,
				active: next,
				phase: "backspacing",
				typed: pool[state.indices[next]] ?? "",
			};
		}
		case "backspacing": {
			if (state.typed === "") {
				const pool = poolFor(config, state.active);
				return {
					...state,
					indices: {
						...state.indices,
						[state.active]: (state.indices[state.active] + 1) % pool.length,
					},
					phase: "typing",
				};
			}
			return { ...state, typed: state.typed.slice(0, -1) };
		}
		case "typing": {
			const target =
				poolFor(config, state.active)[state.indices[state.active]] ?? "";
			if (state.typed.length >= target.length) {
				return { ...state, phase: "dwell" };
			}
			const nextTyped = target.slice(0, state.typed.length + 1);
			return nextTyped === target
				? { ...state, typed: nextTyped, phase: "dwell" }
				: { ...state, typed: nextTyped };
		}
	}
}

export function delayForSeq(state: SeqState, config: SeqConfig): number {
	switch (state.phase) {
		case "dwell":
			return config.timing.dwell;
		case "backspacing":
			return config.timing.backspace;
		case "typing":
			return config.timing.type;
	}
}

export function cursorActive(state: SeqState): boolean {
	return state.phase === "backspacing" || state.phase === "typing";
}

/**
 * Returns state.typed when the slot is actively being edited (cursorActive),
 * otherwise returns the settled pool word at the current index.
 * The animationActive gate lives in the hook (useSequentialCycle).
 */
export function slotText(
	state: SeqState,
	slot: Slot,
	config: SeqConfig,
): string {
	const pool = poolFor(config, slot);
	if (state.active === slot && cursorActive(state)) {
		return state.typed;
	}
	return pool[state.indices[slot]] ?? "";
}
