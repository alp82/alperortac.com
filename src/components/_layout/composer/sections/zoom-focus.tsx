import { useEffect, useRef, useState } from "react";
import { flourishSrc } from "../types";
import type { SectionRenderProps, ZoomParams } from "../types";

/*
 * Section: zoom-focus
 *
 * A Ken Burns move: a ghost flourish slowly scales/pans in the backdrop while
 * the cluster scales from understated to dominant as the stage enters view.
 * ~95vh.
 *
 * Knobs — `enterZoom` is how far the cluster scales up on arrival (0 = none,
 * 45 = today); `speed` is the backdrop drift speed; `drift` is its pan
 * direction. Reduced-motion safe: the observer resolves immediately to the
 * rested scale and the backdrop animation is disabled in CSS.
 */

const DRIFT: Record<ZoomParams["drift"], string> = {
	in: "0 0",
	"up-left": "-2% -2%",
	"up-right": "2% -2%",
	down: "0 3%",
};

export function ZoomFocusStage({
	topic,
	params,
	accent,
	children,
}: SectionRenderProps<"zoom-focus">) {
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

	// enterZoom 0 = no zoom, 45 ≈ the original 0.82 start scale, 100 = dramatic.
	const startScale = 1 - (params.enterZoom / 100) * 0.4;
	// speed 0 = slow (30s), 50 ≈ original 18s, 100 = fast (8s).
	const durSec = 30 - (params.speed / 100) * 22;

	return (
		<article
			ref={ref}
			id={`topic-${topic.id}`}
			className="cmp-stage cmp-zoom relative flex flex-col items-center justify-center px-6"
			style={
				{
					minHeight: `${params.height}vh`,
					"--cmp-accent": accent ?? "transparent",
				} as React.CSSProperties
			}
		>
			<div
				className="cmp-zoom-bg"
				style={
					{
						"--cmp-kenburns-dur": `${durSec}s`,
						"--cmp-kenburns-to": DRIFT[params.drift],
					} as React.CSSProperties
				}
				aria-hidden="true"
			>
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
					background:
						"radial-gradient(ellipse at center, rgba(0,0,0,0.55) 0%, transparent 70%)",
				}}
				aria-hidden="true"
			/>
			<div
				className="relative z-10 w-full flex flex-col items-center"
				style={{
					transform: shown ? "scale(1)" : `scale(${startScale})`,
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
