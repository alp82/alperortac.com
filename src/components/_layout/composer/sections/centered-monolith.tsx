import { TOPICS } from "../../../../data/topics";
import type { SectionRenderProps } from "../types";

/*
 * Section: centered-monolith
 *
 * Title-card energy: the cluster floats dead-center over a radial vignette, the
 * landscape glowing through at the rim. ~100vh.
 *
 * Knobs — `vignette` deepens the radial scrim that pops the type; `edgeGlow`
 * dials the landscape light bleed at the rim (0 = edges off); `titleScale` sets
 * the cluster's presence; `indexTag` toggles the "NN / total" counter.
 */

const TITLE_SCALE: Record<
	SectionRenderProps<"centered-monolith">["params"]["titleScale"],
	number
> = {
	modest: 0.92,
	bold: 1,
	towering: 1.12,
};

export function CenteredMonolithStage({
	topic,
	index,
	params,
	accent,
	children,
}: SectionRenderProps<"centered-monolith">) {
	const scrim = params.vignette / 100;
	const glow = params.edgeGlow / 100;
	const rim = accent ?? "rgba(255,255,255,0.7)";
	return (
		<article
			id={`topic-${topic.id}`}
			className="cmp-stage relative flex flex-col items-center justify-center text-center px-6"
			style={
				{
					minHeight: `${params.height}vh`,
					"--cmp-accent": accent ?? "transparent",
				} as React.CSSProperties
			}
		>
			<div
				className="cmp-scrim-radial"
				style={{ "--cmp-scrim": String(scrim) } as React.CSSProperties}
				aria-hidden="true"
			/>
			{glow > 0 && (
				// Landscape light pooled at the rim — the inverse of the vignette.
				<div
					className="pointer-events-none absolute inset-0"
					style={{
						background: `radial-gradient(ellipse at center, transparent 55%, ${rim} 140%)`,
						opacity: glow * 0.5,
						mixBlendMode: "screen",
					}}
					aria-hidden="true"
				/>
			)}
			{accent && glow > 0 && (
				// Top accent rule, faded at both ends; rides with the edge glow.
				<div
					className="pointer-events-none absolute inset-x-0 top-0 h-[3px]"
					style={{
						background: `linear-gradient(90deg, transparent, ${accent} 25%, ${accent} 75%, transparent)`,
						opacity: 0.6 * glow,
					}}
					aria-hidden="true"
				/>
			)}
			<div
				className="relative z-10 w-full flex flex-col items-center"
				style={{ transform: `scale(${TITLE_SCALE[params.titleScale]})` }}
			>
				{params.indexTag && (
					<div
						className="mb-6 font-mono text-xs uppercase tracking-[0.5em]"
						style={{ color: accent ?? "rgba(255,255,255,0.6)" }}
					>
						{String(index + 1).padStart(2, "0")} /{" "}
						{String(TOPICS.length).padStart(2, "0")}
					</div>
				)}
				{children}
			</div>
		</article>
	);
}
