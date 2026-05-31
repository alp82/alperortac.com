import { useEffect, useRef, useState } from "react";
import type { MarqueeParams, SectionRenderProps } from "../types";

/*
 * Section: marquee-scroll
 *
 * Giant repeating heading strips drift horizontally behind the cluster, their
 * offset driven by page scroll so they read as moving banners. ~90vh.
 *
 * Knobs — `strips` is the row count; `speed` scales the scroll drift; `textStyle`
 * treats the type (filled / outlined / accent); `mirrored` drifts alternate rows
 * in opposite directions. Reduced-motion safe: the scroll listener never
 * attaches, so the strips freeze.
 */

const POSITIONS: Record<MarqueeParams["strips"], string[]> = {
	1: ["42%"],
	2: ["15%", "70%"],
	3: ["10%", "44%", "74%"],
};

function stripStyle(
	textStyle: MarqueeParams["textStyle"],
	color: string,
): React.CSSProperties {
	switch (textStyle) {
		case "outline":
			return {
				color: "transparent",
				WebkitTextStroke: `1.5px ${color}`,
				opacity: 0.5,
			};
		case "accent":
			return { color, opacity: 0.24 };
		default:
			return { color, opacity: 0.15 };
	}
}

export function MarqueeScrollStage({
	topic,
	params,
	accent,
	children,
}: SectionRenderProps<"marquee-scroll">) {
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

	const drift = (shift * params.speed) / 50;
	const word = `${topic.heading} · `;
	const strip = word.repeat(6);
	const rows = POSITIONS[params.strips];
	const color = accent ?? "rgba(255,255,255,0.6)";

	return (
		<article
			ref={ref}
			id={topic.id}
			className="cmp-stage relative flex flex-col items-center justify-center px-6"
			style={
				{
					minHeight: `${params.height}vh`,
					"--cmp-accent": accent ?? "transparent",
				} as React.CSSProperties
			}
		>
			{rows.map((top, i) => {
				const dir = params.mirrored ? (i % 2 === 0 ? -1 : 1) : -1;
				return (
					<div
						key={top}
						className="cmp-marquee-row"
						style={{ top }}
						aria-hidden="true"
					>
						<div
							className="cmp-marquee-text"
							style={{
								transform: `translate3d(${dir * drift}px,0,0)`,
								...stripStyle(params.textStyle, color),
							}}
						>
							{strip}
						</div>
					</div>
				);
			})}
			{/* scrim behind the cluster for legibility (fixed) */}
			<div
				className="pointer-events-none absolute inset-0"
				style={{
					background:
						"radial-gradient(ellipse 60% 45% at center, rgba(6,9,15,0.5) 0%, transparent 75%)",
				}}
				aria-hidden="true"
			/>
			<div className="relative z-10 w-full flex flex-col items-center">
				{children}
			</div>
		</article>
	);
}
