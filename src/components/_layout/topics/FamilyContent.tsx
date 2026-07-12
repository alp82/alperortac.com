import { Paragraph, type TopicContentProps, TriggerCard } from "./primitives";

export function FamilyContent({ lastTriggerRef }: TopicContentProps) {
	return (
		<div className="space-y-5">
			<Paragraph>
				Family. Love my wife and three kids. They are the reason I stay
				motivated to grow as a person. I'm proud of our relationship. Trust,
				friendship and closeness is what I experienced as a kid from my parents
				and I'm trying to offer the same to my family.
			</Paragraph>

			<Paragraph>
				I like Magic the Gathering. Created an app that helps me building decks,
				printing them and playing with my kids.
			</Paragraph>

			<TriggerCard
				trigger={{ kind: "project", slug: "manaschmiede" }}
				lastTriggerRef={lastTriggerRef}
			/>
		</div>
	);
}
