import { useEffect, useRef, useState } from "react";
import type { SectionRenderProps } from "../types";

/*
 * Section: curtain-reveal
 *
 * Theatrical: two scrim "curtains" part from the center as the stage scrolls
 * into view, revealing the cluster behind them. Reduced-motion safe — under
 * prefers-reduced-motion the curtains start fully parted (no motion). The
 * curtain darkness is driven by `scrim`; `align` positions the revealed
 * cluster. ~92vh.
 */

const ALIGN_CLASS: Record<SectionRenderProps["params"]["align"], string> = {
	center: "items-center justify-center text-center",
	left: "items-start justify-center text-left",
	right: "items-end justify-center text-right",
	bottom: "items-center justify-end text-center pb-[12vh]",
};

export function CurtainRevealStage({
	topic,
	params,
	accent,
	children,
}: SectionRenderProps) {
	const ref = useRef<HTMLElement>(null);
	const [open, setOpen] = useState(false);

	useEffect(() => {
		if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
			setOpen(true);
			return;
		}
		const el = ref.current;
		if (!el) return;
		const io = new IntersectionObserver(
			(entries) => {
				for (const e of entries) if (e.isIntersecting) setOpen(true);
			},
			{ threshold: 0.4 },
		);
		io.observe(el);
		return () => io.disconnect();
	}, []);

	const scrim = params.scrim / 100;
	const curtain = `linear-gradient(180deg, rgba(6,9,15,${scrim + 0.35}) 0%, rgba(6,9,15,${scrim + 0.2}) 100%)`;

	return (
		<article
			ref={ref}
			id={`topic-${topic.id}`}
			className={`cmp-stage relative flex flex-col px-6 ${ALIGN_CLASS[params.align]}`}
			style={
				{
					minHeight: `${params.height}vh`,
					"--cmp-accent": accent ?? "transparent",
				} as React.CSSProperties
			}
		>
			{/* left curtain */}
			<div
				className="cmp-curtain cmp-curtain-l"
				style={{
					background: curtain,
					transform: open ? "translateX(-101%)" : "translateX(0)",
					borderRight: accent ? `2px solid ${accent}` : "none",
				}}
				aria-hidden="true"
			/>
			{/* right curtain */}
			<div
				className="cmp-curtain cmp-curtain-r"
				style={{
					background: curtain,
					transform: open ? "translateX(101%)" : "translateX(0)",
					borderLeft: accent ? `2px solid ${accent}` : "none",
				}}
				aria-hidden="true"
			/>
			<div className="relative z-10 w-full flex flex-col items-center">
				{children}
			</div>
		</article>
	);
}
