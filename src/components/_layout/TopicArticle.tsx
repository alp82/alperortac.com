import type { Topic } from "../../data/topics";
import { CurrentBlock } from "./composer/current";
import { TopicComposition } from "./composer/TopicComposition";
import type { ComposerState } from "./composer/useComposerControls";

/*
 * Topic block dispatcher.
 *
 * Two render paths:
 *
 *   1. "Shipped baseline" toggle → CurrentBlock. The baseline handles every
 *      topic via the shared SectionBody (teaser + trigger cards for un-promoted
 *      topics, the dedicated component inside the frosted plate for promoted
 *      ones).
 *
 *   2. Composed look (the default) → full TopicComposition (Section + Inner from
 *      the registries), which restyles each topic's stage + cluster.
 */

type TopicArticleProps = {
	topic: Topic;
	index: number;
	lastTriggerRef: React.RefObject<HTMLElement | null>;
	isNight: boolean;
	// The active composition (composed look by default; panel can switch to baseline).
	composer: ComposerState;
};

export function TopicArticle({
	topic,
	index,
	lastTriggerRef,
	isNight,
	composer,
}: TopicArticleProps) {
	if (!composer.baseline) {
		return (
			<TopicComposition
				state={composer}
				topic={topic}
				index={index}
				isNight={isNight}
				lastTriggerRef={lastTriggerRef}
			/>
		);
	}

	// "Shipped baseline" toggle.
	return (
		<CurrentBlock
			topic={topic}
			isNight={isNight}
			lastTriggerRef={lastTriggerRef}
		/>
	);
}
