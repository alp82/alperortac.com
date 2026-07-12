import { describe, expect, it } from "vitest";
import {
	type CycleConfig,
	type CycleState,
	cycleNext,
	delayFor,
	makeInitial,
} from "../typewriterCycle";

// ---------------------------------------------------------------------------
// Inline fixtures - no dependency on src/data/hero so this suite stays green
// even as hero.ts evolves (HERO_TIMING / HERO_ROLES / HERO_PHRASES relocated).
// 5 roles and 5 phrases with DISTINCT LENGTHS so wrap tests (TC-PURE-11/12)
// remain meaningful.
// ---------------------------------------------------------------------------
const TEST_ROLES: readonly string[] = [
	"web enthusiast",
	"agentic coach",
	"engineering consultant",
	"solutions architect",
	"relentless tinkerer",
];

const TEST_PHRASES: readonly string[] = [
	"with a side project habit", // 25 chars
	"contributing to open source", // 28 chars
	"with a camera in hand", // 21 chars
	"always stepping outside his comfort zone", // 40 chars
	"shipping things on the side", // 27 chars
];

const TEST_TIMING = {
	type: 40,
	backspace: 14,
	dwell: 1100,
	push: 420,
} as const;

const TEST_CONFIG: CycleConfig = {
	roles: TEST_ROLES,
	phrases: TEST_PHRASES,
	timing: TEST_TIMING,
};

const INITIAL = makeInitial(TEST_CONFIG);
const next = (s: CycleState) => cycleNext(s, TEST_CONFIG);

// ---------------------------------------------------------------------------
// Helper: drive cycleNext until predicate(state) is true.
// Fails the test (throws) if the safety cap is exceeded.
// ---------------------------------------------------------------------------
function advanceUntil(
	state: CycleState,
	predicate: (s: CycleState) => boolean,
	cap = 2000,
): CycleState {
	let s = state;
	let iterations = 0;
	while (!predicate(s)) {
		if (iterations >= cap) {
			throw new Error(
				`advanceUntil: safety cap of ${cap} iterations exceeded (last phase: ${s.phase})`,
			);
		}
		s = next(s);
		iterations++;
	}
	return s;
}

// ---------------------------------------------------------------------------
describe("typewriterCycle pure state machine (v3 two-index model)", () => {
	const phrase0 = TEST_PHRASES[0]!;
	const phrase1 = TEST_PHRASES[1]!;

	// TC-PURE-01: INITIAL shape
	it("TC-PURE-01: makeInitial deep-equals { leftIndex:0, rightIndex:0, turn:'right', phase:'dwell', typed: TEST_PHRASES[0] }", () => {
		expect(INITIAL).toEqual({
			leftIndex: 0,
			rightIndex: 0,
			turn: "right",
			phase: "dwell",
			typed: TEST_PHRASES[0],
		});
	});

	// TC-PURE-02: dwell + turn=right -> backspacing, indices/typed unchanged
	it("TC-PURE-02: cycleNext(INITIAL dwell+turn:right) -> phase 'backspacing'; leftIndex/rightIndex/typed unchanged", () => {
		const nextState = next(INITIAL);
		expect(nextState.phase).toBe("backspacing");
		expect(nextState.leftIndex).toBe(INITIAL.leftIndex);
		expect(nextState.rightIndex).toBe(INITIAL.rightIndex);
		expect(nextState.typed).toBe(INITIAL.typed);
	});

	// TC-PURE-03: backspacing drops exactly one char per tick
	it("TC-PURE-03: backspacing drops exactly one char per tick", () => {
		const backspacing = next(INITIAL); // enters backspacing with full phrase0
		expect(backspacing.phase).toBe("backspacing");
		const nextState = next(backspacing);
		expect(nextState.typed).toBe(phrase0.slice(0, -1));
		expect(nextState.phase).toBe("backspacing");
	});

	// TC-PURE-04: after phrase0.length backspacing ticks, typed==="" and phase still "backspacing"
	it("TC-PURE-04: after exactly phrase0.length backspacing ticks, typed==='' and phase still 'backspacing'", () => {
		let state = next(INITIAL); // phase "backspacing", typed === phrase0
		expect(state.phase).toBe("backspacing");

		// We need phrase0.length ticks to empty the string (each drops one char)
		for (let i = 0; i < phrase0.length; i++) {
			state = next(state);
		}
		expect(state.typed).toBe("");
		expect(state.phase).toBe("backspacing");
	});

	// TC-PURE-05: the NEXT tick after backspacing+typed="" sets rightIndex===1 and phase==="typing"
	it("TC-PURE-05: tick after backspacing+typed='' -> rightIndex===1 and phase==='typing'", () => {
		let state = next(INITIAL); // backspacing
		for (let i = 0; i < phrase0.length; i++) {
			state = next(state);
		}
		// Now typed==="" and phase==="backspacing"
		expect(state.typed).toBe("");
		expect(state.phase).toBe("backspacing");

		const nextState = next(state);
		expect(nextState.rightIndex).toBe(1);
		expect(nextState.phase).toBe("typing");
	});

	// TC-PURE-06: typing appends exactly one char per tick; after TEST_PHRASES[1].length ticks typed===phrase1 and phase==="dwell" and turn==="left"
	it("TC-PURE-06: typing appends one char per tick; completing phrase sets turn:'left' and phase:'dwell'", () => {
		// Get to typing state with rightIndex=1, typed=""
		let state = next(INITIAL); // backspacing
		for (let i = 0; i <= phrase0.length; i++) {
			state = next(state);
		}
		// Now at rightIndex=1, phase="typing", typed=""
		expect(state.phase).toBe("typing");
		expect(state.rightIndex).toBe(1);
		expect(state.typed).toBe("");

		// First tick appends one char
		const firstType = next(state);
		expect(firstType.typed).toBe(phrase1.slice(0, 1));
		expect(firstType.phase).toBe("typing");

		// After phrase1.length ticks total, typed===phrase1, phase==="dwell", turn==="left"
		let typingState = state;
		let ticks = 0;
		while (typingState.phase === "typing") {
			typingState = next(typingState);
			ticks++;
			if (ticks > 2000) throw new Error("TC-PURE-06: typing never ended");
		}
		expect(ticks).toBe(phrase1.length);
		expect(typingState.typed).toBe(phrase1);
		expect(typingState.phase).toBe("dwell");
		expect(typingState.turn).toBe("left");
	});

	// TC-PURE-07: dwell + turn=left -> phase "pushing", leftIndex+1, turn="right"
	it("TC-PURE-07: cycleNext(dwell+turn:left) -> phase 'pushing', leftIndex===1, turn==='right'", () => {
		// Get to a dwell+turn:left state
		let state = next(INITIAL); // backspacing
		state = advanceUntil(
			state,
			(s) => s.phase === "dwell" && s.turn === "left",
		);
		expect(state.turn).toBe("left");
		const nextState = next(state);
		expect(nextState.phase).toBe("pushing");
		expect(nextState.leftIndex).toBe(1);
		expect(nextState.turn).toBe("right");
	});

	// TC-PURE-08: pushing -> phase "dwell", leftIndex unchanged
	it("TC-PURE-08: cycleNext(pushing) -> phase 'dwell', leftIndex unchanged", () => {
		let state = next(INITIAL);
		state = advanceUntil(state, (s) => s.phase === "pushing");
		const pushingLeftIndex = state.leftIndex;
		const nextState = next(state);
		expect(nextState.phase).toBe("dwell");
		expect(nextState.leftIndex).toBe(pushingLeftIndex);
	});

	// TC-PURE-09: SEQUENCE - first 5 dwell beats have (leftIndex,rightIndex) [[0,0],[0,1],[1,1],[1,2],[2,2]]
	it("TC-PURE-09: sequence of (leftIndex,rightIndex) at dwell beats is [[0,0],[0,1],[1,1],[1,2],[2,2]]", () => {
		const samples: [number, number][] = [];
		let state = INITIAL;

		// Collect INITIAL dwell beat
		expect(state.phase).toBe("dwell");
		samples.push([state.leftIndex, state.rightIndex]);

		const cap = 2000;
		let ticks = 0;
		let lastSample: [number, number] = [state.leftIndex, state.rightIndex];

		while (samples.length < 5) {
			state = next(state);
			ticks++;
			if (ticks > cap) throw new Error("TC-PURE-09: cap exceeded");

			if (state.phase === "dwell") {
				const current: [number, number] = [state.leftIndex, state.rightIndex];
				// dedupe consecutive duplicates
				if (current[0] !== lastSample[0] || current[1] !== lastSample[1]) {
					samples.push(current);
					lastSample = current;
				}
			}
		}

		expect(samples).toEqual([
			[0, 0],
			[0, 1],
			[1, 1],
			[1, 2],
			[2, 2],
		]);
	});

	// TC-PURE-10: ALTERNATION invariant - leftIndex and rightIndex NEVER both change on the same tick;
	// leftIndex changes only when prev.phase==="dwell" && prev.turn==="left";
	// rightIndex changes only when prev.phase==="backspacing" && prev.typed===""
	it("TC-PURE-10: alternation invariant - indices never both change same tick; each changes only at the correct phase", () => {
		// Drive enough to cross both wraps (both indices return to 0 at least once)
		// Full cycle per index: each phrase is typed then backspaced, 5 phrases each
		// Use a generous cap
		const cap = 2000;
		let state = INITIAL;
		let leftWrapped = false;
		let rightWrapped = false;
		let ticks = 0;

		// Track previous leftIndex and rightIndex to detect when they wrap back to 0
		let prevLeftIndex = state.leftIndex;
		let prevRightIndex = state.rightIndex;

		while (!(leftWrapped && rightWrapped)) {
			const prev = state;
			state = next(state);
			ticks++;
			if (ticks > cap) break; // Use break so we can still run assertions on collected data

			const leftChanged = prev.leftIndex !== state.leftIndex;
			const rightChanged = prev.rightIndex !== state.rightIndex;

			// Both must not change on the same tick
			expect(leftChanged && rightChanged).toBe(false);

			// leftIndex changes only on dwell+turn=left tick
			if (leftChanged) {
				expect(prev.phase).toBe("dwell");
				expect(prev.turn).toBe("left");
			}

			// rightIndex changes only on backspacing+typed="" tick
			if (rightChanged) {
				expect(prev.phase).toBe("backspacing");
				expect(prev.typed).toBe("");
			}

			// Detect wraps
			if (state.leftIndex === 0 && prevLeftIndex === 4) leftWrapped = true;
			if (state.rightIndex === 0 && prevRightIndex === 4) rightWrapped = true;
			prevLeftIndex = state.leftIndex;
			prevRightIndex = state.rightIndex;
		}

		// Ensure we actually completed both wraps
		expect(leftWrapped).toBe(true);
		expect(rightWrapped).toBe(true);
	});

	// TC-PURE-11: WRAP - leftIndex wraps from 4 to 0 through a pushing beat
	it("TC-PURE-11: leftIndex wraps 4->0 on a dwell+turn:left -> pushing tick", () => {
		// Construct a state with leftIndex=4 and advance through dwell+turn:left
		const state: CycleState = {
			leftIndex: 4,
			rightIndex: 4,
			turn: "left",
			phase: "dwell",
			typed: TEST_PHRASES[4]!,
		};
		const pushing = next(state);
		expect(pushing.phase).toBe("pushing");
		expect(pushing.leftIndex).toBe(0);
	});

	// TC-PURE-12: WRAP - rightIndex wraps from 4 to 0 through backspacing-empty
	it("TC-PURE-12: rightIndex wraps 4->0 on backspacing+typed='' -> typing tick", () => {
		const state: CycleState = {
			leftIndex: 4,
			rightIndex: 4,
			turn: "right",
			phase: "backspacing",
			typed: "",
		};
		const nextState = next(state);
		expect(nextState.phase).toBe("typing");
		expect(nextState.rightIndex).toBe(0);
	});

	// TC-PURE-13: delayFor returns correct ms for each phase
	it("TC-PURE-13: delayFor dwell -> TEST_TIMING.dwell", () => {
		expect(
			delayFor(
				{
					leftIndex: 0,
					rightIndex: 0,
					turn: "right",
					phase: "dwell",
					typed: phrase0,
				},
				TEST_CONFIG,
			),
		).toBe(TEST_TIMING.dwell);
	});

	it("TC-PURE-14: delayFor backspacing -> TEST_TIMING.backspace", () => {
		expect(
			delayFor(
				{
					leftIndex: 0,
					rightIndex: 0,
					turn: "right",
					phase: "backspacing",
					typed: phrase0,
				},
				TEST_CONFIG,
			),
		).toBe(TEST_TIMING.backspace);
	});

	it("TC-PURE-15: delayFor typing -> TEST_TIMING.type", () => {
		expect(
			delayFor(
				{
					leftIndex: 0,
					rightIndex: 1,
					turn: "right",
					phase: "typing",
					typed: "",
				},
				TEST_CONFIG,
			),
		).toBe(TEST_TIMING.type);
	});

	it("TC-PURE-16: delayFor pushing -> TEST_TIMING.push", () => {
		expect(
			delayFor(
				{
					leftIndex: 1,
					rightIndex: 1,
					turn: "right",
					phase: "pushing",
					typed: phrase1,
				},
				TEST_CONFIG,
			),
		).toBe(TEST_TIMING.push);
	});
});
