import type { Topic } from "../../../data/topics";
import { INNERS, SECTIONS } from "./index";
import { TopicBody } from "./TopicBody";
import { type SectionRenderProps, TOPIC_ACCENT } from "./types";
import type { ComposerState } from "./useComposerControls";

/*
 * DEV-ONLY composition dispatcher.
 *
 * Builds one topic's composition: resolves the accent (per the section's accent
 * param), builds the topic's REAL body (the shared TopicBody), and hands it to
 * the Layer-2 inner frame as `children`, all wrapped in the Layer-1 stage. Every
 * frame is a container around the same body; the `rich-card` inner ignores
 * `children` and renders the full shipped card itself.
 *
 * The sole importer of the inner + section registries on the topic path; gated
 * behind a folded import.meta.env.DEV literal at the call site (TopicArticle),
 * so Rollup dead-strips this + the registry from production.
 *
 * Planner: removed with the rest of the composer once a composition is locked.
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
	const section = SECTIONS[state.section];
	// The registry erases the id↔params link — Component wants its stage's exact
	// param shape while state holds the union. setSection keeps `section` and
	// `sectionParams` in lockstep, so this widening cast is sound at runtime.
	const Stage = section.Component as React.ComponentType<SectionRenderProps>;

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

	// Cluster is local to each topic.
	const cluster = state.clusters[topic.id];
	const inner = INNERS[cluster.id];
	const Cluster = inner.Component;
	// Every inner frame wraps the topic's REAL body (the shared TopicBody), so
	// every topic — promoted or teaser-based — renders correctly under any inner.
	const body = (
		<TopicBody
			topic={topic}
			isNight={isNight}
			lastTriggerRef={lastTriggerRef}
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
