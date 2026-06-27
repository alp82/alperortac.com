import type { Topic } from "../../../data/topics";
import { INNERS, SECTIONS } from "./index";
import { TopicBody } from "./TopicBody";
import {
	type InnerRenderProps,
	type SectionRenderProps,
	TOPIC_ACCENT,
} from "./types";
import type { ComposerState } from "./useComposerControls";

/*
 * Composition dispatcher.
 *
 * Builds one topic's composition: resolves the accent (per the section's accent
 * param), builds the topic's REAL body (the shared TopicBody), and hands it to
 * the Layer-2 inner frame as `children`, all wrapped in the Layer-1 stage. Every
 * frame is a container around the same body.
 */

type TopicCompositionProps = {
	state: ComposerState;
	topic: Topic;
	index: number;
	isNight: boolean;
	lastTriggerRef: React.RefObject<HTMLElement | null>;
};

export function TopicComposition({
	state,
	topic,
	index,
	isNight,
	lastTriggerRef,
}: TopicCompositionProps) {
	// Stage is local to each topic. The registry erases the id↔params link —
	// Component wants its stage's exact param shape while state holds the union;
	// setStage keeps id + params in lockstep, so this widening cast is sound.
	const stage = state.stages[topic.id];
	const section = SECTIONS[stage.id];
	const Stage = section.Component as React.ComponentType<SectionRenderProps>;

	const topicAccent = TOPIC_ACCENT[topic.id];
	// Accent source: topic palette / a fixed warm amber / none.
	const sectionAccent =
		stage.params.accent === "topic"
			? topicAccent
			: stage.params.accent === "fixed"
				? "#fde68a"
				: null;
	// The cluster always gets a concrete accent to key its motifs off (it falls
	// back to the topic palette when the stage suppresses accent).
	const clusterAccent = sectionAccent ?? topicAccent;

	const stageProps = {
		topic,
		index,
		isNight,
		params: stage.params,
		accent: sectionAccent,
	};

	// Cluster is local to each topic. Same widening cast as the Stage — the
	// registry erases the id↔params link; the cluster keeps id + params in
	// lockstep, so it's sound at runtime.
	const cluster = state.clusters[topic.id];
	const inner = INNERS[cluster.id];
	const Cluster = inner.Component as React.ComponentType<InnerRenderProps>;
	// Every inner frame wraps the topic's REAL body (the shared TopicBody), so
	// every topic — promoted or teaser-based — renders correctly under any inner.
	// The frame declares its surface so the body blends in (bare) or keeps the
	// frosted plate.
	const body = (
		<TopicBody
			topic={topic}
			isNight={isNight}
			lastTriggerRef={lastTriggerRef}
			surface={inner.surface}
		/>
	);
	return (
		<Stage {...stageProps}>
			<Cluster
				topic={topic}
				index={index}
				isNight={isNight}
				lastTriggerRef={lastTriggerRef}
				params={cluster.params}
				accent={clusterAccent}
			>
				{body}
			</Cluster>
		</Stage>
	);
}
