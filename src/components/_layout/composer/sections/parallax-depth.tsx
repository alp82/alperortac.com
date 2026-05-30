import { useEffect, useRef, useState } from "react";
import type { TopicId } from "../../../../data/topics";
import { flourishSrc } from "../types";
import type { ParallaxParams, SectionRenderProps } from "../types";

/*
 * Section: parallax-depth
 *
 * Layered foreground/background: a backdrop shape drifts slower than the cluster
 * as the stage scrolls through the viewport, giving real depth over the pixel
 * world. Tallest stage so the parallax has room to read. ~110vh.
 *
 * Knobs — `shape` swaps the drifting backdrop (the topic flourish or a drawn
 * blob / rings / grid / sediment strata); `depth` scales the layer separation
 * (0 = flat, 50 = today); `layers` adds a mid scrim plane for extra depth.
 * Reduced-motion users get a static frame (the scroll listener never attaches).
 */

function ShapeBackdrop({
	shape,
	topicId,
	accent,
}: {
	shape: ParallaxParams["shape"];
	topicId: TopicId;
	accent: string | null;
}) {
	const tint = accent ?? "rgba(255,255,255,0.5)";
	switch (shape) {
		case "blob":
			return (
				<div
					className="w-[60vmin] max-w-[460px] aspect-square rounded-[42%_58%_56%_44%/48%_42%_58%_52%]"
					style={{
						background: `radial-gradient(circle at 40% 35%, ${tint}, transparent 70%)`,
						opacity: 0.16,
						filter: "blur(8px)",
					}}
				/>
			);
		case "rings":
			return (
				<div
					className="w-[70vmin] max-w-[520px] aspect-square rounded-full"
					style={{
						background: `repeating-radial-gradient(circle, ${tint} 0 2px, transparent 2px 7%)`,
						opacity: 0.12,
					}}
				/>
			);
		case "grid":
			return (
				<div
					className="w-[80vmin] max-w-[640px] aspect-square"
					style={{
						backgroundImage: `linear-gradient(${tint} 1px, transparent 1px), linear-gradient(90deg, ${tint} 1px, transparent 1px)`,
						backgroundSize: "clamp(28px,5vw,52px) clamp(28px,5vw,52px)",
						opacity: 0.1,
					}}
				/>
			);
		case "strata":
			return (
				<div
					className="w-[80vmin] max-w-[600px] h-[60vmin]"
					style={{
						background: `repeating-linear-gradient(0deg, ${tint} 0 3px, transparent 3px 22px)`,
						opacity: 0.12,
					}}
				/>
			);
		default:
			return (
				<img
					src={flourishSrc(topicId)}
					alt=""
					className="w-[55vmin] max-w-[420px] opacity-[0.1]"
					style={{ imageRendering: "pixelated" }}
				/>
			);
	}
}

export function ParallaxDepthStage({
	topic,
	params,
	accent,
	children,
}: SectionRenderProps<"parallax-depth">) {
	const ref = useRef<HTMLElement>(null);
	const [offset, setOffset] = useState(0);

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

	// depth 50 reproduces the original separation; 0 = flat, 100 = doubled.
	const k = params.depth / 50;

	return (
		<article
			ref={ref}
			id={`topic-${topic.id}`}
			className="cmp-stage relative flex flex-col items-center justify-center px-6"
			style={
				{
					minHeight: `${params.height}vh`,
					"--cmp-accent": accent ?? "transparent",
				} as React.CSSProperties
			}
		>
			{/* far background shape — drifts slowest */}
			<div
				className="cmp-parallax-layer flex items-center justify-center"
				style={{ transform: `translate3d(0, ${offset * -60 * k}px, 0)` }}
				aria-hidden="true"
			>
				<ShapeBackdrop
					shape={params.shape}
					topicId={topic.id}
					accent={accent}
				/>
			</div>
			{/* mid scrim band — only on the 3-layer setting */}
			{params.layers === 3 && (
				<div
					className="cmp-parallax-layer"
					style={{
						transform: `translate3d(0, ${offset * -28 * k}px, 0)`,
						background:
							"radial-gradient(ellipse at center, rgba(0,0,0,0.35) 0%, transparent 65%)",
					}}
					aria-hidden="true"
				/>
			)}
			{/* foreground cluster — drifts fastest (counter to scroll) */}
			<div
				className="relative z-10 w-full flex flex-col items-center"
				style={{ transform: `translate3d(0, ${offset * 36 * k}px, 0)` }}
			>
				{children}
			</div>
		</article>
	);
}
