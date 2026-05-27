import type { SectionRenderProps } from "../types";

/*
 * Section: edge-anchored
 *
 * The content cluster pins to a corner/edge while the landscape dominates the
 * rest of the frame. A soft directional gradient anchors the cluster's edge so
 * type stays legible; the open expanse lets the pixel world breathe. ~85vh.
 *
 * The `align` param chooses the corner (default: bottom-left).
 */

type Align = SectionRenderProps["params"]["align"];

// Where the cluster cluster sits + which edge the gradient hugs.
const ANCHOR: Record<Align, { box: string; grad: string }> = {
	left: {
		box: "items-start justify-center text-left",
		grad: "linear-gradient(90deg, var(--g) 0%, transparent 60%)",
	},
	right: {
		box: "items-end justify-center text-right",
		grad: "linear-gradient(270deg, var(--g) 0%, transparent 60%)",
	},
	center: {
		box: "items-center justify-end text-center",
		grad: "linear-gradient(0deg, var(--g) 0%, transparent 55%)",
	},
	bottom: {
		box: "items-start justify-end text-left",
		grad: "linear-gradient(35deg, var(--g) 0%, transparent 55%)",
	},
};

export function EdgeAnchoredStage({
	topic,
	params,
	accent,
	children,
}: SectionRenderProps) {
	const anchor = ANCHOR[params.align];
	const g = `rgba(8,11,18,${params.scrim / 100})`;
	return (
		<article
			id={`topic-${topic.id}`}
			className={`cmp-stage relative flex flex-col px-6 md:px-12 ${anchor.box}`}
			style={
				{
					minHeight: `${params.height}vh`,
					"--cmp-accent": accent ?? "transparent",
				} as React.CSSProperties
			}
		>
			<div
				className="pointer-events-none absolute inset-0"
				style={{ ["--g" as string]: g, background: anchor.grad }}
				aria-hidden="true"
			/>
			{accent && (
				<div
					className="pointer-events-none absolute bottom-0 left-0 h-1 w-1/3"
					style={{ background: accent, opacity: 0.8 }}
					aria-hidden="true"
				/>
			)}
			<div className="relative z-10 w-full max-w-3xl pb-[8vh]">{children}</div>
		</article>
	);
}
