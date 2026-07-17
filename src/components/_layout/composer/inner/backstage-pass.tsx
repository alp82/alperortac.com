import type { InnerRenderProps } from "../types";
import { DENSITY_MAXW } from "./shared";

/*
 * Inner: backstage-pass - "all access."
 *
 * A tour laminate on a lanyard is the frame: an optional strap + clip dropping
 * in from the top edge, the laminate card with an "ALL ACCESS" band, the
 * heading as the tour name, a "CREW · AAA-001" credential row, a holo shine
 * sweep (static gradient - no motion), the topic's REAL body seated on the
 * laminate as the tour notes, and a barcode strip at the foot
 * (repeating-gradient theater). All chrome text is fixed and aria-hidden. The
 * laminate is deliberately NOT the travel ticket-stub's paper - plastic,
 * lanyard-hung, gig-flavored.
 * Signature toggle (params.lanyard) = the strap + clip; theming knob
 * (laminate) sets the card finish via the `.bsp-*` inline vars
 * (--bsp-shell / --bsp-band / --bsp-ink - the sbb --sbb-* convention).
 */

/** laminate → { shell, band, ink } - card surface, access band, band ink. */
const LAMINATES: Record<
	InnerRenderProps<"backstage-pass">["params"]["laminate"],
	{ shell: string; band: string; ink: string }
> = {
	holo: { shell: "#101322", band: "#22d3ee", ink: "#08222a" },
	onyx: { shell: "#131316", band: "#e4e4e7", ink: "#18181b" },
	crimson: { shell: "#1c0f14", band: "#f43f5e", ink: "#2a060f" },
};

export function BackstagePassCluster({
	topic,
	params,
	children,
}: InnerRenderProps<"backstage-pass">) {
	const l = LAMINATES[params.laminate];

	return (
		<div className={`w-full ${DENSITY_MAXW[params.density]}`}>
			<div
				className="bsp-wrap relative"
				style={
					{
						"--bsp-shell": l.shell,
						"--bsp-band": l.band,
						"--bsp-ink": l.ink,
					} as React.CSSProperties
				}
			>
				{/* lanyard strap + clip */}
				{params.lanyard && (
					<div
						className="bsp-lanyard relative flex flex-col items-center"
						aria-hidden="true"
					>
						<span className="bsp-strap" />
						<span className="bsp-clip" />
					</div>
				)}

				{/* the laminate */}
				<div className="bsp relative text-left">
					{/* access band */}
					<div
						className="bsp-band relative px-6 md:px-9 py-2 flex items-center justify-between text-[11px] font-black tracking-[0.3em]"
						aria-hidden="true"
					>
						<span>ALL ACCESS</span>
						<span>AAA</span>
					</div>

					{/* tour name + credential row */}
					<div className="relative px-6 md:px-9 pt-6">
						<h2 className="bsp-title font-bold text-3xl md:text-5xl leading-none tracking-tight uppercase">
							{topic.heading}
						</h2>
						<p
							className="bsp-cred mt-3 text-[11px] font-semibold tracking-[0.18em]"
							aria-hidden="true"
						>
							WORLD TOUR · CREW · AAA-001
						</p>
					</div>

					{/* the topic's REAL body - the tour notes on the laminate */}
					<div className="relative px-6 md:px-9 py-6">{children}</div>

					{/* barcode strip */}
					<div
						className="bsp-barcode relative mx-6 md:mx-9 mb-5"
						aria-hidden="true"
					/>
				</div>
			</div>
		</div>
	);
}
