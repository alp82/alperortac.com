import { useEffect, useRef, useState } from "react";
import { flourishSrc } from "../types";
import type { SectionRenderProps } from "../types";

/*
 * Section: parallax-depth
 *
 * Layered foreground/background: a large ghost flourish drifts slower than the
 * cluster as the stage scrolls through the viewport, giving real depth over the
 * pixel world. Tallest stage so the parallax has room to read. ~110vh.
 *
 * The offset is computed from the stage's position relative to viewport center;
 * reduced-motion users get a static frame (CSS neutralizes the transform).
 */

const ALIGN_CLASS: Record<SectionRenderProps["params"]["align"], string> = {
	center: "items-center justify-center text-center",
	left: "items-start justify-center text-left",
	right: "items-end justify-center text-right",
	bottom: "items-center justify-end text-center pb-[14vh]",
};

export function ParallaxDepthStage({
	topic,
	params,
	accent,
	children,
}: SectionRenderProps) {
	const ref = useRef<HTMLElement>(null);
	const [offset, setOffset] = useState(0);

	useEffect(() => {
		// Respect reduced-motion: leave the layers static (offset stays 0).
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
				// −1 (stage above center) .. +1 (stage below center)
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

	const scrim = params.scrim / 100;

	return (
		<article
			ref={ref}
			id={`topic-${topic.id}`}
			className={`cmp-stage relative flex flex-col px-6 ${ALIGN_CLASS[params.align]}`}
			style={
				{
					minHeight: `${params.height}vh`,
					"--cmp-accent": accent ?? "transparent",
				} as React.CSSProperties
			}
		>
			{/* far background ghost flourish — drifts slowest */}
			<div
				className="cmp-parallax-layer flex items-center justify-center"
				style={{ transform: `translate3d(0, ${offset * -60}px, 0)` }}
				aria-hidden="true"
			>
				<img
					src={flourishSrc(topic.id)}
					alt=""
					className="w-[55vmin] max-w-[420px] opacity-[0.1]"
					style={{ imageRendering: "pixelated" }}
				/>
			</div>
			{/* mid scrim band — drifts a touch faster than background */}
			<div
				className="cmp-parallax-layer"
				style={{
					transform: `translate3d(0, ${offset * -28}px, 0)`,
					background: `radial-gradient(ellipse at center, rgba(0,0,0,${scrim + 0.1}) 0%, transparent 65%)`,
				}}
				aria-hidden="true"
			/>
			{/* foreground cluster — drifts fastest (counter to scroll) */}
			<div
				className="relative z-10 w-full flex flex-col items-center"
				style={{ transform: `translate3d(0, ${offset * 36}px, 0)` }}
			>
				{children}
			</div>
		</article>
	);
}
