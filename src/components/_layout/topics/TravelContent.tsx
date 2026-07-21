import { EarthTrigger } from "../travel/EarthTrigger";
import { Paragraph, type TopicContentProps } from "./primitives";

export function TravelContent({ lastTriggerRef }: TopicContentProps) {
	// The visited-country list below is mirrored BY HAND from the single source
	// in src/data/travel.ts (VISITED_PLACES) - authentic voice stays verbatim.
	return (
		<div className="space-y-5">
			<Paragraph>
				Exploring other countries and cultures is an absolute joy to me. We love
				to visit places with different culture, history and climate. We went to
				Thailand, Isreal, Mexico, Grenada and all over Europe. There is so much
				more to see.
			</Paragraph>

			<Paragraph>
				My favorite moments are when we witness the raw reality of what a place
				is about. Touristic attractions can be fun, but I mean the actual land
				and people. Geocaching is a great tool to find the best local spots -
				even in your home town.
			</Paragraph>

			<Paragraph>Next destination: Japan 2027.</Paragraph>

			<EarthTrigger lastTriggerRef={lastTriggerRef} />
		</div>
	);
}
