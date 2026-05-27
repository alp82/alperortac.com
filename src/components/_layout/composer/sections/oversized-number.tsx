import type { SectionRenderProps } from "../types";

/*
 * Section: oversized-number
 *
 * A giant ghost index numeral (01–08, from index+1) fills the backdrop, bleeding
 * off an edge, accent-tinted. The cluster layers over it. `align` decides which
 * edge the numeral hugs and where the cluster sits opposite it; `scrim` darkens
 * behind the cluster for legibility. ~92vh.
 */

type Align = SectionRenderProps["params"]["align"];

const LAYOUT: Record<
	Align,
	{ cluster: string; numPos: React.CSSProperties; numAlign: string }
> = {
	left: {
		cluster: "items-start justify-center text-left",
		numPos: { right: "-4vw", top: "50%", transform: "translateY(-50%)" },
		numAlign: "justify-end",
	},
	right: {
		cluster: "items-end justify-center text-right",
		numPos: { left: "-4vw", top: "50%", transform: "translateY(-50%)" },
		numAlign: "justify-start",
	},
	center: {
		cluster: "items-center justify-center text-center",
		numPos: { left: "50%", top: "50%", transform: "translate(-50%,-50%)" },
		numAlign: "justify-center",
	},
	bottom: {
		cluster: "items-center justify-end text-center pb-[10vh]",
		numPos: { left: "50%", top: "-6vh", transform: "translateX(-50%)" },
		numAlign: "justify-center",
	},
};

export function OversizedNumberStage({
	topic,
	index,
	params,
	accent,
	children,
}: SectionRenderProps) {
	const scrim = params.scrim / 100;
	const layout = LAYOUT[params.align];
	const num = String(index + 1).padStart(2, "0");

	return (
		<article
			id={`topic-${topic.id}`}
			className={`cmp-stage relative flex flex-col px-6 md:px-12 ${layout.cluster}`}
			style={
				{
					minHeight: `${params.height}vh`,
					"--cmp-accent": accent ?? "transparent",
				} as React.CSSProperties
			}
		>
			{/* giant ghost numeral */}
			<div
				className={`pointer-events-none absolute inset-0 flex items-center ${layout.numAlign}`}
				aria-hidden="true"
			>
				<span
					className="cmp-bignum"
					style={{
						color: "transparent",
						WebkitTextStrokeColor: accent ?? "rgba(248,250,252,0.18)",
						...layout.numPos,
						position: "absolute",
					}}
				>
					{num}
				</span>
			</div>
			{/* scrim behind cluster */}
			<div
				className="pointer-events-none absolute inset-0"
				style={{
					background: `radial-gradient(ellipse 55% 50% at center, rgba(6,9,15,${scrim}) 0%, transparent 75%)`,
				}}
				aria-hidden="true"
			/>
			<div className="relative z-10 w-full max-w-2xl">{children}</div>
		</article>
	);
}
