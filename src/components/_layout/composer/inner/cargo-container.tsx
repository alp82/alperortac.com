import type { InnerRenderProps } from "../types";
import { DENSITY_MAXW } from "./shared";

/*
 * Inner: cargo-container - "shipping container."
 *
 * A container wall is the frame (the self-hosting metaphor: everything ships
 * in containers): a painted corrugated-steel panel (toggle) with four corner
 * castings, the heading stenciled on the wall beside a deterministic
 * ALPU registration number, a tiny MAX GROSS / TARE spec plate, and the
 * topic's REAL body seated on a light door placard riveted to the wall.
 * Signature toggle (params.corrugation) = the vertical corrugation ridges;
 * theming knob (livery) = the paint job (rust / ocean / forest), handed to
 * the `.cargo-*` classes as --cargo-paint / --cargo-stencil inline vars (the
 * timecard --tc-* convention). The placard stays fixed light paper so the
 * prose reads the same in every livery.
 */

/** livery → { paint, stencil } - wall paint + stencil ink. */
const LIVERIES: Record<
	InnerRenderProps<"cargo-container">["params"]["livery"],
	{ paint: string; stencil: string }
> = {
	rust: { paint: "#7d3021", stencil: "#f6ece1" },
	ocean: { paint: "#1d4361", stencil: "#e8f1f8" },
	forest: { paint: "#2c5237", stencil: "#eaf3e9" },
};

/* Fixed placard constants - the door paper never tracks the livery. */
const PLACARD_PAPER = "#f4f1e8";
const PLACARD_INK = "#1c1917";

/** Deterministic registration number - owner code ALPU (category U), a
 * serial spread by the band index, and a fake check digit. SSR-stable. */
function registration(index: number): string {
	const serial = String(820071 + index * 1111).slice(0, 6);
	return `ALPU ${serial} ${(index * 7) % 10}`;
}

const CORNERS = ["tl", "tr", "bl", "br"] as const;

export function CargoContainerCluster({
	topic,
	index,
	params,
	children,
}: InnerRenderProps<"cargo-container">) {
	const livery = LIVERIES[params.livery];

	return (
		<div className={`w-full ${DENSITY_MAXW[params.density]}`}>
			<div
				className={`cargo relative px-6 md:px-9 py-8 text-left ${params.corrugation ? "cargo--ridged" : ""}`}
				style={
					{
						"--cargo-paint": livery.paint,
						"--cargo-stencil": livery.stencil,
						backgroundColor: livery.paint,
					} as React.CSSProperties
				}
			>
				{/* corner castings - pure chrome */}
				{CORNERS.map((c) => (
					<span
						key={c}
						className={`cargo-casting cargo-casting--${c}`}
						aria-hidden="true"
					/>
				))}

				{/* stenciled wall markings: heading + registration + spec plate */}
				<div className="relative z-10 flex flex-wrap items-end justify-between gap-x-6 gap-y-4 mb-6">
					<div className="min-w-0">
						<h2 className="cargo-stencil font-mono font-black uppercase tracking-[0.08em] text-2xl md:text-4xl leading-none">
							{topic.heading}
						</h2>
						<span className="cargo-reg mt-2 inline-block font-mono text-sm md:text-base tracking-[0.22em]">
							{registration(index)}
						</span>
					</div>
					<span className="cargo-plate font-mono text-[9px] uppercase leading-relaxed whitespace-nowrap">
						max gross 30,480 kg
						<br />
						tare&ensp;&ensp;&ensp;&ensp;2,180 kg
					</span>
				</div>

				{/* the door placard seating the body - fixed light paper */}
				<div
					className="cargo-placard relative z-10 p-4 md:p-5"
					style={
						{
							"--cargo-placard-paper": PLACARD_PAPER,
							"--cargo-placard-ink": PLACARD_INK,
							backgroundColor: PLACARD_PAPER,
							color: PLACARD_INK,
						} as React.CSSProperties
					}
				>
					{children}
				</div>
			</div>
		</div>
	);
}
