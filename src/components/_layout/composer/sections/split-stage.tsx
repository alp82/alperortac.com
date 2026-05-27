import { flourishSrc } from "../types";
import type { SectionRenderProps } from "../types";

/*
 * Section: split-stage
 *
 * The viewport splits asymmetrically (~58/42): the cluster lives on one panel
 * over a soft scrim, the other panel is near-empty negative space where the
 * landscape shows through, anchored by an oversized ghost flourish. ~90vh.
 *
 * `align: right` flips the cluster to the right panel; `bottom` stacks the
 * cluster below the open panel for narrow viewports' natural fallback.
 */

export function SplitStageStage({
	topic,
	params,
	accent,
	children,
}: SectionRenderProps) {
	const clusterRight = params.align === "right";
	const scrim = params.scrim / 100;
	const panelGrad = clusterRight
		? `linear-gradient(270deg, rgba(8,11,18,${scrim}) 0%, rgba(8,11,18,${scrim * 0.4}) 55%, transparent 100%)`
		: `linear-gradient(90deg, rgba(8,11,18,${scrim}) 0%, rgba(8,11,18,${scrim * 0.4}) 55%, transparent 100%)`;

	return (
		<article
			id={`topic-${topic.id}`}
			className="cmp-stage cmp-split grid-cols-1 md:grid-cols-[1.35fr_1fr]"
			style={
				{
					minHeight: `${params.height}vh`,
					"--cmp-accent": accent ?? "transparent",
					direction: clusterRight ? "rtl" : "ltr",
				} as React.CSSProperties
			}
		>
			{/* cluster panel */}
			<div
				className="cmp-split-panel relative flex items-center px-6 md:px-14 py-[10vh]"
				style={{ background: panelGrad, direction: "ltr" }}
			>
				{accent && (
					<span
						className="absolute top-0 bottom-0 w-1.5"
						style={{
							background: accent,
							opacity: 0.85,
							[clusterRight ? "right" : "left"]: 0,
						}}
						aria-hidden="true"
					/>
				)}
				<div className="relative z-10 w-full">{children}</div>
			</div>

			{/* negative-space panel with a ghost flourish */}
			<div
				className="relative hidden md:flex items-center justify-center"
				style={{ direction: "ltr" }}
				aria-hidden="true"
			>
				<img
					src={flourishSrc(topic.id)}
					alt=""
					className="w-2/3 max-w-[260px] opacity-[0.13]"
					style={{ imageRendering: "pixelated" }}
				/>
			</div>
		</article>
	);
}
