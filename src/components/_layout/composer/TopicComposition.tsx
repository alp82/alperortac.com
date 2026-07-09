import { useRef } from "react";
import type { Topic } from "../../../data/topics";
import { useSectionNightPhase } from "../SectionTitle";
import { INNERS } from "./index";
import { TopicBody } from "./TopicBody";
import { type InnerRenderProps, TOPIC_ACCENT } from "./types";
import type { ComposerState } from "./useComposerControls";

/*
 * Composition dispatcher.
 *
 * Builds one topic's composition: a neutral centered `<article id>` wrapper
 * (the per-topic scroll/deep-link anchor) that always sets `--cmp-accent` to
 * the topic palette, builds the topic's REAL body (the shared TopicBody), and
 * hands it to the inner frame as `children`. Every frame is a container
 * around the same body.
 */

type TopicCompositionProps = {
	state: ComposerState;
	topic: Topic;
	index: number;
	lastTriggerRef: React.RefObject<HTMLElement | null>;
};

export function TopicComposition({
	state,
	topic,
	index,
	lastTriggerRef,
}: TopicCompositionProps) {
	const articleRef = useRef<HTMLElement>(null);
	// ONE frozen phase for the whole topic section, measured at the article
	// root — everything night-dependent inside agrees with it.
	const night = useSectionNightPhase(articleRef);
	// Accent always comes from the topic palette (the accent-source knob is gone).
	const accent = TOPIC_ACCENT[topic.id];

	// Cluster is local to each topic. The registry erases the id↔params link —
	// Component wants its cluster's exact param shape while state holds the
	// union; the setters keep id + params in lockstep, so this widening cast is
	// sound at runtime.
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
			isNight={night}
			lastTriggerRef={lastTriggerRef}
			surface={inner.surface}
		/>
	);
	return (
		<article
			ref={articleRef}
			id={topic.id}
			className="relative overflow-hidden flex flex-col items-center justify-center px-6 min-h-[90vh]"
			style={{ "--cmp-accent": accent } as React.CSSProperties}
		>
			<Cluster
				topic={topic}
				index={index}
				isNight={night}
				lastTriggerRef={lastTriggerRef}
				params={cluster.params}
				accent={accent}
			>
				{body}
			</Cluster>
		</article>
	);
}
