import { flourishSrc } from "../types";
import type { InnerRenderProps } from "../types";
import { useTriggerNav } from "../useTriggerNav";
import { DENSITY_MAXW } from "./shared";

/*
 * Inner: pressed-specimen
 *
 * A herbarium mounting sheet: the topic flourish presented as a pressed plant
 * held by photo-corner mounts (motif), a typed specimen label (heading +
 * teaser) bottom-right, and triggers as classification label rows. Nature
 * blend. Signature motif = the diagonal mounting corners.
 */

export function PressedSpecimenCluster({
	topic,
	index,
	lastTriggerRef,
	params,
	accent,
}: InnerRenderProps) {
	const { resolveTrigger } = useTriggerNav(lastTriggerRef);

	return (
		<div className={`w-full ${DENSITY_MAXW[params.density]}`}>
			<div className="herbarium relative px-7 md:px-9 py-8 grid grid-cols-1 md:grid-cols-[1.1fr_1fr] gap-6">
				{/* mounted specimen */}
				<div className="herbarium-mount relative flex items-center justify-center min-h-[180px]">
					{params.motif && (
						<>
							<span
								className="herbarium-corner herbarium-corner-tl"
								aria-hidden="true"
							/>
							<span
								className="herbarium-corner herbarium-corner-tr"
								aria-hidden="true"
							/>
							<span
								className="herbarium-corner herbarium-corner-bl"
								aria-hidden="true"
							/>
							<span
								className="herbarium-corner herbarium-corner-br"
								aria-hidden="true"
							/>
						</>
					)}
					<img
						src={flourishSrc(topic.id)}
						alt=""
						aria-hidden="true"
						className="w-28 h-28 opacity-80"
						style={{ imageRendering: "pixelated", filter: "sepia(0.3)" }}
					/>
				</div>

				{/* specimen label */}
				<div className="herbarium-label relative px-5 py-4 self-end text-left">
					<div
						className="font-mono text-[10px] uppercase tracking-[0.25em] mb-2 pb-1 border-b"
						style={{ borderColor: accent, color: "#5c4a36" }}
					>
						specimen no. {String(index + 1).padStart(3, "0")}
					</div>
					<h2 className="font-serif font-semibold text-2xl md:text-3xl text-[#3a2c1a] leading-tight italic">
						{topic.heading}
					</h2>
					<p className="font-serif text-xs text-[#5c4a36] leading-snug mt-2">
						{topic.teaser}
					</p>

					<div className="mt-4 flex flex-col gap-1.5">
						{topic.triggers.map((trigger) => {
							const resolved = resolveTrigger(trigger, topic.teaser);
							if (!resolved) return null;
							return (
								<button
									key={resolved.key}
									type="button"
									onClick={(e) => resolved.navigate(e.currentTarget)}
									className="herbarium-row group flex items-baseline gap-2 text-left"
								>
									<span
										className="font-mono text-[9px] uppercase tracking-wider shrink-0"
										style={{ color: accent ? "#5c4a36" : undefined }}
									>
										coll.
									</span>
									<span className="font-serif text-sm text-[#3a2c1a] group-hover:underline">
										{resolved.title}
									</span>
								</button>
							);
						})}
					</div>
				</div>
			</div>
		</div>
	);
}
