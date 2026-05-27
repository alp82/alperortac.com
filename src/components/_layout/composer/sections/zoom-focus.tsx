import { useEffect, useRef, useState } from "react";
import { flourishSrc } from "../types";
import type { SectionRenderProps } from "../types";

/*
 * Section: zoom-focus
 *
 * A Ken Burns move: a large ghost flourish slowly scales in the backdrop while
 * the cluster scales from understated to dominant as the stage enters view.
 * Reduced-motion safe — under prefers-reduced-motion the observer resolves
 * immediately to the rested (full) scale and the backdrop CSS animation is
 * disabled. `scrim` sets the backdrop darkness; `align` positions the cluster.
 * ~95vh.
 */

const ALIGN_CLASS: Record<SectionRenderProps["params"]["align"], string> = {
	center: "items-center justify-center text-center",
	left: "items-start justify-center text-left",
	right: "items-end justify-center text-right",
	bottom: "items-center justify-end text-center pb-[12vh]",
};

export function ZoomFocusStage({
	topic,
	params,
	accent,
	children,
}: SectionRenderProps) {
	const ref = useRef<HTMLElement>(null);
	const [shown, setShown] = useState(false);

	useEffect(() => {
		if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
			setShown(true);
			return;
		}
		const el = ref.current;
		if (!el) return;
		const io = new IntersectionObserver(
			(entries) => {
				for (const e of entries) if (e.isIntersecting) setShown(true);
			},
			{ threshold: 0.35 },
		);
		io.observe(el);
		return () => io.disconnect();
	}, []);

	const scrim = params.scrim / 100;

	return (
		<article
			ref={ref}
			id={`topic-${topic.id}`}
			className={`cmp-stage cmp-zoom relative flex flex-col px-6 ${ALIGN_CLASS[params.align]}`}
			style={
				{
					minHeight: `${params.height}vh`,
					"--cmp-accent": accent ?? "transparent",
				} as React.CSSProperties
			}
		>
			{/* slow ken-burns ghost flourish */}
			<div className="cmp-zoom-bg" aria-hidden="true">
				<img
					src={flourishSrc(topic.id)}
					alt=""
					className="w-[60vmin] max-w-[460px] opacity-[0.12]"
					style={{ imageRendering: "pixelated" }}
				/>
			</div>
			<div
				className="pointer-events-none absolute inset-0"
				style={{
					background: `radial-gradient(ellipse at center, rgba(0,0,0,${scrim + 0.1}) 0%, transparent 70%)`,
				}}
				aria-hidden="true"
			/>
			<div
				className="relative z-10 w-full flex flex-col items-center"
				style={{
					transform: shown ? "scale(1)" : "scale(0.82)",
					opacity: shown ? 1 : 0.35,
					transition:
						"transform 900ms cubic-bezier(0.16,1,0.3,1), opacity 700ms ease-out",
				}}
			>
				{children}
			</div>
		</article>
	);
}
