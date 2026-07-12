import type { InnerRenderProps } from "../types";
import { DENSITY_HEADING, DENSITY_MAXW } from "./shared";

/*
 * Inner: moonrise (night)
 *
 * A calm late-night frame: a glowing moon with a soft halo sits high to one
 * side, a few stars scattered around it, dark sky behind. `phase` carves the
 * moon (full / gibbous / crescent) via an inset terminator shadow; the signature
 * toggle is the surrounding stars. Static - no motion needed.
 */

const SKY = "#0b1020";

/* phase → inset terminator offset (px). 0 = full disc. */
const TERMINATOR: Record<"full" | "gibbous" | "crescent", number> = {
	full: 0,
	gibbous: 9,
	crescent: 20,
};

const STARS: { x: number; y: number; r: number }[] = [
	{ x: 16, y: 30, r: 1 },
	{ x: 34, y: 16, r: 1.3 },
	{ x: 52, y: 26, r: 1 },
	{ x: 24, y: 50, r: 1 },
	{ x: 60, y: 46, r: 1.2 },
	{ x: 12, y: 66, r: 1 },
	{ x: 70, y: 64, r: 1 },
];

export function MoonriseCluster({
	topic,
	index,
	params,
	children,
}: InnerRenderProps<"moonrise">) {
	const inset = TERMINATOR[params.phase];
	const boxShadow =
		inset > 0
			? `0 0 34px 7px rgba(199,210,254,0.4), inset ${inset}px 0 0 1px ${SKY}`
			: "0 0 34px 7px rgba(199,210,254,0.4)";

	return (
		<div className={`relative w-full ${DENSITY_MAXW[params.density]}`}>
			{/* moon, high-right, behind content */}
			<div
				className="pointer-events-none absolute right-[6%] top-[2%]"
				aria-hidden="true"
			>
				<span
					className="cmp-moon block"
					style={{ width: "56px", height: "56px", boxShadow }}
				/>
			</div>

			{params.stars && (
				<div
					className="pointer-events-none absolute inset-0"
					aria-hidden="true"
				>
					{STARS.map((s) => (
						<span
							key={`m-${s.x}-${s.y}`}
							className="absolute rounded-full"
							style={{
								left: `${s.x}%`,
								top: `${s.y}%`,
								width: `${s.r}px`,
								height: `${s.r}px`,
								background: "#e2e8f0",
								opacity: 0.6,
							}}
						/>
					))}
				</div>
			)}

			<div className="relative z-10 flex flex-col items-center text-center gap-5">
				<div className="font-mono text-[11px] uppercase tracking-[0.35em] text-indigo-200">
					☾ moonrise {String(index + 1).padStart(2, "0")}
				</div>
				<h2
					className={`${DENSITY_HEADING[params.density]} font-black uppercase tracking-tighter text-white leading-[0.9] [text-shadow:0_2px_12px_rgba(0,0,0,0.5)]`}
				>
					{topic.heading}
				</h2>
				<div className="w-full text-left">{children}</div>
			</div>
		</div>
	);
}
