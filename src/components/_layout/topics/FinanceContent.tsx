import { SiGithub } from "@icons-pack/react-simple-icons";
import { ExternalCard, Paragraph, type TopicContentProps } from "./primitives";

export function FinanceContent({ isNight }: TopicContentProps) {
	return (
		<div className="space-y-5">
			<Paragraph>
				I started 2016 with investing in stocks, ETF's and crypto. A very bumpy
				road, and I learned a lot in the process about trading psychology and
				strategies to cope with FOMO and FUD. I'm much more Zen than I was
				before.
			</Paragraph>

			<Paragraph>
				I believe in portfolio diversification. Got some bucks in ETF's, stocks
				and crypto. I mostly invest in tech because i'm knowlegable in that
				field, but also in other areas.
			</Paragraph>

			<Paragraph>
				Even held a presentation about this topic, but beware - it's in German.
			</Paragraph>

			<ExternalCard
				href="https://github.com/alp82/trading-strategien-und-psychologie"
				label="Trading-Strategien und Psychologie"
				Icon={SiGithub}
				brand="#181717"
				isNight={isNight}
			/>
		</div>
	);
}
