import { useCallback, useEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";

export type Swap = { cell: number; phase: "out" | "in" } | null;

type HistoryEntry<T> = { cell: number; previousItem: T };

// Bounded undo depth for prev(): oldest entries are discarded past this.
const HISTORY_DEPTH = 12;

// Deterministic PRNG (mulberry32) for the MOUNT-TIME shuffle only. The initial
// visible set is rendered on the server (these grids live inside dialogs, whose
// children are server-rendered even while closed) and must match the client's
// first render, or hydration fails (React #418) and the whole tree is
// regenerated on the client - the flash of the main page rebuilding behind a
// subpage panel. Math.random() here differed every render, on every request, so
// SSR and client never agreed. A fixed seed makes the initial subset stable and
// identical across server/client; runtime rotation still uses the injected
// `random` (Math.random by default) so the shelf keeps varying after mount.
const INITIAL_SHUFFLE_SEED = 0x5eeded;
function mulberry32(seed: number): () => number {
	let a = seed;
	return () => {
		a |= 0;
		a = (a + 0x6d2b79f5) | 0;
		let t = Math.imul(a ^ (a >>> 15), 1 | a);
		t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
	};
}

/*
 * Generic timed grid-cell rotation engine - the Music shelf's battle-tested
 * concurrency machinery (interval scheduling, two-phase flushSync swap,
 * in-flight guard, pause/restart, bounded undo) extracted from
 * useAlbumRotation so the movies PosterGrid reuses it. Identity comparisons
 * go through `keyOf` (albums key by cover, posters by slug); timing defaults
 * are the Music cadence - callers with their own choreography (PosterGrid's
 * channel-zap) pass explicit timings.
 */
export function useRotation<T>(
	items: T[],
	opts: {
		visibleCount: number;
		keyOf: (item: T) => string;
		intervalMs?: number;
		outMs?: number;
		inMs?: number;
		random?: () => number;
		paused?: boolean;
	},
): {
	visible: T[];
	swap: Swap;
	cycle: number;
	next: () => void;
	prev: () => void;
	canPrev: boolean;
} {
	const {
		visibleCount,
		keyOf,
		// Music-shelf defaults (2800/200/340) - keep in sync with
		// AlbumShelf.tsx INTERVAL_MS and the album-flick durations in
		// styles.css; other callers override explicitly.
		intervalMs = 2800,
		outMs = 200,
		inMs = 340,
		random = Math.random,
		paused = false,
	} = opts;

	const [visible, setVisible] = useState<T[]>(() => {
		// Fisher–Yates shuffle with a FIXED-seed PRNG (not the injected `random`)
		// so the mount-time subset is identical on server and client - hydration
		// safety, see INITIAL_SHUFFLE_SEED above. Runtime swaps below still use
		// the injected `random`, so the shelf keeps varying after mount.
		const seededShuffle = mulberry32(INITIAL_SHUFFLE_SEED);
		const shuffled = [...items];
		for (let i = shuffled.length - 1; i > 0; i--) {
			const j = Math.floor(seededShuffle() * (i + 1));
			const tmp = shuffled[i] as T;
			shuffled[i] = shuffled[j] as T;
			shuffled[j] = tmp;
		}
		return shuffled.slice(0, visibleCount);
	});
	const [swap, setSwap] = useState<Swap>(null);
	// Increments at every swap initiation (auto or manual) and every rotation
	// (re)start - the component keys the progress fill on it.
	const [cycle, setCycle] = useState(0);
	const [canPrev, setCanPrev] = useState(false);

	// Latest-value mirrors so the interval callback never reads a stale
	// closure: every tick sees the current visible set, item list, and random.
	const visibleRef = useRef(visible);
	visibleRef.current = visible;
	const itemsRef = useRef(items);
	itemsRef.current = items;
	const randomRef = useRef(random);
	randomRef.current = random;
	const keyOfRef = useRef(keyOf);
	keyOfRef.current = keyOf;
	const pausedRef = useRef(paused);
	pausedRef.current = paused;
	// In-flight guard: non-null while a swap is mid-flight; ticks no-op then.
	const swapRef = useRef<Swap>(null);
	const outTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	const inTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	// Live interval id - manual nav restarts the clock through this ref; the
	// effect cleanup MUST null it so a cleared interval never looks alive.
	const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
	// Undo stack for prev(): entries push at content-commit time only, so an
	// aborted-by-pause out-phase never creates a bogus entry.
	const historyRef = useRef<HistoryEntry<T>[]>([]);

	// The two-phase swap machinery, ref-held so the interval tick and the
	// next()/prev() callbacks share one closure reading the latest refs.
	const beginSwapRef = useRef<
		(cell: number, replacement: T, pushHistory: boolean) => void
	>(() => {});
	beginSwapRef.current = (cell, replacement, pushHistory) => {
		// Each phase transition commits synchronously (flushSync): the swap
		// classes must hit the DOM at the exact timer fire so the CSS
		// animations start in lockstep with the outMs/inMs timeouts.
		const outSwap: Swap = { cell, phase: "out" };
		swapRef.current = outSwap;
		flushSync(() => {
			setCycle((c) => c + 1);
			setSwap(outSwap);
		});
		outTimeoutRef.current = setTimeout(() => {
			// Content swaps at the end of the OUT phase - history records the
			// displaced item here (commit time), never at initiation.
			if (pushHistory) {
				historyRef.current.push({
					cell,
					previousItem: visibleRef.current[cell] as T,
				});
				if (historyRef.current.length > HISTORY_DEPTH) {
					historyRef.current.shift();
				}
			}
			const inSwap: Swap = { cell, phase: "in" };
			swapRef.current = inSwap;
			flushSync(() => {
				setVisible((prev) => {
					const next = [...prev];
					next[cell] = replacement;
					return next;
				});
				setSwap(inSwap);
				if (pushHistory) setCanPrev(true);
			});
			inTimeoutRef.current = setTimeout(() => {
				swapRef.current = null;
				flushSync(() => {
					setSwap(null);
				});
			}, inMs);
		}, outMs);
	};

	// Starts the interval clock via the ref-held tick, shared by the main
	// effect's (re)start and restartIntervalClock's manual-nav restart so
	// both create the interval identically.
	const startInterval = useCallback(() => {
		intervalRef.current = setInterval(() => {
			tickRef.current();
		}, intervalMs);
	}, [intervalMs]);

	// Interval tick, ref-held so the effect's interval and the manual-nav
	// restarted interval run the exact same body.
	const tickRef = useRef<() => void>(() => {});
	tickRef.current = () => {
		if (swapRef.current) return; // a swap is in flight - no-op this tick
		const current = visibleRef.current;
		const key = keyOfRef.current;
		const hidden = itemsRef.current.filter(
			(a) => !current.some((v) => key(v) === key(a)),
		);
		if (hidden.length === 0) return;
		const cell = Math.floor(randomRef.current() * current.length);
		const replacement = hidden[
			Math.floor(randomRef.current() * hidden.length)
		] as T;
		beginSwapRef.current(cell, replacement, true);
	};

	// biome-ignore lint/correctness/useExhaustiveDependencies: outMs/inMs are read by the ref-held beginSwap - a change must still restart rotation (pre-existing contract, TC-ROT-12/13).
	useEffect(() => {
		if (paused) return;

		// Fresh (re)start of rotation: the progress bar restarts from zero -
		// honest, since a full interval runs after resume.
		setCycle((c) => c + 1);
		startInterval();

		return () => {
			// Clear via the REF, never a captured local id - next() may have
			// replaced the interval since this effect ran.
			if (intervalRef.current !== null) clearInterval(intervalRef.current);
			// Null the ref so a paused-state next() can never read a dead id as
			// "running" and resurrect a live interval while paused.
			intervalRef.current = null;
			if (outTimeoutRef.current !== null) clearTimeout(outTimeoutRef.current);
			if (inTimeoutRef.current !== null) clearTimeout(inTimeoutRef.current);
			outTimeoutRef.current = null;
			inTimeoutRef.current = null;
			// Abandon any in-flight swap AND reopen the in-flight guard, so a
			// restart after unpause can never wedge shut on the abandoned swap.
			swapRef.current = null;
			setSwap(null);
		};
	}, [paused, intervalMs, outMs, inMs]);

	// Unmount-only cleanup for the phase timeouts: covers unmount while a
	// paused-state MANUAL swap is in flight (the main effect registered no
	// cleanup when paused).
	useEffect(() => {
		return () => {
			if (outTimeoutRef.current !== null) clearTimeout(outTimeoutRef.current);
			if (inTimeoutRef.current !== null) clearTimeout(inTimeoutRef.current);
		};
	}, []);

	// Manual-nav interval-clock reset: gated on the paused FLAG (via
	// pausedRef), never on intervalRef.current alone - while paused the manual
	// swap runs but the interval stays stopped; the paused-reactivity effect
	// restarts the clock on unpause.
	const restartIntervalClock = useCallback(() => {
		if (pausedRef.current) return;
		if (intervalRef.current !== null) clearInterval(intervalRef.current);
		startInterval();
	}, [startInterval]);

	const next = useCallback(() => {
		if (swapRef.current) return; // in-flight guard: ignore, no queue
		tickRef.current();
		if (!swapRef.current) return; // hidden set was empty - nothing swapped
		restartIntervalClock();
	}, [restartIntervalClock]);

	const prev = useCallback(() => {
		if (swapRef.current) return; // in-flight guard: ignore, no queue
		// Pop, discarding entries whose item is currently visible again (the
		// item-came-back-in-another-cell duplicate guard).
		let entry: HistoryEntry<T> | undefined;
		while (historyRef.current.length > 0) {
			const candidate = historyRef.current.pop() as HistoryEntry<T>;
			const key = keyOfRef.current;
			if (
				visibleRef.current.some((v) => key(v) === key(candidate.previousItem))
			) {
				continue;
			}
			entry = candidate;
			break;
		}
		setCanPrev(historyRef.current.length > 0);
		if (!entry) return;
		// No history push - no redo, prev is pure undo.
		beginSwapRef.current(entry.cell, entry.previousItem, false);
		restartIntervalClock();
	}, [restartIntervalClock]);

	return { visible, swap, cycle, next, prev, canPrev };
}
