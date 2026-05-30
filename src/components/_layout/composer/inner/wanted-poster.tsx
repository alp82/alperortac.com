import type { InnerRenderProps } from "../types";
import { flourishSrc } from "../types";
import { DENSITY_MAXW } from "./shared";

/*
 * Inner: wanted-poster — "aged bill board."
 *
 * An old-west WANTED bill on aged paper, widened to hold the content: a woodtype
 * "WANTED" banner + a "dead or alive" line + the flourish as a framed mugshot +
 * the heading as the outlaw's name form the chrome, with a heavy rule dividing it
 * from the topic's REAL body (the shared light plate) as the bill copy below, and
 * a reward number footer. Signature motif (params.motif) = the torn/aged paper
 * edges.
 */

export function WantedPosterCluster({
	topic,
	index,
	params,
	children,
}: InnerRenderProps) {
	return (
		<div className={`w-full ${DENSITY_MAXW[params.density]}`}>
			<div
				className={`wanted relative px-8 md:px-12 py-9 text-center ${params.motif ? "wanted-torn" : ""}`}
			>
				<div className="wanted-banner font-black uppercase text-4xl md:text-6xl leading-none tracking-tight">
					Wanted
				</div>
				<div className="wanted-rule" aria-hidden="true" />
				<div className="font-serif text-[11px] uppercase tracking-[0.35em] text-[#4a3013] mt-2 mb-5">
					dead or alive
				</div>

				{/* mugshot */}
				<div className="wanted-photo mx-auto mb-4 flex items-center justify-center">
					<img
						src={flourishSrc(topic.id)}
						alt=""
						aria-hidden="true"
						className="w-24 h-24 opacity-80"
						style={{ imageRendering: "pixelated", filter: "sepia(0.6)" }}
					/>
				</div>

				<h2 className="wanted-name font-black uppercase text-3xl md:text-4xl text-[#3a2410] leading-none">
					{topic.heading}
				</h2>

				<div className="wanted-rule mt-5 mb-6" aria-hidden="true" />

				<div className="text-left text-[#4a3013]">{children}</div>

				<div className="font-serif text-[10px] uppercase tracking-[0.3em] text-[#4a3013]/70 mt-6">
					reward no. {String(index + 1).padStart(3, "0")}
				</div>
			</div>
		</div>
	);
}
