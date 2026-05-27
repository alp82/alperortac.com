import type { SectionRenderProps } from "../types";

/*
 * Section: horizon-band
 *
 * A horizon line crosses the viewport: a luminous "sky" treatment fills above
 * it and a darker "ground" gradient below, echoing the day→night world. The
 * cluster sits ON the horizon line, anchored by a thin accent rule. `align`
 * shifts the cluster along the band; `scrim` deepens the ground. ~90vh.
 */

const ALIGN_CLASS: Record<SectionRenderProps["params"]["align"], string> = {
	center: "items-center text-center",
	left: "items-start text-left",
	right: "items-end text-right",
	bottom: "items-center text-center",
};

export function HorizonBandStage({
	topic,
	isNight,
	params,
	accent,
	children,
}: SectionRenderProps) {
	const ground = params.scrim / 100;
	const sky = isNight
		? "linear-gradient(180deg, rgba(15,23,42,0.0) 0%, rgba(30,41,80,0.35) 100%)"
		: "linear-gradient(180deg, rgba(125,211,252,0.0) 0%, rgba(125,211,252,0.28) 100%)";

	return (
		<article
			id={`topic-${topic.id}`}
			className="cmp-stage relative flex flex-col justify-center px-6 md:px-12"
			style={
				{
					minHeight: `${params.height}vh`,
					"--cmp-accent": accent ?? "transparent",
				} as React.CSSProperties
			}
		>
			{/* sky half */}
			<div
				className="pointer-events-none absolute inset-x-0 top-0 h-1/2"
				style={{ background: sky }}
				aria-hidden="true"
			/>
			{/* ground half */}
			<div
				className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2"
				style={{
					background: `linear-gradient(180deg, rgba(8,11,18,${ground * 0.4}) 0%, rgba(8,11,18,${ground + 0.15}) 100%)`,
				}}
				aria-hidden="true"
			/>
			{/* horizon line */}
			<div
				className="pointer-events-none absolute inset-x-0 top-1/2 h-px"
				style={{
					background: accent
						? `linear-gradient(90deg, transparent, ${accent} 20%, ${accent} 80%, transparent)`
						: "linear-gradient(90deg, transparent, rgba(248,250,252,0.6) 50%, transparent)",
					boxShadow: accent ? `0 0 18px 1px ${accent}` : "none",
				}}
				aria-hidden="true"
			/>
			<div
				className={`relative z-10 w-full flex flex-col ${ALIGN_CLASS[params.align]}`}
			>
				{children}
			</div>
		</article>
	);
}
