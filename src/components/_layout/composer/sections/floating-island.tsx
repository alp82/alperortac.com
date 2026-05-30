import { useEffect, useRef, useState } from "react";
import type { IslandParams, SectionRenderProps } from "../types";

/*
 * Section: floating-island
 *
 * The cluster rests on a floating slab with a soft drop shadow, the landscape
 * visible all around it. The slab bobs gently as the stage scrolls through view.
 * ~90vh.
 *
 * Knobs — `floatHeight` grows the shadow throw + lift; `bob` is the idle drift
 * amount (0 = still); `corners` sets the slab radius; `tint` is the slab surface
 * opacity (glassy → solid). Reduced-motion safe: the listener never attaches.
 */

const RADIUS: Record<IslandParams["corners"], string> = {
	sharp: "6px",
	soft: "18px",
	pill: "32px",
};

export function FloatingIslandStage({
	topic,
	params,
	accent,
	children,
}: SectionRenderProps<"floating-island">) {
	const ref = useRef<HTMLElement>(null);
	const [rel, setRel] = useState(0);

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
				setRel(
					(rect.top + rect.height / 2 - window.innerHeight / 2) /
						window.innerHeight,
				);
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

	const surface = params.tint / 100;
	const lift = -(params.floatHeight * 0.12);
	const bobPx = (rel * 24 * params.bob) / 50;
	const shadow = `0 ${24 + params.floatHeight * 0.7}px ${48 + params.floatHeight}px -30px rgba(0,0,0,0.85)`;

	return (
		<article
			ref={ref}
			id={`topic-${topic.id}`}
			className="cmp-stage relative flex items-center justify-center px-5 md:px-10 py-[9vh]"
			style={
				{
					minHeight: `${params.height}vh`,
					"--cmp-accent": accent ?? "transparent",
				} as React.CSSProperties
			}
		>
			<div
				className="cmp-island relative w-full max-w-2xl flex flex-col items-center text-center"
				style={
					{
						transform: `translate3d(0, ${lift + bobPx}px, 0)`,
						"--cmp-island-surface": String(surface),
						"--cmp-island-radius": RADIUS[params.corners],
						"--cmp-island-shadow": shadow,
					} as React.CSSProperties
				}
			>
				{accent && (
					<span
						className="absolute -bottom-3 left-1/2 -translate-x-1/2 h-2 w-2/3 rounded-full blur-md"
						style={{ background: accent, opacity: 0.5 }}
						aria-hidden="true"
					/>
				)}
				<div className="relative p-8 md:p-12 w-full">{children}</div>
			</div>
		</article>
	);
}
