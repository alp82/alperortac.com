import { PostHogProvider } from "@posthog/react";
import { TanStackDevtools } from "@tanstack/react-devtools";
import { createRootRoute, HeadContent, Scripts } from "@tanstack/react-router";
import { TanStackRouterDevtoolsPanel } from "@tanstack/react-router-devtools";

import { SOCIAL_LINKS } from "../components/_layout/social/socialLinks";
import { CONTACT_EMAIL } from "../data/footer";
import { HERO_SUMMARY, OG_HEADLINE, OG_TAGLINE } from "../data/hero";
import appCss from "../styles.css?url";

const SITE_URL = "https://alperortac.com";
const SITE_NAME = "Alper Ortac";
const SITE_DESCRIPTION = HERO_SUMMARY.join(" ");
const OG_IMAGE_URL = `${SITE_URL}/og/landing.png`;
const OG_IMAGE_ALT = `${OG_HEADLINE} ${OG_TAGLINE}`;
const TWITTER_HANDLE = "@alperortac";

const JSON_LD = JSON.stringify({
	"@context": "https://schema.org",
	"@graph": [
		{
			"@type": "Person",
			"@id": `${SITE_URL}/#person`,
			name: SITE_NAME,
			url: SITE_URL,
			image: `${SITE_URL}/alper-avatar.webp`,
			description: SITE_DESCRIPTION,
			email: `mailto:${CONTACT_EMAIL}`,
			sameAs: SOCIAL_LINKS.map((l) => l.href).filter((h): h is string =>
				Boolean(h),
			),
		},
		{
			"@type": "WebSite",
			"@id": `${SITE_URL}/#website`,
			name: SITE_NAME,
			url: SITE_URL,
			publisher: { "@id": `${SITE_URL}/#person` },
		},
	],
});

export const Route = createRootRoute({
	head: ({ matches }) => {
		const pathname = matches.at(-1)?.pathname ?? "/";
		const pageUrl = new URL(pathname, SITE_URL).href;
		const meta = [
			{
				charSet: "utf-8",
			},
			{
				name: "viewport",
				content: "width=device-width, initial-scale=1",
			},
			{
				title: "Alper Ortac",
			},
			{ name: "description", content: SITE_DESCRIPTION },
			{ name: "author", content: SITE_NAME },
			{ name: "robots", content: "index, follow, max-image-preview:large" },
			{ property: "og:type", content: "website" },
			{ property: "og:site_name", content: SITE_NAME },
			{ property: "og:locale", content: "en_US" },
			{ property: "og:title", content: SITE_NAME },
			{ property: "og:description", content: SITE_DESCRIPTION },
			{ property: "og:url", content: pageUrl },
			{ property: "og:image", content: OG_IMAGE_URL },
			{ property: "og:image:type", content: "image/png" },
			{ property: "og:image:width", content: "1200" },
			{ property: "og:image:height", content: "630" },
			{ property: "og:image:alt", content: OG_IMAGE_ALT },
			{ name: "twitter:card", content: "summary_large_image" },
			{ name: "twitter:site", content: TWITTER_HANDLE },
			{ name: "twitter:creator", content: TWITTER_HANDLE },
			{ name: "twitter:title", content: SITE_NAME },
			{ name: "twitter:description", content: SITE_DESCRIPTION },
			{ name: "twitter:image", content: OG_IMAGE_URL },
			{ name: "twitter:image:alt", content: OG_IMAGE_ALT },
		];
		const links = [
			{
				rel: "stylesheet",
				href: appCss,
			},
			{
				rel: "icon",
				type: "image/png",
				sizes: "32x32",
				href: "/favicon-32.png",
			},
			{
				rel: "icon",
				type: "image/png",
				sizes: "16x16",
				href: "/favicon-16.png",
			},
			{
				rel: "apple-touch-icon",
				sizes: "180x180",
				href: "/apple-touch-icon.png",
			},
			{
				rel: "icon",
				href: "/favicon.ico",
				sizes: "any",
			},
			{ rel: "canonical", href: pageUrl },
		];
		const scripts = [{ type: "application/ld+json", children: JSON_LD }];
		return { meta, links, scripts };
	},
	shellComponent: RootDocument,
});

function RootDocument({ children }: { children: React.ReactNode }) {
	return (
		<html lang="en">
			<head>
				<HeadContent />
			</head>
			<body>
				<PostHogProvider
					apiKey={import.meta.env.VITE_PUBLIC_POSTHOG_PROJECT_TOKEN!}
					options={{
						api_host: "/ingest",
						ui_host: import.meta.env.VITE_PUBLIC_POSTHOG_HOST,
						defaults: "2025-05-24",
						capture_exceptions: true,
						debug: import.meta.env.DEV,
					}}
				>
					{children}
				</PostHogProvider>
				<TanStackDevtools
					config={{
						position: "bottom-right",
					}}
					plugins={[
						{
							name: "Tanstack Router",
							render: <TanStackRouterDevtoolsPanel />,
						},
					]}
				/>
				<Scripts />
			</body>
		</html>
	);
}
