import {
	InlineLink,
	Paragraph,
	type TopicContentProps,
	TriggerCard,
} from "./primitives";

export function GamesContent({ lastTriggerRef }: TopicContentProps) {
	return (
		<div className="space-y-5">
			<Paragraph>
				I played many games. Spent countless hours with simulations, arcade,
				jump'n'run, shooters, RTS and indie games. If you like Duke Nukem,
				Gordon Freeman, Jade, Kerrigan, Guybrush Threepwood or Scorpion, we can
				be friends.
			</Paragraph>

			<Paragraph>
				The THPS 2 soundtrack is still on{" "}
				<InlineLink href="https://open.spotify.com/user/1140243663?si=8d9cec95a0f5450a">
					<em>my rotation</em>
				</InlineLink>
				.
			</Paragraph>

			<TriggerCard
				trigger={{ kind: "project", slug: "manaschmiede" }}
				lastTriggerRef={lastTriggerRef}
			/>
		</div>
	);
}
