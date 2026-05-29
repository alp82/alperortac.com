import { SiLastdotfm, SiSpotify } from "@icons-pack/react-simple-icons";
import {
	ExternalCard,
	Paragraph,
	type TopicContentProps,
	TriggerCard,
} from "./primitives";

export function MusicContent({ lastTriggerRef }: TopicContentProps) {
	return (
		<div className="space-y-5">
			<Paragraph>
				I'm into music that radiates infinite energy. From Metalcore, over
				Progrock to Liquid D'n'B and Tech House. Loudness and high production
				value spurs me.
			</Paragraph>
			<Paragraph>
				If it's well produced and expertly played, there are good chances that
				I'll like it regardless of the genre.
			</Paragraph>
			<div className="space-y-3">
				<ExternalCard
					href="https://www.last.fm/user/Alper_"
					label="Last.fm"
					Icon={SiLastdotfm}
					brand="#D51007"
				/>
				<ExternalCard
					href="https://open.spotify.com/user/1140243663?si=f613e1c43ce74d54"
					label="Spotify"
					Icon={SiSpotify}
					brand="#1ED760"
				/>
				<TriggerCard
					trigger={{ kind: "personal", slug: "music" }}
					lastTriggerRef={lastTriggerRef}
				/>
			</div>
		</div>
	);
}
