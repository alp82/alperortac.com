import { ArrowRight } from "lucide-react";
import type { InnerRenderProps } from "../types";
import { useTriggerNav } from "../useTriggerNav";
import { DENSITY_MAXW } from "./shared";

/*
 * Inner: strata-core
 *
 * Centered recast of strata-dig: instead of a full-width band, the cluster is a
 * vertical CORE SAMPLE — a rounded earthy column with a depth gauge, an embossed
 * heading, and fossil triggers set into it. Ties to the dig mechanic. Signature
 * motif = the sediment striation overlay on the core.
 */

const LAYERS: readonly { bg: string; fg: string }[] = [
	{ bg: "#6f4720", fg: "#f5e9d8" },
	{ bg: "#8a5a28", fg: "#fdf3e2" },
	{ bg: "#5c4a36", fg: "#ece3d4" },
	{ bg: "#7a5b3a", fg: "#f7eede" },
	{ bg: "#4a3b2a", fg: "#e8ddcb" },
	{ bg: "#936a3a", fg: "#fdf6ea" },
	{ bg: "#63503b", fg: "#efe6d6" },
	{ bg: "#806040", fg: "#f9f0e2" },
];
const FALLBACK = LAYERS[0] as { bg: string; fg: string };

export function StrataCoreCluster({
	topic,
	index,
	lastTriggerRef,
	params,
	accent,
}: InnerRenderProps) {
	const { resolveTrigger } = useTriggerNav(lastTriggerRef);
	const layer = LAYERS[index % LAYERS.length] ?? FALLBACK;
	const depth = (index + 1) * 1.4;

	return (
		<div
			className={`strata-core relative w-full px-6 md:px-10 py-10 rounded-2xl ${params.motif ? "strata-band" : ""} ${DENSITY_MAXW[params.density]}`}
			style={
				{
					"--strata-fg": layer.fg,
					backgroundColor: layer.bg,
					color: layer.fg,
				} as React.CSSProperties
			}
		>
			<div className="flex items-center justify-between gap-4 mb-3">
				<span className="font-mono text-[11px] uppercase tracking-[0.3em] opacity-70">
					depth {depth.toFixed(1)}m
				</span>
				<span
					className="h-2 flex-1 mx-4"
					style={{
						background: `repeating-linear-gradient(90deg, ${accent} 0 4px, transparent 4px 10px)`,
						opacity: 0.5,
					}}
					aria-hidden="true"
				/>
			</div>
			<h2 className="strata-emboss text-4xl md:text-7xl font-black uppercase tracking-tighter text-center">
				{topic.heading}
			</h2>
			<p className="mt-3 mx-auto max-w-xl text-base md:text-lg font-medium leading-relaxed opacity-90 text-center">
				{topic.teaser}
			</p>

			<div className="flex flex-wrap justify-center gap-4 mt-7">
				{topic.triggers.map((trigger) => {
					const resolved = resolveTrigger(trigger, topic.teaser);
					if (!resolved) return null;
					const { Icon } = resolved;
					return (
						<button
							key={resolved.key}
							type="button"
							onClick={(e) => resolved.navigate(e.currentTarget)}
							className="fossil group inline-flex items-center gap-3 pl-3 pr-5 py-3 text-left hover:-translate-y-0.5 transition-transform"
						>
							<span
								className="fossil-core flex items-center justify-center w-10 h-10 shrink-0"
								style={{ background: accent }}
							>
								<Icon size={18} className="text-[#3a2410]" />
							</span>
							<span className="flex flex-col">
								<span className="font-black uppercase tracking-tight text-base leading-none">
									{resolved.title}
								</span>
								<span className="mt-1 inline-flex items-center gap-1 text-[11px] font-mono uppercase tracking-wider opacity-70">
									excavate
									<ArrowRight
										size={12}
										className="group-hover:translate-x-1 transition-transform"
									/>
								</span>
							</span>
						</button>
					);
				})}
			</div>
		</div>
	);
}
