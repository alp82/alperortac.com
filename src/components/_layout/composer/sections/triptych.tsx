import { flourishSrc } from "../types";
import type { SectionRenderProps } from "../types";

/*
 * Section: triptych
 *
 * Three vertical sub-panels with thin dividers, altarpiece-style: a ghost
 * flourish panel, the cluster in the wide central panel, and a slim accent
 * "leaf" panel. The cluster carries heading+teaser+triggers; the side panels
 * frame it. `align` sets the cluster's vertical seat in the central panel
 * (top/center/bottom; left+right both read as top-aligned). ~92vh.
 */

const VPLACE: Record<SectionRenderProps["params"]["align"], string> = {
	center: "items-center",
	left: "items-start",
	right: "items-start",
	bottom: "items-end",
};

export function TriptychStage({
	topic,
	params,
	accent,
	children,
}: SectionRenderProps) {
	const scrim = params.scrim / 100;
	const divider = accent
		? `color-mix(in srgb, ${accent} 50%, #1e293b)`
		: "rgba(248,250,252,0.25)";

	const Leaf = ({ side }: { side: "l" | "r" }) => (
		<div
			className="cmp-triptych-leaf relative hidden md:flex items-center justify-center"
			style={{
				background: `rgba(8,11,18,${scrim * 0.6})`,
				[side === "l" ? "borderRight" : "borderLeft"]: `1px solid ${divider}`,
			}}
			aria-hidden="true"
		>
			<img
				src={flourishSrc(topic.id)}
				alt=""
				className="w-1/2 max-w-[120px] opacity-[0.16]"
				style={{ imageRendering: "pixelated" }}
			/>
			{accent && (
				<span
					className="absolute top-1/2 -translate-y-1/2 w-1 h-1/3 rounded-full"
					style={{
						background: accent,
						opacity: 0.6,
						[side === "l" ? "left" : "right"]: "10px",
					}}
				/>
			)}
		</div>
	);

	return (
		<article
			id={`topic-${topic.id}`}
			className="cmp-stage cmp-triptych"
			style={
				{
					minHeight: `${params.height}vh`,
					"--cmp-accent": accent ?? "transparent",
				} as React.CSSProperties
			}
		>
			<Leaf side="l" />
			{/* central panel with the cluster */}
			<div
				className={`relative flex justify-center px-6 md:px-10 py-[8vh] ${VPLACE[params.align]}`}
				style={{ background: `rgba(8,11,18,${scrim})` }}
			>
				<div className="relative z-10 w-full max-w-2xl text-center">
					{children}
				</div>
			</div>
			<Leaf side="r" />
		</article>
	);
}
