import { describe, expect, it } from "vitest";
import {
	cursorActive,
	delayForSeq,
	makeInitialSeq,
	type SeqConfig,
	type SeqState,
	seqNext,
	slotText,
} from "../sequentialCycle";

// ---------------------------------------------------------------------------
// Fixtures — two typewriter slots: curious (line 1), outcome (line 2).
// ---------------------------------------------------------------------------
const TEST_CONFIG: SeqConfig = {
	curious: ["the web", "AI", "good design", "how things work"],
	outcome: ["memorable", "original", "genuinely useful", "a little different"],
	timing: { type: 40, backspace: 14, dwell: 1100, push: 420 },
};

// ---------------------------------------------------------------------------
// Helper: drive seqNext until predicate is true.
// Throws (fails the test) if the safety cap is exceeded.
// ---------------------------------------------------------------------------
function advanceUntil(
	state: SeqState,
	predicate: (s: SeqState) => boolean,
	cap = 5000,
): SeqState {
	let s = state;
	let iterations = 0;
	while (!predicate(s)) {
		if (iterations >= cap) {
			throw new Error(
				`advanceUntil: safety cap of ${cap} iterations exceeded ` +
					`(last phase: ${s.phase}, active: ${s.active})`,
			);
		}
		s = seqNext(s, TEST_CONFIG);
		iterations++;
	}
	return s;
}

// ---------------------------------------------------------------------------
describe("sequentialCycle pure state machine", () => {
	const INITIAL = makeInitialSeq();
	const next = (s: SeqState) => seqNext(s, TEST_CONFIG);

	// SC-01 ----------------------------------------------------------------
	it("SC-01: makeInitialSeq deep-equals {active:'outcome',phase:'dwell',indices:{curious:0,outcome:0},typed:''}", () => {
		expect(INITIAL).toEqual({
			active: "outcome",
			phase: "dwell",
			indices: { curious: 0, outcome: 0 },
			typed: "",
		});
	});

	// SC-02 ----------------------------------------------------------------
	it("SC-02: first tick from initial -> active:'curious', phase:'backspacing', typed===curious[0], indices unchanged", () => {
		const s = next(INITIAL);
		expect(s.active).toBe("curious");
		expect(s.phase).toBe("backspacing");
		expect(s.typed).toBe(TEST_CONFIG.curious[0]);
		expect(s.indices.curious).toBe(0);
		expect(s.indices.outcome).toBe(0);
	});

	// SC-03 ----------------------------------------------------------------
	it("SC-03: backspacing slices one char/tick; when typed reaches '' next tick sets indices.curious===1 (mod 4) and phase:'typing'", () => {
		let s = next(INITIAL); // backspacing, active="curious", typed="the web"
		expect(s.phase).toBe("backspacing");
		expect(s.active).toBe("curious");
		const initialTyped = s.typed;
		expect(initialTyped).toBe("the web");

		// Each tick removes one character
		const oneBack = next(s);
		expect(oneBack.typed).toBe(initialTyped.slice(0, -1));
		expect(oneBack.phase).toBe("backspacing");

		// Drain to empty
		while (s.typed !== "") {
			s = next(s);
		}
		expect(s.typed).toBe("");
		expect(s.phase).toBe("backspacing");

		// Next tick: index advances (0 -> 1 mod 4) and phase becomes "typing"
		const typing = next(s);
		expect(typing.indices.curious).toBe(1);
		expect(typing.phase).toBe("typing");
	});

	// SC-04 ----------------------------------------------------------------
	it("SC-04: typing appends one char/tick; on completion phase:'dwell', active stays 'curious', typed===full target word", () => {
		let s = next(INITIAL); // backspacing, active="curious"
		s = advanceUntil(
			s,
			(st) => st.phase === "typing" && st.active === "curious",
		);
		expect(s.phase).toBe("typing");
		expect(s.typed).toBe("");

		const targetWord = TEST_CONFIG.curious[s.indices.curious] ?? "";

		// First tick appends one character
		const firstType = next(s);
		expect(firstType.typed).toBe(targetWord.slice(0, 1));
		expect(firstType.phase).toBe("typing");

		// Drive to completion
		let typingState = s;
		let ticks = 0;
		while (typingState.phase === "typing") {
			typingState = next(typingState);
			ticks++;
			if (ticks > 500) throw new Error("SC-04: typing never ended");
		}
		expect(ticks).toBe(targetWord.length);
		expect(typingState.typed).toBe(targetWord);
		expect(typingState.phase).toBe("dwell");
		expect(typingState.active).toBe("curious");
	});

	// SC-05 ----------------------------------------------------------------
	it("SC-05: ring order curious,outcome repeats; delayForSeq per phase; cursorActive truth table", () => {
		// Collect the active slot at each animation-start (dwell -> backspacing).
		// Expect two full cycles: curious, outcome, curious, outcome.
		const animStarts: string[] = [];
		let s = INITIAL;

		let ticks = 0;
		while (animStarts.length < 4) {
			const prev = s;
			s = next(s);
			ticks++;
			if (ticks > 10000) throw new Error("SC-05: cap exceeded");

			if (prev.phase === "dwell" && s.phase === "backspacing") {
				animStarts.push(s.active);
			}
		}

		expect(animStarts).toEqual(["curious", "outcome", "curious", "outcome"]);

		// delayForSeq — one representative state per phase
		const dwellState: SeqState = {
			...INITIAL,
			phase: "dwell",
		};
		const backspacingState: SeqState = {
			...INITIAL,
			active: "curious",
			phase: "backspacing",
			typed: "the web",
		};
		const typingState: SeqState = {
			...INITIAL,
			active: "curious",
			phase: "typing",
			typed: "t",
		};

		expect(delayForSeq(dwellState, TEST_CONFIG)).toBe(TEST_CONFIG.timing.dwell);
		expect(delayForSeq(backspacingState, TEST_CONFIG)).toBe(
			TEST_CONFIG.timing.backspace,
		);
		expect(delayForSeq(typingState, TEST_CONFIG)).toBe(TEST_CONFIG.timing.type);

		// cursorActive: true only during backspacing or typing
		expect(cursorActive(dwellState)).toBe(false);
		expect(cursorActive(backspacingState)).toBe(true);
		expect(cursorActive(typingState)).toBe(true);
	});

	// SC-06 ----------------------------------------------------------------
	it("SC-06: slotText(state,'curious'/'outcome',config) returns typed when active+cursorActive else pool[idx]", () => {
		const backspacingCurious: SeqState = {
			active: "curious",
			phase: "backspacing",
			indices: { curious: 0, outcome: 0 },
			typed: "the w",
		};
		const typingOutcome: SeqState = {
			active: "outcome",
			phase: "typing",
			indices: { curious: 0, outcome: 0 },
			typed: "memo",
		};
		const dwellCurious: SeqState = {
			active: "curious",
			phase: "dwell",
			indices: { curious: 1, outcome: 0 },
			typed: "",
		};

		// active===slot && cursorActive -> return typed
		expect(slotText(backspacingCurious, "curious", TEST_CONFIG)).toBe("the w");
		expect(slotText(typingOutcome, "outcome", TEST_CONFIG)).toBe("memo");

		// active !== slot -> return pool[indices[slot]]
		expect(slotText(backspacingCurious, "outcome", TEST_CONFIG)).toBe(
			TEST_CONFIG.outcome[0],
		);
		expect(slotText(typingOutcome, "curious", TEST_CONFIG)).toBe(
			TEST_CONFIG.curious[0],
		);

		// dwell phase -> cursorActive=false -> return pool[indices[slot]]
		expect(slotText(dwellCurious, "curious", TEST_CONFIG)).toBe(
			TEST_CONFIG.curious[1], // indices.curious===1
		);
	});

	// WRAP COVERAGE --------------------------------------------------------
	it("WRAP: curious wraps 3->0 (mod 4); outcome wraps 3->0 (mod 4); all indices stay in range", () => {
		let s = INITIAL;
		let curiousWrapped = false;
		let outcomeWrapped = false;

		let prevCurious = s.indices.curious;
		let prevOutcome = s.indices.outcome;

		for (let i = 0; i < 20000; i++) {
			s = next(s);

			// Every index must stay within its pool's bounds
			expect(s.indices.curious).toBeGreaterThanOrEqual(0);
			expect(s.indices.curious).toBeLessThan(TEST_CONFIG.curious.length); // < 4
			expect(s.indices.outcome).toBeGreaterThanOrEqual(0);
			expect(s.indices.outcome).toBeLessThan(TEST_CONFIG.outcome.length); // < 4

			// Detect wraps at their respective last-index boundaries
			if (s.indices.curious === 0 && prevCurious === 3) curiousWrapped = true;
			if (s.indices.outcome === 0 && prevOutcome === 3) outcomeWrapped = true;

			prevCurious = s.indices.curious;
			prevOutcome = s.indices.outcome;

			if (curiousWrapped && outcomeWrapped) break;
		}

		expect(curiousWrapped, "curious index must wrap 3->0").toBe(true);
		expect(outcomeWrapped, "outcome index must wrap 3->0").toBe(true);
	});
});
