import { ArrowLeft, ArrowRight } from "lucide-react";
import type { Topic } from "../../../data/topics";
import { TopicPlate } from "../topics/primitives";
import { TOPIC_CONTENTS } from "../topics/registry";
import type { InnerSurface } from "./types";
import { TOPIC_ACCENT } from "./types";
import { type ResolvedTrigger, useTriggerNav } from "./useTriggerNav";

/*
 * The shipped topic BODY — the plate/bespoke-else-teaser dispatch, extracted
 * VERBATIM out of `SectionBody` so it can be rendered as the `children` of any
 * composer frame (inner style). Every inner is a CONTAINER that wraps this
 * real body.
 *
 * Resolves `accent` + `CustomContent` INTERNALLY from `topic.id`, so callers
 * can't pass a mismatched value. Carries no heading/accent layout/vertical
 * rhythm — those belong to the frame (or, in production, to `SectionBody`).
 */

function SidedCard({ resolved }: { resolved: ResolvedTrigger }) {
	const { Icon, title, subtitle, side, navigate, tileClass } = resolved;
	const isRight = side === "right";

	const iconEl = (
		<div
			className={`w-14 h-14 ${tileClass} flex items-center justify-center border-2 border-slate-900 shrink-0`}
		>
			<Icon size={26} />
		</div>
	);
	const contentEl = (
		<span className="min-w-0">
			<span className="block text-2xl md:text-3xl font-black uppercase leading-none truncate">
				{title}
			</span>
			{subtitle && (
				<span className="block mt-1 text-xs md:text-sm font-medium normal-case opacity-75 line-clamp-1">
					{subtitle}
				</span>
			)}
		</span>
	);
	const arrowEl = isRight ? (
		<ArrowRight
			size={28}
			className="shrink-0 group-hover:translate-x-1 transition-transform"
		/>
	) : (
		<ArrowLeft
			size={28}
			className="shrink-0 group-hover:-translate-x-1 transition-transform"
		/>
	);

	return (
		<button
			type="button"
			onClick={(e) => navigate(e.currentTarget)}
			className="btn-brutalist btn-brutalist--ghost group block w-full text-left p-6 md:p-7"
		>
			<div className="flex items-center justify-between gap-6">
				{isRight ? (
					<>
						<div className="flex items-center gap-5 min-w-0">
							{iconEl}
							{contentEl}
						</div>
						{arrowEl}
					</>
				) : (
					<>
						<div className="flex items-center gap-5 min-w-0">
							{arrowEl}
							{contentEl}
						</div>
						{iconEl}
					</>
				)}
			</div>
		</button>
	);
}

type TopicBodyProps = {
	topic: Topic;
	isNight: boolean;
	lastTriggerRef: React.RefObject<HTMLElement | null>;
	/** How the body sits inside its frame; defaults to the frosted plate (prod). */
	surface?: InnerSurface;
};

export function TopicBody({
	topic,
	isNight,
	lastTriggerRef,
	surface = "plate",
}: TopicBodyProps) {
	const { resolveTrigger } = useTriggerNav(lastTriggerRef);
	const accent = TOPIC_ACCENT[topic.id];
	const CustomContent = TOPIC_CONTENTS[topic.id];

	return CustomContent ? (
		<TopicPlate isNight={isNight} surface={surface} className="mt-6 p-5 md:p-6">
			<CustomContent
				lastTriggerRef={lastTriggerRef}
				isNight={isNight}
				accent={accent}
			/>
		</TopicPlate>
	) : (
		<>
			{topic.teaser && (
				<TopicPlate
					isNight={isNight}
					surface={surface}
					className="mt-3 p-3 text-lg md:text-xl font-medium leading-relaxed"
				>
					{topic.teaser.split("\n\n").map((para, i) => (
						<p key={para.slice(0, 24)} className={i > 0 ? "mt-3" : ""}>
							{para}
						</p>
					))}
				</TopicPlate>
			)}
			<div className="space-y-6 mt-6">
				{topic.triggers.map((trigger) => {
					const resolved = resolveTrigger(trigger, topic.teaser ?? "");
					if (!resolved) return null;
					if (resolved.isCareer) {
						return (
							<button
								key={resolved.key}
								type="button"
								onClick={(e) => resolved.navigate(e.currentTarget)}
								className="btn-brutalist btn-brutalist--ghost w-full flex items-center justify-between gap-6 font-black uppercase tracking-tighter text-xl md:text-3xl p-6"
							>
								<ArrowLeft size={32} className="shrink-0" />
								<span>{resolved.title}</span>
							</button>
						);
					}
					return <SidedCard key={resolved.key} resolved={resolved} />;
				})}
			</div>
		</>
	);
}
