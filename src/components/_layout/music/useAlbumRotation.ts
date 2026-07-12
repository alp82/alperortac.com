import { useCallback, useEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";
import type { Album } from "../../../data/personal";

type Swap = { cell: number; phase: "out" | "in" } | null;

type HistoryEntry = { cell: number; previousAlbum: Album };

// Bounded undo depth for prev(): oldest entries are discarded past this.
const HISTORY_DEPTH = 12;

export function useAlbumRotation(
	albums: Album[],
	opts: {
		visibleCount: number;
		intervalMs?: number;
		outMs?: number;
		inMs?: number;
		random?: () => number;
		paused?: boolean;
	},
): {
	visible: Album[];
	swap: Swap;
	cycle: number;
	next: () => void;
	prev: () => void;
	canPrev: boolean;
} {
	const {
		visibleCount,
		// flicker 200/340 unchanged - 2800ms cadence leaves 2260ms of slack;
		// keep in sync with AlbumShelf.tsx INTERVAL_MS and styles.css
		intervalMs = 2800,
		// keep in sync with .album-flick-out / .album-flick-in durations in styles.css
		outMs = 200,
		inMs = 340,
		random = Math.random,
		paused = false,
	} = opts;

	const [visible, setVisible] = useState<Album[]>(() => {
		// Fisher–Yates shuffle with the injected random, then take the first
		// visibleCount (app is client-rendered; no hydration concern).
		const shuffled = [...albums];
		for (let i = shuffled.length - 1; i > 0; i--) {
			const j = Math.floor(random() * (i + 1));
			const tmp = shuffled[i] as Album;
			shuffled[i] = shuffled[j] as Album;
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
	// closure: every tick sees the current visible set, album list, and random.
	const visibleRef = useRef(visible);
	visibleRef.current = visible;
	const albumsRef = useRef(albums);
	albumsRef.current = albums;
	const randomRef = useRef(random);
	randomRef.current = random;
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
	const historyRef = useRef<HistoryEntry[]>([]);

	// The two-phase swap machinery, ref-held so the interval tick and the
	// next()/prev() callbacks share one closure reading the latest refs.
	const beginSwapRef = useRef<
		(cell: number, replacement: Album, pushHistory: boolean) => void
	>(() => {});
	beginSwapRef.current = (cell, replacement, pushHistory) => {
		// Each phase transition commits synchronously (flushSync): the flick
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
			// displaced album here (commit time), never at initiation.
			if (pushHistory) {
				historyRef.current.push({
					cell,
					previousAlbum: visibleRef.current[cell] as Album,
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
		const hidden = albumsRef.current.filter(
			(a) => !current.some((v) => v.cover === a.cover),
		);
		if (hidden.length === 0) return;
		const cell = Math.floor(randomRef.current() * current.length);
		const replacement = hidden[
			Math.floor(randomRef.current() * hidden.length)
		] as Album;
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
			// Abandon any in-flight flicker AND reopen the in-flight guard, so a
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
		// Pop, discarding entries whose album is currently visible again (the
		// album-came-back-in-another-cell duplicate guard).
		let entry: HistoryEntry | undefined;
		while (historyRef.current.length > 0) {
			const candidate = historyRef.current.pop() as HistoryEntry;
			if (
				visibleRef.current.some(
					(v) => v.cover === candidate.previousAlbum.cover,
				)
			) {
				continue;
			}
			entry = candidate;
			break;
		}
		setCanPrev(historyRef.current.length > 0);
		if (!entry) return;
		// No history push - no redo, prev is pure undo.
		beginSwapRef.current(entry.cell, entry.previousAlbum, false);
		restartIntervalClock();
	}, [restartIntervalClock]);

	return { visible, swap, cycle, next, prev, canPrev };
}
