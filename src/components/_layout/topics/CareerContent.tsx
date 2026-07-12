import { CAREER_TEASER } from "../../../data/topics";
import { Paragraph, type TopicContentProps, TriggerCard } from "./primitives";

export function CareerContent({
	lastTriggerRef,
}: Pick<TopicContentProps, "lastTriggerRef">) {
	return (
		<div className="space-y-5">
			{CAREER_TEASER.split("\n\n").map((para) => (
				<Paragraph key={para.slice(0, 24)}>{para}</Paragraph>
			))}
			<TriggerCard
				trigger={{ kind: "career" }}
				lastTriggerRef={lastTriggerRef}
			/>
		</div>
	);
}
