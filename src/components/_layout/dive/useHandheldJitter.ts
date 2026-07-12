import type React from "react";
import { useEffect } from "react";
import { useReducedMotion } from "./useReducedMotion";

const JITTER_AMP = 0.4;

// The ONLY rAF in the dive feature - drives the handheld technique's faint
// constant shake by writing --dive-jitter-x / --dive-jitter-y onto the scene
// element. Honors reduced-motion (no rAF, vars stay at 0) and clears the vars
// whenever it goes inactive so the scene is jitter-free at rest.
export function useHandheldJitter(opts: {
	sceneRef: React.RefObject<HTMLElement | null>;
	active: boolean;
}): void {
	const { sceneRef, active } = opts;
	const reducedMotion = useReducedMotion();

	useEffect(() => {
		const el = sceneRef.current;
		if (!el) return;
		if (!active || reducedMotion) {
			el.style.setProperty("--dive-jitter-x", "0px");
			el.style.setProperty("--dive-jitter-y", "0px");
			return;
		}

		let raf = 0;
		const tick = () => {
			const t = performance.now() / 1000;
			const x = Math.sin(t * 13) * JITTER_AMP;
			const y = Math.cos(t * 11) * JITTER_AMP * 0.7;
			el.style.setProperty("--dive-jitter-x", `${x}px`);
			el.style.setProperty("--dive-jitter-y", `${y}px`);
			raf = requestAnimationFrame(tick);
		};
		raf = requestAnimationFrame(tick);

		return () => {
			cancelAnimationFrame(raf);
			el.style.setProperty("--dive-jitter-x", "0px");
			el.style.setProperty("--dive-jitter-y", "0px");
		};
	}, [sceneRef, active, reducedMotion]);
}
