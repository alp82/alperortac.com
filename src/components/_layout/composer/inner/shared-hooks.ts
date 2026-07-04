import { type RefObject, useEffect, useState } from "react";

/*
 * Shared scroll-tracking hook for inner styles.
 *
 * Several inner clusters (parallax-depth, floating-island) drift or bob in
 * response to how far the cluster's center sits from the viewport's
 * vertical center. This hook centralizes that rAF-throttled scroll+resize
 * listener, including the prefers-reduced-motion guard (the listener never
 * attaches, so reduced-motion users get a static frame at offset 0).
 *
 * Ships as part of the composer subsystem (see types.ts).
 */

/**
 * Tracks `el`'s relative vertical offset from the viewport center as a
 * fraction of viewport height: 0 when centered, negative above, positive
 * below. Updates on scroll/resize, rAF-throttled, and never attaches when
 * the user prefers reduced motion.
 */
export function useRelativeScrollOffset(ref: RefObject<HTMLElement | null>) {
	const [offset, setOffset] = useState(0);

	// biome-ignore lint/correctness/useExhaustiveDependencies: ref.current is read once on mount and never swaps; the ref attaches before effects run.
	useEffect(() => {
		if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
		const el = ref.current;
		if (!el) return;
		let raf = 0;
		const onScroll = () => {
			if (raf) return;
			raf = requestAnimationFrame(() => {
				raf = 0;
				const rect = el.getBoundingClientRect();
				const center = rect.top + rect.height / 2;
				const rel = (center - window.innerHeight / 2) / window.innerHeight;
				setOffset(rel);
			});
		};
		onScroll();
		window.addEventListener("scroll", onScroll, { passive: true });
		window.addEventListener("resize", onScroll);
		return () => {
			window.removeEventListener("scroll", onScroll);
			window.removeEventListener("resize", onScroll);
			if (raf) cancelAnimationFrame(raf);
		};
	}, []);

	return offset;
}
