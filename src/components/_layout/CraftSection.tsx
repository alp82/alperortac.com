import { Fragment } from "react";
import { SECTION_IDS } from "../../data/sections";
import { TOPICS } from "../../data/topics";
import { LINKS } from "./composer/index";
import { type LinkRenderProps, TOPIC_ACCENT } from "./composer/types";
import type { ComposerState } from "./composer/useComposerControls";
import { TopicArticle } from "./TopicArticle";

/*
 * Interests band.
 *
 * Production maps TOPICS → TopicArticle (baseline look), no connectors.
 *
 * In DEV, when the composer is active, the Layer-3 connector renders at each
 * seam BETWEEN consecutive topics (after every topic but the last). The
 * connector block is gated behind a folded import.meta.env.DEV literal, so
 * Rollup dead-strips it + the LINKS registry from production.
 */

const DESIGN_MODE = import.meta.env.DEV;

type CraftSectionProps = {
	lastTriggerRef: React.RefObject<HTMLElement | null>;
	isNight: boolean;
	// DEV-only composition; undefined in production (baseline look).
	composer?: ComposerState | undefined;
};

export function CraftSection({
	lastTriggerRef,
	isNight,
	composer,
}: CraftSectionProps) {
	const showLinks =
		DESIGN_MODE && composer && !composer.baseline && composer.link !== "none";
	// Widening cast (same as Stage/Inside): the registry erases the id↔params
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
							isNight={isNight}
							composer={composer}
						/>
						{LinkComponent && composer && index < TOPICS.length - 1 && (
							<LinkComponent
								index={index}
								isNight={isNight}
								params={composer.linkParams}
								accent={TOPIC_ACCENT[topic.id]}
							/>
						)}
					</Fragment>
				))}
			</div>
		</section>
	);
}
