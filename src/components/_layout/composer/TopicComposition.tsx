import type { ComposerTopic, Topic } from "../../../data/topics";
import { INNERS, SECTIONS } from "./index";
import { TOPIC_ACCENT } from "./types";
import type { ComposerState } from "./useComposerControls";

/*
 * DEV-ONLY composition dispatcher.
 *
 * Builds one topic's composition: resolves the accent (per the section's accent
 * param), renders the Layer-2 inner cluster, and wraps it in the Layer-1 stage.
 * The sole importer of the inner + section registries on the topic path; gated
 * behind a folded import.meta.env.DEV literal at the call site (TopicArticle),
 * so Rollup dead-strips this + the registry from production.
 *
 * `innerOverride`: when set, the resolved Layer-2 cluster is replaced with the
 * passed node. Used by promoted topics (those with their own component in
 * TOPIC_CONTENTS) so they can still ride any composer Stage while ignoring the
 * inner-style picker.
 *
 * Planner: removed with the rest of the composer once a composition is locked.
 */

type TopicCompositionProps = {
	state: ComposerState;
	topic: Topic;
	index: number;
	isNight: boolean;
	lastTriggerRef: React.RefObject<HTMLElement | null>;
	innerOverride?: React.ReactNode;
};

export function TopicComposition({
	state,
	topic,
	index,
	isNight,
	lastTriggerRef,
	innerOverride,
}: TopicCompositionProps) {
	const section = SECTIONS[state.section];
	const Stage = section.Component;

	const topicAccent = TOPIC_ACCENT[topic.id];
	// Accent source: topic palette / a fixed warm amber / none.
	const sectionAccent =
		state.sectionParams.accent === "topic"
			? topicAccent
			: state.sectionParams.accent === "fixed"
				? "#fde68a"
				: null;
	// The cluster always gets a concrete accent to key its motifs off (it falls
	// back to the topic palette when the stage suppresses accent).
	const clusterAccent = sectionAccent ?? topicAccent;

	const stageProps = {
		topic,
		index,
		isNight,
		params: state.sectionParams,
		accent: sectionAccent,
	};

	if (innerOverride !== undefined) {
		return <Stage {...stageProps}>{innerOverride}</Stage>;
	}

	const inner = INNERS[state.inner];
	const Cluster = inner.Component;
	return (
		<Stage {...stageProps}>
			<Cluster
				topic={topic as ComposerTopic}
				index={index}
				isNight={isNight}
				lastTriggerRef={lastTriggerRef}
				params={state.innerParams}
				accent={clusterAccent}
			/>
		</Stage>
	);
}
