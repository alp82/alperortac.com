import { useEffect, useRef, useState } from "react";
import type { SectionRenderProps } from "../types";

/*
 * Section: stacked-cards
 *
 * The topic sits on a card atop a faux offset stack — two ghost cards peek out
 * behind it with layered shadows, like a deck. The top card scales in subtly as
 * the stage enters view (reduced-motion safe via IntersectionObserver gated on
 * the media query). `scrim` tints the card surface; `align` positions the
 * content inside the card. ~92vh.
 */

const ALIGN_CLASS: Record<SectionRenderProps["params"]["align"], string> = {
	center: "items-center text-center",
	left: "items-start text-left",
	right: "items-end text-right",
	bottom: "items-center text-center justify-end",
};

export function StackedCardsStage({
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
			{ threshold: 0.3 },
		);
		io.observe(el);
		return () => io.disconnect();
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
			<div className="relative w-full max-w-2xl">
				{/* faux offset stack behind */}
				<div className="cmp-deck-ghost cmp-deck-ghost-2" aria-hidden="true" />
				<div className="cmp-deck-ghost cmp-deck-ghost-1" aria-hidden="true" />
				{/* top card */}
				<div
					className={`cmp-deck-card relative flex flex-col ${ALIGN_CLASS[params.align]}`}
					style={
						{
							transform: shown ? "scale(1)" : "scale(0.94)",
							opacity: shown ? 1 : 0,
							"--cmp-card-surface": String(surface),
						} as React.CSSProperties
					}
				>
					{accent && (
						<span
							className="absolute top-0 left-0 right-0 h-1.5"
							style={{ background: accent }}
							aria-hidden="true"
						/>
					)}
					<div className="p-8 md:p-12 w-full">{children}</div>
				</div>
			</div>
		</article>
	);
}
