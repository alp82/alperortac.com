import { CODING_TEASER } from "../../../data/topics";
import { Paragraph, type TopicContentProps, TriggerCard } from "./primitives";

export function CodingContent({ lastTriggerRef }: TopicContentProps) {
	return (
		<div className="space-y-5">
			{CODING_TEASER.split("\n\n").map((para) => (
				<Paragraph key={para.slice(0, 24)}>{para}</Paragraph>
			))}
			<TriggerCard
				trigger={{ kind: "story", slug: "early-days" }}
				lastTriggerRef={lastTriggerRef}
			/>
		</div>
	);
}
