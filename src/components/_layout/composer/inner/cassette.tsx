import type { InnerRenderProps } from "../types";
import { useTriggerNav } from "../useTriggerNav";
import { DENSITY_MAXW } from "./shared";

/*
 * Inner: cassette
 *
 * A cassette tape label: a j-card body with two spinning reels (motif) up top,
 * the heading hand-lettered on the label strip, the teaser as a felt-tip note,
 * and triggers split across A/B sides. Signature motif = the two tape reels
 * (rotation disabled under reduced motion via CSS).
 */

export function CassetteCluster({
	topic,
	lastTriggerRef,
	params,
	accent,
}: InnerRenderProps) {
	const { resolveTrigger } = useTriggerNav(lastTriggerRef);
	const items = topic.triggers
		.map((t) => resolveTrigger(t, topic.teaser))
		.filter((r): r is NonNullable<typeof r> => r !== null);

	return (
		<div className={`w-full ${DENSITY_MAXW[params.density]}`}>
			<div
				className="cassette relative px-6 py-6"
				style={{ "--cassette-accent": accent } as React.CSSProperties}
			>
				{/* window with two reels */}
				<div className="cassette-window relative flex items-center justify-around px-6 py-4 mb-4">
					<span
						className={`cassette-reel ${params.motif ? "cassette-reel-spin" : ""}`}
						aria-hidden="true"
					/>
					<span className="cassette-tape-line" aria-hidden="true" />
					<span
						className={`cassette-reel ${params.motif ? "cassette-reel-spin" : ""}`}
						aria-hidden="true"
					/>
				</div>

				{/* label strip */}
				<div
					className="cassette-label px-4 py-3"
					style={{ borderColor: accent }}
				>
					<h2 className="scrapbook-hand text-2xl md:text-3xl text-slate-900 leading-none">
						{topic.heading}
					</h2>
					<p className="scrapbook-hand text-sm text-slate-700 leading-snug mt-1">
						{topic.teaser}
					</p>
				</div>

				<div className="mt-4 grid grid-cols-2 gap-3">
					{items.map((resolved, i) => (
						<button
							key={resolved.key}
							type="button"
							onClick={(e) => resolved.navigate(e.currentTarget)}
							className="cassette-side group flex items-center gap-2 px-3 py-2 text-left"
						>
							<span
								className="cassette-side-badge flex items-center justify-center w-6 h-6 shrink-0 font-black text-xs text-slate-900"
								style={{ background: accent }}
							>
								{i % 2 === 0 ? "A" : "B"}
							</span>
							<span className="scrapbook-hand text-sm text-slate-800 group-hover:underline leading-tight">
								{resolved.title}
							</span>
						</button>
					))}
				</div>
			</div>
		</div>
	);
}
