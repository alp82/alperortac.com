import { useEffect, useRef, useState } from "react";
import type { SectionRenderProps } from "../types";

/*
 * Section: marquee-scroll
 *
 * A giant repeating heading marquee strip drifts horizontally behind the
 * cluster, its offset driven by page scroll so it reads as a moving banner.
 * Reduced-motion safe: the scroll listener never attaches under
 * prefers-reduced-motion, so the strip freezes. `scrim` darkens behind the
 * cluster for legibility; `align` positions the cluster. ~90vh.
 */

const ALIGN_CLASS: Record<SectionRenderProps["params"]["align"], string> = {
	center: "items-center justify-center text-center",
	left: "items-start justify-center text-left",
	right: "items-end justify-center text-right",
	bottom: "items-center justify-end text-center pb-[12vh]",
};

export function MarqueeScrollStage({
	topic,
	params,
	accent,
	children,
}: SectionRenderProps) {
	const ref = useRef<HTMLElement>(null);
	const [shift, setShift] = useState(0);

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
				const rel = (rect.top + rect.height / 2) / window.innerHeight;
				setShift(rel * 240);
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
	const word = `${topic.heading} · `;
	const strip = word.repeat(6);

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
			{/* upper marquee strip — drifts one way */}
			<div
				className="cmp-marquee-row"
				style={{ top: "16%" }}
				aria-hidden="true"
			>
				<div
					className="cmp-marquee-text"
					style={{
						transform: `translate3d(${-shift}px,0,0)`,
						color: accent ?? "rgba(255,255,255,0.14)",
						opacity: accent ? 0.16 : 1,
					}}
				>
					{strip}
				</div>
			</div>
			{/* lower marquee strip — drifts the other way */}
			<div
				className="cmp-marquee-row"
				style={{ bottom: "16%" }}
				aria-hidden="true"
			>
				<div
					className="cmp-marquee-text"
					style={{
						transform: `translate3d(${shift}px,0,0)`,
						color: accent ?? "rgba(255,255,255,0.1)",
						opacity: accent ? 0.12 : 1,
					}}
				>
					{strip}
				</div>
			</div>
			{/* scrim behind the cluster */}
			<div
				className="pointer-events-none absolute inset-0"
				style={{
					background: `radial-gradient(ellipse 60% 45% at center, rgba(6,9,15,${scrim + 0.1}) 0%, transparent 75%)`,
				}}
				aria-hidden="true"
			/>
			<div className="relative z-10 w-full flex flex-col items-center">
				{children}
			</div>
		</article>
	);
}
