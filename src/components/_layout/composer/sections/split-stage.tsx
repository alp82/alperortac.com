import { flourishSrc } from "../types";
import type { SectionRenderProps } from "../types";

/*
 * Section: split-stage
 *
 * The viewport splits asymmetrically: the cluster lives on one panel over a
 * soft shade, the other is near-empty negative space where the landscape shows
 * through behind an oversized ghost flourish. Great for small content. ~90vh.
 *
 * Knobs — `ratio` is the content panel's share of width; `side` flips which
 * panel holds the cluster; `flourish` sets the ghost's strength; `spine`
 * toggles the accent edge bar. The panel shade is fixed.
 */

const SHADE = 0.5;

export function SplitStageStage({
	topic,
	params,
	accent,
	children,
}: SectionRenderProps<"split-stage">) {
	const right = params.side === "right";
	const content = `${params.ratio}fr`;
	const open = `${100 - params.ratio}fr`;
	const panelGrad = right
		? `linear-gradient(270deg, rgba(8,11,18,${SHADE}) 0%, rgba(8,11,18,${SHADE * 0.4}) 55%, transparent 100%)`
		: `linear-gradient(90deg, rgba(8,11,18,${SHADE}) 0%, rgba(8,11,18,${SHADE * 0.4}) 55%, transparent 100%)`;

	const clusterPanel = (
		<div
			key="cluster"
			className="cmp-split-panel relative flex items-center px-6 md:px-14 py-[10vh]"
			style={{ background: panelGrad }}
		>
			{params.spine && accent && (
				<span
					className="absolute top-0 bottom-0 w-1.5"
					style={{
						background: accent,
						opacity: 0.85,
						[right ? "right" : "left"]: 0,
					}}
					aria-hidden="true"
				/>
			)}
			<div className="relative z-10 w-full">{children}</div>
		</div>
	);

	const openPanel = (
		<div
			key="open"
			className="relative hidden md:flex items-center justify-center"
			aria-hidden="true"
		>
			<img
				src={flourishSrc(topic.id)}
				alt=""
				className="w-2/3 max-w-[260px]"
				style={{ opacity: params.flourish / 100, imageRendering: "pixelated" }}
			/>
		</div>
	);

	return (
		<article
			id={topic.id}
			className="cmp-stage cmp-split"
			style={
				{
					minHeight: `${params.height}vh`,
					"--cmp-accent": accent ?? "transparent",
					"--cmp-split-cols": right
						? `${open} ${content}`
						: `${content} ${open}`,
				} as React.CSSProperties
			}
		>
			{right ? [openPanel, clusterPanel] : [clusterPanel, openPanel]}
		</article>
	);
}
