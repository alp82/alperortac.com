import { useRef } from "react";
import type { Topic } from "../../../data/topics";
import { useSectionNightPhase } from "../SectionTitle";
import { SectionBody } from "./SectionBody";

/*
 * Baseline shell - the baseline look, reachable via the panel's Shipped-baseline
 * toggle.
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
	lastTriggerRef: React.RefObject<HTMLElement | null>;
};

export function CurrentBlock({ topic, lastTriggerRef }: CurrentBlockProps) {
	const articleRef = useRef<HTMLElement>(null);
	// ONE frozen phase for the whole topic section, measured at the article
	// root - everything night-dependent inside agrees with it.
	const night = useSectionNightPhase(articleRef);
	return (
		<article ref={articleRef} id={topic.id}>
			<SectionBody
				topic={topic}
				isNight={night}
				lastTriggerRef={lastTriggerRef}
			/>
		</article>
	);
}
