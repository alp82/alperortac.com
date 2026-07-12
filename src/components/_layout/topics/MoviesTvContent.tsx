import {
	InlineLink,
	Paragraph,
	type TopicContentProps,
	TriggerCard,
} from "./primitives";

export function MoviesTvContent({
	lastTriggerRef,
	isNight,
}: TopicContentProps) {
	return (
		<div className="space-y-5">
			<Paragraph>
				I watched more than a thousand movies and shows, at least those that I
				can remember. I love intricate stories, unique visuals and immersive
				worlds. Kind of similar of what I value in a{" "}
				<InlineLink href="#games">
					<em>good game</em>
				</InlineLink>
				.
			</Paragraph>

			<Paragraph>
				My all time favorites are The Matrix (
				<InlineLink href="https://xkcd.com/566/" isNight={isNight}>
					too bad they never made any sequels
				</InlineLink>
				), Fight Club and Breaking Bad. I like dark humor, epicness and
				unexpected twists.
			</Paragraph>

			<Paragraph>
				I built GoodWatch because I didn't want to go to IMDB, Metacritic,
				Rotten Tomatoes and JustWatch every single time when I was contemplating
				what to watch next. It became my biggest side project and is now a
				personalized recommendation engine for each user's personal taste.
			</Paragraph>

			<TriggerCard
				trigger={{ kind: "project", slug: "goodwatch" }}
				lastTriggerRef={lastTriggerRef}
			/>
		</div>
	);
}
