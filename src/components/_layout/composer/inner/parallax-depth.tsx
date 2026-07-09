import { useRef } from "react";
import type { TopicId } from "../../../../data/topics";
import { SectionTitle } from "../../SectionTitle";
import type { InnerRenderProps, ParallaxDepthParams } from "../types";
import { flourishSrc } from "../types";
import { FrameShell } from "./FrameShell";
import { DENSITY_GAP, DENSITY_HEADING, DENSITY_MAXW } from "./shared";
import { useRelativeScrollOffset } from "./shared-hooks";

/*
 * Inner: parallax-depth — "layered depth drift." (ported from the retired
 * Layer-1 stage of the same name)
 *
 * A backdrop shape drifts slower than the cluster as it scrolls through the
 * viewport, giving real depth over the pixel world, with the Minimal style's
 * big uppercase heading + accent underline as the fixed chrome. Knob — `depth`
 * scales the layer separation (0 = flat, 50 = today); shape (flourish) and
 * layers (3) ship locked in the panel. Reduced-motion users get a static frame
 * (the scroll listener never attaches).
 */

function ShapeBackdrop({
	shape,
	topicId,
	accent,
}: {
	shape: ParallaxDepthParams["shape"];
	topicId: TopicId;
	accent: string;
}) {
	const tint = accent;
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

export function ParallaxDepthCluster({
	topic,
	params,
	accent,
	isNight,
	children,
}: InnerRenderProps<"parallax-depth">) {
	const ref = useRef<HTMLDivElement>(null);
	const offset = useRelativeScrollOffset(ref);

	// depth 50 reproduces the original separation; 0 = flat, 100 = doubled.
	const k = params.depth / 50;

	const heading = (
		<SectionTitle
			size={DENSITY_HEADING[params.density]}
			accent={accent}
			night={isNight}
		>
			{topic.heading}
		</SectionTitle>
	);

	return (
		<div ref={ref} className="relative w-full flex flex-col items-center">
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
				<FrameShell
					className={`flex flex-col items-center text-center ${DENSITY_GAP[params.density]}`}
					heading={heading}
					contentClassName={`w-full ${DENSITY_MAXW[params.density]}`}
				>
					{children}
				</FrameShell>
			</div>
		</div>
	);
}
