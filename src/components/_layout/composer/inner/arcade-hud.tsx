import type { InnerRenderProps } from "../types";
import { DENSITY_MAXW } from "./shared";

/*
 * Inner: arcade-hud - "HUD-framed panel."
 *
 * A retro game HUD is the frame: a pixel-edged panel with a SCORE readout, an HP
 * bar and a LEVEL tag as chrome, the heading as "STAGE: <name>" in chunky pixel
 * type, then the topic's REAL body (the shared light plate) seated in the
 * play-area panel - dark HUD chrome around the light content card, NOT
 * scanline-text content. Signature toggle (params.scanlines) = the CRT scanline
 * overlay; params.palette recolors the phosphor (chrome text + play-area border).
 */

/** palette → phosphor color for the HUD chrome text + play-area border. */
const PHOSPHOR: Record<
	InnerRenderProps<"arcade-hud">["params"]["palette"],
	string
> = {
	green: "#4ade80",
	amber: "#fbbf24",
	ice: "#38bdf8",
	magenta: "#f472b6",
};

export function ArcadeHudCluster({
	topic,
	index,
	params,
	accent,
	children,
}: InnerRenderProps<"arcade-hud">) {
	const score = String((index + 1) * 1337).padStart(6, "0");
	const phosphor = PHOSPHOR[params.palette];

	return (
		<div className={`w-full ${DENSITY_MAXW[params.density]}`}>
			<div
				className={`arcade relative px-6 md:px-9 py-8 text-left ${params.scanlines ? "arcade-scanlines" : ""}`}
				style={{ "--arcade-accent": accent } as React.CSSProperties}
			>
				{/* HUD top row */}
				<div className="relative z-10 flex items-center justify-between gap-4 mb-4 font-mono">
					<span
						className="text-[10px] uppercase tracking-[0.2em] text-emerald-300"
						style={{ color: phosphor }}
					>
						score{" "}
						<span className="text-emerald-100" style={{ color: phosphor }}>
							{score}
						</span>
					</span>
					<span
						className="flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-emerald-300"
						style={{ color: phosphor }}
					>
						hp
						<span className="arcade-hp" aria-hidden="true">
							<span
								className="arcade-hp-fill"
								style={{ width: `${70 - index * 6}%`, background: accent }}
							/>
						</span>
					</span>
				</div>

				<h2
					className="arcade-title relative z-10 font-black uppercase tracking-tight text-2xl md:text-4xl leading-none mb-5"
					style={{ color: phosphor }}
				>
					<span className="text-emerald-300/80" style={{ color: phosphor }}>
						stage:
					</span>{" "}
					{topic.heading}
				</h2>

				{/* play-area panel seating the content plate */}
				<div
					className="relative z-10 border-2 border-emerald-500/40 p-3 md:p-4"
					style={{ borderColor: phosphor }}
				>
					{children}
				</div>

				<div
					className="relative z-10 mt-4 font-mono text-[10px] uppercase tracking-[0.2em] text-emerald-300 text-right"
					style={{ color: phosphor }}
				>
					level {String(index + 1).padStart(2, "0")}
				</div>
			</div>
		</div>
	);
}
