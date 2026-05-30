import type { InnerRenderProps } from "../types";
import { flourishSrc } from "../types";
import { DENSITY_MAXW } from "./shared";

/*
 * Inner: stamp-postcard — "postcard."
 *
 * A divided vintage postcard: the picture side (flourish art) carries a
 * perforated postage stamp with a circular postmark ring stamped over its
 * corner as the accent half; the message side holds the GREETINGS-FROM chrome +
 * the heading above the topic's REAL body (the shared light plate) on the
 * address area. Widened so the message side holds the plate. Signature motif
 * (params.motif) = the postmark ring over the stamp.
 */

export function StampPostcardCluster({
	topic,
	params,
	accent,
	children,
}: InnerRenderProps) {
	return (
		<div className={`w-full ${DENSITY_MAXW[params.density]}`}>
			<div className="postcard relative grid grid-cols-1 md:grid-cols-[0.8fr_1.2fr]">
				{/* picture side + postage */}
				<div
					className="postcard-pic relative flex items-center justify-center min-h-[180px]"
					style={{
						background: `radial-gradient(circle at 50% 40%, ${accent} 0%, color-mix(in srgb, ${accent} 35%, #fdf6e9) 100%)`,
					}}
				>
					<img
						src={flourishSrc(topic.id)}
						alt=""
						aria-hidden="true"
						className="w-24 h-24"
						style={{ imageRendering: "pixelated" }}
					/>
					<div className="absolute top-4 right-4">
						<span
							className="postcard-stamp flex items-center justify-center"
							style={{ background: accent }}
						>
							<span className="font-mono text-[8px] uppercase text-slate-900/70 leading-tight text-center">
								post
								<br />
								card
							</span>
						</span>
						{params.motif && (
							<span className="postcard-postmark" aria-hidden="true">
								<span className="postcard-postmark-bars" />
							</span>
						)}
					</div>
				</div>

				{/* message side */}
				<div className="relative px-6 py-6 text-left">
					<div className="font-serif text-[11px] uppercase tracking-[0.3em] text-slate-500 mb-3">
						greetings from
					</div>
					<h2 className="font-serif font-bold text-3xl md:text-4xl text-slate-900 leading-tight">
						{topic.heading}
					</h2>

					<div className="mt-4">{children}</div>
				</div>
			</div>
		</div>
	);
}
