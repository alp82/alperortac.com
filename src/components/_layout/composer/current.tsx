import { ArrowLeft, ArrowRight } from "lucide-react";
import type { Topic, TopicId } from "../../../data/topics";
import { TopicPlate } from "../topics/primitives";
import { TOPIC_CONTENTS } from "../topics/registry";
import { flourishSrc, TOPIC_ACCENT } from "./types";
import { type ResolvedTrigger, useTriggerNav } from "./useTriggerNav";

/*
 * Baseline shell — the PRODUCTION default for every topic on the Craft band.
 *
 * Owns the chrome shared across all topics: heading, accent layout
 * (accent-bar / stamped / full-bleed), and the frosted plate backdrop.
 *
 * Body dispatch: if `TOPIC_CONTENTS[topic.id]` exists, the topic's dedicated
 * component (in `src/components/_layout/topics/`) renders inside the plate.
 * Otherwise the legacy teaser-string + trigger-cards layout renders. Promote
 * a topic to its own component by adding it to the registry.
 */

type CurrentBlockProps = {
	topic: Topic;
	index: number;
	isNight: boolean;
	lastTriggerRef: React.RefObject<HTMLElement | null>;
};

const LAYOUT_BY_TOPIC: Record<
	TopicId,
	"accent-bar" | "stamped" | "full-bleed"
> = {
	coding: "accent-bar",
	career: "full-bleed",
	ai: "stamped",
	"tech-stack": "accent-bar",
	finance: "accent-bar",
	"movies-tv": "full-bleed",
	family: "accent-bar",
	music: "stamped",
	games: "stamped",
};

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
			className={`btn-brutalist group block w-full max-w-2xl text-left p-6 md:p-8 ${isRight ? "ml-auto" : "ml-0"}`}
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

export function CurrentBlock({
	topic,
	isNight,
	lastTriggerRef,
}: CurrentBlockProps) {
	const { resolveTrigger } = useTriggerNav(lastTriggerRef);
	const layout = LAYOUT_BY_TOPIC[topic.id];
	const accent = TOPIC_ACCENT[topic.id];
	const src = flourishSrc(topic.id);
	const CustomContent = TOPIC_CONTENTS[topic.id];
	const headingDark = !isNight;
	const headingClass = `topic-heading text-4xl md:text-6xl font-black uppercase tracking-tighter transition-colors duration-300 ${headingDark ? "text-slate-900" : "text-white"}`;

	const layoutClasses =
		layout === "accent-bar"
			? "pl-8 before:content-[''] before:absolute before:left-0 before:top-0 before:bottom-0 before:w-[10px] before:bg-[var(--topic-accent)]"
			: layout === "full-bleed"
				? "after:content-[''] after:absolute after:left-0 after:right-0 after:bottom-0 after:h-[40%] after:bg-[var(--topic-accent)] after:-z-10"
				: "";

	const flourishImg = (
		<img
			src={src}
			alt=""
			aria-hidden="true"
			className="w-12 h-12 shrink-0 pointer-events-none"
			style={{ imageRendering: "pixelated" }}
		/>
	);

	return (
		<article
			id={`topic-${topic.id}`}
			className={`relative py-24 ${layoutClasses}`}
			style={{ "--topic-accent": accent } as React.CSSProperties}
		>
			{layout === "stamped" && (
				<img
					src={src}
					alt=""
					aria-hidden="true"
					className="absolute right-4 top-4 w-12 h-12 -rotate-6 pointer-events-none"
					style={{ imageRendering: "pixelated" }}
				/>
			)}
			<header className="max-w-3xl">
				{layout === "stamped" ? (
					<h2 className={headingClass}>{topic.heading}</h2>
				) : (
					<div className="flex items-center gap-3">
						<h2 className={headingClass}>{topic.heading}</h2>
						{flourishImg}
					</div>
				)}
			</header>
			{CustomContent ? (
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
										className="btn-brutalist btn-brutalist--dark w-full flex items-center justify-between gap-6 font-black uppercase tracking-tighter text-xl md:text-3xl"
									>
										<ArrowLeft size={32} className="shrink-0" />
										<span>{resolved.title}</span>
									</button>
								);
							}
							return (
								<SidedCard
									key={resolved.key}
									resolved={resolved}
									tint={accent}
								/>
							);
						})}
					</div>
				</>
			)}
		</article>
	);
}
