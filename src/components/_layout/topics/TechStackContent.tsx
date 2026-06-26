import {
	BulletList,
	InlineLink,
	Paragraph,
	type TopicContentProps,
} from "./primitives";

export function TechStackContent({ isNight }: TopicContentProps) {
	return (
		<div className="space-y-5">
			<Paragraph>
				I self-host as much as I can to avoid serverless horrors (
				<InlineLink href="https://serverlesshorrors.com" isNight={isNight}>
					serverlesshorrors.com
				</InlineLink>
				). Hetzner Cloud is the best compromise between cost, performance and
				value. What's running on it?
			</Paragraph>

			<BulletList
				items={[
					{ primary: "Coolify", secondary: "to spin up my web apps" },
					{
						primary: "Windmill",
						secondary:
							"to orchestrate data pipelines (for millions of movies and tv shows)",
					},
					{ primary: "CrateDB", secondary: "for big data" },
					{ primary: "Convex", secondary: "for realtime data" },
					{ primary: "MongoDB", secondary: "for raw data (from scraping)" },
					{ primary: "Redis", secondary: "for Pub/Sub and caching" },
					{ primary: "SpacetimeDB", secondary: "for my browser game" },
				]}
			/>

			<Paragraph>For some services I still rely on cloud software:</Paragraph>

			<BulletList
				items={[
					{ primary: "Posthog", secondary: "for analytics" },
					{ primary: "Grafana", secondary: "for monitoring" },
					{ primary: "Namecheap", secondary: "for Emails" },
				]}
			/>

			<Paragraph>
				When I spin up a new web apps, I usually build it with Tanstack Start,
				Tailwind and Convex.
			</Paragraph>
		</div>
	);
}
