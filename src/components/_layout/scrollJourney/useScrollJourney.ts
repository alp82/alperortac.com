// The scroll driver.
//
// One rAF per frame, no layout reads in the scroll handler, and zero React
// renders while scrolling. React state is only touched when something that
// genuinely needs a render changes: the night UI flip (immediate, it swaps
// classes) and a trailing re-sync once the scroll settles.

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { CelestialState } from "../../../data/celestial";
import {
	NIGHT_UI_THRESHOLD,
	type RGB,
	type SkyAnchors,
} from "../../../data/skyCurve";
import { useIsomorphicLayoutEffect } from "../../useIsomorphicLayoutEffect";
import {
	applyJourney,
	createJourneyTargets,
	type JourneyTargets,
} from "./journeyTargets";
import {
	computeJourney,
	type JourneyValues,
	type Metrics,
	progressFor,
	readMetrics,
	sameMetrics,
} from "./journeyValues";

/**
 * How long after the last scroll tick the settled position is pushed back into
 * React. Nothing visual waits on it - the DOM has already moved - it only
 * re-syncs the few consumers that need a render (the atmosphere dial readout,
 * the night flip's exact value).
 */
const SETTLE_MS = 140;

export type Journey = {
	targets: JourneyTargets;
	/**
	 * Re-assert the current frame. Consumers call this from a layout effect on
	 * every render, because React restores the markup's `var()` style references
	 * (the pre-hydration seed) whenever it re-renders them.
	 */
	repaint: () => void;
	/** Compute and apply the journey for an explicit scroll offset. */
	applyAt: (scrollY: number) => { progress: number; skyProgress: number };
	/** Viewport/document metrics; changes only on resize or doc-height change. */
	metrics: Metrics | null;
};

export function useScrollJourney(opts: {
	celestial: CelestialState;
	anchors: SkyAnchors;
	/** the ridge base colour (the atmosphere toy's palette owns it) */
	landscape: RGB;
	/** the atmosphere toy's time-slice override, or identity */
	sliceFor: (rawProgress: number) => number;
	/** true while a detail subpage is open: the journey must not advance */
	frozenRef: React.RefObject<boolean>;
	/** push a settled scroll position back into React state */
	onSettle: (progress: number, scrollY: number) => void;
}): Journey {
	const { celestial, anchors, landscape, sliceFor, frozenRef, onSettle } = opts;

	const [metrics, setMetrics] = useState<Metrics | null>(null);
	const targets = useMemo(createJourneyTargets, []);

	// Everything the rAF path reads lives in a ref, so the driver effect never
	// re-subscribes mid-scroll.
	const metricsRef = useRef<Metrics | null>(null);
	const lastRef = useRef<JourneyValues | null>(null);
	const celestialRef = useRef(celestial);
	const anchorsRef = useRef(anchors);
	const landscapeRef = useRef(landscape);
	const sliceRef = useRef(sliceFor);
	const onSettleRef = useRef(onSettle);
	celestialRef.current = celestial;
	anchorsRef.current = anchors;
	landscapeRef.current = landscape;
	sliceRef.current = sliceFor;
	onSettleRef.current = onSettle;

	// prefers-reduced-motion pins the watermark's drift travel to 0. Held in a ref
	// so the per-frame path never touches matchMedia.
	const reduceMotionRef = useRef(false);

	const applyAt = useCallback(
		(scrollY: number) => {
			const m = metricsRef.current;
			if (!m) return { progress: 0, skyProgress: 0 };
			const progress = progressFor(scrollY, m);
			const skyProgress = sliceRef.current(progress);
			const values = computeJourney({
				skyProgress,
				rawProgress: progress,
				scrollY,
				metrics: m,
				celestial: celestialRef.current,
				anchors: anchorsRef.current,
				landscape: landscapeRef.current,
				reduceMotion: reduceMotionRef.current,
			});
			lastRef.current = values;
			applyJourney(values, targets);
			return { progress, skyProgress };
		},
		[targets],
	);

	useEffect(() => {
		const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
		const read = () => {
			reduceMotionRef.current = mq.matches;
			applyAt(window.scrollY);
		};
		read();
		mq.addEventListener("change", read);
		return () => mq.removeEventListener("change", read);
	}, [applyAt]);

	const repaint = useCallback(() => {
		if (lastRef.current) applyJourney(lastRef.current, targets);
	}, [targets]);

	// Metrics: measured on mount, on resize, and when the document height changes
	// (the rhythm-gap slider, lazy images landing). A new object only goes into
	// state when a value actually moved - the observer fires for every image, and
	// a fresh object each time re-rendered the whole tree mid-scroll.
	useIsomorphicLayoutEffect(() => {
		const measure = () => {
			const m = readMetrics();
			const changed = !sameMetrics(metricsRef.current, m);
			metricsRef.current = m;
			if (changed) {
				setMetrics(m);
				applyAt(window.scrollY);
			}
		};
		measure();
		window.addEventListener("resize", measure);
		const ro = new ResizeObserver(measure);
		ro.observe(document.documentElement);
		return () => {
			window.removeEventListener("resize", measure);
			ro.disconnect();
		};
	}, [applyAt]);

	// The scroll path. Coalesced to one frame; the handler itself only reads
	// window.scrollY (no forced layout).
	useEffect(() => {
		let queued = false;
		let lastY = window.scrollY;
		let wasNight: boolean | null = null;
		let settle = 0;

		const frame = () => {
			queued = false;
			if (frozenRef.current) return;
			const { progress, skyProgress } = applyAt(lastY);

			const night = skyProgress >= NIGHT_UI_THRESHOLD;
			if (wasNight !== night) {
				wasNight = night;
				onSettleRef.current(progress, lastY);
			}
			window.clearTimeout(settle);
			settle = window.setTimeout(() => {
				const m = metricsRef.current;
				if (m) onSettleRef.current(progressFor(lastY, m), lastY);
			}, SETTLE_MS);
		};

		const onScroll = () => {
			lastY = window.scrollY;
			if (queued) return;
			queued = true;
			requestAnimationFrame(frame);
		};

		window.addEventListener("scroll", onScroll, { passive: true });
		return () => {
			window.removeEventListener("scroll", onScroll);
			window.clearTimeout(settle);
		};
	}, [applyAt, frozenRef]);

	// A palette / curve / time-slice change repaints in place, with no scroll.
	useIsomorphicLayoutEffect(() => {
		applyAt(window.scrollY);
	}, [applyAt, celestial, anchors, landscape, sliceFor]);

	// MUST be memoised. This object is the prop that reaches PixelBackground,
	// Minimap and NarrativeWatermark, all of which are memo()'d. A fresh literal
	// every render defeats every one of those bail-outs, so an unrelated
	// LayoutHost state change (opening the About menu, a settle sync) would
	// reconcile the whole 150-node star field and rewrite its inline styles -
	// measured at 150-310ms of style recalc per nav click.
	return useMemo(
		() => ({ targets, repaint, applyAt, metrics }),
		[targets, repaint, applyAt, metrics],
	);
}

/**
 * Re-assert the journey after every render of a consumer. React rewrites the
 * markup's `var()` style references when it re-renders, which would otherwise
 * snap the scene back to the pre-hydration seed until the next scroll frame.
 * Deliberately has no dependency array.
 */
export function useJourneyRepaint(journey: Journey | undefined) {
	useIsomorphicLayoutEffect(() => {
		journey?.repaint();
	});
}
