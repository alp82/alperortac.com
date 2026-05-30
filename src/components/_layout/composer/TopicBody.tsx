import { ArrowLeft, ArrowRight } from "lucide-react";
import { TRIGGERS_ENABLED } from "../../../data/flags";
import type { Topic } from "../../../data/topics";
import { TopicPlate } from "../topics/primitives";
import { TOPIC_CONTENTS } from "../topics/registry";
import { TOPIC_ACCENT } from "./types";
import { type ResolvedTrigger, useTriggerNav } from "./useTriggerNav";

/*
 * The shipped topic BODY — the plate/bespoke-else-teaser dispatch, extracted
 * VERBATIM out of `SectionBody` so it can be rendered as the `children` of any
 * composer frame (Layer-2 inner). Every inner is a CONTAINER that wraps this
 * real body; the `rich-card` inner is the one exception — it renders the full
 * shipped card itself via `SectionBody` and ignores `children`.
 *
 * Resolves `accent` + `CustomContent` INTERNALLY from `topic.id`, so callers
 * can't pass a mismatched value. Carries no heading/accent layout/vertical
 * rhythm — those belong to the frame (or, in production, to `SectionBody`).
 */

function SidedCard({
	resolved,
	tint,
}: {
	resolved: ResolvedTrigger;
	tint: string;
}) {
	const { Icon, title, subtitle, side, navigate, tileClass } = resolved;
	const isRight = side === "right";

	const iconEl = (
		<div
			className={`w-14 h-14 ${tileClass} flex items-center justify-center border-2 border-slate-900 shrink-0`}
		>
			<Icon size={24} />
		</div>
	);
	const contentEl = (
		<div className="min-w-0">
			<h3 className="text-2xl md:text-3xl font-black uppercase leading-none mb-1 truncate">
				{title}
			</h3>
			{subtitle && (
				<p className="text-sm text-slate-600 font-medium line-clamp-1">
					{subtitle}
				</p>
			)}
		</div>
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
			style={{ "--btn-tint": tint } as React.CSSProperties}
			className={`btn-brutalist group block w-full md:w-1/2 text-left p-6 md:p-8 ${isRight ? "ml-auto" : "ml-0"}`}
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
};

export function TopicBody({ topic, isNight, lastTriggerRef }: TopicBodyProps) {
	const { resolveTrigger } = useTriggerNav(lastTriggerRef);
	const accent = TOPIC_ACCENT[topic.id];
	const CustomContent = TOPIC_CONTENTS[topic.id];

	return CustomContent ? (
		<TopicPlate isNight={isNight} className="mt-6 p-5 md:p-6">
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
					className="mt-3 p-3 text-lg md:text-xl font-medium leading-relaxed"
				>
					{topic.teaser.split("\n\n").map((para, i) => (
						<p key={para.slice(0, 24)} className={i > 0 ? "mt-3" : ""}>
							{para}
						</p>
					))}
				</TopicPlate>
			)}
			{TRIGGERS_ENABLED && (
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
									className="btn-brutalist btn-brutalist--dark w-full md:w-1/2 flex items-center justify-between gap-6 font-black uppercase tracking-tighter text-xl md:text-3xl"
								>
									<ArrowLeft size={32} className="shrink-0" />
									<span>{resolved.title}</span>
								</button>
							);
						}
						return (
							<SidedCard key={resolved.key} resolved={resolved} tint={accent} />
						);
					})}
				</div>
			)}
		</>
	);
}
