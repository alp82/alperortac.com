import { flourishSrc } from "../types";
import type { SectionRenderProps } from "../types";

/*
 * Section: peek-reveal
 *
 * The NEXT topic peeks in at the bottom: a teaser strip (the upcoming topic's
 * index + a ghost flourish) juts up from the lower edge with a rounded lip, so
 * consecutive stages feel like they overlap as you scroll. The main cluster
 * sits above the peek. Pure CSS — no scroll JS needed. `scrim` sets the main
 * backdrop; `align` positions the cluster. ~94vh.
 */

const ALIGN_CLASS: Record<SectionRenderProps["params"]["align"], string> = {
	center: "items-center justify-center text-center",
	left: "items-start justify-center text-left",
	right: "items-end justify-center text-right",
	bottom: "items-center justify-end text-center pb-[18vh]",
};

export function PeekRevealStage({
	topic,
	index,
	params,
	accent,
	children,
}: SectionRenderProps) {
	const scrim = params.scrim / 100;
	const nextNum = String(((index + 1) % 8) + 1).padStart(2, "0");

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
				className="pointer-events-none absolute inset-0"
				style={{
					background: `linear-gradient(180deg, rgba(8,11,18,${scrim + 0.1}) 0%, rgba(8,11,18,${scrim * 0.3}) 60%, transparent 100%)`,
				}}
				aria-hidden="true"
			/>
			<div className="relative z-10 w-full flex flex-col items-center pb-[14vh]">
				{children}
			</div>

			{/* next-topic peek strip jutting from the bottom */}
			<div className="cmp-peek" aria-hidden="true">
				<div
					className="cmp-peek-lip"
					style={{
						borderTopColor: accent ?? "rgba(248,250,252,0.45)",
					}}
				>
					<img
						src={flourishSrc(topic.id)}
						alt=""
						className="w-9 h-9 opacity-30"
						style={{ imageRendering: "pixelated" }}
					/>
					<span
						className="font-mono text-xs uppercase tracking-[0.4em]"
						style={{ color: accent ?? "rgba(248,250,252,0.6)" }}
					>
						next · {nextNum}
					</span>
				</div>
			</div>
		</article>
	);
}
