import { useEffect, useRef, useState } from "react";
import type { SectionRenderProps } from "../types";

/*
 * Section: floating-island
 *
 * The cluster rests on a floating slab with a soft drop shadow, the landscape
 * visible all around it. The slab bobs gently as the stage scrolls through view
 * (reduced-motion safe: the scroll listener never attaches under
 * prefers-reduced-motion, so the slab sits still). `scrim` tints the slab;
 * `align` positions content on the slab. ~90vh.
 */

const ALIGN_CLASS: Record<SectionRenderProps["params"]["align"], string> = {
	center: "items-center text-center",
	left: "items-start text-left",
	right: "items-end text-right",
	bottom: "items-center text-center justify-end",
};

export function FloatingIslandStage({
	topic,
	params,
	accent,
	children,
}: SectionRenderProps) {
	const ref = useRef<HTMLElement>(null);
	const [bob, setBob] = useState(0);

	useEffect(() => {
		if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
		const el = ref.current;
		if (!el) return;
		let raf = 0;
		const onScroll = () => {
			if (raf) return;
			raf = requestAnimationFrame(() => {
				raf = 0;
				const rect = el.getBoundingClientRect();
				const rel =
					(rect.top + rect.height / 2 - window.innerHeight / 2) /
					window.innerHeight;
				setBob(rel * 24);
			});
		};
		onScroll();
		window.addEventListener("scroll", onScroll, { passive: true });
		window.addEventListener("resize", onScroll);
		return () => {
			window.removeEventListener("scroll", onScroll);
			window.removeEventListener("resize", onScroll);
			if (raf) cancelAnimationFrame(raf);
		};
	}, []);

	const surface = params.scrim / 100;

	return (
		<article
			ref={ref}
			id={`topic-${topic.id}`}
			className="cmp-stage relative flex items-center justify-center px-5 md:px-10 py-[9vh]"
			style={
				{
					minHeight: `${params.height}vh`,
					"--cmp-accent": accent ?? "transparent",
				} as React.CSSProperties
			}
		>
			<div
				className={`cmp-island relative w-full max-w-2xl flex flex-col ${ALIGN_CLASS[params.align]}`}
				style={
					{
						transform: `translate3d(0, ${bob}px, 0)`,
						"--cmp-island-surface": String(surface),
					} as React.CSSProperties
				}
			>
				{accent && (
					<span
						className="absolute -bottom-3 left-1/2 -translate-x-1/2 h-2 w-2/3 rounded-full blur-md"
						style={{ background: accent, opacity: 0.5 }}
						aria-hidden="true"
					/>
				)}
				<div className="relative p-8 md:p-12 w-full">{children}</div>
			</div>
		</article>
	);
}
