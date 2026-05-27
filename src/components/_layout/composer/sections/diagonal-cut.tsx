import type { SectionRenderProps } from "../types";

/*
 * Section: diagonal-cut
 *
 * The viewport is split by a bold diagonal: one wedge carries a dark scrim that
 * holds the cluster, the opposite wedge is left open so the landscape shows
 * through, divided by an angled accent edge. `align` picks which side the
 * cluster wedge lives on (left/right); center/bottom nudge the cluster within
 * its wedge. ~95vh.
 */

type Align = SectionRenderProps["params"]["align"];

// Cluster sits on the LEFT wedge unless align === right.
const PLACE: Record<Align, string> = {
	left: "items-center justify-start text-left",
	center: "items-center justify-center text-center",
	right: "items-center justify-end text-right",
	bottom: "items-end justify-center text-center pb-[12vh]",
};

export function DiagonalCutStage({
	topic,
	params,
	accent,
	children,
}: SectionRenderProps) {
	const right = params.align === "right";
	const scrim = params.scrim / 100;
	// Wedge polygon: a steep diagonal from one corner to the opposite edge.
	const wedge = right
		? "polygon(100% 0, 100% 100%, 32% 100%, 58% 0)"
		: "polygon(0 0, 42% 0, 68% 100%, 0 100%)";
	const accentEdge = right
		? "polygon(56% 0, 58.4% 0, 32.4% 100%, 30% 100%)"
		: "polygon(40% 0, 42.4% 0, 68.4% 100%, 66% 100%)";

	return (
		<article
			id={`topic-${topic.id}`}
			className="cmp-stage cmp-diagonal relative flex flex-col px-6 md:px-12"
			style={
				{
					minHeight: `${params.height}vh`,
					"--cmp-accent": accent ?? "transparent",
				} as React.CSSProperties
			}
		>
			{/* dark wedge backing the cluster */}
			<div
				className="pointer-events-none absolute inset-0"
				style={{
					clipPath: wedge,
					background: `linear-gradient(${right ? 235 : 125}deg, rgba(8,11,18,${scrim + 0.12}) 0%, rgba(8,11,18,${scrim * 0.5}) 100%)`,
				}}
				aria-hidden="true"
			/>
			{/* angled accent edge */}
			{accent && (
				<div
					className="pointer-events-none absolute inset-0"
					style={{ clipPath: accentEdge, background: accent, opacity: 0.9 }}
					aria-hidden="true"
				/>
			)}
			<div
				className={`relative z-10 flex flex-col w-full h-full min-h-[inherit] ${PLACE[params.align]}`}
			>
				<div className="w-full max-w-md py-[10vh]">{children}</div>
			</div>
		</article>
	);
}
