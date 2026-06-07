import type { Topic } from "../../data/topics";
import { CurrentBlock } from "./composer/current";
import { TopicComposition } from "./composer/TopicComposition";
import type { ComposerState } from "./composer/useComposerControls";

/*
 * Topic block dispatcher.
 *
 * Two render paths:
 *
 *   1. Production / "Shipped baseline" toggle → CurrentBlock. The baseline
 *      handles every topic via the shared SectionBody (teaser + trigger cards
 *      for un-promoted topics, the dedicated component inside the frosted plate
 *      for promoted ones).
 *
 *   2. DEV composer active → full TopicComposition (Section + Inner from the
 *      registries), which restyles each topic's stage + cluster.
 *
 *   Both paths gate behind a folded `import.meta.env.DEV` literal, so Rollup
 *   dead-strips TopicComposition + the section/inner registries from production.
 */

const DESIGN_MODE = import.meta.env.DEV;

type TopicArticleProps = {
	topic: Topic;
	index: number;
	lastTriggerRef: React.RefObject<HTMLElement | null>;
	isNight: boolean;
	// DEV-only composition; undefined in production (baseline look).
	composer?: ComposerState | undefined;
};

export function TopicArticle({
	topic,
	index,
	lastTriggerRef,
	isNight,
	composer,
}: TopicArticleProps) {
	if (DESIGN_MODE && composer && !composer.baseline) {
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

	// Production, "Shipped baseline" toggle, OR composer disabled.
	return (
		<CurrentBlock
			topic={topic}
			isNight={isNight}
			lastTriggerRef={lastTriggerRef}
		/>
	);
}
