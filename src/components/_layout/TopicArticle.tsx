import type { ComposerTopic, Topic } from "../../data/topics";
import { TOPIC_ACCENT } from "./composer/types";
import { CurrentBlock } from "./composer/current";
import { TopicComposition } from "./composer/TopicComposition";
import type { ComposerState } from "./composer/useComposerControls";
import { TopicHeading, TopicPlate } from "./topics/primitives";
import { TOPIC_CONTENTS } from "./topics/registry";

/*
 * Topic block dispatcher.
 *
 * Three render paths:
 *
 *   1. Production / "Shipped baseline" toggle → CurrentBlock. The baseline
 *      handles both un-promoted topics (teaser + trigger cards) and promoted
 *      topics (renders their custom component inside the frosted plate).
 *
 *   2. DEV composer active, promoted topic → TopicComposition with the
 *      custom component as `innerOverride`. The Stage (Layer 1) applies; the
 *      Inner-style picker is ignored because the custom component IS the
 *      inner cluster.
 *
 *   3. DEV composer active, un-promoted topic → full TopicComposition
 *      (Section + Inner from the registries).
 *
 *   CurrentBlock + composer paths all gate behind a folded
 *   `import.meta.env.DEV` literal, so Rollup dead-strips TopicComposition +
 *   the section/inner registries from production.
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
	const CustomContent = TOPIC_CONTENTS[topic.id];

	if (DESIGN_MODE && composer && !composer.baseline) {
		// Promoted topic: ride the composer's Stage (Layer 1) but ignore the
		// Inner-style picker — the custom component IS the inner cluster.
		if (CustomContent) {
			const accent =
				composer.sectionParams.accent === "topic"
					? TOPIC_ACCENT[topic.id]
					: composer.sectionParams.accent === "fixed"
						? "#fde68a"
						: TOPIC_ACCENT[topic.id];
			return (
				<TopicComposition
					state={composer}
					topic={topic}
					index={index}
					isNight={isNight}
					lastTriggerRef={lastTriggerRef}
					innerOverride={
						<div className="space-y-6 max-w-3xl">
							<TopicHeading heading={topic.heading} isNight={isNight} />
							<TopicPlate isNight={isNight} className="p-5 md:p-6">
								<CustomContent
									lastTriggerRef={lastTriggerRef}
									isNight={isNight}
									accent={accent}
								/>
							</TopicPlate>
						</div>
					}
				/>
			);
		}
		// Un-promoted topic: full composer (Stage + Inner). Topic carries teaser
		// by data contract (no entry in TOPIC_CONTENTS).
		return (
			<TopicComposition
				state={composer}
				topic={topic as ComposerTopic}
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
			index={index}
			isNight={isNight}
			lastTriggerRef={lastTriggerRef}
		/>
	);
}
