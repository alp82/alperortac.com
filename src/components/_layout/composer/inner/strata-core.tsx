import type { InnerRenderProps } from "../types";
import { DENSITY_MAXW } from "./shared";

/*
 * Inner: strata-core — "core-sample panel."
 *
 * A vertical geological core sample is the frame: a striated earthy column with a
 * depth gauge (ties to the site's dig theme) forms a side accent rail, the heading
 * is embossed across the top, then the topic's REAL body (the shared light plate)
 * sits in the main panel beside the core — earthy chrome around the light content
 * card. Signature motif (params.motif) = the sediment striation overlay on the core.
 */

const LAYERS: readonly string[] = [
	"#6f4720",
	"#8a5a28",
	"#5c4a36",
	"#7a5b3a",
	"#4a3b2a",
	"#936a3a",
	"#63503b",
	"#806040",
];
const FALLBACK = LAYERS[0] as string;

export function StrataCoreCluster({
	topic,
	index,
	params,
	accent,
	children,
}: InnerRenderProps) {
	const top = LAYERS[index % LAYERS.length] ?? FALLBACK;
	const bottom = LAYERS[(index + 3) % LAYERS.length] ?? FALLBACK;
	const depth = (index + 1) * 1.4;

	return (
		<div className={`w-full ${DENSITY_MAXW[params.density]}`}>
			<div
				className="strata-core relative rounded-2xl p-5 md:p-7"
				style={
					{
						backgroundColor: "#2c241b",
						"--strata-fg": "#f5e9d8",
					} as React.CSSProperties
				}
			>
				<div className="grid grid-cols-[auto_1fr] gap-5 items-stretch">
					{/* core sample rail with depth gauge */}
					<div
						className={`relative w-12 md:w-16 rounded-md overflow-hidden ${params.motif ? "strata-band" : ""}`}
						style={{
							background: `linear-gradient(180deg, ${top}, ${bottom})`,
						}}
						aria-hidden="true"
					>
						<span
							className="absolute inset-x-0 top-0 h-1"
							style={{ background: accent, opacity: 0.7 }}
						/>
						<span className="absolute bottom-2 left-1/2 -translate-x-1/2 font-mono text-[9px] uppercase tracking-[0.2em] text-white/80 [writing-mode:vertical-rl]">
							{depth.toFixed(1)}m
						</span>
					</div>

					{/* main panel: heading chrome + light content card */}
					<div>
						<div className="flex items-center gap-3 mb-3">
							<span className="font-mono text-[11px] uppercase tracking-[0.3em] text-amber-100/70">
								core sample
							</span>
							<span
								className="h-px flex-1"
								style={{
									background: `repeating-linear-gradient(90deg, ${accent} 0 4px, transparent 4px 10px)`,
									opacity: 0.5,
								}}
								aria-hidden="true"
							/>
						</div>
						<h2 className="strata-emboss text-3xl md:text-5xl font-black uppercase tracking-tighter mb-5">
							{topic.heading}
						</h2>
						<div>{children}</div>
					</div>
				</div>
			</div>
		</div>
	);
}
