import { Fragment } from "react";
import { SECTION_IDS } from "../../data/sections";
import { TOPICS } from "../../data/topics";
import { LINKS } from "./composer/index";
import { type LinkRenderProps, TOPIC_ACCENT } from "./composer/types";
import type { ComposerState } from "./composer/useComposerControls";
import { RhythmGap } from "./RhythmGap";
import { TopicArticle } from "./TopicArticle";

/*
 * Interests band.
 *
 * Maps TOPICS → TopicArticle, with the link connector rendered at each seam
 * BETWEEN consecutive topics (after every topic but the last) whenever the
 * composition is non-baseline and a connector is picked.
 */

type CraftSectionProps = {
	lastTriggerRef: React.RefObject<HTMLElement | null>;
	// isNight is only for the seam LinkComponents: seams sit BETWEEN frozen
	// sections and deliberately track the live sky; each topic freezes its own
	// phase at its article root.
	isNight: boolean;
	// The active composition (composed look by default; panel can switch to baseline).
	composer: ComposerState;
	// Landscape-through gap (vh) at each seam between consecutive topics.
	gapVh: number;
};

export function CraftSection({
	lastTriggerRef,
	isNight,
	composer,
	gapVh,
}: CraftSectionProps) {
	const showLinks = !composer.baseline && composer.link !== "none";
	// Widening cast (same as Inside): the registry erases the id↔params
	// link; setLink keeps link + linkParams in lockstep, so it's sound.
	const LinkComponent = showLinks
		? (LINKS[composer.link]
				.Component as React.ComponentType<LinkRenderProps> | null)
		: null;

	return (
		<section id={SECTION_IDS.craft} className="px-6">
			<div className="max-w-5xl mx-auto">
				{TOPICS.map((topic, index) => (
					<Fragment key={topic.id}>
						<TopicArticle
							topic={topic}
							index={index}
							lastTriggerRef={lastTriggerRef}
							composer={composer}
						/>
						{LinkComponent && index < TOPICS.length - 1 && (
							<LinkComponent
								index={index}
								isNight={isNight}
								params={composer.linkParams}
								accent={TOPIC_ACCENT[topic.id]}
							/>
						)}
						{index < TOPICS.length - 1 && <RhythmGap gapVh={gapVh} />}
					</Fragment>
				))}
			</div>
		</section>
	);
}
