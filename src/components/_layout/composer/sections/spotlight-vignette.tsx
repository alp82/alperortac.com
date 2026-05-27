import type { SectionRenderProps } from "../types";

/*
 * Section: spotlight-vignette
 *
 * A radial spotlight holds the cluster in a pool of clear light while the
 * edges darken hard into the landscape — theatrical focus. The accent tints the
 * spotlight's rim. ~90vh.
 */

const ALIGN_CLASS: Record<SectionRenderProps["params"]["align"], string> = {
	center: "items-center justify-center text-center",
	left: "items-start justify-center text-left",
	right: "items-end justify-center text-right",
	bottom: "items-center justify-end text-center pb-[12vh]",
};

export function SpotlightVignetteStage({
	topic,
	params,
	accent,
	children,
}: SectionRenderProps) {
	return (
		<article
			id={`topic-${topic.id}`}
			className={`cmp-stage cmp-vignette relative flex flex-col px-6 ${ALIGN_CLASS[params.align]}`}
			style={
				{
					minHeight: `${params.height}vh`,
					"--cmp-scrim": String(params.scrim / 100),
					"--cmp-accent": accent ?? "transparent",
				} as React.CSSProperties
			}
		>
			{accent && (
				<div
					className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full"
					style={{
						width: "62vmin",
						height: "62vmin",
						boxShadow: `0 0 120px 40px ${accent}`,
						opacity: 0.18,
					}}
					aria-hidden="true"
				/>
			)}
			<div className="relative z-10 w-full flex flex-col items-center">
				{children}
			</div>
		</article>
	);
}
