import type { InnerRenderProps } from "../types";
import { DENSITY_HEADING, DENSITY_MAXW } from "./shared";

/*
 * Inner: aurora (night)
 *
 * Deep-night frame: a blur-edged dark veil panel seats the cluster as a
 * visible container, and two soft, blurred northern-lights ribbons drift over
 * it (mix-blend screen) with an optional faint star scatter. A natural fit
 * once the journey is fully into the night sky.
 *
 * Signature toggle = the stars; `hue` recolors the curtains (+ eyebrow) -
 * `shift` cross-fades the curtains between the emerald and violet pairs.
 * Motion is gentle and disabled under prefers-reduced-motion (see
 * composer.css).
 */

const HUE: Record<"emerald" | "violet" | "teal", [string, string]> = {
	emerald: ["#34d399", "#22d3ee"],
	violet: ["#a78bfa", "#f472b6"],
	teal: ["#2dd4bf", "#38bdf8"],
};

const STARS: { x: number; y: number; r: number }[] = [
	{ x: 12, y: 16, r: 1 },
	{ x: 28, y: 10, r: 1.3 },
	{ x: 46, y: 20, r: 1 },
	{ x: 64, y: 12, r: 1 },
	{ x: 80, y: 22, r: 1.3 },
	{ x: 90, y: 14, r: 1 },
	{ x: 20, y: 34, r: 1 },
	{ x: 72, y: 36, r: 1 },
];

export function AuroraCluster({
	topic,
	index,
	params,
	children,
}: InnerRenderProps<"aurora">) {
	const shift = params.hue === "shift";
	const [a, b] = HUE[params.hue === "shift" ? "emerald" : params.hue];
	const [a2, b2] = HUE.violet;

	return (
		<div className={`relative w-full ${DENSITY_MAXW[params.density]}`}>
			{/* veil panel - blur-edged dark slab so the frame reads as a container */}
			<div
				className="cmp-aurora-panel pointer-events-none absolute -inset-x-6 -inset-y-8"
				aria-hidden="true"
			/>

			{/* aurora curtains - blurred, over the veil, behind content */}
			<div
				className={`cmp-aurora pointer-events-none absolute${shift ? " cmp-aurora-shift" : ""}`}
				style={
					{
						"--aur-a": a,
						"--aur-b": b,
						"--aur-a2": a2,
						"--aur-b2": b2,
					} as React.CSSProperties
				}
				aria-hidden="true"
			>
				<span className="cmp-aurora-band cmp-aurora-band-1" />
				<span className="cmp-aurora-band cmp-aurora-band-2" />
			</div>

			{params.stars && (
				<div
					className="pointer-events-none absolute inset-0"
					aria-hidden="true"
				>
					{STARS.map((s) => (
						<span
							key={`s-${s.x}-${s.y}`}
							className="absolute rounded-full"
							style={{
								left: `${s.x}%`,
								top: `${s.y}%`,
								width: `${s.r}px`,
								height: `${s.r}px`,
								background: "#f8fafc",
								opacity: 0.65,
							}}
						/>
					))}
				</div>
			)}

			<div className="relative z-10 flex flex-col items-center text-center gap-5">
				<div
					className={`font-mono text-[11px] uppercase tracking-[0.35em]${shift ? " cmp-aurora-eyebrow-shift" : ""}`}
					style={shift ? undefined : { color: a }}
				>
					◇ aurora {String(index + 1).padStart(2, "0")}
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
