import type { InnerRenderProps } from "../types";
import { useTriggerNav } from "../useTriggerNav";
import { DENSITY_MAXW } from "./shared";

/*
 * Inner: manuscript
 *
 * An illuminated manuscript page: ruled vellum, an ornate accent drop-cap
 * leading the heading, gold flourish corners, and triggers as rubricated
 * (red-lettered) lines marked with a ❧ leaf. Signature motif = the illuminated
 * drop-cap block.
 */

export function ManuscriptCluster({
	topic,
	lastTriggerRef,
	params,
	accent,
}: InnerRenderProps) {
	const { resolveTrigger } = useTriggerNav(lastTriggerRef);
	const head = topic.heading;
	const drop = head.charAt(0);
	const rest = head.slice(1);

	return (
		<div className={`w-full ${DENSITY_MAXW[params.density]}`}>
			<div className="manuscript relative px-8 md:px-12 py-10 text-left">
				{/* gold flourish corners */}
				<span
					className="manuscript-corner manuscript-corner-tl"
					aria-hidden="true"
				/>
				<span
					className="manuscript-corner manuscript-corner-br"
					aria-hidden="true"
				/>

				<h2 className="font-serif text-3xl md:text-5xl text-slate-900 leading-tight flex items-start gap-1">
					{params.motif && (
						<span className="manuscript-dropcap" style={{ background: accent }}>
							{drop}
						</span>
					)}
					<span className={params.motif ? "pt-1" : ""}>
						{params.motif ? rest : head}
					</span>
				</h2>

				<p className="font-serif italic text-base md:text-lg text-slate-700 leading-relaxed mt-4 first-letter:text-xl">
					{topic.teaser}
				</p>

				<div className="manuscript-rubric mt-6 flex flex-col gap-3">
					{topic.triggers.map((trigger) => {
						const resolved = resolveTrigger(trigger, topic.teaser);
						if (!resolved) return null;
						return (
							<button
								key={resolved.key}
								type="button"
								onClick={(e) => resolved.navigate(e.currentTarget)}
								className="manuscript-line group inline-flex items-baseline gap-2 text-left"
							>
								<span className="manuscript-leaf" aria-hidden="true">
									❧
								</span>
								<span className="font-serif text-base text-[#8a2a16] group-hover:underline decoration-[#8a2a16]/50">
									{resolved.title}
								</span>
							</button>
						);
					})}
				</div>
			</div>
		</div>
	);
}
