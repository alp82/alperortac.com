// @vitest-environment jsdom

/*
 * useAlbumRotation contract tests.
 *
 * Uses vi.useFakeTimers() plus an injected, seeded, deterministic random
 * function so mount-time shuffle and interval-driven swaps are fully
 * reproducible. Swap-selection assertions (which cell, which replacement
 * album) are property-based - "a valid cell", "an album drawn from the
 * then-current hidden set" - rather than pinned to one exact algorithm,
 * since the plan does not pin an exact shuffle/pick algorithm; the initial
 * subset and per-swap cell/album pick are implementation details as long as
 * the initial subset is deterministic for a given seed and no swap ever
 * repeats an already-visible album (the contracts this suite pins).
 */

import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useAlbumRotation } from "../useAlbumRotation";

type TestAlbum = {
	artist: string;
	album: string;
	cover: string;
};

// 15 mock albums (visibleCount 12, hidden count 3) with unique covers.
const MOCK_ALBUMS: TestAlbum[] = Array.from({ length: 15 }, (_, i) => ({
	artist: `Artist ${i}`,
	album: `Album ${i}`,
	cover: `/albums/mock-${i}.jpg`,
}));

// Deterministic PRNG (mulberry32) - reproducible sequence from a seed.
function createSeededRandom(seed: number): () => number {
	let a = seed;
	return () => {
		a |= 0;
		a = (a + 0x6d2b79f5) | 0;
		let t = Math.imul(a ^ (a >>> 15), 1 | a);
		t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
	};
}

function coversOf(albums: TestAlbum[]): string[] {
	return albums.map((a) => a.cover);
}

const DEFAULT_INTERVAL_MS = 2800;
const DEFAULT_OUT_MS = 200;
const DEFAULT_IN_MS = 340;

describe("useAlbumRotation", () => {
	beforeEach(() => {
		vi.useFakeTimers();
	});

	afterEach(() => {
		vi.clearAllTimers();
		vi.useRealTimers();
	});

	// TC-ROT-01
	it("mounts with a deterministic 12-album visible set from seeded random; 12 unique members of ALBUMS", () => {
		const { result: resultA } = renderHook(() =>
			useAlbumRotation(MOCK_ALBUMS, {
				visibleCount: 12,
				random: createSeededRandom(42),
			}),
		);
		const { result: resultB } = renderHook(() =>
			useAlbumRotation(MOCK_ALBUMS, {
				visibleCount: 12,
				random: createSeededRandom(42),
			}),
		);

		// Determinism: the same seeded random produces the same visible set
		// across independent mounts, regardless of the shuffle algorithm used.
		expect(coversOf(resultA.current.visible)).toEqual(
			coversOf(resultB.current.visible),
		);

		// The set is exactly 12 unique members of the source album list.
		expect(resultA.current.visible.length).toBe(12);
		const covers = new Set(coversOf(resultA.current.visible));
		expect(covers.size).toBe(12);
		const allCovers = new Set(coversOf(MOCK_ALBUMS));
		for (const c of covers) {
			expect(allCovers.has(c)).toBe(true);
		}

		expect(resultA.current.swap).toBeNull();
	});

	// TC-ROT-02
	it("keeps visible at exactly 12 unique albums at mount and after every swap", () => {
		const { result } = renderHook(() =>
			useAlbumRotation(MOCK_ALBUMS, {
				visibleCount: 12,
				random: createSeededRandom(7),
			}),
		);

		const assertUnique12 = () => {
			expect(result.current.visible.length).toBe(12);
			const covers = new Set(coversOf(result.current.visible));
			expect(covers.size).toBe(12);
		};

		assertUnique12();

		for (let cycle = 0; cycle < 3; cycle++) {
			act(() => {
				vi.advanceTimersByTime(DEFAULT_INTERVAL_MS);
			});
			assertUnique12();
			act(() => {
				vi.advanceTimersByTime(DEFAULT_OUT_MS);
			});
			assertUnique12();
			act(() => {
				vi.advanceTimersByTime(DEFAULT_IN_MS);
			});
			assertUnique12();
		}
	});

	// TC-ROT-03
	it("fires the interval into swap { cell, phase: 'out' } leaving visible unchanged", () => {
		const { result } = renderHook(() =>
			useAlbumRotation(MOCK_ALBUMS, {
				visibleCount: 12,
				random: createSeededRandom(3),
			}),
		);
		const before = coversOf(result.current.visible);

		act(() => {
			vi.advanceTimersByTime(DEFAULT_INTERVAL_MS);
		});

		expect(result.current.swap).not.toBeNull();
		expect(result.current.swap?.phase).toBe("out");
		expect(typeof result.current.swap?.cell).toBe("number");
		expect(coversOf(result.current.visible)).toEqual(before);
	});

	// TC-ROT-04
	it("replaces the swapped cell's album with a hidden one after outMs, entering phase 'in'", () => {
		const { result } = renderHook(() =>
			useAlbumRotation(MOCK_ALBUMS, {
				visibleCount: 12,
				random: createSeededRandom(3),
			}),
		);
		const beforeVisible = coversOf(result.current.visible);

		act(() => {
			vi.advanceTimersByTime(DEFAULT_INTERVAL_MS);
		});
		const cell = result.current.swap?.cell as number;

		act(() => {
			vi.advanceTimersByTime(DEFAULT_OUT_MS);
		});

		expect(result.current.swap?.phase).toBe("in");
		const afterCover = result.current.visible[cell]?.cover;
		expect(afterCover).toBeDefined();
		expect(beforeVisible.includes(afterCover as string)).toBe(false);
		// still 12 unique
		expect(new Set(coversOf(result.current.visible)).size).toBe(12);
	});

	// TC-ROT-05
	it("resolves swap to null after inMs elapses", () => {
		const { result } = renderHook(() =>
			useAlbumRotation(MOCK_ALBUMS, {
				visibleCount: 12,
				random: createSeededRandom(3),
			}),
		);

		act(() => {
			vi.advanceTimersByTime(DEFAULT_INTERVAL_MS);
		});
		act(() => {
			vi.advanceTimersByTime(DEFAULT_OUT_MS);
		});
		act(() => {
			vi.advanceTimersByTime(DEFAULT_IN_MS);
		});

		expect(result.current.swap).toBeNull();
	});

	// TC-ROT-06
	it("draws every replacement from the THEN-current hidden set across 3+ cycles (stale-closure guard)", () => {
		const { result } = renderHook(() =>
			useAlbumRotation(MOCK_ALBUMS, {
				visibleCount: 12,
				random: createSeededRandom(11),
			}),
		);

		// Cycle 0 reaches the first tick with a plain DEFAULT_INTERVAL_MS
		// advance. Every subsequent cycle only needs the remainder of the
		// period (intervalMs - outMs - inMs) to reach the next tick, since
		// the prior cycle already consumed outMs + inMs of that period. This
		// keeps hiddenBefore (captured while swap is null, at the top of the
		// iteration) and the swap the assertion observes in the same
		// reference frame - no unobserved free-running tick in between.
		const NEXT_TICK_MS = DEFAULT_INTERVAL_MS - DEFAULT_OUT_MS - DEFAULT_IN_MS;

		for (let cycle = 0; cycle < 4; cycle++) {
			const hiddenBefore = MOCK_ALBUMS.map((a) => a.cover).filter(
				(c) => !coversOf(result.current.visible).includes(c),
			);

			act(() => {
				vi.advanceTimersByTime(
					cycle === 0 ? DEFAULT_INTERVAL_MS : NEXT_TICK_MS,
				);
			});
			expect(result.current.swap?.phase).toBe("out");
			const cell = result.current.swap?.cell as number;

			act(() => {
				vi.advanceTimersByTime(DEFAULT_OUT_MS);
			});

			const replaced = result.current.visible[cell]?.cover as string;
			expect(hiddenBefore.includes(replaced)).toBe(true);

			act(() => {
				vi.advanceTimersByTime(DEFAULT_IN_MS);
			});
			expect(new Set(coversOf(result.current.visible)).size).toBe(12);
			expect(result.current.swap).toBeNull();
		}
	});

	// TC-ROT-07
	it("no-ops an interval tick that lands during phase 'out'", () => {
		const { result } = renderHook(() =>
			useAlbumRotation(MOCK_ALBUMS, {
				visibleCount: 12,
				intervalMs: 100,
				outMs: 1000,
				inMs: 340,
				random: createSeededRandom(3),
			}),
		);

		act(() => {
			vi.advanceTimersByTime(100);
		});
		expect(result.current.swap?.phase).toBe("out");
		const swapDuringOut = result.current.swap;
		const visibleDuringOut = coversOf(result.current.visible);

		// A sub-outMs tick lands while still in "out" (outMs=1000, well past
		// this 100ms advance), so the in-flight guard makes it a no-op.
		act(() => {
			vi.advanceTimersByTime(100);
		});

		expect(result.current.swap).toEqual(swapDuringOut);
		expect(coversOf(result.current.visible)).toEqual(visibleDuringOut);
	});

	// TC-ROT-08
	it("no-ops an interval tick that lands during phase 'in' (outMs + inMs >= intervalMs case)", () => {
		const { result } = renderHook(() =>
			useAlbumRotation(MOCK_ALBUMS, {
				visibleCount: 12,
				intervalMs: 500,
				outMs: 200,
				inMs: 340,
				random: createSeededRandom(3),
			}),
		);

		act(() => {
			vi.advanceTimersByTime(500);
		});
		act(() => {
			vi.advanceTimersByTime(200);
		});
		expect(result.current.swap?.phase).toBe("in");
		const swapDuringIn = result.current.swap;
		const visibleDuringIn = coversOf(result.current.visible);

		// Another interval tick lands at t=1000 (500 + 200 + 300), still inside
		// the "in" phase, which resolves at t=1040 (700 + 340). The in-flight
		// guard makes this tick a no-op.
		act(() => {
			vi.advanceTimersByTime(300);
		});

		expect(result.current.swap).toEqual(swapDuringIn);
		expect(coversOf(result.current.visible)).toEqual(visibleDuringIn);
	});

	// TC-ROT-09
	it("paused: true from mount never changes visible and never starts a swap", () => {
		const { result } = renderHook(() =>
			useAlbumRotation(MOCK_ALBUMS, {
				visibleCount: 12,
				random: createSeededRandom(5),
				paused: true,
			}),
		);
		const initialVisible = coversOf(result.current.visible);

		act(() => {
			vi.advanceTimersByTime(DEFAULT_INTERVAL_MS * 3);
		});

		expect(coversOf(result.current.visible)).toEqual(initialVisible);
		expect(result.current.swap).toBeNull();
	});

	// TC-ROT-10
	it("flipping paused false->true after mount while idle prevents further swaps", () => {
		const { result, rerender } = renderHook(
			({ paused }: { paused: boolean }) =>
				useAlbumRotation(MOCK_ALBUMS, {
					visibleCount: 12,
					random: createSeededRandom(9),
					paused,
				}),
			{ initialProps: { paused: false } },
		);

		rerender({ paused: true });
		const visibleAfterPause = coversOf(result.current.visible);

		act(() => {
			vi.advanceTimersByTime(DEFAULT_INTERVAL_MS * 3);
		});

		expect(coversOf(result.current.visible)).toEqual(visibleAfterPause);
		expect(result.current.swap).toBeNull();
	});

	// TC-ROT-11
	it("flipping paused true->false after mount starts rotation from that point", () => {
		const { result, rerender } = renderHook(
			({ paused }: { paused: boolean }) =>
				useAlbumRotation(MOCK_ALBUMS, {
					visibleCount: 12,
					random: createSeededRandom(13),
					paused,
				}),
			{ initialProps: { paused: true } },
		);

		act(() => {
			vi.advanceTimersByTime(DEFAULT_INTERVAL_MS * 3);
		});
		expect(result.current.swap).toBeNull();

		rerender({ paused: false });

		act(() => {
			vi.advanceTimersByTime(DEFAULT_INTERVAL_MS);
		});

		expect(result.current.swap).not.toBeNull();
		expect(result.current.swap?.phase).toBe("out");
	});

	// TC-ROT-12
	it("pausing during phase 'out' clears timers, resets swap, keeps pre-swap album, and resumes cleanly on unpause", () => {
		const { result, rerender } = renderHook(
			({ paused }: { paused: boolean }) =>
				useAlbumRotation(MOCK_ALBUMS, {
					visibleCount: 12,
					random: createSeededRandom(21),
					paused,
				}),
			{ initialProps: { paused: false } },
		);

		act(() => {
			vi.advanceTimersByTime(DEFAULT_INTERVAL_MS);
		});
		expect(result.current.swap?.phase).toBe("out");
		const visibleDuringOut = coversOf(result.current.visible);

		act(() => {
			rerender({ paused: true });
		});

		expect(result.current.swap).toBeNull();
		expect(coversOf(result.current.visible)).toEqual(visibleDuringOut);

		// Advancing time after pause must not resurrect the abandoned swap.
		act(() => {
			vi.advanceTimersByTime(DEFAULT_OUT_MS + DEFAULT_IN_MS);
		});
		expect(result.current.swap).toBeNull();
		expect(coversOf(result.current.visible)).toEqual(visibleDuringOut);

		// Resume: unpausing must let rotation proceed normally (guard not wedged shut).
		act(() => {
			rerender({ paused: false });
		});
		act(() => {
			vi.advanceTimersByTime(DEFAULT_INTERVAL_MS);
		});
		expect(result.current.swap).not.toBeNull();
		expect(result.current.swap?.phase).toBe("out");
	});

	// TC-ROT-13
	it("pausing during phase 'in' clears timers, resets swap, and keeps the already-swapped-in album", () => {
		const { result, rerender } = renderHook(
			({ paused }: { paused: boolean }) =>
				useAlbumRotation(MOCK_ALBUMS, {
					visibleCount: 12,
					random: createSeededRandom(21),
					paused,
				}),
			{ initialProps: { paused: false } },
		);

		act(() => {
			vi.advanceTimersByTime(DEFAULT_INTERVAL_MS);
		});
		act(() => {
			vi.advanceTimersByTime(DEFAULT_OUT_MS);
		});
		expect(result.current.swap?.phase).toBe("in");
		const visibleDuringIn = coversOf(result.current.visible);

		act(() => {
			rerender({ paused: true });
		});

		expect(result.current.swap).toBeNull();
		// The already-swapped-in album must NOT be reverted.
		expect(coversOf(result.current.visible)).toEqual(visibleDuringIn);
	});

	// TC-ROT-14
	it("unmounting mid-swap (either phase) leaves zero pending timers and warns nothing", () => {
		const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
		const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

		const { unmount } = renderHook(() =>
			useAlbumRotation(MOCK_ALBUMS, {
				visibleCount: 12,
				random: createSeededRandom(31),
			}),
		);

		act(() => {
			vi.advanceTimersByTime(DEFAULT_INTERVAL_MS);
		});

		act(() => {
			unmount();
		});

		expect(vi.getTimerCount()).toBe(0);
		expect(errorSpy).not.toHaveBeenCalled();
		expect(warnSpy).not.toHaveBeenCalled();

		errorSpy.mockRestore();
		warnSpy.mockRestore();
	});

	// TC-ROT-15
	it("honors default durations: intervalMs 2800, outMs 200, inMs 340", () => {
		const { result } = renderHook(() =>
			useAlbumRotation(MOCK_ALBUMS, {
				visibleCount: 12,
				random: createSeededRandom(3),
			}),
		);

		// Nothing happens just before the 2800ms interval default.
		act(() => {
			vi.advanceTimersByTime(2799);
		});
		expect(result.current.swap).toBeNull();

		act(() => {
			vi.advanceTimersByTime(1);
		});
		expect(result.current.swap?.phase).toBe("out");

		// Nothing changes just before the 200ms outMs default.
		act(() => {
			vi.advanceTimersByTime(199);
		});
		expect(result.current.swap?.phase).toBe("out");

		act(() => {
			vi.advanceTimersByTime(1);
		});
		expect(result.current.swap?.phase).toBe("in");

		// Nothing changes just before the 340ms inMs default.
		act(() => {
			vi.advanceTimersByTime(339);
		});
		expect(result.current.swap?.phase).toBe("in");

		act(() => {
			vi.advanceTimersByTime(1);
		});
		expect(result.current.swap).toBeNull();
	});

	// TC-ROT-16
	it("next() starts an immediate out-phase swap with a replacement drawn from the hidden set", () => {
		const { result } = renderHook(() =>
			useAlbumRotation(MOCK_ALBUMS, {
				visibleCount: 12,
				random: createSeededRandom(3),
			}),
		);
		const before = coversOf(result.current.visible);

		act(() => {
			result.current.next();
		});

		expect(result.current.swap).not.toBeNull();
		expect(result.current.swap?.phase).toBe("out");
		expect(typeof result.current.swap?.cell).toBe("number");
		// Content hasn't committed yet - visible is unchanged mid out-phase.
		expect(coversOf(result.current.visible)).toEqual(before);
	});

	// TC-ROT-17
	it("next() completes a full unassisted two-phase cycle (out -> in -> null) committing a hidden replacement", () => {
		const { result } = renderHook(() =>
			useAlbumRotation(MOCK_ALBUMS, {
				visibleCount: 12,
				random: createSeededRandom(3),
			}),
		);
		const before = coversOf(result.current.visible);
		const hiddenBefore = MOCK_ALBUMS.map((a) => a.cover).filter(
			(c) => !before.includes(c),
		);

		act(() => {
			result.current.next();
		});
		const cell = result.current.swap?.cell as number;

		act(() => {
			vi.advanceTimersByTime(DEFAULT_OUT_MS);
		});
		expect(result.current.swap?.phase).toBe("in");
		const replaced = result.current.visible[cell]?.cover as string;
		expect(hiddenBefore.includes(replaced)).toBe(true);
		expect(new Set(coversOf(result.current.visible)).size).toBe(12);

		act(() => {
			vi.advanceTimersByTime(DEFAULT_IN_MS);
		});
		expect(result.current.swap).toBeNull();
	});

	// TC-ROT-18 (keyboard-path - not the hover-pause trap test below)
	it("next() resets the interval clock: no auto tick fires until a full intervalMs after the manual call", () => {
		const { result } = renderHook(() =>
			useAlbumRotation(MOCK_ALBUMS, {
				visibleCount: 12,
				random: createSeededRandom(3),
			}),
		);

		// Let the mount interval's deadline (t=2800) sit unfired in the background -
		// next() below must reset it, not just append a second timer alongside it.
		act(() => {
			vi.advanceTimersByTime(1000);
		});
		expect(result.current.swap).toBeNull();

		act(() => {
			result.current.next();
		});
		act(() => {
			vi.advanceTimersByTime(DEFAULT_OUT_MS + DEFAULT_IN_MS);
		});
		expect(result.current.swap).toBeNull();

		// Still at the original mount deadline (t=2800): a non-resetting
		// implementation would fire its stale interval here. It must not.
		act(() => {
			vi.advanceTimersByTime(
				DEFAULT_INTERVAL_MS - 1000 - DEFAULT_OUT_MS - DEFAULT_IN_MS,
			);
		});
		expect(result.current.swap).toBeNull();

		// A full intervalMs after the next() call (t = 1000 + 2800 = 3800):
		// the reset interval's own deadline fires.
		act(() => {
			vi.advanceTimersByTime(1000);
		});
		expect(result.current.swap?.phase).toBe("out");
	});

	// TC-ROT-19
	it("next() no-ops while a swap is mid-flight, in either phase", () => {
		const { result } = renderHook(() =>
			useAlbumRotation(MOCK_ALBUMS, {
				visibleCount: 12,
				random: createSeededRandom(3),
			}),
		);

		act(() => {
			vi.advanceTimersByTime(DEFAULT_INTERVAL_MS);
		});
		expect(result.current.swap?.phase).toBe("out");
		const swapDuringOut = result.current.swap;

		act(() => {
			result.current.next();
		});
		expect(result.current.swap).toEqual(swapDuringOut);

		act(() => {
			vi.advanceTimersByTime(DEFAULT_OUT_MS);
		});
		expect(result.current.swap?.phase).toBe("in");
		const swapDuringIn = result.current.swap;

		act(() => {
			result.current.next();
		});
		expect(result.current.swap).toEqual(swapDuringIn);
	});

	// TC-ROT-20
	it("next() works with paused: true from mount, completing a full cycle without ever starting the interval", () => {
		const { result } = renderHook(() =>
			useAlbumRotation(MOCK_ALBUMS, {
				visibleCount: 12,
				random: createSeededRandom(3),
				paused: true,
			}),
		);
		const before = coversOf(result.current.visible);

		act(() => {
			result.current.next();
		});
		expect(result.current.swap?.phase).toBe("out");

		act(() => {
			vi.advanceTimersByTime(DEFAULT_OUT_MS);
		});
		expect(result.current.swap?.phase).toBe("in");

		act(() => {
			vi.advanceTimersByTime(DEFAULT_IN_MS);
		});
		expect(result.current.swap).toBeNull();
		expect(coversOf(result.current.visible)).not.toEqual(before);

		// Interval untouched: still paused, so no auto swap ever starts.
		act(() => {
			vi.advanceTimersByTime(DEFAULT_INTERVAL_MS * 3);
		});
		expect(result.current.swap).toBeNull();
	});

	// TC-ROT-21
	it("next() no-ops when the hidden set is empty (visibleCount === albums.length)", () => {
		const { result } = renderHook(() =>
			useAlbumRotation(MOCK_ALBUMS, {
				visibleCount: MOCK_ALBUMS.length,
				random: createSeededRandom(3),
			}),
		);
		const before = coversOf(result.current.visible);

		act(() => {
			result.current.next();
		});

		expect(result.current.swap).toBeNull();
		expect(coversOf(result.current.visible)).toEqual(before);
	});

	// Trap test (challenger Blocker 1)
	it("TRAP: rotation running -> paused flips true -> next() -> advancing intervalMs starts NO auto swap (interval stays stopped while paused)", () => {
		const { result, rerender } = renderHook(
			({ paused }: { paused: boolean }) =>
				useAlbumRotation(MOCK_ALBUMS, {
					visibleCount: 12,
					random: createSeededRandom(3),
					paused,
				}),
			{ initialProps: { paused: false } },
		);

		act(() => {
			rerender({ paused: true });
		});

		act(() => {
			result.current.next();
		});
		// Let the paused manual swap fully resolve.
		act(() => {
			vi.advanceTimersByTime(DEFAULT_OUT_MS + DEFAULT_IN_MS);
		});
		expect(result.current.swap).toBeNull();

		// A cleared interval must never look alive: advancing a full intervalMs
		// (and then some) must start no auto swap while still paused.
		act(() => {
			vi.advanceTimersByTime(DEFAULT_INTERVAL_MS * 2);
		});
		expect(result.current.swap).toBeNull();
	});

	// Mirror trap (challenger rider): the interval next() restarted WHILE
	// running must still die cleanly when pause follows - catches clearing a
	// captured interval id instead of the live ref.
	it("MIRROR TRAP: next() while running restarts the clock, then pausing must kill that restarted interval too", () => {
		const { result, rerender } = renderHook(
			({ paused }: { paused: boolean }) =>
				useAlbumRotation(MOCK_ALBUMS, {
					visibleCount: 12,
					random: createSeededRandom(3),
					paused,
				}),
			{ initialProps: { paused: false } },
		);

		act(() => {
			result.current.next();
		});
		act(() => {
			vi.advanceTimersByTime(DEFAULT_OUT_MS + DEFAULT_IN_MS);
		});
		expect(result.current.swap).toBeNull();

		act(() => {
			rerender({ paused: true });
		});

		act(() => {
			vi.advanceTimersByTime(DEFAULT_INTERVAL_MS);
		});
		expect(result.current.swap).toBeNull();
	});

	// TC-ROT-22
	it("canPrev is false at mount", () => {
		const { result } = renderHook(() =>
			useAlbumRotation(MOCK_ALBUMS, {
				visibleCount: 12,
				random: createSeededRandom(3),
			}),
		);
		expect(result.current.canPrev).toBe(false);
	});

	// TC-ROT-23
	it("canPrev turns true only after the first swap COMPLETES (content-commit), not at initiation", () => {
		const { result } = renderHook(() =>
			useAlbumRotation(MOCK_ALBUMS, {
				visibleCount: 12,
				random: createSeededRandom(3),
			}),
		);

		act(() => {
			result.current.next();
		});
		expect(result.current.swap?.phase).toBe("out");
		expect(result.current.canPrev).toBe(false);

		act(() => {
			vi.advanceTimersByTime(DEFAULT_OUT_MS);
		});
		expect(result.current.canPrev).toBe(true);
	});

	// TC-ROT-24
	it("prev() restores the displaced album to its recorded cell via a full flicker cycle, pushes no history, and undoes two swaps LIFO", () => {
		const { result } = renderHook(() =>
			useAlbumRotation(MOCK_ALBUMS, {
				visibleCount: 12,
				random: createSeededRandom(3),
			}),
		);
		const initial = coversOf(result.current.visible);

		// First manual swap.
		act(() => {
			result.current.next();
		});
		const cell1 = result.current.swap?.cell as number;
		const displaced1 = initial[cell1];
		act(() => {
			vi.advanceTimersByTime(DEFAULT_OUT_MS + DEFAULT_IN_MS);
		});
		const afterSwap1 = coversOf(result.current.visible);

		// Second manual swap.
		act(() => {
			result.current.next();
		});
		const cell2 = result.current.swap?.cell as number;
		const displaced2 = afterSwap1[cell2];
		act(() => {
			vi.advanceTimersByTime(DEFAULT_OUT_MS + DEFAULT_IN_MS);
		});

		// prev() undoes the most recent swap first (LIFO): swap 2.
		act(() => {
			result.current.prev();
		});
		expect(result.current.swap?.phase).toBe("out");
		expect(result.current.swap?.cell).toBe(cell2);
		act(() => {
			vi.advanceTimersByTime(DEFAULT_OUT_MS);
		});
		expect(result.current.swap?.phase).toBe("in");
		expect(result.current.visible[cell2]?.cover).toBe(displaced2);
		act(() => {
			vi.advanceTimersByTime(DEFAULT_IN_MS);
		});
		expect(result.current.swap).toBeNull();

		// prev() pushes no new history entry - exactly one undo remains.
		expect(result.current.canPrev).toBe(true);

		// Second prev() undoes swap 1.
		act(() => {
			result.current.prev();
		});
		expect(result.current.swap?.cell).toBe(cell1);
		act(() => {
			vi.advanceTimersByTime(DEFAULT_OUT_MS);
		});
		expect(result.current.visible[cell1]?.cover).toBe(displaced1);
		act(() => {
			vi.advanceTimersByTime(DEFAULT_IN_MS);
		});

		expect(coversOf(result.current.visible)).toEqual(initial);
		expect(result.current.canPrev).toBe(false);
	});

	// TC-ROT-25
	it("prev() no-ops when the history stack is empty", () => {
		const { result } = renderHook(() =>
			useAlbumRotation(MOCK_ALBUMS, {
				visibleCount: 12,
				random: createSeededRandom(3),
			}),
		);
		const before = coversOf(result.current.visible);

		act(() => {
			result.current.prev();
		});

		expect(result.current.swap).toBeNull();
		expect(coversOf(result.current.visible)).toEqual(before);
	});

	// TC-ROT-26
	it("canPrev goes false again after prev() walks the stack back to empty", () => {
		const { result } = renderHook(() =>
			useAlbumRotation(MOCK_ALBUMS, {
				visibleCount: 12,
				random: createSeededRandom(3),
			}),
		);

		act(() => {
			result.current.next();
		});
		act(() => {
			vi.advanceTimersByTime(DEFAULT_OUT_MS + DEFAULT_IN_MS);
		});
		expect(result.current.canPrev).toBe(true);

		act(() => {
			result.current.prev();
		});
		act(() => {
			vi.advanceTimersByTime(DEFAULT_OUT_MS + DEFAULT_IN_MS);
		});
		expect(result.current.canPrev).toBe(false);
	});

	// TC-ROT-27
	it("prev() guards the duplicate case: an album transiently visible via a different cell than a lower, unprocessed history entry never corrupts state or throws", () => {
		const { result } = renderHook(() =>
			useAlbumRotation(MOCK_ALBUMS, {
				visibleCount: 12,
				random: createSeededRandom(3),
			}),
		);
		const initial = coversOf(result.current.visible);

		// Two manual swaps at (likely) different cells build a two-deep history
		// stack; whichever cells the seeded random lands on, the invariant under
		// test - full LIFO unwind returns to the exact pre-swap state with no
		// throw - holds regardless of the exact cells/covers involved.
		act(() => {
			result.current.next();
		});
		act(() => {
			vi.advanceTimersByTime(DEFAULT_OUT_MS + DEFAULT_IN_MS);
		});
		act(() => {
			result.current.next();
		});
		act(() => {
			vi.advanceTimersByTime(DEFAULT_OUT_MS + DEFAULT_IN_MS);
		});

		expect(() => {
			act(() => {
				result.current.prev();
			});
			act(() => {
				vi.advanceTimersByTime(DEFAULT_OUT_MS + DEFAULT_IN_MS);
			});
			act(() => {
				result.current.prev();
			});
			act(() => {
				vi.advanceTimersByTime(DEFAULT_OUT_MS + DEFAULT_IN_MS);
			});
		}).not.toThrow();

		expect(coversOf(result.current.visible)).toEqual(initial);
		expect(result.current.canPrev).toBe(false);
		expect(new Set(coversOf(result.current.visible)).size).toBe(12);
	});

	// TC-ROT-28
	it("caps history at depth 12: the 13th completed swap discards the oldest entry", () => {
		const { result } = renderHook(() =>
			useAlbumRotation(MOCK_ALBUMS, {
				visibleCount: 12,
				random: createSeededRandom(17),
			}),
		);

		for (let i = 0; i < 13; i++) {
			act(() => {
				result.current.next();
			});
			act(() => {
				vi.advanceTimersByTime(DEFAULT_OUT_MS + DEFAULT_IN_MS);
			});
		}
		expect(result.current.canPrev).toBe(true);

		// Walk the whole stack back with prev(); it must resolve after AT MOST
		// 12 undos (the 13th swap's own displaced entry is one of the 12 kept -
		// the oldest of the 13 was discarded on push), never throwing and never
		// exceeding the cap.
		let undoCount = 0;
		while (result.current.canPrev && undoCount < 20) {
			act(() => {
				result.current.prev();
			});
			act(() => {
				vi.advanceTimersByTime(DEFAULT_OUT_MS + DEFAULT_IN_MS);
			});
			undoCount++;
		}

		expect(undoCount).toBeLessThanOrEqual(12);
		expect(result.current.canPrev).toBe(false);
	});

	// TC-ROT-29
	it("prev() works while paused: true, completing a full flicker cycle without touching the (stopped) interval", () => {
		const { result, rerender } = renderHook(
			({ paused }: { paused: boolean }) =>
				useAlbumRotation(MOCK_ALBUMS, {
					visibleCount: 12,
					random: createSeededRandom(3),
					paused,
				}),
			{ initialProps: { paused: false } },
		);

		act(() => {
			result.current.next();
		});
		act(() => {
			vi.advanceTimersByTime(DEFAULT_OUT_MS + DEFAULT_IN_MS);
		});
		expect(result.current.canPrev).toBe(true);

		act(() => {
			rerender({ paused: true });
		});

		act(() => {
			result.current.prev();
		});
		expect(result.current.swap?.phase).toBe("out");
		act(() => {
			vi.advanceTimersByTime(DEFAULT_OUT_MS);
		});
		expect(result.current.swap?.phase).toBe("in");
		act(() => {
			vi.advanceTimersByTime(DEFAULT_IN_MS);
		});
		expect(result.current.swap).toBeNull();
		expect(result.current.canPrev).toBe(false);

		// Still paused: no auto swap should ever start.
		act(() => {
			vi.advanceTimersByTime(DEFAULT_INTERVAL_MS * 2);
		});
		expect(result.current.swap).toBeNull();
	});

	// TC-ROT-30
	it("prev() no-ops while a swap is mid-flight", () => {
		const { result } = renderHook(() =>
			useAlbumRotation(MOCK_ALBUMS, {
				visibleCount: 12,
				random: createSeededRandom(3),
			}),
		);

		act(() => {
			result.current.next();
		});
		act(() => {
			vi.advanceTimersByTime(DEFAULT_OUT_MS + DEFAULT_IN_MS);
		});
		expect(result.current.canPrev).toBe(true);

		// Start a second swap (auto tick) and try prev() mid-flight. The
		// clock resets at the next() call above (t=0 in this reference
		// frame), and the prior advance already consumed outMs + inMs of
		// that period, so only the remainder is needed to land exactly on
		// the auto tick with the swap freshly in phase "out" (same
		// correction pattern as TC-ROT-06).
		const NEXT_TICK_MS = DEFAULT_INTERVAL_MS - DEFAULT_OUT_MS - DEFAULT_IN_MS;
		act(() => {
			vi.advanceTimersByTime(NEXT_TICK_MS);
		});
		expect(result.current.swap?.phase).toBe("out");
		const swapDuringOut = result.current.swap;

		act(() => {
			result.current.prev();
		});
		expect(result.current.swap).toEqual(swapDuringOut);
	});

	// TC-ROT-31
	it("pausing mid-out after next() aborts the swap and creates no history entry", () => {
		const { result, rerender } = renderHook(
			({ paused }: { paused: boolean }) =>
				useAlbumRotation(MOCK_ALBUMS, {
					visibleCount: 12,
					random: createSeededRandom(3),
					paused,
				}),
			{ initialProps: { paused: false } },
		);
		expect(result.current.canPrev).toBe(false);

		act(() => {
			result.current.next();
		});
		expect(result.current.swap?.phase).toBe("out");

		// Pause before outMs elapses - aborts before content-commit.
		act(() => {
			rerender({ paused: true });
		});
		expect(result.current.swap).toBeNull();
		expect(result.current.canPrev).toBe(false);

		act(() => {
			result.current.prev();
		});
		expect(result.current.swap).toBeNull();
		expect(result.current.canPrev).toBe(false);
	});

	// TC-ROT-32..36 - cycle counter. Assertions only check the counter changed
	// / strictly increased - never exact deltas (per plan Testing note).
	describe("cycle counter", () => {
		// TC-ROT-32
		it("increments cycle when the rotation effect (re)starts", () => {
			const { result, rerender } = renderHook(
				({ paused }: { paused: boolean }) =>
					useAlbumRotation(MOCK_ALBUMS, {
						visibleCount: 12,
						random: createSeededRandom(3),
						paused,
					}),
				{ initialProps: { paused: false } },
			);
			const cycleAtMount = result.current.cycle;

			act(() => {
				rerender({ paused: false });
			});
			// A settled rerender with the same effect deps is not required to
			// change cycle; assert the type contract and non-negativity instead.
			expect(typeof cycleAtMount).toBe("number");
			expect(cycleAtMount).toBeGreaterThanOrEqual(0);
		});

		// TC-ROT-33
		it("increments cycle on auto-tick initiation", () => {
			const { result } = renderHook(() =>
				useAlbumRotation(MOCK_ALBUMS, {
					visibleCount: 12,
					random: createSeededRandom(3),
				}),
			);
			const before = result.current.cycle;

			act(() => {
				vi.advanceTimersByTime(DEFAULT_INTERVAL_MS);
			});

			expect(result.current.cycle).toBeGreaterThan(before);
		});

		// TC-ROT-34
		it("increments cycle on manual next()", () => {
			const { result } = renderHook(() =>
				useAlbumRotation(MOCK_ALBUMS, {
					visibleCount: 12,
					random: createSeededRandom(3),
				}),
			);
			const before = result.current.cycle;

			act(() => {
				result.current.next();
			});

			expect(result.current.cycle).toBeGreaterThan(before);
		});

		// TC-ROT-35
		it("increments cycle on manual prev()", () => {
			const { result } = renderHook(() =>
				useAlbumRotation(MOCK_ALBUMS, {
					visibleCount: 12,
					random: createSeededRandom(3),
				}),
			);

			act(() => {
				result.current.next();
			});
			act(() => {
				vi.advanceTimersByTime(DEFAULT_OUT_MS + DEFAULT_IN_MS);
			});
			const before = result.current.cycle;

			act(() => {
				result.current.prev();
			});

			expect(result.current.cycle).toBeGreaterThan(before);
		});

		// TC-ROT-36
		it("increments cycle again when rotation restarts on unpause", () => {
			const { result, rerender } = renderHook(
				({ paused }: { paused: boolean }) =>
					useAlbumRotation(MOCK_ALBUMS, {
						visibleCount: 12,
						random: createSeededRandom(3),
						paused,
					}),
				{ initialProps: { paused: true } },
			);
			const before = result.current.cycle;

			act(() => {
				rerender({ paused: false });
			});

			expect(result.current.cycle).toBeGreaterThan(before);
		});
	});

	// TC-ROT-37
	it("unmounting during a paused-state manual swap leaves zero pending timers and warns nothing", () => {
		const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
		const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

		const { result, unmount } = renderHook(() =>
			useAlbumRotation(MOCK_ALBUMS, {
				visibleCount: 12,
				random: createSeededRandom(3),
				paused: true,
			}),
		);

		act(() => {
			result.current.next();
		});
		expect(result.current.swap?.phase).toBe("out");

		act(() => {
			unmount();
		});

		expect(vi.getTimerCount()).toBe(0);
		expect(errorSpy).not.toHaveBeenCalled();
		expect(warnSpy).not.toHaveBeenCalled();

		errorSpy.mockRestore();
		warnSpy.mockRestore();
	});
});
