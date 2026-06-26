import { describe, expect, it } from "vitest";
import { INITIAL, delayFor, heroNext } from "../HeroSubtitle";
import { HERO_ROLES, HERO_PHRASES, HERO_TIMING } from "../../../data/hero";

// ---------------------------------------------------------------------------
// Helper: drive heroNext until predicate(state) is true.
// Fails the test (throws) if the safety cap is exceeded.
// ---------------------------------------------------------------------------
function advanceUntil(
	state: ReturnType<typeof heroNext>,
	predicate: (s: ReturnType<typeof heroNext>) => boolean,
	cap = 2000,
): ReturnType<typeof heroNext> {
	let s = state;
	let iterations = 0;
	while (!predicate(s)) {
		if (iterations >= cap) {
			throw new Error(
				`advanceUntil: safety cap of ${cap} iterations exceeded (last phase: ${s.phase})`,
			);
		}
		s = heroNext(s);
		iterations++;
	}
	return s;
}

// ---------------------------------------------------------------------------
describe("HeroSubtitle pure state machine (v3 two-index model)", () => {
	const phrase0 = HERO_PHRASES[0]!;
	const phrase1 = HERO_PHRASES[1]!;

	// TC-PURE-01: INITIAL shape
	it("TC-PURE-01: INITIAL deep-equals { leftIndex:0, rightIndex:0, turn:'right', phase:'dwell', typed: HERO_PHRASES[0] }", () => {
		expect(INITIAL).toEqual({
			leftIndex: 0,
			rightIndex: 0,
			turn: "right",
			phase: "dwell",
			typed: HERO_PHRASES[0],
		});
	});

	// TC-PURE-02: dwell + turn=right -> backspacing, indices/typed unchanged
	it("TC-PURE-02: heroNext(INITIAL dwell+turn:right) -> phase 'backspacing'; leftIndex/rightIndex/typed unchanged", () => {
		const next = heroNext(INITIAL);
		expect(next.phase).toBe("backspacing");
		expect(next.leftIndex).toBe(INITIAL.leftIndex);
		expect(next.rightIndex).toBe(INITIAL.rightIndex);
		expect(next.typed).toBe(INITIAL.typed);
	});

	// TC-PURE-03: backspacing drops exactly one char per tick
	it("TC-PURE-03: backspacing drops exactly one char per tick", () => {
		const backspacing = heroNext(INITIAL); // enters backspacing with full phrase0
		expect(backspacing.phase).toBe("backspacing");
		const next = heroNext(backspacing);
		expect(next.typed).toBe(phrase0.slice(0, -1));
		expect(next.phase).toBe("backspacing");
	});

	// TC-PURE-04: after phrase0.length backspacing ticks, typed==="" and phase still "backspacing"
	it("TC-PURE-04: after exactly phrase0.length backspacing ticks, typed==='' and phase still 'backspacing'", () => {
		let state = heroNext(INITIAL); // phase "backspacing", typed === phrase0
		expect(state.phase).toBe("backspacing");

		// We need phrase0.length ticks to empty the string (each drops one char)
		for (let i = 0; i < phrase0.length; i++) {
			state = heroNext(state);
		}
		expect(state.typed).toBe("");
		expect(state.phase).toBe("backspacing");
	});

	// TC-PURE-05: the NEXT tick after backspacing+typed="" sets rightIndex===1 and phase==="typing"
	it("TC-PURE-05: tick after backspacing+typed='' -> rightIndex===1 and phase==='typing'", () => {
		let state = heroNext(INITIAL); // backspacing
		for (let i = 0; i < phrase0.length; i++) {
			state = heroNext(state);
		}
		// Now typed==="" and phase==="backspacing"
		expect(state.typed).toBe("");
		expect(state.phase).toBe("backspacing");

		const next = heroNext(state);
		expect(next.rightIndex).toBe(1);
		expect(next.phase).toBe("typing");
	});

	// TC-PURE-06: typing appends exactly one char per tick; after HERO_PHRASES[1].length ticks typed===phrase1 and phase==="dwell" and turn==="left"
	it("TC-PURE-06: typing appends one char per tick; completing phrase sets turn:'left' and phase:'dwell'", () => {
		// Get to typing state with rightIndex=1, typed=""
		let state = heroNext(INITIAL); // backspacing
		for (let i = 0; i <= phrase0.length; i++) {
			state = heroNext(state);
		}
		// Now at rightIndex=1, phase="typing", typed=""
		expect(state.phase).toBe("typing");
		expect(state.rightIndex).toBe(1);
		expect(state.typed).toBe("");

		// First tick appends one char
		const firstType = heroNext(state);
		expect(firstType.typed).toBe(phrase1.slice(0, 1));
		expect(firstType.phase).toBe("typing");

		// After phrase1.length ticks total, typed===phrase1, phase==="dwell", turn==="left"
		let typingState = state;
		let ticks = 0;
		while (typingState.phase === "typing") {
			typingState = heroNext(typingState);
			ticks++;
			if (ticks > 2000) throw new Error("TC-PURE-06: typing never ended");
		}
		expect(ticks).toBe(phrase1.length);
		expect(typingState.typed).toBe(phrase1);
		expect(typingState.phase).toBe("dwell");
		expect(typingState.turn).toBe("left");
	});

	// TC-PURE-07: dwell + turn=left -> phase "pushing", leftIndex+1, turn="right"
	it("TC-PURE-07: heroNext(dwell+turn:left) -> phase 'pushing', leftIndex===1, turn==='right'", () => {
		// Get to a dwell+turn:left state
		let state = heroNext(INITIAL); // backspacing
		state = advanceUntil(
			state,
			(s) => s.phase === "dwell" && s.turn === "left",
		);
		expect(state.turn).toBe("left");
		const next = heroNext(state);
		expect(next.phase).toBe("pushing");
		expect(next.leftIndex).toBe(1);
		expect(next.turn).toBe("right");
	});

	// TC-PURE-08: pushing -> phase "dwell", leftIndex unchanged
	it("TC-PURE-08: heroNext(pushing) -> phase 'dwell', leftIndex unchanged", () => {
		let state = heroNext(INITIAL);
		state = advanceUntil(state, (s) => s.phase === "pushing");
		const pushingLeftIndex = state.leftIndex;
		const next = heroNext(state);
		expect(next.phase).toBe("dwell");
		expect(next.leftIndex).toBe(pushingLeftIndex);
	});

	// TC-PURE-09: SEQUENCE — first 5 dwell beats have (leftIndex,rightIndex) [[0,0],[0,1],[1,1],[1,2],[2,2]]
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
			state = heroNext(state);
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

	// TC-PURE-10: ALTERNATION invariant — leftIndex and rightIndex NEVER both change on the same tick;
	// leftIndex changes only when prev.phase==="dwell" && prev.turn==="left";
	// rightIndex changes only when prev.phase==="backspacing" && prev.typed===""
	it("TC-PURE-10: alternation invariant — indices never both change same tick; each changes only at the correct phase", () => {
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
			state = heroNext(state);
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

	// TC-PURE-11: WRAP — leftIndex wraps from 4 to 0 through a pushing beat
	it("TC-PURE-11: leftIndex wraps 4->0 on a dwell+turn:left -> pushing tick", () => {
		// Construct a state with leftIndex=4 and advance through dwell+turn:left
		const state = {
			leftIndex: 4,
			rightIndex: 4,
			turn: "left" as const,
			phase: "dwell" as const,
			typed: HERO_PHRASES[4]!,
		};
		const pushing = heroNext(state);
		expect(pushing.phase).toBe("pushing");
		expect(pushing.leftIndex).toBe(0);
	});

	// TC-PURE-12: WRAP — rightIndex wraps from 4 to 0 through backspacing-empty
	it("TC-PURE-12: rightIndex wraps 4->0 on backspacing+typed='' -> typing tick", () => {
		const state = {
			leftIndex: 4,
			rightIndex: 4,
			turn: "right" as const,
			phase: "backspacing" as const,
			typed: "",
		};
		const next = heroNext(state);
		expect(next.phase).toBe("typing");
		expect(next.rightIndex).toBe(0);
	});

	// TC-PURE-13: delayFor returns correct ms for each phase
	it("TC-PURE-13: delayFor dwell -> HERO_TIMING.dwell", () => {
		expect(
			delayFor({
				leftIndex: 0,
				rightIndex: 0,
				turn: "right",
				phase: "dwell",
				typed: phrase0,
			}),
		).toBe(HERO_TIMING.dwell);
	});

	it("TC-PURE-14: delayFor backspacing -> HERO_TIMING.backspace", () => {
		expect(
			delayFor({
				leftIndex: 0,
				rightIndex: 0,
				turn: "right",
				phase: "backspacing",
				typed: phrase0,
			}),
		).toBe(HERO_TIMING.backspace);
	});

	it("TC-PURE-15: delayFor typing -> HERO_TIMING.type", () => {
		expect(
			delayFor({
				leftIndex: 0,
				rightIndex: 1,
				turn: "right",
				phase: "typing",
				typed: "",
			}),
		).toBe(HERO_TIMING.type);
	});

	it("TC-PURE-16: delayFor pushing -> HERO_TIMING.push", () => {
		expect(
			delayFor({
				leftIndex: 1,
				rightIndex: 1,
				turn: "right",
				phase: "pushing",
				typed: phrase1,
			}),
		).toBe(HERO_TIMING.push);
	});

	// TC-PURE-17: HERO_TIMING exact values
	it("TC-PURE-17: HERO_TIMING deep-equals { type:40, backspace:14, dwell:1100, push:420 }", () => {
		expect(HERO_TIMING).toEqual({
			type: 40,
			backspace: 14,
			dwell: 1100,
			push: 420,
		});
	});

	// TC-PURE-18: HERO_ROLES exact array
	it("TC-PURE-18: HERO_ROLES.length===5 and equals the exact array", () => {
		expect(HERO_ROLES.length).toBe(5);
		expect(Array.from(HERO_ROLES)).toEqual([
			"web enthusiast",
			"agentic coach",
			"engineering consultant",
			"solutions architect",
			"relentless tinkerer",
		]);
	});

	// TC-PURE-19: HERO_PHRASES exact array
	it("TC-PURE-19: HERO_PHRASES.length===5 and equals the exact array", () => {
		expect(HERO_PHRASES.length).toBe(5);
		expect(Array.from(HERO_PHRASES)).toEqual([
			"with a side project habit",
			"contributing to open source",
			"with a camera in hand",
			"always stepping outside his comfort zone",
			"shipping things on the side",
		]);
	});
});
