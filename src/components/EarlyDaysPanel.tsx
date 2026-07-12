import { useEffect, useRef, useState } from "react";
import type { Story } from "../data/stories";
import { SubpageClose } from "./_layout/SubpageClose";
import { useReducedMotion } from "./_layout/dive/useReducedMotion";

export const getStoryPanelTitleId = (slug: string) => `story-${slug}-title`;

type EarlyDaysPanelProps = {
	story: Story;
	onClose: () => void;
};

export function EarlyDaysPanel({ story, onClose }: EarlyDaysPanelProps) {
	const Icon = story.Icon;
	const timelineRef = useRef<HTMLDivElement>(null);
	const [revealed, setRevealed] = useState<ReadonlySet<number>>(new Set());
	const [instantRevealed, setInstantRevealed] = useState<ReadonlySet<number>>(
		new Set(),
	);
	const reducedMotion = useReducedMotion();

	useEffect(() => {
		if (reducedMotion) {
			setRevealed(
				new Set(Array.from({ length: story.eras.length }, (_, i) => i)),
			);
			return;
		}
		const root = timelineRef.current?.closest(".panel-surface") ?? null;
		let firstBatch = true;
		const observer = new IntersectionObserver(
			(entries) => {
				const isFirstBatch = firstBatch;
				firstBatch = false;
				for (const entry of entries) {
					if (!entry.isIntersecting) continue;
					const i = Number((entry.target as HTMLElement).dataset.era);
					if (isFirstBatch) {
						setInstantRevealed((prev) => {
							if (prev.has(i)) return prev;
							const next = new Set(prev);
							next.add(i);
							return next;
						});
					}
					setRevealed((prev) => {
						if (prev.has(i)) return prev;
						const next = new Set(prev);
						next.add(i);
						return next;
					});
				}
			},
			{ root, threshold: 0.15 },
		);
		for (const el of timelineRef.current?.querySelectorAll("[data-era]") ??
			[]) {
			observer.observe(el);
		}
		return () => observer.disconnect();
	}, [reducedMotion, story.eras.length]);

	return (
		<>
			<SubpageClose onClose={onClose} />
			<div
				className="subpage-column relative w-full max-w-3xl mx-auto my-[10vh]"
				style={{ color: story.panelFg }}
			>
				<div className="px-6 md:px-10 py-12">
					<div
						className={`w-24 h-24 mb-6 flex items-center justify-center border-4 border-slate-900 shadow-[6px_6px_0px_0px_rgba(255,255,255,0.25)] ${story.tileBg} ${story.tileFg}`}
					>
						<Icon size={48} />
					</div>

					<h2
						id={getStoryPanelTitleId(story.slug)}
						className="text-4xl md:text-6xl font-black uppercase tracking-tighter mb-8"
					>
						{story.title}
					</h2>

					<div ref={timelineRef} className="era-spine">
						{story.eras.map((era, i) => (
							<section
								// biome-ignore lint/suspicious/noArrayIndexKey: static era list, never reordered - age+suffix is not guaranteed unique across eras.
								key={i}
								data-era={i}
								className={`era-reveal${revealed.has(i) ? " is-revealed" : ""}${instantRevealed.has(i) ? " era-reveal-instant" : ""} relative grid grid-cols-[4.5rem_1fr] sm:grid-cols-[7.5rem_1fr] gap-5 py-[2.2rem]`}
							>
								<div
									aria-hidden="true"
									className="sticky top-6 self-start select-none text-right pr-[0.9rem] sm:pr-[1.4rem] text-[3.5rem] sm:text-[5.5rem] font-black leading-none tracking-[-0.06em] text-[rgba(255,247,237,0.14)]"
								>
									{era.age}
									<span className="text-[1.6rem] sm:text-[2.4rem] tracking-normal">
										{era.ageSuffix}
									</span>
								</div>
								<div>
									<span className="sr-only">
										Age {era.age}
										{era.ageSuffix}
									</span>
									<div className="text-[0.7rem] font-bold uppercase tracking-[0.22em] text-[rgba(255,247,237,0.75)] mb-[0.6rem]">
										{era.caption}
									</div>
									<div className="space-y-[0.9rem]">
										{era.beats.map((beat, beatIndex) => (
											// biome-ignore lint/suspicious/noArrayIndexKey: static beats list, never reordered - beat text is not guaranteed unique within an era.
											<p key={beatIndex} className="text-lg leading-[1.75]">
												{beat}
											</p>
										))}
									</div>
								</div>
							</section>
						))}
					</div>
				</div>
			</div>
		</>
	);
}
