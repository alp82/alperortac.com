import type { Topic } from "../../../data/topics";
import { SectionBody } from "./SectionBody";

/*
 * Baseline shell — the PRODUCTION default for every topic on the Craft band.
 *
 * Owns the topic's `<article>` shell (id anchor + vertical rhythm) and renders
 * the shared `SectionBody` (heading, accent layout, plate/bespoke-else-teaser)
 * inside it. `SectionBody` holds the shared production card chrome.
 *
 * Body dispatch lives in `SectionBody`: if `TOPIC_CONTENTS[topic.id]` exists,
 * the topic's dedicated component renders inside the plate; otherwise the legacy
 * teaser-string + trigger-cards layout renders. Promote a topic to its own
 * component by adding it to the registry.
 */

type CurrentBlockProps = {
	topic: Topic;
	isNight: boolean;
	lastTriggerRef: React.RefObject<HTMLElement | null>;
};

export function CurrentBlock({
	topic,
	isNight,
	lastTriggerRef,
}: CurrentBlockProps) {
	return (
		<article id={topic.id}>
			<SectionBody
				topic={topic}
				isNight={isNight}
				lastTriggerRef={lastTriggerRef}
			/>
		</article>
	);
}
