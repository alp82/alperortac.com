import type { InnerRenderProps } from "../types";
import { useTriggerNav } from "../useTriggerNav";
import { DENSITY_MAXW } from "./shared";

/*
 * Inner: embossed-seal
 *
 * A formal certificate: a foil medallion / wax seal (motif) beside the heading,
 * restrained serif type, a ribbon banner, and triggers as bordered seal
 * buttons. Signature motif = the embossed wax seal with its radiating notches.
 */

export function EmbossedSealCluster({
	topic,
	index,
	lastTriggerRef,
	params,
	accent,
}: InnerRenderProps) {
	const { resolveTrigger } = useTriggerNav(lastTriggerRef);

	return (
		<div className={`w-full ${DENSITY_MAXW[params.density]}`}>
			<div className="certificate relative px-9 md:px-14 py-11 text-center">
				<span
					className="certificate-corner certificate-corner-tl"
					aria-hidden="true"
				/>
				<span
					className="certificate-corner certificate-corner-tr"
					aria-hidden="true"
				/>
				<span
					className="certificate-corner certificate-corner-bl"
					aria-hidden="true"
				/>
				<span
					className="certificate-corner certificate-corner-br"
					aria-hidden="true"
				/>

				<div className="font-serif text-[11px] uppercase tracking-[0.4em] text-slate-500 mb-4">
					certificate of
				</div>
				<h2 className="font-serif font-bold text-4xl md:text-5xl text-slate-900 leading-tight">
					{topic.heading}
				</h2>

				{/* wax seal / medallion */}
				{params.motif && (
					<div className="certificate-seal-wrap my-5">
						<span
							className="certificate-seal"
							style={{ "--seal-accent": accent } as React.CSSProperties}
						>
							<span className="certificate-seal-star">★</span>
						</span>
						<span
							className="certificate-ribbon"
							style={{ background: accent }}
						/>
					</div>
				)}

				<p className="font-serif italic text-base md:text-lg text-slate-600 leading-relaxed mx-auto max-w-md">
					{topic.teaser}
				</p>

				<div className="flex flex-wrap items-center justify-center gap-3 mt-7">
					{topic.triggers.map((trigger) => {
						const resolved = resolveTrigger(trigger, topic.teaser);
						if (!resolved) return null;
						return (
							<button
								key={resolved.key}
								type="button"
								onClick={(e) => resolved.navigate(e.currentTarget)}
								className="certificate-btn group inline-flex items-center gap-2 px-6 py-2.5 font-serif text-sm tracking-wide"
								style={{ borderColor: accent }}
							>
								{resolved.title}
							</button>
						);
					})}
				</div>

				<div className="font-serif text-[10px] uppercase tracking-[0.3em] text-slate-400 mt-6">
					no. {String(index + 1).padStart(4, "0")}
				</div>
			</div>
		</div>
	);
}
