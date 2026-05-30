import type { InnerRenderProps } from "../types";
import { flourishSrc } from "../types";
import { DENSITY_MAXW } from "./shared";

/*
 * Inner: pressed-specimen — "herbarium sheet."
 *
 * A herbarium mounting sheet is the frame: the topic flourish presented as a
 * pressed specimen held by photo-corner mounts (motif) + a typed specimen label
 * form the chrome, then the topic's REAL body (the shared light plate) sits as the
 * specimen-sheet body below. Nature blend. Signature motif (params.motif) = the
 * diagonal mounting corners.
 */

export function PressedSpecimenCluster({
	topic,
	index,
	params,
	accent,
	children,
}: InnerRenderProps) {
	return (
		<div className={`w-full ${DENSITY_MAXW[params.density]}`}>
			<div className="herbarium relative px-7 md:px-9 py-8">
				<div className="grid grid-cols-1 md:grid-cols-[auto_1fr] gap-6 items-end mb-6">
					{/* mounted specimen */}
					<div className="herbarium-mount relative flex items-center justify-center min-h-[150px] md:w-44 p-4">
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
							className="w-24 h-24 opacity-80"
							style={{ imageRendering: "pixelated", filter: "sepia(0.3)" }}
						/>
					</div>

					{/* specimen label */}
					<div className="herbarium-label relative px-5 py-4 text-left">
						<div
							className="font-mono text-[10px] uppercase tracking-[0.25em] mb-2 pb-1 border-b"
							style={{ borderColor: accent, color: "#5c4a36" }}
						>
							specimen no. {String(index + 1).padStart(3, "0")}
						</div>
						<h2 className="font-serif font-semibold text-2xl md:text-3xl text-[#3a2c1a] leading-tight italic">
							{topic.heading}
						</h2>
					</div>
				</div>

				{/* specimen-sheet body */}
				<div>{children}</div>
			</div>
		</div>
	);
}
