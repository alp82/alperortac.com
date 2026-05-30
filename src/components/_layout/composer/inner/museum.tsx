import type { InnerRenderProps } from "../types";
import { clusterTextColor, DENSITY_MAXW } from "./shared";

/*
 * Inner: museum — "framed gallery placard."
 *
 * A thin museum frame + mat border surround the content. Restrained serif chrome:
 * an accent tick over the exhibit number, the heading as the exhibit title, a
 * hairline rule, then the topic's REAL body (the shared light plate) seated in
 * the mat below. Calm restraint against the loud landscape. Signature motif
 * (params.motif) = the thin double frame around the placard.
 */

export function MuseumCluster({
	topic,
	index,
	isNight,
	params,
	accent,
	children,
}: InnerRenderProps) {
	const textColor = clusterTextColor(params.color, isNight);
	const frameColor = isNight ? "rgba(248,250,252,0.6)" : "rgba(15,23,42,0.5)";

	return (
		<div
			className={`relative w-full px-8 md:px-12 py-12 ${DENSITY_MAXW[params.density]} ${params.motif ? "museum-frame" : ""}`}
			style={{ color: textColor, borderColor: frameColor }}
		>
			<div className="text-center">
				<span
					className="block mx-auto mb-6 h-1 w-12"
					style={{ background: accent }}
					aria-hidden="true"
				/>
				<div className="font-serif text-[11px] uppercase tracking-[0.4em] mb-4 opacity-60">
					Exhibit {String(index + 1).padStart(2, "0")}
				</div>
				<h2 className="font-serif text-4xl md:text-6xl font-semibold tracking-tight">
					{topic.heading}
				</h2>
				<span
					className="block mx-auto mt-5 h-px w-2/3 opacity-40"
					style={{ background: "currentColor" }}
					aria-hidden="true"
				/>
			</div>

			{/* mat border seating the content plate */}
			<div
				className="museum-plate mt-6 p-3 md:p-4 text-left"
				style={{ borderColor: frameColor }}
			>
				{children}
			</div>
		</div>
	);
}
