import { SiGithub } from "@icons-pack/react-simple-icons";
import {
	ExternalCard,
	InlineLink,
	Paragraph,
	type TopicContentProps,
	TriggerCard,
} from "./primitives";

export function GamesContent({ lastTriggerRef, isNight }: TopicContentProps) {
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

			<div className="space-y-3">
				<ExternalCard
					href="https://github.com/alp82/manaschmiede"
					label="manaschmiede"
					Icon={SiGithub}
					brand="#181717"
					isNight={isNight}
				/>
				<TriggerCard
					trigger={{ kind: "project", slug: "manaschmiede" }}
					lastTriggerRef={lastTriggerRef}
				/>
			</div>
		</div>
	);
}
