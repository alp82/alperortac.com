import type { SectionRenderProps } from "../types";

/*
 * Section: framed-window
 *
 * The cluster is viewed through a thick matte window frame — a cabin window
 * onto the landscape. A heavy beveled border, deep inner shadow, and (motif via
 * scrim) optional cross mullions. The landscape shows through the glass; the
 * scrim tints the glass darker. `align` positions the cluster within the pane.
 * ~88vh.
 */

const ALIGN_CLASS: Record<SectionRenderProps["params"]["align"], string> = {
	center: "items-center justify-center text-center",
	left: "items-start justify-center text-left",
	right: "items-end justify-center text-right",
	bottom: "items-center justify-end text-center pb-8",
};

export function FramedWindowStage({
	topic,
	params,
	accent,
	children,
}: SectionRenderProps) {
	const glass = params.scrim / 100;
	return (
		<article
			id={`topic-${topic.id}`}
			className="cmp-stage relative flex items-center justify-center px-4 md:px-10 py-[7vh]"
			style={
				{
					minHeight: `${params.height}vh`,
					"--cmp-accent": accent ?? "transparent",
				} as React.CSSProperties
			}
		>
			<div
				className="cmp-window relative w-full max-w-4xl flex-1 flex"
				style={
					{
						"--cmp-glass": String(glass),
						borderColor: accent
							? `color-mix(in srgb, ${accent} 22%, #3a3024)`
							: "#3a3024",
					} as React.CSSProperties
				}
			>
				{/* tinted glass + landscape-through */}
				<div className="cmp-window-glass" aria-hidden="true" />
				{/* cross mullions */}
				<span className="cmp-window-mullion-v" aria-hidden="true" />
				<span className="cmp-window-mullion-h" aria-hidden="true" />
				{accent && (
					<span
						className="pointer-events-none absolute left-0 right-0 bottom-0 h-1.5 z-20"
						style={{ background: accent, opacity: 0.8 }}
						aria-hidden="true"
					/>
				)}
				<div
					className={`relative z-30 flex flex-col w-full p-6 md:p-12 ${ALIGN_CLASS[params.align]}`}
				>
					{children}
				</div>
			</div>
		</article>
	);
}
