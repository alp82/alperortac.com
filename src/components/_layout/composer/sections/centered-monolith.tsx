import type { SectionRenderProps } from "../types";

/*
 * Section: centered-monolith
 *
 * Today's cinematic seed: the cluster floats dead-center over a radial dark
 * scrim, the landscape glowing through at the edges. Title-card energy, one big
 * immersive beat per topic. ~100vh base.
 */

const ALIGN_CLASS: Record<SectionRenderProps["params"]["align"], string> = {
	center: "items-center justify-center text-center",
	left: "items-start justify-center text-left",
	right: "items-end justify-center text-right",
	bottom: "items-center justify-end text-center pb-[12vh]",
};

export function CenteredMonolithStage({
	topic,
	index,
	params,
	accent,
	children,
}: SectionRenderProps) {
	const scrim = params.scrim / 100;
	return (
		<article
			id={`topic-${topic.id}`}
			className={`cmp-stage relative flex flex-col px-6 ${ALIGN_CLASS[params.align]}`}
			style={
				{
					minHeight: `${params.height}vh`,
					"--cmp-accent": accent ?? "transparent",
				} as React.CSSProperties
			}
		>
			<div
				className="cmp-scrim-radial"
				style={{ "--cmp-scrim": String(scrim) } as React.CSSProperties}
				aria-hidden="true"
			/>
			{accent && (
				// Top accent glow — faded at both ends (not a full-bleed hard rule)
				// so it never reads as a hard horizontal line chopping the seam.
				<div
					className="pointer-events-none absolute inset-x-0 top-0 h-[3px]"
					style={{
						background: `linear-gradient(90deg, transparent, ${accent} 25%, ${accent} 75%, transparent)`,
						opacity: 0.6,
					}}
					aria-hidden="true"
				/>
			)}
			<div className="relative z-10 w-full flex flex-col items-center">
				<div
					className="mb-6 font-mono text-xs uppercase tracking-[0.5em]"
					style={{ color: accent ?? "rgba(255,255,255,0.6)" }}
				>
					{String(index + 1).padStart(2, "0")} / 08
				</div>
				{children}
			</div>
		</article>
	);
}
