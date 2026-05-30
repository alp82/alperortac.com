import type { InnerRenderProps } from "../types";
import { flourishSrc } from "../types";
import { DENSITY_MAXW } from "./shared";

/*
 * Inner: vinyl-liner — "record sleeve."
 *
 * A record sleeve spread is the frame: an album-art label with the flourish +
 * heading and a disc (motif) sliding out behind it form the accent, then the
 * topic's REAL body (the shared light plate) reads as the liner-notes body beside
 * it — dark sleeve chrome around the light content card. Signature motif
 * (params.motif) = the vinyl disc peeking out of the sleeve.
 */

export function VinylLinerCluster({
	topic,
	params,
	accent,
	children,
}: InnerRenderProps) {
	return (
		<div className={`w-full ${DENSITY_MAXW[params.density]}`}>
			<div className="vinyl relative flex items-stretch">
				{/* disc peeking from behind the sleeve */}
				{params.motif && (
					<div
						className="vinyl-disc"
						style={{ "--vinyl-accent": accent } as React.CSSProperties}
						aria-hidden="true"
					>
						<span className="vinyl-disc-label" style={{ background: accent }} />
					</div>
				)}
				{/* sleeve: album-art label + liner-notes body */}
				<div className="vinyl-sleeve relative z-10 flex-1 grid grid-cols-1 md:grid-cols-[auto_1fr] gap-5 p-5">
					<div className="md:w-44">
						<div
							className="vinyl-art relative flex items-center justify-center mb-3"
							style={{
								background: `radial-gradient(circle at 35% 30%, ${accent} 0%, #1a1a1a 95%)`,
							}}
						>
							<img
								src={flourishSrc(topic.id)}
								alt=""
								aria-hidden="true"
								className="w-20 h-20"
								style={{ imageRendering: "pixelated" }}
							/>
						</div>
						<h2 className="font-black uppercase tracking-tight text-2xl text-white leading-none drop-shadow-lg">
							{topic.heading}
						</h2>
						<div className="mt-1 font-mono text-[10px] uppercase tracking-[0.3em] text-slate-400">
							liner notes
						</div>
					</div>

					{/* light content card as the liner-notes body */}
					<div className="self-center">{children}</div>
				</div>
			</div>
		</div>
	);
}
