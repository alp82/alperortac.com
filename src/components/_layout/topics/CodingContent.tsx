import { CODING_TEASER } from "../../../data/topics";
import { DiffedParagraphs } from "../composer/pr-diff";
import { type TopicContentProps, TriggerCard } from "./primitives";

export function CodingContent({ lastTriggerRef }: TopicContentProps) {
	return (
		<div className="space-y-5">
			<DiffedParagraphs text={CODING_TEASER} />
			<TriggerCard
				trigger={{ kind: "story", slug: "early-days" }}
				lastTriggerRef={lastTriggerRef}
			/>
		</div>
	);
}
