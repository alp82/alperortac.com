import type { Topic, TopicId } from "../../../data/topics";
import { SectionTitle } from "../SectionTitle";
import { TopicBody } from "./TopicBody";
import { flourishSrc, TOPIC_ACCENT } from "./types";

/*
 * The shipped section card's CHROME - heading block + accent layout - wrapped
 * around the shared `TopicBody`. Extracted out of `current.tsx` so production
 * `CurrentBlock` can wrap it in its `<article>` shell.
 *
 * Resolves `layout` + `accent` INTERNALLY from `topic.id` (so neither caller can
 * pass a mismatched value) and wraps its output in a `relative` element carrying
 * `layoutClasses` + `--topic-accent`, so the accent-bar `before:` and full-bleed
 * `after:` pseudos anchor correctly even when nested inside another wrapper.
 */

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
	travel: "stamped",
	music: "stamped",
	games: "stamped",
};

type SectionBodyProps = {
	topic: Topic;
	isNight: boolean;
	lastTriggerRef: React.RefObject<HTMLElement | null>;
};

export function SectionBody({
	topic,
	isNight,
	lastTriggerRef,
}: SectionBodyProps) {
	const layout = LAYOUT_BY_TOPIC[topic.id];
	const accent = TOPIC_ACCENT[topic.id];
	const src = flourishSrc(topic.id);

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
		<div
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
					<SectionTitle accent={accent} night={isNight} underlineAlign="left">
						{topic.heading}
					</SectionTitle>
				) : (
					<div className="flex items-center gap-3">
						<SectionTitle accent={accent} night={isNight} underlineAlign="left">
							{topic.heading}
						</SectionTitle>
						{flourishImg}
					</div>
				)}
			</header>
			<TopicBody
				topic={topic}
				isNight={isNight}
				lastTriggerRef={lastTriggerRef}
			/>
		</div>
	);
}
