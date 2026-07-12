import {
	SiConvex,
	SiCoolify,
	SiCratedb,
	SiGrafana,
	SiMongodb,
	SiNamecheap,
	SiPosthog,
	SiRedis,
} from "@icons-pack/react-simple-icons";
import { Orbit, Wind } from "lucide-react";
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
					{
						primary: "Coolify",
						secondary: "to spin up my web apps",
						Icon: SiCoolify,
					},
					{
						primary: "Windmill",
						secondary:
							"to orchestrate data pipelines (for millions of movies and tv shows)",
						Icon: Wind,
					},
					{ primary: "CrateDB", secondary: "for big data", Icon: SiCratedb },
					{ primary: "Convex", secondary: "for realtime data", Icon: SiConvex },
					{
						primary: "MongoDB",
						secondary: "for raw data (from scraping)",
						Icon: SiMongodb,
					},
					{
						primary: "Redis",
						secondary: "for Pub/Sub and caching",
						Icon: SiRedis,
					},
					{
						primary: "SpacetimeDB",
						secondary: "for my browser game",
						Icon: Orbit,
					},
				]}
			/>

			<Paragraph>For some services I still rely on cloud software:</Paragraph>

			<BulletList
				items={[
					{ primary: "Posthog", secondary: "for analytics", Icon: SiPosthog },
					{ primary: "Grafana", secondary: "for monitoring", Icon: SiGrafana },
					{ primary: "Namecheap", secondary: "for Emails", Icon: SiNamecheap },
				]}
			/>

			<Paragraph>
				When I spin up a new web apps, I usually build it with Tanstack Start,
				Tailwind and Convex.
			</Paragraph>
		</div>
	);
}
