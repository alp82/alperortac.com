import type { InnerRenderProps } from "../types";
import { DENSITY_MAXW } from "./shared";

/*
 * Inner: embossed-seal — "certificate sheet."
 *
 * A formal certificate/diploma sheet on parchment: gilt corner brackets frame a
 * CERTIFICATE-OF eyebrow + the serif certificate-title heading, then the topic's
 * REAL body (the shared light plate) seated as the certificate body, footed by a
 * wax-seal medallion + ribbon and a serial no. as chrome. Widened to hold the
 * plate; light parchment surface. Signature motif (params.motif) = the embossed
 * wax seal with its radiating notch + ribbon.
 */

export function EmbossedSealCluster({
	topic,
	index,
	params,
	accent,
	children,
}: InnerRenderProps) {
	return (
		<div className={`w-full ${DENSITY_MAXW[params.density]}`}>
			<div className="certificate relative px-8 md:px-12 py-10">
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

				<div className="text-center">
					<div className="font-serif text-[11px] uppercase tracking-[0.4em] text-slate-500 mb-4">
						certificate of
					</div>
					<h2 className="font-serif font-bold text-4xl md:text-5xl text-slate-900 leading-tight">
						{topic.heading}
					</h2>
				</div>

				{/* certificate body: the light content plate */}
				<div className="text-left">{children}</div>

				{/* wax seal + ribbon + serial, as footer chrome */}
				<div className="mt-8 flex items-center justify-between gap-4">
					<span className="font-serif text-[10px] uppercase tracking-[0.3em] text-slate-400">
						no. {String(index + 1).padStart(4, "0")}
					</span>
					{params.motif && (
						<div className="certificate-seal-wrap">
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
				</div>
			</div>
		</div>
	);
}
