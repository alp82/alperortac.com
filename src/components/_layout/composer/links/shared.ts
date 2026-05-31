import { useEffect, useRef, useState } from "react";
import type { LinkBase } from "../types";

/**
 * Portrait viewBox the vertical connectors draw within: x 0..SEAM_VIEWBOX_W is
 * the horizontal meander band (50 = centerline), y descends top→bottom.
 * Continuous-fill connectors (ribbons, the strata core) draw over a fixed
 * `0 0 100 VBOX_H` box and let preserveAspectRatio="none" stretch it to the
 * tall rail. Discrete connectors (dots/dashes/stars) instead size the viewBox
 * height to the rail's real aspect ratio via useAspectViewBox(), so they scale
 * uniformly and never distort.
 */
export const SEAM_VIEWBOX_W = 100;
export const VBOX_H = 300;

/*
 * Shared helpers for Layer-3 connectors.
 *
 * Connectors are VERTICAL: each renders a tall element straddling the seam
 * between topic N and N+1, descending the page (river flows down, vine grows
 * down, trail descends). They draw TOP→BOTTOM and bleed into the stages above
 * and below behind a vertical mask fade (see VERTICAL_FADE_MASK / .cmp-seam-rail
 * in composer.css).
 *
 * useDrawIn() returns a ref + a `shown` flag that flips true once the seam
 * scrolls into view (when `enabled`). Connectors feed it into a top→bottom
 * reveal — stroke-dash along the vertical path, or a clip-path that wipes down
 * (revealStyle below). Respects prefers-reduced-motion (jumps straight to
 * shown). DEV-only — lives under composer/, dead-stripped from prod (see
 * types.ts).
 *
 * Reveal trigger: rails are now 90–150vh — TALLER than the viewport — so a
 * "40% of the rail visible" threshold could never be met and the observer would
 * never fire (the connector would stay hidden forever). Instead we fire on mere
 * ENTRY with threshold 0 + a bottom rootMargin, so the reveal trips as soon as
 * the rail's top edge climbs ~20% up from the viewport bottom — reliable no
 * matter how tall the rail is.
 */

export function useDrawIn(enabled: boolean) {
	const ref = useRef<SVGSVGElement>(null);
	const [shown, setShown] = useState(!enabled);

	useEffect(() => {
		if (!enabled) {
			setShown(true);
			return;
		}
		const reduce = window.matchMedia(
			"(prefers-reduced-motion: reduce)",
		).matches;
		if (reduce) {
			setShown(true);
			return;
		}
		const el = ref.current;
		if (!el) return;
		const io = new IntersectionObserver(
			(entries) => {
				for (const e of entries) {
					if (e.isIntersecting) {
						setShown(true);
						io.disconnect();
					}
				}
			},
			// Fire the moment ANY part of the rail enters; the negative bottom
			// margin makes it trip once the rail's top edge is ~20% up from the
			// viewport bottom. Works for rails far taller than the viewport.
			{ threshold: 0, rootMargin: "0px 0px -20% 0px" },
		);
		io.observe(el);
		return () => io.disconnect();
	}, [enabled]);

	return { ref, shown };
}

/**
 * Measures the rail SVG's real rendered box and returns a viewBox HEIGHT that
 * matches its true aspect ratio (width is fixed at SEAM_VIEWBOX_W = 100). With
 * that height fed to a `0 0 100 <viewBoxH>` viewBox under
 * preserveAspectRatio="none", x and y scale by the SAME factor — so DISCRETE
 * elements (round star/dot nodes, dashes) keep their shape and constant spacing
 * no matter how tall the rail grows: more dashes, not longer dashes; round
 * stars stay round. Continuous fills (ribbons, the strata core) don't need this
 * and keep using VBOX_H.
 *
 * Returns the fixed fallback (`fallback`, default VBOX_H) until the first
 * measurement lands, so the very first paint is sane. Takes the SAME svg ref
 * the connector already holds (e.g. from useDrawIn) so both observers share one
 * element. DEV-only.
 */
export function useAspectViewBox(
	ref: React.RefObject<SVGSVGElement | null>,
	fallback = VBOX_H,
) {
	const [viewBoxH, setViewBoxH] = useState(fallback);

	useEffect(() => {
		const el = ref.current;
		if (!el || typeof ResizeObserver === "undefined") return;
		const measure = () => {
			const { width, height } = el.getBoundingClientRect();
			if (width > 0 && height > 0) {
				// 1 viewBox x-unit == width/SEAM_VIEWBOX_W px; pick viewBoxH so 1
				// y-unit maps to the same px → uniform (non-distorting) scale.
				setViewBoxH((SEAM_VIEWBOX_W * height) / width);
			}
		};
		measure();
		const ro = new ResizeObserver(measure);
		ro.observe(el);
		return () => ro.disconnect();
	}, [ref]);

	return viewBoxH;
}

/**
 * Vertical fade so a connector's TOP and BOTTOM ends melt into the stage above
 * and below instead of hard-stopping. Applied as both mask + -webkit-mask on
 * the rail wrapper (see .cmp-seam-rail) — kept here so connectors that fade an
 * inner element (e.g. river-ribbon's highlight) can reuse the exact stops.
 */
export const VERTICAL_FADE_MASK =
	"linear-gradient(to bottom, transparent 0%, #000 14%, #000 86%, transparent 100%)";

/**
 * Top→bottom draw-in reveal for path-free fills (ribbons, strata): a clip-path
 * that wipes down from the top edge. Stroke-based connectors use stroke-dash
 * instead (set pathLength={1} and animate strokeDashoffset 1→0).
 *
 * `animate` (default true) controls whether a transition is attached: when the
 * connector's animate param is OFF the element starts fully shown and we omit
 * the transition entirely, so it appears instantly with no draw-in on mount.
 */
export function revealDownStyle(
	shown: boolean,
	ms = 900,
	animate = true,
): React.CSSProperties {
	return {
		clipPath: shown ? "inset(0 0 0 0)" : "inset(0 0 100% 0)",
		transition: animate ? `clip-path ${ms}ms ease-out` : undefined,
	};
}

/**
 * Per-connector rail sizing vars, applied to every `.cmp-seam-rail`. Centralizes
 * the param→CSS mapping so the 8 connectors stay DRY:
 *   --rail-h    = `${height}vh`     (default 90 → 90vh)
 *   --rail-fade = `${blend * 0.5}%` (default 90 → 45% end-fade)
 * composer.css reads both with fallbacks that reproduce the old look if absent.
 * Spread onto the rail's style (merge with any existing inline style).
 */
export function railVars(params: LinkBase): React.CSSProperties {
	return {
		"--rail-h": `${params.height}vh`,
		"--rail-fade": `${params.blend * 0.5}%`,
	} as React.CSSProperties;
}
