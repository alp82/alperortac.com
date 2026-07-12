import { InlineLink, Paragraph, type TopicContentProps } from "./primitives";

export function GamesContent(_: TopicContentProps) {
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
				<InlineLink href="#music">
					<em>my rotation</em>
				</InlineLink>
				.
			</Paragraph>

			<Paragraph>
				I'm in the exploration phase to build the very first massive multiplayer
				coop game. you build a pyramid together with thousands of other players.
				it might it turn out that you were part of something very different.
			</Paragraph>

			<Paragraph>
				currently playing Witcher 3 (yep i never finished it) and expedition 33.
				next up is probably Baldurs gate 3
			</Paragraph>
		</div>
	);
}
