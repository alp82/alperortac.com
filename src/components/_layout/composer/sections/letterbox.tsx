import type { SectionRenderProps } from "../types";

/*
 * Section: letterbox
 *
 * Cinematic black bars top + bottom frame the topic like a title card. A faint
 * accent color-grade washes the live frame between the bars. Shorter, wider
 * beat — the cluster sits centered in the visible band. ~70vh.
 *
 * `scrim` drives bar thickness here (thicker bars = more cinematic crop); the
 * frame between stays clear so the landscape reads.
 */

const ALIGN_CLASS: Record<SectionRenderProps["params"]["align"], string> = {
	center: "items-center text-center",
	left: "items-start text-left",
	right: "items-end text-right",
	bottom: "items-center text-center",
};

export function LetterboxStage({
	topic,
	index,
	params,
	accent,
	children,
}: SectionRenderProps) {
	// scrim 0..80 → bar height 8%..22% of the stage.
	const bar = 8 + (params.scrim / 80) * 14;
	return (
		<article
			id={`topic-${topic.id}`}
			className="cmp-stage cmp-letterbox relative flex flex-col justify-center px-6 md:px-12"
			style={
				{
					minHeight: `${params.height}vh`,
					"--cmp-bar": `${bar}%`,
					"--cmp-accent": accent ?? "transparent",
				} as React.CSSProperties
			}
		>
			{accent && (
				<div
					className="cmp-letterbox-grade"
					style={{
						background: `linear-gradient(115deg, ${accent} 0%, transparent 55%)`,
					}}
					aria-hidden="true"
				/>
			)}
			<div
				className={`relative z-10 w-full flex flex-col ${ALIGN_CLASS[params.align]}`}
			>
				<div
					className="mb-5 font-mono text-[11px] uppercase tracking-[0.55em]"
					style={{ color: accent ?? "rgba(255,255,255,0.65)" }}
				>
					reel {String(index + 1).padStart(2, "0")}
				</div>
				{children}
			</div>
		</article>
	);
}
