import type { SectionRenderProps } from "../types";

/*
 * Section: full-type
 *
 * The heading IS the stage: enormous viewport-filling type with the landscape
 * peeking through the letterforms (background-clip:text over the live frame).
 * The Layer-2 cluster is overlaid small in a corner. `align` picks the corner
 * the cluster anchors to; `scrim` darkens the field so the cut-out type pops.
 * The huge word is decorative — the real heading still lives in the cluster.
 * ~96vh.
 */

type Align = SectionRenderProps["params"]["align"];

const CORNER: Record<Align, string> = {
	left: "items-start justify-end text-left",
	right: "items-end justify-end text-right",
	center: "items-center justify-end text-center",
	bottom: "items-center justify-end text-center",
};

export function FullTypeStage({
	topic,
	params,
	accent,
	children,
}: SectionRenderProps) {
	const scrim = params.scrim / 100;
	return (
		<article
			id={`topic-${topic.id}`}
			className="cmp-stage relative flex flex-col px-6 md:px-10 py-[8vh] overflow-hidden"
			style={
				{
					minHeight: `${params.height}vh`,
					"--cmp-accent": accent ?? "transparent",
				} as React.CSSProperties
			}
		>
			{/* field scrim under the cut-out type */}
			<div
				className="pointer-events-none absolute inset-0"
				style={{ background: `rgba(6,9,15,${scrim})` }}
				aria-hidden="true"
			/>
			{/* viewport-filling cut-out heading: landscape shows through the glyphs */}
			<div className="cmp-fulltype-wrap" aria-hidden="true">
				<span
					className="cmp-fulltype-word"
					style={{
						WebkitTextStrokeColor: accent ?? "rgba(248,250,252,0.4)",
					}}
				>
					{topic.heading}
				</span>
			</div>
			<div
				className={`relative z-10 flex flex-col w-full h-full min-h-[inherit] ${CORNER[params.align]}`}
			>
				<div className="cmp-fulltype-card max-w-md">{children}</div>
			</div>
		</article>
	);
}
