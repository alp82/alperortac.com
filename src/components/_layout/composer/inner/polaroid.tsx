import { flourishSrc } from "../types";
import type { InnerRenderProps } from "../types";
import { useTriggerNav } from "../useTriggerNav";

/*
 * Inner: polaroid
 *
 * Centered recast of the scrapbook: a hero polaroid (accent photo zone +
 * flourish, handwritten caption) sits beside sticky-note triggers held by washi
 * tape, all clustered at the stage center. Playful collage. Signature motif =
 * the washi tape strips on the notes.
 */

const CARD_TILT = [-3, 2.5, -1.5, 3];
const NOTE_TILT = [4, -3, 2, -4];

export function PolaroidCluster({
	topic,
	index,
	lastTriggerRef,
	params,
	accent,
}: InnerRenderProps) {
	const { resolveTrigger } = useTriggerNav(lastTriggerRef);

	return (
		<div className="relative w-full max-w-3xl flex flex-wrap items-start justify-center gap-8 md:gap-12">
			<div
				className="polaroid relative w-72 shrink-0"
				style={{
					transform: `rotate(${CARD_TILT[index % CARD_TILT.length]}deg)`,
				}}
			>
				<span className="polaroid-tape" aria-hidden="true" />
				<div
					className="polaroid-photo flex items-center justify-center"
					style={{ background: accent }}
				>
					<img
						src={flourishSrc(topic.id)}
						alt=""
						aria-hidden="true"
						className="w-20 h-20"
						style={{ imageRendering: "pixelated" }}
					/>
				</div>
				<h2 className="font-black uppercase tracking-tight text-2xl text-slate-900 mt-3 text-center">
					{topic.heading}
				</h2>
				<p className="scrapbook-hand text-center text-[#3a2410] text-lg leading-snug mt-1 px-2 pb-1">
					{topic.teaser}
				</p>
			</div>

			<div className="flex flex-col gap-6 pt-6">
				{topic.triggers.map((trigger, ti) => {
					const resolved = resolveTrigger(trigger, topic.teaser);
					if (!resolved) return null;
					return (
						<button
							key={resolved.key}
							type="button"
							onClick={(e) => resolved.navigate(e.currentTarget)}
							className="sticky-note group relative w-48 px-4 py-5 text-left hover:-translate-y-1 transition-transform"
							style={{
								transform: `rotate(${NOTE_TILT[(index + ti) % NOTE_TILT.length]}deg)`,
							}}
						>
							{params.motif && (
								<span className="washi-tape" aria-hidden="true" />
							)}
							<span className="scrapbook-hand block text-xl text-slate-900 leading-tight">
								{resolved.title}
							</span>
							<span className="scrapbook-hand block mt-2 text-sm text-slate-700 group-hover:underline">
								open →
							</span>
						</button>
					);
				})}
			</div>
		</div>
	);
}
