import {
	type RefObject,
	useCallback,
	useEffect,
	useLayoutEffect,
	useRef,
	useState,
} from "react";
import {
	type Ceiling,
	type FitTextSpec,
	fitFontSize,
	resolveCeiling,
} from "./fitText";

// Measures a hidden ghost copy of the full line rendered at the ceiling size
// and computes the largest font size that keeps it on one line. Keyed on the
// FULL line (not the partially typed text), so the size is set once per
// phrase and held constant through typing/backspacing. Measurement structure
// (measure-on-mount + ResizeObserver with window-resize fallback + 0-width
// guards) mirrors useShortsRail.
export function useFitText(
	line: string,
	spec: FitTextSpec,
	ceilings: Ceiling[],
): {
	containerRef: RefObject<HTMLDivElement | null>;
	ghostRef: RefObject<HTMLSpanElement | null>;
	fontSizePx: number;
	ceilingPx: number;
} {
	const containerRef = useRef<HTMLDivElement>(null);
	const ghostRef = useRef<HTMLSpanElement>(null);
	const [fontSizePx, setFontSizePx] = useState(spec.ceilingPx);
	const [ceilingPx, setCeilingPx] = useState(spec.ceilingPx);

	const measure = useCallback(() => {
		const containerW = containerRef.current?.clientWidth ?? 0;
		const ghostW = ghostRef.current?.getBoundingClientRect().width ?? 0;
		const vw = typeof window !== "undefined" ? window.innerWidth : 0;
		const ceiling = resolveCeiling(vw, ceilings);
		setCeilingPx(ceiling);
		setFontSizePx(Math.min(fitFontSize(containerW, ghostW, spec), ceiling));
	}, [spec, ceilings]);

	// biome-ignore lint/correctness/useExhaustiveDependencies: `line` is read by measure() through the ghost DOM node, so the effect must re-run when the phrase changes; useLayoutEffect avoids a one-frame flash at the stale size.
	useLayoutEffect(() => {
		measure();
	}, [line, measure]);

	useEffect(() => {
		if (typeof ResizeObserver === "undefined") {
			window.addEventListener("resize", measure);
			return () => window.removeEventListener("resize", measure);
		}
		const observer = new ResizeObserver(measure);
		const container = containerRef.current;
		if (container) observer.observe(container);
		return () => observer.disconnect();
	}, [measure]);

	return { containerRef, ghostRef, fontSizePx, ceilingPx };
}
