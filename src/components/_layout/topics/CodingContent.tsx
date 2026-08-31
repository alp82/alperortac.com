import { CODING_CLOSING } from "../../../data/coding";
import { CODING_TEASER } from "../../../data/topics";
import { DiffedParagraphs } from "../composer/pr-diff";
import {
	InlineLink,
	Paragraph,
	type TopicContentProps,
	TriggerCard,
} from "./primitives";

export function CodingContent({ lastTriggerRef, isNight }: TopicContentProps) {
	return (
		<div className="space-y-5">
			<DiffedParagraphs text={CODING_TEASER} />
			{/* The self-host stance (CODING_CLOSING, coding.ts). The wrapper
			    class keeps it out of the teaser-paragraph pins in
			    pr-diff.test.tsx. */}
			<div className="coding-band-closing">
				<Paragraph>
					{CODING_CLOSING.pre}
					<InlineLink href={CODING_CLOSING.link.href} isNight={isNight}>
						{CODING_CLOSING.link.label}
					</InlineLink>
					{CODING_CLOSING.post}
				</Paragraph>
			</div>
			<TriggerCard
				trigger={{ kind: "story", slug: "early-days" }}
				lastTriggerRef={lastTriggerRef}
			/>
		</div>
	);
}
